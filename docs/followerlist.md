# Follower & Network List Architecture (`docs/followerlist.md`)

This document serves as the technical reference for the interconnected network views (**OOMFs**, **Following**, and **Followers**) on `oomfs.org`. It details the routing hierarchy, UI presentation modes, relationship badge logic, and real-time data synchronization.

---

## 1. Core Philosophy & UX Model

Just like on Twitter/X Web, users navigate their social connections through dedicated, interconnected subroutes under any user profile. Content is rendered inside the standard 600px central timeline with light theme tokens and zero extraneous padding.

### Core Objectives:
1. **1:1 X Web Parity**: Sticky top header with back navigation, target user identity, and an interconnected 3-tab bar.
2. **Multi-Mode Visual Presentation**: Supports 4 distinct view modes (Compact, Cards, Canvas, Link Wall) toggled via an icon-only segmented pill in the header.
3. **Internal Mutuals (OOMFS) Graph**: Highlight mutual relationships ($A \leftrightarrow B$) natively without external Twitter API firehose dependencies.
4. **Unified Relationship Badge Hierarchy**: Distinct, non-competing badges (`OOMFS` vs `Follows you`) with authentic Twitter Light typography.

---

## 2. Route Hierarchy & Component Structure

```
src/app/[username]/
├── oomfs/page.tsx               # Mutual followers ($A ↔ B$) route
├── following/page.tsx           # Accounts followed by @username
├── followers/page.tsx           # Accounts following @username
└── page.tsx                     # Main user profile (stats row links into network routes)

src/app/oomfs/
└── page.tsx                     # Top-level sidebar route (loads authenticated user's network or guest view)

src/components/network/
└── UserNetworkView.tsx          # 1:1 Interconnected network view (tabs, icon switcher, 4 display modes)
```

### Route Resolvers:
All network subroutes (`/[username]/oomfs`, `/[username]/following`, `/[username]/followers`) use the shared profile resolver [`resolveUserProfile(username)`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/resolveUser.ts) wrapped in Next.js `<Suspense>` boundaries.

---

## 3. Profile Stats Row Integration

On any profile page ([`src/components/profile/ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx)), the profile-facing stats row prominently features the **OOMFs** count linking directly to the mutuals route, while the full 3-tab network menu remains active inside the network subroutes:

| Stat | Destination | Description |
| :--- | :--- | :--- |
| **`[N] oomfs`** (Profile Facing) | `/[username]/oomfs` | Mutual followers directory ($A \leftrightarrow B$) |
| **`[N] Following`** (Network Menu) | `/[username]/following` | Accounts that `@[username]` follows on `oomfs.org` |
| **`[N] Followers`** (Network Menu) | `/[username]/followers` | Accounts following `@[username]` on `oomfs.org` |

---

## 4. Sticky Header & 4 Display Modes

The top sticky header combines navigation, user identification, and a **4-option icon-only display switcher**:

```
[ ← Back ]  Display Name ✓  @handle             [ (List) (Grid) (Palette) (Layers) ]
────────────────────────────────────────────────────────────────────────────────────
     [ OOMFs ]              [ Following ]                 [ Followers ]
```

### 4.1 Display Options

| View Mode | Icon | Identifier | Layout & Visual Characteristics |
| :--- | :--- | :--- | :--- |
| **Compact** (Default) | `List` | `'compact'` | 1:1 Twitter timeline row with circular 44px avatar on the left, display name, handle, single badge, bio snippet, and right-aligned follow button. |
| **Cards** | `LayoutGrid` | `'cards'` | Taller 1:1 profile header cards with real header banner (`h-28 sm:h-32`), 80px circular avatar overlapping the banner (`-mt-10 sm:-mt-12`), name, handle, badge, bio, and follow button. *(Follower/following/oomfs count row is excluded to preserve card focus).* |
| **Canvas** | `Palette` | `'canvas'` | Minimalist visual mode: wide rectangular banner tile (`h-28 sm:h-36`) with small avatar overlaid on the top left (`absolute top-3 left-3`). **Zero text**. |
| **Link Wall** | `Layers` | `'link_wall'` | Identical wide rectangular banner tile with small top-left avatar and **zero text**. |

---

## 5. Relationship Badge Logic

To avoid competing badges, each account card in the network feed displays **at most one** relationship badge beside their handle:

```
@username  [ OOMFS ]       <-- If mutual: you follow them AND they follow you
@username  [ Follows you ] <-- If they follow you, but you don't follow back
@username                  <-- If neither condition is met or viewing yourself
```

### Badge Styling Rules:
1. **`OOMFS` (Mutual)**:
   - **Condition**: `viewerIsFollowing && userFollowsViewer` ($A \leftrightarrow B$).
   - **Style**: `bg-[#1d9bf0]/10 text-[#1d9bf0] text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0`.
   - **Icon**: None. Purely typography-driven to match Twitter's badge weight.
2. **`Follows you`**:
   - **Condition**: `userFollowsViewer && !viewerIsFollowing`.
   - **Style**: `bg-[#eff3f4] text-[#536471] text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0`.
3. **Self Exclusion**:
   - When the logged-in viewer appears in a list, relationship tags and follow buttons are suppressed.

---

## 6. Data Layer & Real-Time Synchronization

Defined in [`src/lib/follows.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/follows.ts):

### 6.1 Query Helpers
- `getMutualOomfs(userId)`: Calls PostgreSQL RPC `public.get_mutual_oomfs` or two-step fallback query to retrieve mutual profiles.
- `getUserFollowing(userId)`: Resolves all profiles where `follower_id = userId`.
- `getUserFollowers(userId)`: Resolves all profiles where `following_id = userId`.
- `getViewerRelationships(viewerUserId)`: Retrieves `followingIds` and `followerIds` as `Set<string>` instances for $O(1)$ relationship checks in the UI loop.

### 6.2 Live Follow Mutations
Clicking the **Follow / Following** button on any card executes an optimistic UI toggle:
1. Immediately updates `viewerFollowing` set in React state.
2. Executes `toggleFollow(targetUserId, authUser.id, isCurrentlyFollowing)`.
3. On failure, automatically rolls back state to prevent desynchronization.

---

## 7. Agent Onboarding Checklist

When working on network lists or follow interactions:

- [ ] **Tab URL Synchronization**: When switching tabs in [`UserNetworkView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/network/UserNetworkView.tsx), use `window.history.replaceState(null, '', '/[username]/[tab]')` to maintain browser history without triggering full page reloads.
- [ ] **UUID Validation**: Always run foreign keys through `isValidUuid()` before executing Supabase queries to prevent Postgres UUID syntax errors (`22P02`).
- [ ] **Mock Fallbacks**: If testing with offline demo handles (e.g. `amberlyn`, `dev_kyle`), ensure mock profiles from `MOCK_USERS` gracefully populate the lists without throwing runtime exceptions.
- [ ] **Banner Height Consistency**: In `cards`, `canvas`, and `link_wall` view modes, ensure image containers use `object-cover` with fallback gradients (`from-blue-100 via-indigo-50 to-purple-100`).
