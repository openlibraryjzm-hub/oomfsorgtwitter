# Curated Collections & Feed Presets System

This document outlines the architecture, component structure, relational data models, and persistence strategy for the **Curated Collections & Presets System** on `oomfs.org`.

---

## 1. Architecture & Core Philosophy

On traditional social networks and link-in-bio tools, user content is locked into a rigid structure:
* **Posts** are constrained strictly to reverse-chronological order (newest first). Older high-signal work gets buried over time.
* **Links** are displayed in a static, one-size-fits-all vertical list.

The **Curated Collections & Switchboard System** introduces author-curated organization across user profiles:
1. **Posts Collections ("Playlist" model)**: A filterable lens over the author's master timeline. Older high-signal posts, carousels, boards, link cards, and badges can be highlighted in custom order, while all posts remain part of the primary chronological feed.
2. **The Links Switchboard Hub**: The **Links** tab functions as a unified console and channel directory. It features an "All Posts" master launcher alongside clickable cards for each curated Post Collection, allowing visitors to instantly explore thematic feeds.
3. **On-Demand Discovery**: Presets remain collapsed by default on the Posts tab to preserve a clean, native profile layout, but expand instantly when the visitor or creator clicks the `Posts ▾` tab header, or when clicking any channel in the Links Switchboard.
4. **Scalability Beyond 4 Items**: Uses a hybrid pill-and-modal pattern to support up to 50 collections per profile without cluttering the horizontal tab strip.
5. **Two-Tiered Ordering Architecture**:
   - **Collection Level**: Pinned collections occupy quick-access slots 1 through 5, while unpinned collections follow in author-defined sequence.
   - **Item Level (Posts / Links)**: Each curated collection preserves its own author-defined item order (up to 100 items), managed via a dedicated reordering canvas.

---

## 2. Component Structure & Hierarchy

```
src/components/collections/
├── CollectionLensBar.tsx       # Horizontal stadium-pill scrollbar with quick-access lenses
├── AllCollectionsModal.tsx     # 50-slot Pokédex-style collection directory modal
├── ReorderCollectionModal.tsx  # Visual 100-card post reordering workspace for collection owners
├── CreateCollectionModal.tsx   # Modal for creating presets with emoji picker and quick-pin toggle
└── AddToCollectionModal.tsx    # Modal for assigning posts/links to presets with instant checkboxes

src/components/profile/
└── ProfileView.tsx             # Controls tab toggling, active filter states, feed reordering, & DB sync
```

### Component Responsibilities

1. **`CollectionLensBar.tsx`**:
   - **`[ All (N) ]` Pill**: Clears any active preset and restores the default chronological feed or standard link list. Strictly locked at the leftmost position and immovable.
   - **Top Pinned Stadium Pills (Up to 5 Fixed Slots)**: Surfaces up to 5 quick-access presets (Slot 1 leftmost through Slot 5 rightmost) with emoji icons and item count badges. Sequence reflects the creator's assigned slot order.
   - **Dynamic Active Pill**: If an unpinned preset is selected from the modal, it automatically surfaces into this bar with an inline `(×)` dismiss button.
   - **`[ ⊞ All (N) ▾ ]` Modal Trigger**: Scalability anchor. Displays the total number of presets and triggers `AllCollectionsModal`.
   - **`[ + New ]` Button**: Visible to profile owners (`isSelf`) to trigger `CreateCollectionModal`.

2. **`AllCollectionsModal.tsx`**:
   - Centered modal adhering to a **Total Minimalism + Pokédex** aesthetic.
   - **Enshrined 50-Slot Hard Limit**: Profiles feature exactly 50 numbered index slots (`#01` to `#50`).
   - **Pokédex Grid Layout**: 5 columns x 10 rows on desktop (`grid-cols-2 sm:grid-cols-5`).
     - **Filled Slots**: Existing collections fill slots in sequence (`#01`, `#02`...) with pinned collections occupying slots 1 through 5 first, followed by unpinned collections. Each capsule displays its monospace slot number (`#01`), emoji icon, and title.
     - **Empty / Placeholder Slots**: Any unused slots up to 50 render as subtle ghosted capsules (`#06 —` for visitors, `#06 + new` on hover for owners). Clicking an empty slot as an owner immediately triggers `CreateCollectionModal`.
   - **Master Timeline Anchor**: The top bar permanently anchors `[ ∞ All Posts ]` (or `[ 🌐 Main Links ]`) on the left to allow instant reset to the complete feed.
   - **Top Controls**: Features only the master anchor on the left and `[ + New ]` + `[ ✕ ]` close button on the right. Contains zero header titles, zero counter text, and no redundant footer bars.
   - **Owner Hover Actions**: Hovering a filled capsule reveals subtle `Pin`, `Delete`, and `Reorder` shortcuts for authenticated profile owners.

