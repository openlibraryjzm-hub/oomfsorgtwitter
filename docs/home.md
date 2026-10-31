# Home Timeline & Creator Discovery Architecture (`docs/home.md`)

This document serves as the canonical technical reference for the primary **Home** route (`/`) on `oomfs.org`. It details the feed philosophy, data layer queries, card visual architecture, horizontally aligned board thumbnails, hashtag bio integration, and relationship badge logic.

---

## 1. System Overview & Core Philosophy

The **Home** timeline represents the primary entry point and creator directory for `oomfs.org`. Unlike algorithmic or high-pressure engagement feeds, the Home page is designed as an authentic, high-signal creator discovery surface:

1. **Real OAuth Creators Only**: Exclusively indexes authentic users who have authenticated via Twitter / X OAuth 2.0 PKCE. Placeholder and demo accounts from client-side mock datasets are strictly excluded.
2. **1:1 Twitter Web Geometry**: Embedded within the standard desktop shell (`MainLayout.tsx`) occupying the central 600px timeline container (`max-w-[600px] border-x border-[#eff3f4]`) with light theme tokens (`#ffffff`, `#eff3f4`, `#0f1419`, `#536471`).
3. **Multi-Asset Card Presentation**: Adapts the comprehensive profile card format detailed in [`docs/followerlist.md`](followerlist.md), presenting an unobstructed top asset row (avatar + horizontally aligned board thumbnails) and personal hashtags.
4. **Zero-Friction Discovery & Routing**: Every asset on a creator card is directly interactive—clicking the avatar or handle navigates to `/[username]`, clicking board thumbnails navigates to `/[username]/status/[board.id]`, and clicking hashtags triggers instantaneous clipboard copying.

---

## 2. Route Hierarchy & Component Map

