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

3. **Specialized Post Formats & Pinterest Boards:**  
   Profiles showcase rich, modular content formats tailored to creative work and visual curation:
   * 📌 **Board (`board`)**: The **sole timeline post type**. Renders on the profile in an authentic **2-column Pinterest-style scroll grid** with a full-bleed 2:1 hero cover image, bottom cascading secondary circle avatars ("also followed by" pattern), bold title, and item count below. Cover photos are framed precisely during upload via the interactive `BoardCropModal.tsx` viewfinder. Supports image uploads and mutual avatar link embeds (`SelectOomfModal`). Expands into a full **2-column Pinterest masonry grid** in the dedicated thread view (`/[username]/status/[id]`).
   * 💬 **Profile Comments (`comment`)**: 1:1 X/Twitter-native guestbook comments supporting attached images (up to 4 photos), rich interaction suite (Reply, Repost, Like, Share), and full thread navigation (`/[author]/status/[id]`).

   *Detailed post format specifications are available in [Post Types Context Doc](docs/post-types.md) and [Composer Context Doc](docs/composer.md).*

4. **The 5 Distinct Profile Tabs:**  
   User profiles organize content across 5 clean tabs ordered left-to-right:
   1. **Boards** (default): Unifies boards and presets. Features a pinned horizontal bar (`BoardPresetsBar.tsx`) leading with **`All Boards`** (master tab showing total boards count) followed by direct creator preset tabs (capped at 12 slots for smooth horizontal scrolling) and owner actions (`[+ New]`, `[Manage]`). Tapping any preset tab provides instant 1-tap filtering directly to that preset's boards with zero intermediate directory cards or drill-down flows.
   2. **Links**: Linktree-style external accounts and destination portal (`LinksPortal.tsx`) for the creator's personal accounts (Discord, Twitch, Steam, X, YouTube, GitHub, Spotify, etc.). Features a 35+ platform vector icon registry, custom logo uploads, domain auto-detection, left-aligned owner creation controls, and inline reordering.
   3. **Comments**: 1:1 X/Twitter-native profile guestbook and conversational threads with up to 4 image attachments, "Replying to @username" context, and interactive Twitter cards.
   4. **Hashtags**: Hyper-minimalist personal notepad (`HashtagsNotepad.tsx`) where creators write and display densely packed, comma-separated hashtags as a continuous flowing paragraph (e.g. `#vibecoder, #gamer, #painter`). Features clean View and Edit modes where adding tags is done simply by typing and pressing comma (`,`) to separate, plus click-to-copy and dual persistence (`localStorage` + Supabase `profiles.hashtags`).
   5. **Likes**: Dedicated feed of posts liked by the user.

   *Detailed profile layout rules and routing are available in [Profile Page Context Doc](docs/profile-page.md), [Collections Context Doc](docs/collections.md), and [Links Context Doc](docs/links.md).*

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
│   ├── banners.md                      # 1:1 X Profile Banner system, 1500x500 crop engine, & cross-view parity
│   ├── collections.md                  # Curated collections & preset lenses architecture and data models
│   ├── comments.md                     # Profile comments guestbook, 1-4 photo grid, and cross-profile RLS
│   ├── composer.md                     # Post composer architecture, flush builders, & media compression
│   ├── followerlist.md                 # Network directory architecture (OOMFs, Following, Followers) & 3 view modes
│   ├── hashtags.md                     # Hyper-minimalist personal hashtags notepad & comma-separator engine
│   ├── links.md                        # Linktree-style external accounts portal, 35+ platform registry, & custom logos
│   ├── navigation.md                   # Global shell geometry, left sidebar registry (7 items), & responsive layout
│   ├── post-types.md                   # Specification for active post formats & creation guide
│   ├── profile-page.md                 # Profile layout, identity section, 5 tabs, and status routing
│   └── tipjar.md                       # Twin Coin system, left-over-right layering, and style testing modal
├── supabase_schema.sql                 # Baseline schema: profiles, blocks, follows tables & RLS policies
├── supabase_follows_rpc.sql            # Supabase RPC migration for bidirectional mutual follower queries
├── supabase_collections.sql            # Collections & collection_items schema, indexes, and RLS policies
├── supabase_banners_storage.sql        # Supabase Storage bucket ('banners') creation and RLS policies
├── supabase_profile_columns.sql        # Missing profile columns migration & PostgREST reload
├── supabase_hashtags.sql               # Hashtags column migration on public.profiles
├── supabase_comments_target.sql        # Cross-profile comments target_user_id & RLS delete policy migration
├── .env.local                          # Supabase project URL and API keys
├── src/
│   ├── app/
│   │   ├── [username]/
│   │   │   ├── page.tsx                # Dynamic profile route (SSR with Supabase fetch + mock fallback)
│   │   │   ├── presets/page.tsx        # Dedicated Presets switchboard route
│   │   │   ├── links/page.tsx          # Dedicated Links portal route
│   │   │   ├── hashtags/page.tsx       # Dedicated Hashtags notepad route
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
│   │   │   ├── LeftSidebar.tsx         # 1:1 Left navigation (275px), 7-item registry, profile pill, "Create Board" button
│   │   │   ├── RightSidebar.tsx        # 1:1 Right spacer column (350px) for layout geometry + footer links
│   │   │   └── MainLayout.tsx          # 1:1 X.com layout shell (max-w-[1265px]) + compose modal
│   │   ├── profile/
│   │   │   ├── ProfileView.tsx         # Core profile view, 5 tabs, Edit Profile modal, composer, Badge Wall
│   │   │   └── BannerCropModal.tsx     # 1:1 X 1500x500 banner crop viewfinder, zoom slider, & wheel zoom
│   │   ├── hashtags/
│   │   │   └── HashtagsNotepad.tsx     # Hyper-minimalist personal hashtags notepad (View/Edit modes, comma engine)
│   │   ├── collections/
│   │   │   ├── ReorderPresetsModal.tsx # Modal for rearranging preset collections and deleting presets
│   │   │   ├── ReorderCollectionModal.tsx # Visual 100-card board reordering workspace for collection owners
│   │   │   ├── CreateCollectionModal.tsx # Modal to create custom post preset collections (Title + Pin to Top Bar)
│   │   │   └── AddToCollectionModal.tsx # Modal to assign boards to curated presets
│   │   ├── links/
│   │   │   └── LinksPortal.tsx         # Linktree-style vertical stack for external user accounts (35+ platforms, custom logos)
│   │   ├── network/
│   │   │   ├── FollowButton.tsx        # Dynamic optimistic Follow/Unfollow action pill
│   │   │   └── UserNetworkView.tsx     # 1:1 network directory (OOMFs, Following, Followers) & 3 display modes
│   │   └── feed/
│   │       ├── BoardPresetsBar.tsx     # Pinned horizontal bar (All Boards, preset tabs, owner actions)
│   │       ├── BoardGridCard.tsx       # 2-column Pinterest board card (2:1 hero cover, bottom cascading circle avatars)
│   │       ├── BoardCropModal.tsx      # 2:1 interactive cover crop viewfinder (drag-pan, zoom slider, thirds grid)
│   │       ├── PostCard.tsx            # Thread view post renderer & board expansion
│   │       ├── CommentCard.tsx         # Flat guestbook comment card (non-threaded)
│   │       └── PostComposer.tsx        # Board Builder composer (Title, 5 visual slots, mutual avatars, crop trigger)
│   │
│   ├── context/
│   │   └── AuthContext.tsx             # Supabase auth session, profile state, signInWithTwitter, signOut
│   ├── lib/
│   │   ├── bannerStorage.ts            # Supabase Storage bucket uploader with resilient dataUrl fallback
│   │   ├── collections.ts              # Supabase & localStorage dual-persistence manager for collections
│   │   ├── follows.ts                  # Client follow toggle & network directory resolver
│   │   ├── mockData.ts                 # Offline mock accounts, bio links, sample content for prototyping
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
Stores custom profile content blocks (posts, boards, comments):
* `id` (`uuid`, primary key, `default gen_random_uuid()`)
* `user_id` (`uuid`, references `public.profiles.id` on delete cascade)
* `type` (`text`: `'standard' | 'board' | 'comment'`)
* `content` (`jsonb`, post payload such as `text`, `boardData`, `attachments`, `images`, or `author`)
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

