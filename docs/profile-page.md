# Profile Page Architecture (`oomfs.org/[username]`)

This document serves as the architectural reference for user profiles on `oomfs.org`. It details the component hierarchy, data lifecycle, layout rules, the 5 profile tabs, and thread routing.

---

## 1. Route Hierarchy & Component Structure

Profiles are routed under dynamic paths using Next.js App Router:

```
src/app/[username]/
├── page.tsx                     # Server component: resolves profile and stats (default: Posts tab)
├── presets/
│   └── page.tsx                 # Dedicated Presets switchboard route (SSR + client hydration)
├── links/
│   ├── page.tsx                 # Dedicated Links portal route
│   └── [slug]/page.tsx          # Permanent server redirect back to /[username]/links
├── oomfs/page.tsx               # Interconnected OOMFs (mutuals) route
├── following/page.tsx           # Interconnected Following route
├── followers/page.tsx           # Interconnected Followers route
└── status/[id]/
    ├── page.tsx                 # Server component: resolves focal post from Supabase or mock data
    └── ThreadClientView.tsx     # Client component: renders focal post + thread replies + reply composer

src/components/network/
└── UserNetworkView.tsx          # 1:1 X/Twitter interconnected tabs (OOMFs, Following, Followers) + live follow actions

src/components/profile/
├── ProfileView.tsx              # Primary profile component (Header, stats, 5 tabs, breadcrumbs, modals)
└── BannerCropModal.tsx          # 1:1 X 1500x500 banner crop viewfinder, zoom slider, & wheel zoom

src/components/collections/
├── ReorderPresetsModal.tsx      # Modal for rearranging preset collections order on the profile Presets tab
├── ReorderCollectionModal.tsx   # Visual 100-card post reordering workspace for collection owners
├── CreateCollectionModal.tsx    # Modal for creating presets with emoji picker and quick-pin toggle
└── AddToCollectionModal.tsx     # Modal for assigning posts/links to presets with instant checkboxes

src/components/links/
└── LinksPortal.tsx              # Linktree-style vertical stack for external user accounts (35+ platforms, custom logos)

src/components/feed/
├── PostCard.tsx                 # Timeline post renderer (Standard with 1-4 attachments, Board with images/avatars)
├── CommentCard.tsx              # Flat comment renderer (no threading, no replies, no quotes)
└── PostComposer.tsx             # Unified post creation component (Standard with 1-4 attachments & Board builder)
```

---

## 2. Profile Header & Identity Section

The profile header sits at the top of `ProfileView.tsx` and adheres strictly to the Twitter/X Web Light Theme:

1. **Top Navigation Bar**:
   - Back button (`←`), user display name, verified checkmark, and active post count.
   - **Top Actions & Dynamic Scroll Swap**:
     - **Persistent "Back to X" Link**: A clean pill button (`View @username on 𝕏`) linking directly to `https://x.com/[username]` in a new tab, clarifying that `oomfs.org` is a complementary profile layer.
     - **Header Action Icons**: Native circular icon buttons: **`More`** (three dots) and **`Search`** (magnifier, furthest to the right).
     - **Dynamic Follow Swap**: When scrolling down past the profile's primary Follow/Following button, the sticky header dynamically swaps the action icon buttons into a compact **`Follow` / `Following`** action pill (when viewing another profile while authenticated). Scrolling back up restores the icon buttons.
     - On own profile (`isSelf`) or when logged out, the action icons persist alongside the X link without swapping.

2. **Banner Viewport**:
   - Main Viewport: Height responsive, 3:1 aspect ratio (`1500×500px`), 100% clean and unobstructed (no dots or overlays), displaying the user's authentic header banner.
   - Lightbox Portal: Tapping the banner opens `FullscreenMediaModal.tsx` for full-resolution inspection and link sharing.

3. **Avatar & Tip Circle (Twin Hero Circles)**:
   - Avatar: Circular avatar overlapping banner (`-mt-16 sm:-mt-20`). Always run through `formatTwitterAvatar()` to ensure 400×400 HD resolution instead of Twitter's pixelated default `_normal.jpg`.
   - **Tip Circle (`TipCircle.tsx`)**: Twin hero circle positioned immediately to the right of the avatar, matching its exact size (`w-28 h-28 sm:w-36 sm:h-36`) and banner-crossing offset (`-mt-16 sm:-mt-20`). Features a borderless, transparent container where the banner and shelf show through:
     - 🪙 **Permanent Twin Coins**: Symmetrical dual-coin format (~63.4% diameter each).
     - 📐 **Left-Over-Right Layering**: The Left Coin (`x = 32.2%`, `z-index: 20`) strictly overlaps on top of the Right Coin (`x = 88.0%`, `z-index: 10`) with a subtle ~7.6% overlap.
     - 🖤 **Permanent Black Outlines**: Both coins feature crisp permanent black outlines (`outline outline-1 outline-black`) with no hover state changes.
     - 🪙 **Default Coin Assets**: Left = Amb Coin (`/ambcoin.png`), Right = My Coin (`/My_Coin (1).png`).
   - Tapping the circle launches **`SupporterModal.tsx`**, presenting the expanded twin coin preview arena and temporary image uploader controls for live style testing.