```
src/app/
└── page.tsx                     # Primary Home route (Client Component, SSR-compatible)

src/components/layout/
├── MainLayout.tsx               # 1:1 Shell geometry (max-w-[1265px], Left 275px, Center 600px, Right 350px)
└── LeftSidebar.tsx              # Active route highlighting for Home ('/')

src/lib/
├── follows.ts                   # Relationship resolver (Following, Followers) & live toggleFollow()
├── postStore.ts                 # Tombstone registry (getDeletedPostIds) & live session store (getSessionPost, getAllSessionPosts)
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
│  Group up to 4 per user_id    │
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
* **Capping**: Grouped by `user_id` in memory and capped at **up to 4 boards** per creator.

### 3.3 Viewer Relationship Sets
If the viewer is signed in, [`getViewerRelationships(authUser.id)`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/follows.ts) retrieves:
* `viewerFollowing`: `Set<string>` of account IDs the viewer follows.
* `viewerFollowers`: `Set<string>` of account IDs following the viewer.
Enables $O(1)$ lookup for relationship indicators (`Follows you`).

### 3.4 Home Feed Minimum Qualification Requirements
To ensure the Home timeline serves as a high-signal creator discovery surface, profiles must fulfill two minimum qualifications to appear:
1. **At least 4 boards**: Must have published $\ge 4$ undeleted boards (`boardsByUser[userId].length >= 4`).
2. **At least 1 hashtag**: Must have configured $\ge 1$ personal hashtag (`tags.length >= 1`).
Profiles that have not yet met both thresholds are filtered from the Home feed and header creator counter until their requirements are satisfied.

---

## 4. Card Anatomy & Visual Specifications

Each creator is presented in a card adhering strictly to Twitter Web Light Theme tokens:

```
┌────────────────────────────────────────────────────────────────────────┐
│ ┌─────┐   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ AV  │   │ Board 1  │ │ Board 2  │ │ Board 3  │ │ Board 4  │          │
│ └─────┘   └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                        │
│ Display Name ✓                                                         │
│ @username  [ Follow ]                                                  │
│ #vibecoder, #gamer, #painter, #pixelart (+2 more)                      │
└────────────────────────────────────────────────────────────────────────┘
──────────────────────────────────────────────────────────────────────────
```

### 4.1 Top Asset Row (Avatar + Horizontally Aligned Board Thumbnails)
Structured as a full-width, clean bannerless top row with horizontal alignment across all media:
1. **Avatar**:
   * Size: $64 \times 64\text{px}$ to $72 \times 72\text{px}$ (`w-16 h-16 sm:w-18 sm:h-18`), circular with a subtle border (`border border-black/5 shadow-xs`).
   * Upscaled via `formatTwitterAvatar()` to ensure 400×400 HD resolution.
2. **Solo Board Thumbnails (`BoardCollageThumbnail`)**:
   * Horizontally aligned alongside and to the right of the avatar (up to 4 boards).
   * Container Geometry: Compact rounded 2:1 card (`aspect-[2/1] w-24 sm:w-28 rounded-xl overflow-hidden border border-[#eff3f4] shadow-xs`).
   * **Solo Image Mode**: Displays the board's primary lead image or custom 2:1 cover crop (`thumbnailUrl || url`), perfectly mirroring the cropping on the profile Boards tab.
   * **Hover Interaction**: Scales up (`hover:scale-[1.04]`), increases shadow, and reveals the board title in a dark glass bottom bar (`bg-black/65 backdrop-blur-2xs text-white text-[9px]`).
   * **Route**: Clicks directly to `/[username]/status/[board.id]`.
   * **Mobile Responsiveness**: Enclosed in a horizontal flex container (`overflow-x-auto no-scrollbar`), ensuring boards scroll smoothly across viewports without obstruction.

### 4.2 Profile Identity & Action Details
Positioned directly beneath the top asset row:
* **Display Name**: Bold primary typography (`font-extrabold text-base text-[#0f1419] hover:underline`).
* **Verified Badge**: Twitter Blue checkmark (`CheckCircle2`).
* **Handle**: Secondary text (`@username text-xs text-[#536471]`).
* **Relationship Badges**:
  * **`Follows you`**: User follows viewer, but viewer has not followed back. Badge: `bg-[#eff3f4] text-[#536471] text-[11px] font-medium px-1.5 py-0.5 rounded`.
* **Follow / Unfollow Action Button**:
  * Positioned inline alongside `@username` (`py-0.5 px-3 min-w-[76px] text-xs font-bold rounded-full`).
  * If viewing own profile (`isSelf`): Displays a static `"You"` pill (`bg-[#eff3f4] text-[#536471] text-[11px] font-medium px-2 py-0.5 rounded-full`).
  * If viewing another profile: Interactive action button with optimistic state toggle and network rollback. Unauthenticated clicks trigger `signInWithTwitter()`.

### 4.3 Hashtags Display (Bio Replacement)
In accordance with [`docs/hashtags.md`](hashtags.md), the creator's personal hashtags replace the standard bio paragraph:
* **Densely Packed Paragraph Flow**: Rendered as continuous text with Twitter Blue `#` marks (`text-[#1d9bf0] font-bold`) and subtle gray commas (`text-[#536471]`).
* **Display Cap**: Displays up to 7 hashtags (`MAX_TAGS_ON_CARD = 7`). If the creator has additional tags, a `+N more` link routes directly to `/[username]/hashtags`.
* **Click-to-Copy Utility**: Clicking any hashtag writes `#tag` to `navigator.clipboard` and surfaces a transient floating tooltip (`Copied!`) directly above the tag for 1.5 seconds.
* **Empty State**: When no hashtags are set, renders a subtle italic indicator (`No hashtags written yet`). On the viewer's own card, surfaces a shortcut link (`Add hashtags →`).

---

## 5. Dual-Persistence & Cache Hydration

Hashtags and boards on creator cards adhere to the platform's multi-tier hydration strategy:

1. **Remote Database**: Read from PostgreSQL tables `public.profiles` (`hashtags` column) and `public.blocks` (`type = 'board'`).
2. **Local Synchronous Cache**: If the user recently updated their tags or recropped/created boards in the current browser session, `localStorage` and `postStore` session records (`getSessionPost`, `getAllSessionPosts`) immediately hydrate to eliminate cache latency.
3. **Showcase Fallback**: For primary platform showcase handles (`amberlyndev`, `amberlyn`), default demo tags (`#vibecoder`, `#gamer`, `#painter`, `#pixelart`, `#nightowl`) are populated if the database field is uninitialized.

---

## 6. Fresh Agent Onboarding Checklist

When maintaining or modifying the Home feed:

- [ ] **Preserve UUID Filtering**: Never allow mock strings (e.g. `usr_amberlyn`) to enter database query arrays; always validate IDs with `isValidUuid()`.
- [ ] **Preserve Solo Board Thumbnail Geometry**: Ensure board thumbnails maintain `aspect-[2/1] w-24 sm:w-28 rounded-xl border border-[#eff3f4]` to maintain proportional horizontal alignment alongside the avatar and match the 2:1 cover crop ratio.
- [ ] **Mobile Scroll Container**: The avatar and board thumbnail container must retain `overflow-x-auto no-scrollbar` so that up to 4 boards on compact viewports never squish the avatar or displace the Follow button.
- [ ] **Prioritize `thumbnailUrl`**: When rendering board cards or thumbnails, always extract `img?.thumbnailUrl || img?.url || img?.avatar` so custom cover crops reflect accurately while preserving the uncropped image for thread views.
- [ ] **Click-to-Copy Propagation**: When clicking a hashtag on a card, ensure `e.stopPropagation()` is called so the click does not inadvertently trigger parent card navigation.
