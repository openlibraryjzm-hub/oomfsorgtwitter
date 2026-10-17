# Curated Collections & Feed Presets System

This document outlines the architecture, component structure, relational data models, and persistence strategy for the **Curated Collections & Presets System** on `oomfs.org`.

---

## 1. Architecture & Core Philosophy

On traditional social networks and link-in-bio tools, user content is locked into a rigid structure:
* **Posts** are constrained strictly to reverse-chronological order (newest first). Older high-signal work gets buried over time.
* **Links** are displayed in a static, one-size-fits-all vertical list.

The **Curated Collections & Presets System** introduces flexible, author-curated lenses across both the **Posts** and **Links** tabs:
1. **Custom Ordering**: Authors group specific post or link IDs into curated sets presented in an exact, bespoke sequence (e.g., *Group A, B, C* rather than date-ordered).
2. **On-Demand Discovery**: Presets remain collapsed by default to preserve a clean, native profile layout, but expand instantly when the visitor or creator clicks the active tab header.
3. **Scalability Beyond 4 Items**: Uses a hybrid pill-and-modal pattern to support dozens of collections per profile without cluttering the horizontal tab strip.
4. **Drag-and-Drop Reordering**: Creators can drag presets directly within the "All Collections" modal to establish their preferred sequence. Top items in the modal automatically pin leftmost on the quick-access pill bar.

---

## 2. Component Structure & Hierarchy

```
src/components/collections/
├── CollectionLensBar.tsx       # Horizontal stadium-pill scrollbar with quick-access lenses
├── AllCollectionsModal.tsx     # Searchable modal with native HTML5 drag-and-drop reordering
├── CreateCollectionModal.tsx   # Modal for creating presets with emoji picker and quick-pin toggle
└── AddToCollectionModal.tsx    # Modal for assigning posts/links to presets with instant checkboxes

src/components/profile/
└── ProfileView.tsx             # Controls tab toggling, active filter states, feed reordering, & DB sync
```

### Component Responsibilities

1. **`CollectionLensBar.tsx`**:
   - **`[ All (N) ]` Pill**: Clears any active preset and restores the default chronological feed or standard link list. Strictly locked at the leftmost position and immovable.
   - **Top Pinned Stadium Pills (`isPinned: true`)**: Surfaces up to 4 quick-access presets (e.g. `[ ⭐ Highlights ]`, `[ 💼 Work ]`) with emoji icons and item count badges. Sequence reflects the creator's custom sort order.
   - **Dynamic Active Pill**: If an unpinned preset is selected from the modal, it automatically surfaces into this bar with an inline `(×)` dismiss button.
   - **`[ ⊞ All (N) ▾ ]` Modal Trigger**: Scalability anchor. Displays the total number of presets and triggers `AllCollectionsModal`.
   - **`[ + New ]` Button**: Visible to profile owners (`isSelf`) to trigger `CreateCollectionModal`.

2. **`AllCollectionsModal.tsx`**:
   - Centered backdrop-blur modal.
   - **Immovable "All" Option**: Hardcoded at the top of the scrollable list outside draggable items; resets filter back to the full feed.
   - **Native HTML5 Drag-and-Drop**: Profile owners can grab the dotted drag handle (`GripVertical`) to reorder presets. Top items in the modal automatically pin leftmost on `CollectionLensBar`.
   - **Real-Time Search Input**: Auto-focuses on open; filters presets by title or description text (dragging is disabled during active searches to prevent index misalignment).
   - **Owner Actions**: Quick hover actions to pin/unpin presets (`⭐`) and delete collections (`Trash2`).
   - **Dynamic Labels**: Accepts `itemTypeLabel="posts"` or `itemTypeLabel="links"` to format counters (`N posts` vs `N links`).

3. **`CreateCollectionModal.tsx`**:
   - Modal form for creating new collections with title, optional description, quick emoji picker, and a `Pin to quick-access bar` toggle.
   - Directly calls `createCollection` from `src/lib/collections.ts`.

