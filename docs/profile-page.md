# Profile Page Architecture (`oomfs.org/[username]`)

This document serves as the architectural reference for user profiles on `oomfs.org`. It details the component hierarchy, data lifecycle, layout rules, the 4 profile tabs, and thread routing.

---

## 1. Route Hierarchy & Component Structure

Profiles are routed under dynamic paths using Next.js App Router:

```
src/app/[username]/
├── page.tsx                     # Server component: resolves profile and stats
├── oomfs/page.tsx               # Interconnected OOMFs (mutuals) route
├── following/page.tsx           # Interconnected Following route
├── followers/page.tsx           # Interconnected Followers route
├── links/
│   ├── page.tsx                 # Dedicated single Links Switchboard route
│   └── [slug]/page.tsx          # Permanent server redirect back to /[username]/links
└── status/[id]/
    ├── page.tsx                 # Server component: resolves focal post from Supabase or mock data
    └── ThreadClientView.tsx     # Client component: renders focal post + thread replies + reply composer

src/components/network/
└── UserNetworkView.tsx          # 1:1 X/Twitter interconnected tabs (OOMFs, Following, Followers) + live follow actions

src/components/profile/
└── ProfileView.tsx              # Primary profile component (Header, stats, tabs, switchboard console, modals)

src/components/collections/
├── CollectionLensBar.tsx        # Horizontal quick-access stadium pills + modal trigger
├── AllCollectionsModal.tsx      # 50-slot Pokédex-style collection directory modal
├── ReorderCollectionModal.tsx   # Visual 100-card post reordering workspace for collection owners
├── CreateCollectionModal.tsx    # Modal for creating presets with emoji picker and quick-pin toggle
└── AddToCollectionModal.tsx     # Modal for assigning posts/links to presets with instant checkboxes

src/components/feed/
├── PostCard.tsx                 # Timeline post renderer (Standard, Carousel, Board, Link Card, Web Badge)
├── CommentCard.tsx              # Flat comment renderer (no threading, no replies, no quotes)
└── PostComposer.tsx             # Unified post creation component (Dual-Tab Post/Link)
```

---

## 2. Profile Header & Identity Section

The profile header sits at the top of `ProfileView.tsx` and adheres strictly to the Twitter/X Web Light Theme:

1. **Top Navigation Bar**:
   - Back button (`←`), user display name, verified checkmark, and active post count.
   - **Top Actions & Dynamic Scroll Swap**:
     - **Persistent "Back to X" Link**: A clean pill button (`View @username on 𝕏`) linking directly to `https://x.com/[username]` in a new tab, clarifying that `oomfs.org` is a complementary profile layer.
     - **Header Action Icons**: Native circular icon buttons: **`More`** (three dots), **`Filter`** (funnel), and **`Search`** (magnifier, furthest to the right).
     - **Dynamic Follow Swap**: When scrolling down past the profile's primary Follow/Following button, the sticky header dynamically swaps the action icon buttons into a compact **`Follow` / `Following`** action pill (when viewing another profile while authenticated). Scrolling back up restores the icon buttons.
     - On own profile (`isSelf`) or when logged out, the action icons persist alongside the X link without swapping.

2. **Banner & Avatar**:
   - Banner: Height responsive (`h-44 sm:h-52`), 3:1 aspect ratio (`1500×500px`), object-cover with Twitter Light neutral slate fallback (`#cfd9de`).
   - Avatar: Circular avatar overlapping banner (`-mt-16 sm:-mt-20`). Always run through `formatTwitterAvatar()` to ensure 400×400 HD resolution instead of Twitter's pixelated default `_normal.jpg`.

