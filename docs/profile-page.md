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
└── status/[id]/
    ├── page.tsx                 # Server component: resolves focal post from Supabase or mock data
    └── ThreadClientView.tsx     # Client component: renders focal post + thread replies + reply composer

src/components/network/
└── UserNetworkView.tsx          # 1:1 X/Twitter interconnected tabs (OOMFs, Following, Followers) + live follow actions

src/components/profile/
└── ProfileView.tsx              # Primary profile component (Header, stats, tabs, composer drawer, modals)

src/components/collections/
├── CollectionLensBar.tsx        # Horizontal quick-access stadium pills + modal trigger
└── AllCollectionsModal.tsx      # Searchable modal displaying all curated presets

src/components/feed/
├── PostCard.tsx                 # Timeline post renderer (Standard, Carousel, Board, Link Card)
├── CommentCard.tsx              # Flat comment renderer (no threading, no replies, no quotes)
└── PostComposer.tsx             # Unified post creation component
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
   - Banner: Height responsive (`h-44 sm:h-52`), object-cover with fallback gradient.
   - Avatar: Circular avatar overlapping banner (`-mt-16 sm:-mt-20`). Always run through `formatTwitterAvatar()` to ensure 400×400 HD resolution instead of Twitter's pixelated default `_normal.jpg`.

3. **Action Row**:
   - **`"Ask!"` Auxiliary Pill** (Viewing others' profiles only): Rendered immediately to the left of the primary action button with a custom monochrome shushing cat face (`CatShushIcon`). Hidden when viewing own profile.
   - **Contextual Action Button**:
     - Viewing own profile: **`"Edit profile"`** opens the native edit modal.
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
- **Role**: Primary content timeline displaying actual posts created by the user (Standard, Carousel, Board).
- **Direct Feed Alignment**: Feed items render directly beneath the tab bar, preserving strict 1:1 parity with Twitter/X web profile timelines.
- **Curated Collections & Presets**: Clicking the active **`Posts ▾`** tab header toggles the expandable `CollectionLensBar`. Selecting a collection dynamically filters and custom-orders posts according to the author's exact sequence. An active blue indicator dot appears on the tab when filtered (`Posts •`), accompanied by a clearable active lens banner. *(See [Collections Context Doc](collections.md) for complete architecture).*
- **Thread Navigation**: Clicking any post card in this feed navigates directly to `/[username]/status/[id]` to open its dedicated thread view.

### 2. Comments (Second from Left)
- **Role**: Direct, flat profile guestbook.
- **Design & Behavior**:
  - Direct comment composer at the top: *"Leave a comment for @username..."*.
  - Comments appear in the feed styled like native tweets (`CommentCard.tsx`).
  - **Flat Structure Constraints**: Comments **cannot** be opened as threads, **cannot** be replied to, and **cannot** be quoted. This preserves a lightweight, high-signal guestbook without nested comment clutter.
  - Deletion: Permitted for the profile owner or the comment author.

### 3. Links (Third from Left)
- **Role**: Curated bio link showcase, link preset hub, and retro web button gallery.
- **Curated Link Collections**: Clicking the active **`Links ▾`** tab header toggles the expandable link presets bar (e.g. *Featured*, *Work*, *Writing*, *Audio*), dynamically rearranging links in custom sequence.
- **Composition**:
  - **The Badge Wall (Top Section)**: Aggregates all early-web 88×31 button badges into a single unified gallery sitting directly above larger link cards when viewing all links.
    - **88px Column Grid**: Rendered as `flex flex-wrap gap-3 items-start justify-start`. Each badge is formatted as an 88px wide column (`w-[88px] flex flex-col items-center gap-1`).
    - **Universal Underneath Labels**: The 88×31 button sits on top (pure visual artwork or color gradient), and the label is rendered underneath in clean, high-contrast typography (`text-[10px] font-semibold text-[#536471] group-hover/badge-item:text-[#0f1419] truncate w-full text-center`).
    - **Owner Controls**: Hovering reveals an inline `×` delete action in the top-right corner of the badge for profile owners, updating local and remote state instantly.
    - *Full technical specifications, canvas compression, and styling rules are detailed in [Web Badges Context Doc](badges.md).*
  - **Featured Link Cards (Bottom Section)**: Showcases high-contrast Linktree-style cards with title, description, domain badge, and a high-visibility `"Visit ↗"` button (from `user.links` and `link_card` blocks) directly without promotional banners.

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