4. **`AddToCollectionModal.tsx`**:
   - Triggered via the `FolderPlus` icon on any post card (`PostCard.tsx`) or link card.
   - Displays real-time checkboxes for all existing presets, supporting instant multi-collection membership assignments.
   - Includes an inline "+ Create new collection" trigger to streamline workflow without losing context.

5. **`ProfileView.tsx` Integration**:
   - Houses independent state for both post collections and link collections.
   - Computes custom-ordered feeds (`timelinePosts` and `linkCards`) based on the active preset.
   - Handles tab header click-to-toggle interactions and renders the active indicator banner.

---

## 3. Data Models & TypeScript Types

Defined in [`src/lib/mockData.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/mockData.ts):

```typescript
export interface Collection {
  id: string;                  // Unique collection ID (UUID or local ID)
  title: string;               // Display title (e.g., 'Design Systems')
  description?: string;        // Secondary description snippet shown in the modal
  icon?: string;               // Emoji or icon glyph (e.g., '🎨', '⭐', '🎧')
  itemIds: string[];           // Array of Post IDs or Link IDs defining membership & custom order
  isPinned?: boolean;          // If true, pinned to the top quick-access row (first 4 items)
  tabType?: 'posts' | 'links'; // Whether collection belongs to Posts or Links tab
  userId?: string;             // Creator profile owner ID
  sortOrder?: number;          // Position index determining modal and quick bar sequence
  createdAt?: string;          // Timestamp of creation
}
```

---

## 4. Interaction Design & Visibility Rules

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
  [📁] Viewing collection: [Title] (X items in custom order)    [Change preset]  [Clear filter]
  ```
  - `Change preset`: Re-opens the secondary collection lens bar.
  - `Clear filter`: Resets the active collection back to `null` (viewing all items).

### 4. Drag-and-Drop Reordering Rules
* Reordering is enabled exclusively for the authenticated profile owner (`isSelf === true`) when search query is empty.
* A vertical dotted handle (`GripVertical`) serves as the visual affordance.
* Moving an item in the modal updates `sortOrder` across the collection set and updates the leftmost-to-rightmost sequence on `CollectionLensBar`.
* The "All" feed row is permanently anchored at the top of the modal and leftmost on the lens bar, and is completely immovable.

---

## 5. Feed Filtering & Custom Ordering Engine

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

## 6. Database Schema & Dual Persistence Strategy

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
   - When a creator with a valid Supabase Auth UUID (`authUser.id`) creates, edits, pins, deletes, or reorders presets, operations write directly to Supabase (`public.collections` and `public.collection_items`) satisfying RLS `auth.uid() = user_id`.
   - Results are automatically mirrored into `localStorage` (`oomfs_collections_v1_<userId>`).
2. **Instant Mount Hydration**:
   - On page mount and browser refresh, [`ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx) synchronizes state immediately from `localStorage` to eliminate any flicker or flash of an empty collection bar while the asynchronous network query completes.
3. **Demo / Unauthenticated Fallback**:
   - For demo accounts (such as `amberlyn`) or unauthenticated local development where Supabase Auth is unavailable, mutations persist reliably in `localStorage`. Custom collections, item assignments, and drag-and-drop sort orders survive browser reloads.

---

## 7. Creator Curation & Management Workflow

1. **Organizing Existing Posts & Links (`AddToCollectionModal.tsx`)**:
   - Profile owners click the `FolderPlus` icon on any post card (`PostCard.tsx`) or link card.
   - Checkboxes allow toggling membership across multiple collections with optimistic UI updates and background Supabase synchronization (`src/lib/collections.ts`).
2. **Drafting New Posts with Collections (`PostComposer.tsx`)**:
   - A dropdown above the composer action bar allows assigning new posts to a collection directly during drafting.
3. **On-Demand Preset Creation (`CreateCollectionModal.tsx`)**:
   - Creators create new collections with an emoji icon picker, title, description, and `Pin to quick-access bar` toggle.
4. **Pinning, Deleting & Drag Reordering (`AllCollectionsModal.tsx`)**:
   - Creators can pin quick-access lenses, drag items using the dotted handle (`GripVertical`) to reorder them (with top items pinning leftmost on the lens bar), and delete presets without affecting underlying posts.
