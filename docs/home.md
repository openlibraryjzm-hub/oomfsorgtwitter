# Home Timeline & Creator Discovery Architecture (`docs/home.md`)

This document serves as the canonical technical reference for the primary **Home** route (`/`) on `oomfs.org`. It details the feed philosophy, data layer queries, card visual architecture, banner-balancing board thumbnails, hashtag bio integration, and relationship badge logic.

---

## 1. System Overview & Core Philosophy

The **Home** timeline represents the primary entry point and creator directory for `oomfs.org`. Unlike algorithmic or high-pressure engagement feeds, the Home page is designed as an authentic, high-signal creator discovery surface:

1. **Real OAuth Creators Only**: Exclusively indexes authentic users who have authenticated via Twitter / X OAuth 2.0 PKCE. Placeholder and demo accounts from client-side mock datasets are strictly excluded.
2. **1:1 Twitter Web Geometry**: Embedded within the standard desktop shell (`MainLayout.tsx`) occupying the central 600px timeline container (`max-w-[600px] border-x border-[#eff3f4]`) with light theme tokens (`#ffffff`, `#eff3f4`, `#0f1419`, `#536471`).
3. **Multi-Asset Card Presentation**: Adapts the comprehensive profile card format detailed in [`docs/followerlist.md`](followerlist.md), enhanced with direct visual previews of the creator's boards and personal hashtags.
4. **Zero-Friction Discovery & Routing**: Every asset on a creator card is directly interactive—clicking the banner, avatar, or handle navigates to `/[username]`, clicking board thumbnails navigates to `/[username]/status/[board.id]`, and clicking hashtags triggers instantaneous clipboard copying.

---

## 2. Route Hierarchy & Component Map

```
src/app/
└── page.tsx                     # Primary Home route (Client Component, SSR-compatible)

src/components/layout/
├── MainLayout.tsx               # 1:1 Shell geometry (max-w-[1265px], Left 275px, Center 600px, Right 350px)
└── LeftSidebar.tsx              # Active route highlighting for Home ('/')

src/lib/
├── follows.ts                   # Relationship resolver (OOMFS, Following, Followers) & live toggleFollow()
├── postStore.ts                 # Tombstone registry (getDeletedPostIds) to filter purged boards
├── utils.ts                     # formatTwitterAvatar() (400x400 HD resolution upscaler)
└── supabase/
    └── client.ts                # Browser Supabase client (@supabase/ssr)
```

---

## 3. Data Architecture & Batch Fetching

The Home feed employs an **RPC-efficient, 2-roundtrip query pattern** to load all feed accounts and their associated boards without $N+1$ query overhead:

```
                  ┌───────────────────────────────┐
                  │        Load Home Feed         │
                  └──────────────┬────────────────┘
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
┌───────────────────────────────┐           ┌───────────────────────────────┐
│     1. Fetch Real Profiles    │           │  2. Viewer Relationships RPC  │
│  `public.profiles` (UUID-only)│           │  Following & Followers Sets   │
└──────────────┬────────────────┘           └───────────────────────────────┘
               │ (Extract user_ids)
               ▼
┌───────────────────────────────┐
│     3. Batch Fetch Boards     │
│  `public.blocks` (type=board) │
│  Group top 3 per user_id      │
└───────────────────────────────┘
```

### 3.1 Profile Query & Real Account Filtering
Profiles are retrieved directly from Supabase PostgreSQL:
```ts
const { data: profilesData } = await supabase
  .from('profiles')
  .select('id, username, name, avatar_url, banner_url, bio, hashtags, created_at')
  .order('created_at', { ascending: false });
```
* **UUID Format Validation**: Validated via `isValidUuid(id)` (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`). Mock IDs (`usr_amberlyn`, `usr_2`) fail validation and are filtered out.

### 3.2 Batch Board Query
To display board previews without querying per-card:
```ts
const { data: boardsData } = await supabase
  .from('blocks')
  .select('id, user_id, type, content, created_at')
  .eq('type', 'board')
  .in('user_id', userIds)
  .order('created_at', { ascending: false });
```
* **Deleted Posts Tombstone**: Cross-referenced with `getDeletedPostIds()` from [`src/lib/postStore.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/postStore.ts) so recently deleted boards never reappear.
* **Capping**: Grouped by `user_id` in memory and capped at **up to 3 boards** per creator.

### 3.3 Viewer Relationship Sets
If the viewer is signed in, [`getViewerRelationships(authUser.id)`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/follows.ts) retrieves:
* `viewerFollowing`: `Set<string>` of account IDs the viewer follows.
* `viewerFollowers`: `Set<string>` of account IDs following the viewer.
Enables $O(1)$ lookup for dynamic relationship tags (`OOMFS` vs `Follows you`).

---

## 4. Card Anatomy & Visual Specifications

Each creator is presented in a card adhering strictly to Twitter Web Light Theme tokens:

```
┌────────────────────────────────────────────────────────────┐
│                    BANNER (3:1 Aspect)                     │
│                                                            │
│       ┌─────┐       ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  - - -│- - -│- - - -│- - - - - │-│- - - - - │-│- - - - - │-│- - (Banner Bottom Line)
│       │ AV  │       │ Board 1  │ │ Board 2  │ │ Board 3  │ │  [ Follow ]
│       └─────┘       └──────────┘ └──────────┘ └──────────┘ │
└────────────────────────────────────────────────────────────┘
 Display Name ✓
 @username  [ OOMFS ]
 #vibecoder, #gamer, #painter, #pixelart (+2 more)
──────────────────────────────────────────────────────────────
```

