# Profile Page Architecture (`oomfs.org/[username]`)

This document serves as the architectural reference for user profiles on `oomfs.org`. It details the component hierarchy, data lifecycle, layout rules, the 4 profile tabs, and thread routing.

---

## 1. Route Hierarchy & Component Structure

Profiles are routed under dynamic paths using Next.js App Router:

```
src/app/[username]/
├── page.tsx                     # Server component: resolves profile and stats (default: Boards tab)
├── presets/
│   └── page.tsx                 # Redirects/renders ProfileView with initialTab="boards"
├── links/
│   ├── page.tsx                 # Dedicated Links portal route
│   └── [slug]/page.tsx          # Permanent server redirect back to /[username]/links
├── hashtags/
│   └── page.tsx                 # Dedicated Hashtags notepad route (initialTab="hashtags")
├── oomfs/page.tsx               # Interconnected OOMFs (mutuals) route
├── following/page.tsx           # Interconnected Following route
├── followers/page.tsx           # Interconnected Followers route
└── status/[id]/
    ├── page.tsx                 # Server component: resolves focal board/comment from Supabase or mock data
    └── ThreadClientView.tsx     # Client component: renders focal board/comment + thread replies + reply composer

src/components/network/
└── UserNetworkView.tsx          # 1:1 X/Twitter interconnected tabs (OOMFs, Following, Followers) + live follow actions

src/components/profile/
├── ProfileView.tsx              # Primary profile component (Header, stats, 5 tabs, breadcrumbs, modals)
└── BannerCropModal.tsx          # 1:1 X 1500x500 banner crop viewfinder, zoom slider, & wheel zoom

src/components/hashtags/
└── HashtagsNotepad.tsx          # Hyper-minimalist personal hashtags notepad (View/Edit modes, comma engine)

src/components/feed/
├── BoardPresetsBar.tsx          # Pinned horizontal bar (All Boards, preset tabs, owner actions)
├── BoardGridCard.tsx            # 2-column Pinterest board card (2:1 aspect ratio)
├── PostComposer.tsx             # Board Builder composer (Title, 5 slots with images & mutual avatars)
└── PostCard.tsx                 # Focal post / thread view renderer

src/components/collections/
├── ReorderPresetsModal.tsx      # Modal for rearranging presets and deleting presets
├── ReorderCollectionModal.tsx   # Visual 100-card board reordering workspace for collection owners
├── CreateCollectionModal.tsx    # Modal for creating presets (Title only)
└── AddToCollectionModal.tsx     # Modal for assigning boards to presets with real-time checkboxes

src/components/links/
└── LinksPortal.tsx              # Linktree-style vertical stack for external user accounts (35+ platforms)
```

---

## 2. Profile Header & Identity Section

The profile header sits at the top of `ProfileView.tsx` and adheres strictly to the Twitter/X Web Light Theme:

1. **Top Navigation Bar**:
   - Back button (`←`), user display name, verified checkmark, and active post count.
   - **Top Actions & Dynamic Scroll Swap**:
     - **Persistent "Back to X" Link**: A clean pill button (`View @username on 𝕏`) linking directly to `https://x.com/[username]` in a new tab.
     - **Header Action Icons**: Native circular icon buttons: **`More`** (three dots) and **`Search`** (magnifier, furthest to the right).
     - **Dynamic Follow Swap**: When scrolling down past the profile's primary Follow/Following button, the sticky header dynamically swaps the action icon buttons into a compact **`Follow` / `Following`** action pill (when viewing another profile while authenticated). Scrolling back up restores the icon buttons.
     - On own profile (`isSelf`) or when logged out, the action icons persist alongside the X link without swapping.

2. **Banner Viewport**:
   - Main Viewport: Height responsive, 3:1 aspect ratio (`1500×500px`), 100% clean and unobstructed, displaying the authentic header banner.
   - Lightbox Portal: Tapping the banner opens `FullscreenMediaModal.tsx` for full-resolution inspection.