### 4. `public.collections`
Stores user-defined curated presets/collections for filtering profile content (posts and links):
* `id` (`uuid`, primary key, `default gen_random_uuid()`)
* `user_id` (`uuid`, references `public.profiles.id` on delete cascade)
* `title` (`text`, collection display name)
* `description` (`text`, optional collection summary)
* `tab_type` (`text`: `'posts' | 'links'`, default `'posts'`)
* `sort_order` (`int`, order index for lens bar and modal positioning, default `0`)
* `created_at` (`timestamptz`)

### 5. `public.collection_items`
Join table mapping content blocks/posts to curated collections:
* `id` (`uuid`, primary key, `default gen_random_uuid()`)
* `collection_id` (`uuid`, references `public.collections.id` on delete cascade)
* `block_id` (`uuid`, references `public.blocks.id` on delete cascade)
* `created_at` (`timestamptz`)
* Unique Constraint: `(collection_id, block_id)`

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
   Submitting posts via [`PostComposer.tsx`](src/components/feed/PostComposer.tsx) persists records to Supabase `public.blocks` (for authenticated users), caches in [`postStore.ts`](src/lib/postStore.ts), and emits the `oomfs:post-created` window event so [`ProfileView.tsx`](src/components/profile/ProfileView.tsx) immediately updates without full page reloads.

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
* [x] 1:1 X Profile Banners (1500×500 interactive crop engine, Supabase Storage, and Cards view parity)
* [x] Twitter bio extraction and native "Edit profile" modal persistence
* [x] 5 Distinct Profile Tabs: Boards (unifies boards and presets), Links (Linktree portal), Comments (guestbook), Hashtags (ultra-minimalist notepad), Likes
* [x] Thread route (`/[username]/status/[id]`) with replies composer
* [x] Sole Timeline Post Type: Pinterest-style Curated Visual Boards with title and 3+ images/mutual avatar embeds
* [x] Board Timeline 2:1 full-bleed hero cover with bottom cascading secondary circles + Thread 2-column masonry expansion
* [x] Interactive 2:1 Cover Viewfinder Cropper (`BoardCropModal.tsx`) with drag-to-pan, 3x zoom, and rule-of-thirds grid
* [x] Unified Board Composer with client-side canvas compression & mutual avatar selector (`SelectOomfModal`)
* [x] Direct Preset Tabs on pinned `BoardPresetsBar` with 1-tap switching and zero intermediate directory cards
* [x] Follow / Unfollow button wired to `public.follows`
* [x] Real-time mutual follower count calculation (SQL view or RPC)
* [x] Linktree-style external accounts portal (`LinksPortal.tsx`) with 35+ platform registry & custom logos
* [ ] Custom link click tracking / analytics for bio links
* [ ] Dynamic Open Graph (OG) image generation for Twitter Cards (`oomfs.org/[username]`)