3. **Action Row & Native Edit Profile Modal**:
   - **`"Ask!"` Auxiliary Pill** (Viewing others' profiles only): Rendered immediately to the left of the primary action button with a custom monochrome shushing cat face (`CatShushIcon`). Hidden when viewing own profile.
   - **Contextual Action Button**:
     - Viewing own profile: **`"Edit profile"`** opens the native 1:1 X edit modal with header banner upload/remove, overlapping avatar, and interactive 1500×500 zoom & pan crop modal (`BannerCropModal.tsx`).
     - Viewing another profile (logged out): **`"Connect X"`** triggers Twitter OAuth 2.0 PKCE.
     - Viewing another profile (logged in): **`"Follow" / "Following"`** toggle.

4. **User Details & Metadata**:
   - Display name + Verified badge.
   - Handle (`@username`).
   - Bio: Multi-line text preserving whitespace. **Crucial Rule**: Always use nullish coalescing (`dbUser.bio !== null && dbUser.bio !== undefined ? dbUser.bio : fallback`) to prevent empty strings or brief bios from falling back to default text.
   - **Focused Stats & Actions Row**:
     - Prominently showcases **`[N] oomfs`** (`#1d9bf0`, enlarged font weight and size) linking directly to the mutuals directory (`/[username]/oomfs`).
     - Profile-facing `Following` and `Followers` counters are removed to focus exclusively on mutual OOMFs.
     - Features auxiliary native capsules to the right: **`Canvas`** (with Paintbrush icon, linking to the user's collaborative r/place-style canvas) and **`Tip`** (with `$` DollarSign icon for direct support).

---

## 3. The 4 Profile Tabs

Tabs are ordered left-to-right to optimize content discovery and render with clean labels without parentheses counters:

```
[ 1. Posts ]  [ 2. Comments ]  [ 3. Links ]  [ 4. Likes ]
```

### 1. Posts (Leftmost & Default)
- **Role**: Primary unified content timeline displaying all posts created by the user: Standard text, Carousels, Curated Boards, Bio Link Cards, and Web Badges.
- **Direct Feed Alignment**: Feed items render directly beneath the tab bar, preserving strict 1:1 parity with Twitter/X web profile timelines.
- **Embedded Link & Badge Blocks**: Link cards and web badges are embedded directly within standard Twitter post cards (`PostCard.tsx`), complete with full native interaction suites (repost, like, share, reply, and collection assignment).
- **Curated Collections & Presets**: Clicking the active **`Posts ▾`** tab header toggles the expandable `CollectionLensBar`. Selecting a collection dynamically filters and custom-orders posts according to the author's exact sequence. Creators can organize existing posts into presets via the `FolderPlus` icon on any post card (`AddToCollectionModal.tsx`), create new presets (`CreateCollectionModal.tsx`), and reorder presets via native drag-and-drop in `AllCollectionsModal.tsx` (top presets pin leftmost on the lens bar). An active blue indicator dot appears on the tab when filtered (`Posts •`), accompanied by a clearable active lens banner. *(See [Collections Context Doc](collections.md) for complete architecture).*
- **Thread Navigation**: Clicking any post card in this feed navigates directly to `/[username]/status/[id]` to open its dedicated thread view.

### 2. Comments (Second from Left)
- **Role**: 1:1 X/Twitter-native profile guestbook and conversation hub.
- **Design & Behavior**:
  - **Composer with Media**: Inline comment composer featuring *"Replying to @username"* context, text area, and client-compressed image attachments supporting up to 4 photos (`TwitterMediaGrid`).
  - **1:1 Twitter Card Layout**: Rendered via `CommentCard.tsx` with verified badge, *"Replying to @[username]"* header, text, attached media grid (1–4 images), and full interactive action suite (Reply, Repost, Like, Share).
  - **Thread Navigation**: Clicking any comment card seamlessly navigates to `/[commentAuthor]/status/[commentId]`, opening it as a full conversational thread with back-navigation to the guestbook and inline reply composition.
  - **Cross-Profile Scoping**: Comments store `user_id` (the commenter) and `target_user_id` (the recipient profile). Comments display exclusively on the target profile's Comments tab while remaining indexed under the author for cross-site search and activity.
  - **Deletion & Moderation**: Deletion is permitted for both the comment author (`auth.uid() = user_id`) and the profile owner (`auth.uid() = target_user_id`).
  - *Complete technical specifications for comments, the 1–4 photo grid, and cross-profile RLS are in [Comments Context Doc](comments.md).*

### 3. Links (Third from Left) — The Switchboard Console
- **Role**: Visual directory and launchpad for the user's curated channels and Post Collections.
- **Single Unified Page**: Rather than fragmenting links into disconnected sub-pages (`/links/[slug]`), all link exploration is centralized on **ONE unified Links page** (`/[username]/links`).
- **Interactive Switchboard GUI**:
  - **Master Timeline Launcher**: Prominent launch card for switching instantly back to the uncensored chronological Posts feed.
  - **Channel Grid**: 2-column interactive button console displaying each of the user's curated Post Collections (e.g., `💼 Work Links`, `🎨 Moodboards`, `📝 Articles`), complete with collection icons, item counts, and descriptions.
  - **1-Click Collection Launching**: Clicking any channel button switches the profile active tab to **Posts**, automatically engages the selected collection lens, and updates the URL parameter (`?col=[id]`).
  - **Owner Controls**: When viewing one's own profile, quick-action buttons allow creating new collections (`+ New Collection`) or managing & reordering channels (`Manage`).
- *Complete technical specifications for collections and the Switchboard are in [Collections Context Doc](collections.md) and [Link Pages Documentation](links.md).*

### 4. Likes (Fourth / Rightmost)
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
4. `ProfileView.tsx` listens for this event and automatically prepends the new post to the active feed, switching to the appropriate tab (`'links'` for link cards, `'posts'` for posts).