4. **Action Row & Native Edit Profile Modal**:
   - **Contextual Action Button**:
     - Viewing own profile: **`"Edit profile"`** opens the native 1:1 X edit modal with header banner upload/remove, overlapping avatar, and interactive 1500×500 zoom & pan crop modal (`BannerCropModal.tsx`).
     - Viewing another profile (logged out): **`"Connect X"`** triggers Twitter OAuth 2.0 PKCE.
     - Viewing another profile (logged in): **`"Follow" / "Following"`** toggle.

5. **User Details & Metadata**:
   - Display name + Verified badge.
   - Handle (`@username`).
   - Bio: Multi-line text preserving whitespace. **Crucial Rule**: Always use nullish coalescing (`dbUser.bio !== null && dbUser.bio !== undefined ? dbUser.bio : fallback`) to prevent empty strings or brief bios from falling back to default text.
   - **1:1 X Stats Row**:
     - Follows authentic Twitter/X standard sizing (`text-sm`) ordered left-to-right:
       - **`[N] oomfs`** (`font-bold text-[#1d9bf0]` count + `text-[#1d9bf0]` label) highlighted in Twitter Blue, linking to `/[username]/oomfs`.
       - **`[N] Following`** (`font-bold text-[#0f1419]` count + `text-[#536471]` label) linking to `/[username]/following`.
       - **`[N] Followers`** (`font-bold text-[#0f1419]` count + `text-[#536471]` label) linking to `/[username]/followers`.

---

## 3. The 5 Profile Tabs

Tabs are ordered left-to-right to optimize content discovery and render with clean labels without parentheses counters:

```
[ 1. Posts ]  [ 2. Presets ]  [ 3. Links ]  [ 4. Comments ]  [ 5. Likes ]
```

### 1. Posts (Leftmost & Default)
- **Role**: Primary unified content timeline displaying all posts created by the user: Standard posts (with 1–4 photo or mutual avatar attachments) and Curated Boards (images and/or mutual avatars).
- **Direct Feed Alignment**: Feed items render cleanly beneath the tab bar, preserving strict 1:1 parity with Twitter/X web profile timelines with no secondary stadium toolbars or dropdown chevrons.
- **Active Preset Breadcrumb**:
  - When viewing an author-curated collection preset (selected from the **Presets** tab or via URL query parameter), a clean, single-line breadcrumb is displayed directly above the feed:
    ```
    ← All posts    [Icon] [Collection Title]    [⇅ Reorder]
    ```
  - **`← All posts`**: Instant 1-click action resetting the filter back to the full master feed.
  - **`[⇅ Reorder]`**: Visible only to the profile owner (`isSelf`), launching `ReorderCollectionModal.tsx` to arrange the visual post order.
- **Thread Navigation**: Clicking any post card in this feed navigates directly to `/[username]/status/[id]` to open its dedicated thread view.

### 2. Presets (Second from Left)
- **Role**: Dedicated in-situ switchboard channel directory, replacing the former Pokédex modal with a native tab.
- **Curated Channels Grid**: 2-column interactive grid (`grid-cols-1 sm:grid-cols-2 gap-3`) displaying each of the creator's curated Post Collections (e.g., `💼 Work Links`, `🎨 Moodboards`, `📝 Articles`, `🎧 Music`).
  - Displays collection icon, title, description, post count pill, and optional `⭐ Pinned` status badge.
- **1-Click Launching**: Clicking any channel card immediately transitions to the **Posts** tab with that collection filter active and the breadcrumb indicator displayed.
- **Owner Controls**: Profile owners (`isSelf`) have left-aligned controls: creating new collections via `+ New Collection` (`CreateCollectionModal.tsx`) and visually rearranging preset display order via `⇅ Rearrange Presets` (`ReorderPresetsModal.tsx`).