3. **`ReorderCollectionModal.tsx`**:
   - Dedicated visual reordering workspace for collection owners (`isSelf`).
   - **Primary Access Point**: Launched via the prominent **`[ ⇅ Reorder ]`** button on the profile's active lens indicator banner (`Viewing collection: [Title]`) directly above the feed. Also accessible via the hover shortcut in `AllCollectionsModal.tsx`.
   - **100-Card Visual Canvas**: Displays all posts within the collection in a responsive grid (`sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).
   - **Item Controls**:
     - Visual position badges (`#1` to `#100`).
     - Post media thumbnails (photos, carousels, boards, link previews) or snippet text.
     - Native drag handles (`GripVertical`).
     - One-click step arrows (`↑` move up, `↓` move down).
     - Removal button (`✕`) to unassign an item from the collection without deleting the underlying post.
   - **Real-time Persistence**: Dispatches reordered ID sequences via `onReorderCollectionItems`, synchronizing immediately with local state, `localStorage`, and Supabase.

4. **`CreateCollectionModal.tsx`**:
   - Modal form for creating new collections with title, optional description, quick emoji picker, and a `Pin to quick-access bar` toggle.
   - Directly calls `createCollection` from `src/lib/collections.ts`. Enforces the 50-collection maximum cap across client and backend logic.

5. **`AddToCollectionModal.tsx`**:
   - Triggered via the `FolderPlus` icon on any post card (`PostCard.tsx`) or link card.
   - Displays real-time checkboxes for all existing presets, supporting instant multi-collection membership assignments.
   - **Capacity Indicator**: Displays the current item count and capacity per collection (e.g. `24/100`). If a collection reaches 100 posts, a `Full` badge appears and further additions are disabled.
   - Includes an inline "+ Create new collection" trigger to streamline workflow without losing context.

6. **`ProfileView.tsx` Integration**:
   - Houses independent state for both post collections and link collections.
   - Computes custom-ordered feeds (`timelinePosts` and `linkCards`) based on the active preset.
   - Renders the active lens indicator banner with collection metadata, the owner-only `[ ⇅ Reorder ]` button, and preset switching actions.

---

## 3. Data Models & TypeScript Types

Defined in [`src/lib/mockData.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/mockData.ts):

```typescript
export interface Collection {
  id: string;                  // Unique collection ID (UUID or local ID)
  title: string;               // Display title (e.g., 'Design Systems')
  description?: string;        // Secondary description snippet shown in the modal
  icon?: string;               // Emoji or icon glyph (e.g., '🎨', '⭐', '🎧')
  itemIds: string[];           // Array of Post IDs or Link IDs defining membership & custom order (max 100)
  isPinned?: boolean;          // If true, pinned to the top quick-access row (first 5 slots)
  tabType?: 'posts' | 'links'; // Whether collection belongs to Posts or Links tab
  userId?: string;             // Creator profile owner ID
  sortOrder?: number;          // Position index determining modal and quick bar sequence
  createdAt?: string;          // Timestamp of creation
}
```

---

## 4. Key Rules & Constraints

1. **Maximum 50 Collections per Profile**:
   - Creators can maintain up to 50 curated collections across their profile.
   - Enforced in `AllCollectionsModal.tsx` (50 Pokédex slots), `CreateCollectionModal.tsx`, and `createCollection` in `src/lib/collections.ts`.

2. **Maximum 100 Posts per Collection**:
   - Curated collections are hard-capped at 100 posts (`MAX_POSTS_PER_COLLECTION = 100`).
   - Enforced in `addItemToCollection` (`src/lib/collections.ts`) and visually enforced in `AddToCollectionModal.tsx`.

3. **Master Timeline ("All") is NEVER Capped**:
   - The master chronological timeline (`allTimelinePosts`) is completely unlimited.
   - The 100-item ceiling strictly applies to curated subsets/playlists, never to the author's primary profile feed.

4. **Owner-Only Reordering & Management**:
   - Reordering posts, pinning slots, and deleting collections are restricted exclusively to the profile owner (`isSelf === true`).
   - Visitors can browse collections, activate filter lenses, and view curated orders, but management controls remain hidden.

---

## 5. Interaction Design & Visibility Rules

To prevent interface bloat and preserve the native Twitter/X profile appearance, the system follows these UX rules:

### 1. Hidden by Default
When a visitor loads a profile, the secondary collection rows on both the **Posts** and **Links** tabs are collapsed. The profile looks completely clean and native.

### 2. Active Tab Click-to-Toggle
* When viewing the **Posts** tab, clicking the active **`Posts ▾`** header toggles `showPostCollections`.
* A subtle chevron next to the tab label rotates smoothly (`▾` ↔ `▴`) to indicate expansion state.
* The same behavior applies to **`Links ▾`**.
* Switching to another tab (e.g. from `Posts` to `Comments`) automatically leaves non-applicable presets hidden.

### 3. Active Lens State Indicators
When any collection preset is active:
* **Tab Header Indicator**: A small blue dot appears on the tab (`Posts •` or `Links •`) to signify a filtered view even when the pill bar is collapsed.
* **Sticky Filter Banner**: Renders directly below the tab bar:
  ```
  [📁] Viewing collection: [Title] (X posts in custom order)    [⇅ Reorder]  [Change preset]  [Clear filter]
  ```
  - `[⇅ Reorder]`: Visible only to the profile owner (`isSelf`). Opens `ReorderCollectionModal.tsx` to arrange the post sequence.
  - `Change preset`: Re-opens the collection lens bar.
  - `Clear filter`: Resets the active collection back to `null` (viewing all posts).

---

## 6. Feed Filtering & Custom Ordering Engine

When a collection is selected, items are resolved and ordered strictly by the sequence of IDs in `col.itemIds`:

```typescript
// 1. Build an O(1) lookup map of all available timeline items
const postMap = new Map(rawTimelinePosts.map(p => [p.id, p]));

// 2. Iterate through col.itemIds to preserve the EXACT author-defined sequence
const matchedPosts: Post[] = [];
for (const id of col.itemIds) {
  const found = postMap.get(id);
  if (found) {
    matchedPosts.push(found);
  }
}

// 3. Graceful fallback for mock collections if browsing an account without matched mock IDs
if (matchedPosts.length === 0 && rawTimelinePosts.length > 0 && col.id.startsWith('col_')) {
  return rawTimelinePosts.slice(0, Math.min(rawTimelinePosts.length, col.itemIds.length));
}
```

---

## 7. Database Schema & Dual Persistence Strategy

The system is backed by two relational tables in Supabase (`public.collections` and `public.collection_items`), declared in [`supabase_collections.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/supabase_collections.sql) and [`supabase_schema.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/supabase_schema.sql), paired with a zero-latency `localStorage` hydration and offline cache layer:

### Relational Schema

```sql
-- 1. Collections master table
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tab_type text not null check (tab_type in ('posts', 'links')),
  title text not null,
  description text,
  icon text default '📁',
  is_pinned boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- 2. Ordered join table referencing blocks or links
create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  item_id text not null, -- references blocks.id or user profile link id
  position integer not null default 0,
  created_at timestamptz default now(),
  unique (collection_id, item_id)
);

-- RLS: Public read, owner manage
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
```

### Persistence & Hydration Lifecycle (`src/lib/collections.ts`)

1. **Authenticated Users (Live Supabase + Local Cache)**:
   - When a creator with a valid Supabase Auth UUID (`authUser.id`) creates, edits, pins, deletes, or reorders presets, operations write directly to Supabase satisfying RLS `auth.uid() = user_id`.
   - Results are automatically mirrored into `localStorage` (`oomfs_collections_v1_<userId>`).
2. **Tab-Type Integrity & Self-Healing**:
   - `reorderCollectionItems` strictly preserves existing collection attributes (including `tabType: 'posts' | 'links'`).
   - `getLocalCollections` includes self-healing normalization: any cached record lacking an explicit `tabType` is inferred based on its ID prefix (`col_link_` maps to `'links'`, otherwise `'posts'`) and restored.
3. **Instant Mount Hydration**:
   - On page mount and browser refresh, [`ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx) synchronizes state immediately from `localStorage` to eliminate any flicker or flash of an empty collection bar while the asynchronous network query completes.
4. **Demo / Unauthenticated Fallback**:
   - For demo accounts (such as `amberlyn`) or unauthenticated local development where Supabase Auth is unavailable, mutations persist reliably in `localStorage`. Custom collections, item assignments, and custom sort orders survive browser reloads.

---

## 8. The Links Switchboard: Channel Directory for Collections

On the **Links** tab, curated Post Collections are presented as an interactive **Switchboard Console**:

1. **Master Timeline Card**:
   - Anchored at the top, allowing 1-click access to the full, unfiltered chronological feed (`All Posts`).
2. **Channel Directory Grid**:
   - Displays all creator-defined Post Collections in a responsive 2-column layout.
   - Shows emoji icon, title, description, post counter pill, and `⭐ Pinned` status.
3. **Seamless Activation**:
   - Clicking any switchboard card immediately transitions to the **Posts** tab and applies that collection's filter lens without a full page reload.
4. **Creator Channel Controls**:
   - Profile owners (`isSelf`) can create new collections with the `+ New Collection` button or manage channels via `AllCollectionsModal.tsx`.

*For complete technical architecture, routing, and upload pipelines, see [Link Pages Documentation](links.md).*
