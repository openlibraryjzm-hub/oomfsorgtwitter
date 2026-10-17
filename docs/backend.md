# Backend Architecture & Data Layer (`oomfs.org`)

This document serves as the canonical technical reference for the backend, database schema, authentication lifecycle, and relational graph engine on `oomfs.org`. It is designed for fresh agent onboarding and persistent architectural alignment.

---

## 1. System Overview

`oomfs.org` uses a serverless backend architecture built on **Supabase (PostgreSQL 15+)** with **Row Level Security (RLS)** and **Supabase Auth via X / Twitter OAuth 2.0 PKCE**.

```
┌────────────────────────────────────────────────────────┐
│                   Next.js App Router                   │
│  (SSR in Server Components + Optimistic Client Views)   │
└───────────────────────┬────────────────────────────────┘
                        │
       Browser Client / Server Fetch (@supabase/ssr)
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│                 Supabase PostgreSQL 15+                │
│  ├── public.profiles   (Synced Twitter metadata)       │
│  ├── public.blocks     (Posts, Carousels, Boards, etc.)│
│  ├── public.follows    (Directed follow graph)         │
│  └── Stored Procedures (RPC stats & mutual OOMFs)      │
└────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema & Tables

All schema definitions and migrations are maintained in [`supabase_schema.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/supabase_schema.sql) and [`supabase_follows_rpc.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/supabase_follows_rpc.sql).

### 2.1 `public.profiles`
Stores user profile information synced from Twitter OAuth or edited directly on `oomfs.org`.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, `references auth.users on delete cascade` | Matches Supabase Auth user ID |
| `username` | `text` | Unique, Not Null | Lowercase Twitter/X handle (without `@`) |
| `name` | `text` | | User display name |
| `avatar_url` | `text` | | 400×400 HD profile picture URL |
| `banner_url` | `text` | | Optional profile header banner image |
| `bio` | `text` | | User biography (preserves newlines) |
| `location` | `text` | | Geographical location |
| `website` | `text` | | External URL or personal site |
| `created_at` | `timestamptz` | Not Null, Default `timezone('utc', now())` | Registration timestamp |
| `updated_at` | `timestamptz` | Not Null, Default `timezone('utc', now())` | Last profile update |

**RLS Policies:**
* `SELECT`: Viewable by everyone (`using (true)`).
* `INSERT`: Only owner can insert (`auth.uid() = id`).
* `UPDATE`: Only owner can update (`auth.uid() = id`).

---

### 2.2 `public.blocks`
Stores modular profile content formats (Standard posts, Carousels, Pinterest-style Boards, Link Cards, Web Badges, and Guestbook Comments).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, Default `gen_random_uuid()` | Unique block identifier |
| `user_id` | `uuid` | Not Null, `references public.profiles(id) on delete cascade` | Creator's user profile ID |
| `type` | `text` | Not Null, Check `in ('standard', 'carousel', 'board', 'link_card', 'comment', 'badge')` | Post format identifier |
| `content` | `jsonb` | Not Null, Default `'{}'::jsonb` | Format-specific structured JSON payload |
| `created_at` | `timestamptz` | Not Null, Default `timezone('utc', now())` | Publication timestamp |

**RLS Policies:**
* `SELECT`: Viewable by everyone (`using (true)`).
* `INSERT`: Authenticated users where `auth.uid() = user_id`.
* `UPDATE`: Authenticated users where `auth.uid() = user_id`.
* `DELETE`: Authenticated users where `auth.uid() = user_id`.

---

### 2.3 `public.follows`
Tracks the internal directed follow graph between `oomfs.org` users.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `follower_id` | `uuid` | Not Null, `references public.profiles(id) on delete cascade` | The user initiating the follow |
| `following_id` | `uuid` | Not Null, `references public.profiles(id) on delete cascade` | The user being followed |
| `created_at` | `timestamptz` | Not Null, Default `timezone('utc', now())` | Timestamp follow was created |

**Constraints:**
* **Composite Primary Key**: `(follower_id, following_id)` — Prevents duplicate follow records.
* **Self-Follow Guard**: `check (follower_id <> following_id)` — Disallows users from following their own profile.

**RLS Policies:**
* `SELECT`: Viewable by everyone (`using (true)`).
* `INSERT`: Authenticated users where `auth.uid() = follower_id`.
* `DELETE`: Authenticated users where `auth.uid() = follower_id`.

---

## 3. Mutuals (OOMFS) Graph & Stored Procedures (RPC)

In Twitter/X culture, **OOMF** stands for *"One Of My Followers / Friends"*. On `oomfs.org`, followers and mutuals are tracked strictly in-app to circumvent third-party Twitter API firehose limitations.

### 3.1 Mutual OOMF Definition
Two users $A$ and $B$ are **OOMFs** if and only if both directed edges exist in `public.follows`:
$$\text{isMutual}(A, B) \iff (A \rightarrow B) \land (B \rightarrow A)$$

### 3.2 Single-Roundtrip Stats Engine: `public.get_profile_follow_stats`
Calculates follower counts, following counts, mutual OOMFs count, and viewer relationship flags in a single database roundtrip:

```sql
create or replace function public.get_profile_follow_stats(
  target_user_id uuid,
  viewer_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  f_count integer := 0;
  fg_count integer := 0;
  o_count integer := 0;
  is_fg boolean := false;
  is_m boolean := false;
begin
  -- Total Followers Count
  select count(*)::int into f_count
  from public.follows
  where following_id = target_user_id;

  -- Total Following Count
  select count(*)::int into fg_count
  from public.follows
  where follower_id = target_user_id;

  -- Mutuals (OOMFS) Count: target follows X AND X follows target
  select count(*)::int into o_count
  from public.follows a
  join public.follows b
    on a.follower_id = b.following_id
   and a.following_id = b.follower_id
  where a.follower_id = target_user_id;

  -- Viewer relationship to target
  if viewer_user_id is not null and viewer_user_id <> target_user_id then
    select exists (
      select 1 from public.follows
      where follower_id = viewer_user_id
        and following_id = target_user_id
    ) into is_fg;

    if is_fg then
      select exists (
        select 1 from public.follows
        where follower_id = target_user_id
          and following_id = viewer_user_id
      ) into is_m;
    end if;
  end if;

  return jsonb_build_object(
    'followers_count', f_count,
    'following_count', fg_count,
    'oomfs_count', o_count,
    'is_following', is_fg,
    'is_mutual', is_m
  );
end;
$$;
```

### 3.3 Mutual Directory Stored Procedure: `public.get_mutual_oomfs`
Resolves complete profile records for a user's mutual network:

```sql
create or replace function public.get_mutual_oomfs(target_user_id uuid)
returns setof public.profiles
language sql
security definer
set search_path = public
as $$
  select p.*
  from public.profiles p
  where p.id in (
    select a.following_id
    from public.follows a
    join public.follows b
      on a.follower_id = b.following_id
     and a.following_id = b.follower_id
    where a.follower_id = target_user_id
  );
$$;
```

---

## 4. Application Integration Layer (`src/lib/follows.ts`)

The application layer encapsulates database operations with an **RPC-first, fallback-resilient architecture**:

1. **UUID Format Validation**:
   All user identifiers must pass strict 8-4-4-4-12 UUID format validation:
   ```ts
   const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
   ```
   Mock accounts (e.g. `usr_amberlyn`) gracefully bypass database calls to avoid foreign key violations.

2. **Automated Query Fallback**:
   If the PostgreSQL RPC function has not yet been executed in a given environment, [`src/lib/follows.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/follows.ts) automatically catches the `PGRST202` error and falls back to composite `supabase.from('follows')` table queries.

3. **Optimistic UI Mutations**:
   Follow/unfollow actions in [`ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx) execute immediately in local React state, incrementing/decrementing counts and toggling badges before awaiting database confirmation. Any network or RLS failure automatically rolls back the UI state.

---

## 5. Authentication & OAuth 2.0 Lifecycle

Authentication is handled via **Twitter / X OAuth 2.0 with PKCE**:

```
User Clicks "Connect X"
       │
       ▼
Supabase signInWithOAuth({ provider: 'x' })
       │
       ▼
Redirect to api.twitter.com/2/oauth2/authorize
       │
       ▼
Callback to /auth/callback?code=...
       │
       ├── exchangeCodeForSession(code)
       ├── Read session.provider_token
       ├── Call Twitter API v2 (/2/users/me?user.fields=description,location)
       └── Upsert public.profiles with bio & HD avatar
       │
       ▼
Redirect to /[username]
```

### Critical Auth Implementation Rules:
1. **Provider identifier is `'x'`, NOT `'twitter'`**:
   Supabase OAuth 2.0 for X requires `provider: 'x' as any`. Passing `'twitter'` falls back to legacy OAuth 1.0a and triggers an un-configured provider error.
2. **Twitter API v2 Bio Enrichment**:
   Twitter's standard `/2/users/me` endpoint omits `description` and `location` unless explicitly queried with `?user.fields=description,location,profile_image_url`. [`src/app/auth/callback/route.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/app/auth/callback/route.ts) enriches `public.profiles` using the OAuth `provider_token`.
3. **HD Avatar Upscaling**:
   Default Twitter OAuth returns $48 \times 48\text{px}$ `_normal.jpg` URLs. The database trigger and callback replace `_normal.` with `_400x400.` via [`formatTwitterAvatar()`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/utils.ts).

---

## 6. Fresh Agent Onboarding Checklist & Gotchas

When writing backend queries or modifying database interactions:

- [ ] **Preserve Nullish Coalescing for Bios**: Never use `dbUser.bio || fallback`. Because empty strings (`""`) or short bios are falsy in JavaScript, `||` erroneously triggers the default placeholder. Always write `dbUser.bio ?? fallback`.
- [ ] **Enforce Standard UUID Validation**: Validate foreign keys against `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`. Never assume mock user strings can be passed into UUID database columns.
- [ ] **Handle Next.js App Router Suspense Boundaries**: When reading `usePathname()` or dynamic query parameters inside client layouts, maintain `<Suspense>` wrappers to avoid Partial Prerender (PPR) bailout errors during `npm run build`.
- [ ] **Keep Schema Migration Files Synchronized**: Any schema changes, RLS policies, or stored procedures added to the database must be committed to both [`supabase_schema.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/supabase_schema.sql) and dedicated standalone scripts.