### 3. Links (Third from Left)
- **Role**: Linktree-style external accounts and destination portal (`LinksPortal.tsx`) for the creator's personal accounts and communities (Discord, Twitch, Steam, X, YouTube, GitHub, Spotify, etc.).
- **Conceptual Boundary**: `Links` is for *your personal accounts and destinations*, while `Posts`/`Presets` are for *content posts and curated feed playlists*.
- **Branded Platform Registry**: Built-in 35+ platform registry across Gaming, Streaming, Social, Music, Art, Support, and Dev with authentic vector SVG brand icons, distinct brand color accents, and automatic URL detection.
- **Custom Logo & Image Support**: Supports uploading custom photos/icons (via client-side data URLs) either directly from the platform picker or as a dynamic replacement for standard brand logos.
- **Owner Management**:
  - **Left-Aligned Action Bar**: Profile owners (`isSelf`) see a compact `+ Add Link` button anchored directly above the vertical stack. Visitors (`!isSelf`) see exclusively the clean vertical stack with zero title or banner prompts.
  - **Inline Item Controls**: Profile owners have direct controls on each card:
    - Inline Reorder: Step arrows (`↑` / `↓`) to arrange card order.
    - Edit: Pencil button to update destination URL, title, subtitle, or action pill.
    - Delete: `✕` button to remove links.
- *Complete technical specifications for the Links portal are in [Links Context Doc](links.md).*

### 4. Comments (Fourth from Left)
- **Role**: 1:1 X/Twitter-native profile guestbook and conversation hub.
- **Design & Behavior**:
  - **Composer with Media**: Inline comment composer featuring *"Replying to @username"* context, text area, and client-compressed image attachments supporting up to 4 photos (`TwitterMediaGrid`).
  - **1:1 Twitter Card Layout**: Rendered via `CommentCard.tsx` with verified badge, *"Replying to @[username]"* header, text, attached media grid (1–4 images), and full interactive action suite (Reply, Repost, Like, Share).
  - **Thread Navigation**: Clicking any comment card seamlessly navigates to `/[commentAuthor]/status/[commentId]`, opening it as a full conversational thread with back-navigation to the guestbook and inline reply composition.
  - **Cross-Profile Scoping**: Comments store `user_id` (the commenter) and `target_user_id` (the recipient profile). Comments display exclusively on the target profile's Comments tab while remaining indexed under the author for cross-site search and activity.
  - **Deletion & Moderation**: Deletion is permitted for both the comment author (`auth.uid() = user_id`) and the profile owner (`auth.uid() = target_user_id`).
  - *Complete technical specifications for comments, the 1–4 photo grid, and cross-profile RLS are in [Comments Context Doc](comments.md).*

### 5. Likes (Fifth / Rightmost)
- **Role**: Dedicated feed showcasing posts liked by the user.
- **Scope**: Displays strictly liked posts (does not mix in blank reposts or standalone quotes).

---

## 4. Thread Route (`/[username]/status/[id]`)

When a user clicks on any post card from the profile timeline, Next.js routes to `/[username]/status/[id]`:

1. **Server Resolution (`src/app/[username]/status/[id]/page.tsx`)**:
   - Queries Supabase `public.blocks` joined with `public.profiles` by `postId`.
   - If not found in database, checks `MOCK_POSTS` and provides an initial post payload.

2. **Client Hydration & Board Expansion (`ThreadClientView.tsx`)**:
   - **Local Session Store Check**: Checks `getSessionPost(id)` from `src/lib/postStore.ts` to ensure newly drafted posts in the current session immediately render without requiring server round-trips.
   - **Board Expansion**:
     - When a Board post is rendered in thread mode (`isThreadView = true`), all `3+` images expand from the 3-image preview into a full **2-column Pinterest-style masonry grid**.
   - **Replying Composer**: Allows visitors and users to submit replies to the thread.
   - **Replies Feed**: Displays conversational replies underneath the main post.

---

## 5. State Management & Data Synchronization

### Supabase Integration
- **Profile Fetching**: `supabase.from('profiles').select('*').eq('username', username.toLowerCase()).single()`.
- **Content Blocks**: `supabase.from('blocks').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false })`.
- **Profile Editing**: Updates `public.profiles` (`name`, `bio`, `location`, `website`) via the native modal.

### Cross-Component Event Broadcasting
When a post is submitted from the Left Sidebar modal or from an inline composer:
1. It is saved in Supabase (if signed in).
2. It is saved to `saveSessionPost(newPost)` for instant same-session thread resolution.
3. It emits `window.dispatchEvent(new CustomEvent('oomfs:post-created', { detail: newPost }))`.
4. `ProfileView.tsx` listens for this event and automatically prepends the new post to the active feed, switching to the `'posts'` tab.