### 4.1 Header Banner
* **Aspect Ratio**: 3:1 (`aspect-[3/1]`), matching profile headers ($1500 \times 500\text{px}$).
* **Fallback**: When no banner is uploaded (`banner_url === null`), renders the Twitter neutral slate gradient (`from-[#cfd9de] via-[#d5dde2] to-[#cfd9de]`).
* **Hover State**: Subtle zoom (`group-hover:scale-[1.02] transition-transform duration-300`).

### 4.2 Banner-Balancing Row (Avatar + Board Thumbnails + Action Button)
Anchored at the bottom edge of the banner with negative margin (`-mt-10 sm:-mt-12 mb-2`):
1. **Avatar**:
   * Size: $80 \times 80\text{px}$ (`w-20 h-20 sm:w-22 sm:h-22`), circular with 4px white ring (`border-4 border-white`).
   * Upscaled via `formatTwitterAvatar()` to ensure 400×400 HD resolution.
2. **Solo Board Thumbnails (`BoardCollageThumbnail`)**:
   * Horizontally aligned alongside the avatar, balancing partially across the banner's bottom edge.
   * Container Geometry: Compact rounded card (`h-16 sm:h-18 w-24 sm:w-28 rounded-xl overflow-hidden border-2 border-white shadow-sm`).
   * **Solo Image Mode**: Displays the board's primary lead image edge-to-edge (`object-cover w-full h-full`).
   * **Hover Interaction**: Scales up (`hover:scale-[1.04]`), increases shadow, and reveals the board title in a dark glass bottom bar (`bg-black/65 backdrop-blur-2xs text-white text-[9px]`).
   * **Route**: Clicks directly to `/[username]/status/[board.id]`.
   * **Mobile Responsiveness**: Enclosed in a horizontal flex container (`overflow-x-auto no-scrollbar`), ensuring boards scroll smoothly without clipping or pushing the Follow button.
3. **Follow / Unfollow Action Button**:
   * Positioned on the far right.
   * If viewing own profile (`isSelf`): Displays a static `"You"` pill (`bg-[#eff3f4] text-[#536471] rounded-full`).
   * If viewing another profile: Interactive action button with optimistic state toggle and network rollback. Unauthenticated clicks trigger `signInWithTwitter()`.

### 4.3 Profile Identity Details
* **Display Name**: Bold primary typography (`font-extrabold text-base text-[#0f1419] hover:underline`).
* **Verified Badge**: Twitter Blue checkmark (`CheckCircle2`).
* **Handle**: Secondary text (`@username text-xs text-[#536471]`).
* **Relationship Badges**:
  * **`OOMFS`**: Mutual follower ($A \leftrightarrow B$). Badge: `bg-[#1d9bf0]/10 text-[#1d9bf0] text-[11px] font-bold px-1.5 py-0.5 rounded`.
  * **`Follows you`**: User follows viewer, but viewer has not followed back. Badge: `bg-[#eff3f4] text-[#536471] text-[11px] font-medium px-1.5 py-0.5 rounded`.

### 4.4 Hashtags Display (Bio Replacement)
In accordance with [`docs/hashtags.md`](hashtags.md), the creator's personal hashtags replace the standard bio paragraph:
* **Densely Packed Paragraph Flow**: Rendered as continuous text with Twitter Blue `#` marks (`text-[#1d9bf0] font-bold`) and subtle gray commas (`text-[#536471]`).
* **Display Cap**: Displays up to 7 hashtags (`MAX_TAGS_ON_CARD = 7`). If the creator has additional tags, a `+N more` link routes directly to `/[username]/hashtags`.
* **Click-to-Copy Utility**: Clicking any hashtag writes `#tag` to `navigator.clipboard` and surfaces a transient floating tooltip (`Copied!`) directly above the tag for 1.5 seconds.
* **Empty State**: When no hashtags are set, renders a subtle italic indicator (`No hashtags written yet`). On the viewer's own card, surfaces a shortcut link (`Add hashtags →`).

---

## 5. Dual-Persistence & Cache Hydration

Hashtags on creator cards adhere to the platform's multi-tier hydration strategy:

1. **Remote Database**: Read from PostgreSQL column `public.profiles.hashtags` (`text[]`).
2. **Local Synchronous Cache**: If the user recently updated their tags in the current browser session, `localStorage.getItem('oomfs_profile_hashtags_<userId>')` instantly takes precedence to eliminate cache latency.
3. **Showcase Fallback**: For primary platform showcase handles (`amberlyndev`, `amberlyn`), default demo tags (`#vibecoder`, `#gamer`, `#painter`, `#pixelart`, `#nightowl`) are populated if the database field is uninitialized.

---

## 6. Fresh Agent Onboarding Checklist

When maintaining or modifying the Home feed:

- [ ] **Preserve UUID Filtering**: Never allow mock strings (e.g. `usr_amberlyn`) to enter database query arrays; always validate IDs with `isValidUuid()`.
- [ ] **Banner Height & Aspect Parity**: Keep banner containers at `aspect-[3/1]` to preserve exact 1:1 visual parity with profile headers.
- [ ] **Preserve Solo Board Thumbnail Geometry**: Ensure board thumbnails maintain `h-16 sm:h-18 w-24 sm:w-28 rounded-xl border-2 border-white` to maintain proportional balance against the overlapping avatar.
- [ ] **Mobile Scroll Container**: The avatar and board thumbnail container must retain `overflow-x-auto no-scrollbar` so that 3 boards on compact viewports never squish the avatar or displace the Follow button.
- [ ] **Click-to-Copy Propagation**: When clicking a hashtag on a card, ensure `e.stopPropagation()` is called so the click does not inadvertently trigger parent card navigation.