3. **Avatar & Tip Circle (Twin Hero Circles)**:
   - Avatar: Circular avatar overlapping banner (`-mt-16 sm:-mt-20`). Always run through `formatTwitterAvatar()` to ensure 400×400 HD resolution instead of Twitter's default `_normal.jpg`.
   - **Tip Circle (`TipCircle.tsx`)**: Twin hero circle positioned immediately to the right of the avatar, matching its exact size (`w-28 h-28 sm:w-36 sm:h-36`) and banner-crossing offset (`-mt-16 sm:-mt-20`).
     - Symmetrical dual-coin format (~63.4% diameter each).
     - Left Coin overlaps on top of Right Coin with crisp permanent black outlines.
     - Tapping the circle launches **`SupporterModal.tsx`**.

4. **Action Row & Native Edit Profile Modal**:
   - Viewing own profile: **`"Edit profile"`** opens the native edit modal with header banner upload/remove, overlapping avatar, and interactive 1500×500 zoom & pan crop modal (`BannerCropModal.tsx`).
   - Viewing another profile (logged out): **`"Connect X"`** triggers Twitter OAuth 2.0 PKCE.
   - Viewing another profile (logged in): **`"Follow" / "Following"`** toggle.

5. **User Details & Metadata**:
   - Display name + Verified badge.
   - Handle (`@username`).
   - Bio: Multi-line text preserving whitespace. Nullish coalescing is strictly enforced to prevent brief bios from falling back to default text.
   - **1:1 X Stats Row**:
     - **`[N] oomfs`** (Twitter Blue) linking to `/[username]/oomfs`.
     - **`[N] Following`** linking to `/[username]/following`.
     - **`[N] Followers`** linking to `/[username]/followers`.

---

## 3. The 5 Profile Tabs

Tabs are ordered left-to-right with clean typography without parentheses counters:

```
[ 1. Boards ]  [ 2. Links ]  [ 3. Comments ]  [ 4. Hashtags ]  [ 5. Likes ]
```

### 1. Boards (Leftmost & Default)
* **Role**: Primary content surface displaying all curated boards created by the user. Boards are the sole timeline post type.
* **Pinned Presets Bar (`BoardPresetsBar.tsx`)**:
  * Pinned directly at `sticky top-[53px]` underneath the tab bar.
  * Rectangles are styled as clean rounded rectangles (`min-w-[96px] h-[58px]`) with zero emojis:
    * **`All Boards` (Master Tab)**: Master button displaying all authored boards in the 2-column Pinterest grid. Displays total boards count. Active when `activeCollectionId === null`.
    * **Divider**: Visual separator dividing the master button from creator preset tabs.
    * **Preset Tabs**: Direct 1-tap switching to filter boards by preset (capped at 12 slots). Displays preset title and board count.
    * **Owner Actions**: `[+ New]` launches `CreateCollectionModal.tsx`; `[Manage]` launches `ReorderPresetsModal.tsx`.
* **Content Surfaces**:
  * The timeline content surface exclusively displays the 2-column Pinterest-style scroll grid (`BoardGridCard.tsx`).
  * Tapping any tab on `BoardPresetsBar` immediately updates the board grid to show either all boards or that preset's boards without intermediate directory cards or drill-down screens.
  * **Card Geometry**: Rounded rectangle maintaining the compact `aspect-[2/1]` height, with the lead hero image widened to span the full 100% width (precisely framed during creation via `BoardCropModal.tsx`). Secondary images in the board cascade as overlapping circular avatars in the bottom-left corner with `+N` overflow indicator.
  * Clean title below the card + item count (e.g. `6 items`).
  * Avatar embeds (`type: 'user'`) render circular mutual avatars with direct links to `/[username]`.

### 2. Links (Second from Left)
* **Role**: Linktree-style external accounts and destination portal (`LinksPortal.tsx`) for the creator's personal accounts and communities (Discord, Twitch, Steam, X, YouTube, GitHub, Spotify, etc.).
* **Branded Platform Registry**: Built-in 35+ platform registry across Gaming, Streaming, Social, Music, Art, Support, and Dev with authentic vector SVG brand icons, distinct brand color accents, and automatic URL detection.
* **Custom Logo & Image Support**: Supports uploading custom photos/icons (via client-side data URLs) either directly from the platform picker or as a dynamic replacement for standard brand logos.
* **Owner Management**: Inline reordering (`↑` / `↓`), editing (pencil button), and deletion (`✕`).

