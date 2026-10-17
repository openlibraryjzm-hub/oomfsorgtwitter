# oomfs.org 

> **A 1:1 Twitter/X-native alternative to Linktree.**  
> Users put `oomfs.org/username` in their X bio to link to a profile that looks and feels authentically like X, serving as a personal portfolio hub with specialized visual post types, bio links, guestbook comments, and an in-app mutual followers (**OOMFS**) graph.

---

## 🎯 Project Vision & Core Principles

1. **The Core Job-to-be-Done:**  
   Replace generic Linktree pages. When someone discovers a creator on X and taps their bio link (`oomfs.org/username`), they stay within an interface that looks identical to X, complete with their banner, HD avatar, display name, verified badge, and bio.

2. **The "OOMFS" Differentiator:**  
   In Twitter/X culture, **OOMF** means *"One Of My Followers / Friends"*.
   * Followers and Following are tracked **in-app** (not through paid Twitter API firehoses).
   * When User A and User B follow each other on `oomfs.org`, they automatically earn an **OOMF mutual badge** ($A \leftrightarrow B$).
   * Mutuals are highlighted on user profiles and in the dedicated **OOMFS** tab.

3. **Specialized Post & Block Types (Beyond Tweets):**  
   Profiles showcase rich, modular content formats tailored to creative work and visual curation:
   * 📝 **Standard Post (`standard`)**: Native 1:1 timeline tweet text post. Threadable, likeable, repostable.
   * 🎞️ **Carousel (`carousel`)**: Uncapped horizontal photo strip (`>4` slides) with a universal small header bar, natural portrait/landscape aspect ratio preservation (no forced square crops), desktop chevrons, and individual bottom overlay captions.
   * 📌 **Board (`board`)**: Pinterest-style visual curation boards (`3+` images). Renders as a 3-image preview on the profile timeline (`50%` left half, two `25%` stacked right images with a `+N` badge) and expands into a full **2-column Pinterest masonry grid** in the dedicated thread view (`/[username]/status/[id]`).
   * 🔗 **Bio Link Card (`link_card`)**: High-visibility link showcase button with title, domain badge, description, and direct visit action. Showcased on the profile **Links** tab.
   * 🏷️ **Web Badge (`badge`)**: Early-web 88×31 retro button badges. Features a dual-mode creation engine (Color gradient presets or 3x HiDPI PNG image uploads) with universal underneath micro-labels. Aggregates into the **Badge Wall** at the top of the **Links** tab.
   * 💬 **Flat Comments (`comment`)**: Direct profile guestbook comments (non-threaded, no replies or quotes).

   *Detailed post format specifications and extension guides are available in [Post Types Context Doc](docs/post-types.md) and [Web Badges Context Doc](docs/badges.md).*

4. **The 4 Distinct Profile Tabs:**  
   User profiles organize content across 4 clean tabs ordered left-to-right:
   1. **Posts** (default): Actual posts (Standard, Carousel, Board). Supports full thread navigation (`/[username]/status/[id]`).
   2. **Comments**: Direct guestbook comments underneath an inline comment composer (flat, non-threaded).
   3. **Links**: Linktree-style showcase of permanent bio links and link cards.
   4. **Likes**: Posts liked by the user.

   *Detailed profile layout rules and routing are available in [Profile Page Context Doc](docs/profile-page.md).*

5. **"Profile-First" Strategy (Overcoming Cold Start):**  
   * We do **not** focus on global feeds, algorithmic discovery, or notifications yet.
   * Non-profile pages (`/explore`, `/notifications`) display low-pressure "Coming Soon" states.
   * 100% of product focus is on perfecting **`oomfs.org/[username]`**, thread views, and organic **profile-hopping** between mutuals.

6. **Design System Rule (Strict North Star):**  
   * **Light Theme by default**: Clean white background (`#ffffff`), Twitter Blue (`#1d9bf0`), subtle gray borders (`#eff3f4`), secondary text (`#536471`), and primary text (`#0f1419`).
   * **1:1 Desktop Layout Geometry Parity**:  
     * Left Navigation: `275px` (`xl:w-[275px]`)
     * Center Timeline: `600px` (`max-w-[600px] border-x border-[#eff3f4]`)
     * Right Spacer Column: `350px` (`xl:w-[350px]`) containing subtle legal footer links
     * Centered Shell: `max-w-[1265px]` container with `justify-between`
   * **Zero "Vibecoding" Fluff**: No forced dark modes, no neon gradients, no heavy glassmorphism or floating bubbles. Maintain 1:1 parity with Twitter Web light mode.

---

## 🛠 Tech Stack

* **Framework:** Next.js 16+ (App Router, Turbopack, TypeScript, React 19).
* **Styling:** Tailwind CSS v4 (`globals.css` configured with Twitter color tokens).
* **Icons:** `lucide-react` (selected to mirror Twitter Web iconography).
* **Backend & Database:** [Supabase](https://supabase.com) (PostgreSQL + Row Level Security).
* **Authentication:** Supabase Auth via **X / Twitter OAuth 2.0 PKCE** (`provider: 'x'`).
* **Client SDKs:** `@supabase/supabase-js`, `@supabase/ssr`.

---

## 📂 Architecture & File Map

```
├── docs/
│   ├── backend.md                      # Supabase schema, RLS policies, RPC follow graph, & OAuth
│   ├── badges.md                       # 88×31 Web Badge system, 3x HiDPI canvas, & Badge Wall gallery
│   ├── composer.md                     # Post composer architecture, flush builders, & media compression
│   ├── followerlist.md                 # Network directory architecture (OOMFs, Following, Followers) & 4 view modes
│   ├── post-types.md                   # Specification for active post formats & creation guide
│   └── profile-page.md                 # Profile page architecture, 4 tabs, and thread routing
├── supabase_follows_rpc.sql            # Supabase RPC migration for bidirectional mutual follower queries
├── .env.local                          # Supabase project URL and API keys
├── src/
│   ├── app/
│   │   ├── [username]/
│   │   │   ├── page.tsx                # Dynamic profile route (SSR with Supabase fetch + mock fallback)
│   │   │   ├── followers/page.tsx      # In-app Followers list with mutual badges
│   │   │   ├── following/page.tsx      # In-app Following list with mutual badges
│   │   │   ├── oomfs/page.tsx          # Dedicated mutuals directory (A ↔ B)
│   │   │   └── status/[id]/
│   │   │       ├── page.tsx            # Thread route SSR resolver (Supabase blocks + mock fallback)
│   │   │       └── ThreadClientView.tsx# Client thread view (2-col Board expansion, replies feed)
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts            # OAuth code exchange & Twitter v2 bio enrichment handler
│   │   ├── explore/page.tsx            # Clean "Coming Soon" explore page
│   │   ├── notifications/page.tsx      # Clean "Coming Soon" notifications page
│   │   ├── oomfs/page.tsx              # Mutual followers directory
│   │   ├── page.tsx                    # Home route with "Coming Soon" timeline disclaimer
│   │   ├── layout.tsx                  # Root layout with AuthProvider & metadata
│   │   └── globals.css                 # Twitter Light Theme CSS variables
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── LeftSidebar.tsx         # 1:1 Left navigation (275px), icon logo, profile pill, "Post" button
│   │   │   ├── RightSidebar.tsx        # 1:1 Right spacer column (350px) for layout geometry + footer links
│   │   │   └── MainLayout.tsx          # 1:1 X.com layout shell (max-w-[1265px]) + compose modal
│   │   ├── profile/
│   │   │   └── ProfileView.tsx         # Core profile view, 4 tabs, Edit Profile modal, composer, Badge Wall
│   │   ├── network/
│   │   │   ├── FollowButton.tsx        # Dynamic optimistic Follow/Unfollow action pill
│   │   │   └── UserFollowItem.tsx      # 1:1 native follower list row component
│   │   └── feed/
│   │       ├── PostCard.tsx            # 1:1 timeline post rendering (Standard, Carousel, Board, Badge)
│   │       ├── CommentCard.tsx         # Flat guestbook comment card (non-threaded)
│   │       └── PostComposer.tsx        # Unified post composer with flush builders & bottom icon toggles
│   │
│   ├── context/
│   │   └── AuthContext.tsx             # Supabase auth session, profile state, signInWithTwitter, signOut
│   ├── lib/
│   │   ├── follows.ts                  # Client follow toggle & network directory resolver
│   │   ├── mockData.ts                 # Offline mock accounts & sample content for prototyping
│   │   ├── postStore.ts                # Client runtime store for newly created session posts
│   │   ├── utils.ts                    # formatTwitterAvatar() (400x400 HD upscaler)
│   │   └── supabase/
│   │       ├── client.ts               # Browser Supabase client (@supabase/ssr)
│   │       └── server.ts               # Server Supabase client
```

---

## 🗄 Database Schema (Supabase PostgreSQL)

### 1. `public.profiles`
Stores user profile information synced from Twitter or edited on `oomfs.org`:
* `id` (`uuid`, primary key, references `auth.users.id` on delete cascade)
* `username` (`text`, unique, lowercase handle without `@`)
* `name` (`text`, display name)
* `avatar_url` (`text`, 400x400 HD avatar URL)
* `banner_url` (`text`, optional banner image)
* `bio` (`text`, user biography)
* `location` (`text`, user location)
* `website` (`text`, website or oomfs.org link)
* `created_at` (`timestamptz`)

### 2. `public.blocks`
Stores custom profile content blocks (posts, carousels, boards, links, comments):
* `id` (`uuid`, primary key, `default gen_random_uuid()`)
* `user_id` (`uuid`, references `public.profiles.id` on delete cascade)
* `type` (`text`: `'standard' | 'carousel' | 'board' | 'link_card' | 'comment'`)
* `content` (`jsonb`, post payload such as `text`, `carouselData`, `boardData`, `linkData`, or `author`)
* `created_at` (`timestamptz`)

### 3. `public.follows`
Tracks the internal follow graph and computes mutual OOMFs:
* `follower_id` (`uuid`, references `public.profiles.id`)
* `following_id` (`uuid`, references `public.profiles.id`)
* `created_at` (`timestamptz`)
* Primary Key: `(follower_id, following_id)`

> **Mutual OOMF Definition:**  
> User A and User B are **OOMFs** if:  
> `(follower_id = A AND following_id = B)` **AND** `(follower_id = B AND following_id = A)` both exist in `public.follows`.

---

## ⚡ Critical Gotchas & Agent Guidelines

When onboarding onto this codebase, remember these crucial implementation details:

1. **Supabase Provider Name is `'x'`, NOT `'twitter'`:**  
   Supabase's OAuth 2.0 integration for X uses `provider: 'x'`. Passing `'twitter'` invokes legacy OAuth 1.0a and triggers `"Unsupported provider: provider is not enabled"`.
   ```ts
   supabase.auth.signInWithOAuth({ provider: 'x' as any, options: { redirectTo: ... } })
   ```

2. **Twitter Avatar HD Upscaling:**  
   Twitter OAuth returns default avatars with `_normal.jpg` ($48 \times 48\text{px}$, pixelated).  
   Always pass avatar URLs through `formatTwitterAvatar(url)` from `src/lib/utils.ts`, which transforms `_normal.` into `_400x400.`.

3. **Twitter API v2 Bio Enrichment:**  
   Twitter's `/2/users/me` endpoint does **not** include `description` (bio) or `location` unless requested with `?user.fields=description,location`.  
   In `src/app/auth/callback/route.ts`, we use `session.provider_token` to fetch these fields and update `public.profiles`.

4. **Nullish Coalescing for Bios:**  
   When merging database profiles with fallbacks, **never** use `dbUser.bio || fallback`. Because empty string `""` or short bios like `"..."` are falsy in JS, `||` will incorrectly revert to placeholder text. Always use:
   ```ts
   dbUser.bio !== null && dbUser.bio !== undefined ? dbUser.bio : fallback
   ```

5. **Next.js 16 Partial Prerendering & `usePathname()`:**  
   When using Next.js 16 with `cacheComponents` enabled, components invoking dynamic client hooks like `usePathname()` (such as `LeftSidebar.tsx`) must be wrapped in `<Suspense>` within `MainLayout.tsx` to prevent build-time prerender bailout errors on dynamic routes.

6. **Post Drafting & Global Reactivity:**  
   Submitting posts via [`PostComposer.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/PostComposer.tsx) persists records to Supabase `public.blocks` (for authenticated users), caches in [`postStore.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/postStore.ts), and emits the `oomfs:post-created` window event so [`ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx) immediately updates without full page reloads.

---

## 🚀 Development Commands

```bash
# Start local development server (http://localhost:3000)
npm run dev

# Run TypeScript check and production build
npm run build
```

---

## 🗺 Roadmap & Next Steps

* [x] Next.js 16 + Tailwind CSS v4 1:1 X Light Theme UI Shell
* [x] Dynamic `/[username]` routing with direct Supabase SSR + Mock fallbacks
* [x] Twitter / X OAuth 2.0 PKCE authentication via Supabase (`provider: 'x'`)
* [x] HD Avatar resolution upscaling (`_400x400`)
* [x] Twitter bio extraction and native "Edit profile" modal persistence
* [x] 4 Distinct Profile Tabs: Posts, Comments (flat guestbook), Links, Likes
* [x] Thread route (`/[username]/status/[id]`) with replies composer
* [x] Custom Post Formats: Uncapped Photo Carousel & Pinterest-style Board
* [x] Board Timeline 3-image preview + Thread 2-column masonry grid expansion
* [x] Unified Post Composer with local file upload compression & sample presets
* [x] Follow / Unfollow button wired to `public.follows`
* [x] Real-time mutual follower count calculation (SQL view or RPC)
* [ ] Custom link click tracking / analytics for bio links
* [ ] Dynamic Open Graph (OG) image generation for Twitter Cards (`oomfs.org/[username]`)