### 3. Comments (Third from Left)
* **Role**: 1:1 X/Twitter-native profile guestbook and conversation hub.
* **Design & Behavior**: Inline comment composer with *"Replying to @username"* context, text area, and client-compressed image attachments supporting up to 4 photos (`TwitterMediaGrid`).
* **Cross-Profile Scoping**: Comments store `user_id` (the commenter) and `target_user_id` (the recipient profile). Comments display exclusively on the target profile's Comments tab while remaining indexed under the author.

### 4. Hashtags (Fourth leftmost)
* **Role**: Hyper-minimalist personal notepad (`HashtagsNotepad.tsx`) residing within the centered 600px timeline container where users write hashtags for themselves (e.g. `#vibecoder`, `#gamer`, `#painter`).
* **Design & Feel**: Continuous, densely packed paragraph of comma-separated hashtags flowing like long written text in a notepad. No lines/list clutter or boxed pills—authentic, clean typography with Twitter Blue `#` marks and subtle gray commas.
* **Interactive Capabilities**:
  * **View Mode**: Clean flowing paragraph of hashtags. Clicking any hashtag copies it to the clipboard with subtle inline confirmation.
  * **Edit Mode**: Profile owners tap `[Edit]` to enter inline editing. Adding tags is done effortlessly by typing and pressing `,` (comma) to separate. Pressing <kbd>Backspace</kbd> on empty input deletes the previous tag; tags can also be pruned via subtle `×` buttons.
  * **Bulk Edit**: Supports switching to edit as a raw comma-separated text block if desired.
  * **Dual Persistence**: Synchronous instant caching in `localStorage` (`oomfs_profile_hashtags_<userId>`) with resilient non-blocking background persistence to Supabase `public.profiles.hashtags`.
* **Specification Reference**: Detailed architecture is documented in [Hashtags Context Doc](hashtags.md).

### 5. Likes (Fifth / Rightmost)
* **Role**: Dedicated feed showcasing posts liked by the user.

---

## 4. Thread Route (`/[username]/status/[id]`)

When a user clicks on any board or comment card, Next.js routes to `/[username]/status/[id]`:

1. **Server Resolution (`src/app/[username]/status/[id]/page.tsx`)**:
   - Queries Supabase `public.blocks` joined with `public.profiles` by `postId`.
   - If not found in database, checks `MOCK_POSTS` and provides an initial post payload.

2. **Client Hydration & Board Expansion (`ThreadClientView.tsx`)**:
   - **Local Session Store Check**: Checks `getSessionPost(id)` from `src/lib/postStore.ts` to ensure newly drafted posts render immediately without server round-trips.
   - **Board Expansion**: Renders the large bold board title, followed by an authentic 2-column Pinterest-style masonry grid showing all items, notes, and collaborator links.
   - **Board Deletion**: Profile owners can delete boards directly from the thread view with confirmation, which purges the item from state, session store, tombstone registry, and Supabase, redirecting back to `/[username]`.
   - **Replies Feed**: Displays conversational reply composer and threaded responses below the board media.

---

## 5. State Management & Data Synchronization

### Supabase Integration
* **Profile Fetching**: `supabase.from('profiles').select('*').eq('username', username.toLowerCase()).single()`.
* **Content Blocks**: `supabase.from('blocks').select('*').eq('user_id', targetUserId).neq('type', 'comment').order('created_at', { ascending: false })`.
* **Collections**: `supabase.from('collections').select('*').eq('user_id', targetUserId).order('sort_order', { ascending: true })`.

### Deletion & Tombstone System (`src/lib/postStore.ts`)
* **`markPostAsDeleted(id)`**: Stores deleted board IDs in both `localStorage` and `sessionStorage`.
* **`getDeletedPostIds()`**: Returns a Set of deleted IDs.
* **Mount Hydration**: `ProfileView.tsx` checks `getDeletedPostIds()` to filter out deleted boards from initial state, session posts, and mock fallbacks, preventing deleted boards from reappearing upon refresh.

### Cross-Component Event Broadcasting
When a board is submitted from the LeftSidebar modal or inline composer:
1. It is saved in Supabase (if signed in).
2. It is cached in `saveSessionPost(newPost)`.
3. It emits `window.dispatchEvent(new CustomEvent('oomfs:post-created', { detail: { post, collectionId } }))`.
4. `ProfileView.tsx` receives the event, prepends the board to active state, updates preset assignments, and activates the `'boards'` tab.
