# Curated Collections & Feed Presets System

This document outlines the architecture, component structure, relational data models, and persistence strategy for the **Curated Collections & Presets System** on `oomfs.org`.

---

## 1. Architecture & Core Philosophy

On traditional social networks and link-in-bio tools, user content is locked into a rigid structure:
* **Posts** are constrained strictly to reverse-chronological order (newest first). Older high-signal work gets buried over time.
* **Collections** are typically hidden behind clunky secondary toolbars or deeply nested submenus.

The **Curated Collections & Presets System** introduces author-curated organization across user profiles:
1. **Posts Collections ("Playlist" model)**: A filterable lens over the author's master timeline. Older high-signal posts, carousels, boards, link cards, and badges can be highlighted in custom order, while all posts remain part of the primary chronological feed.
2. **The Dedicated Presets Tab**: The **Presets** tab functions as a unified channel directory and switchboard console. It features clickable cards for each curated Post Collection, allowing visitors and creators to browse and launch thematic feeds in-situ.
3. **Ultra-Clean Posts Feed & Breadcrumb**: The Posts tab remains 100% clean with zero secondary stadium bars or dropdown chevrons. When a collection preset is active, a minimalist, mobile-first 1-line breadcrumb appears above the feed:
   ```
   ← All posts    [Icon] [Collection Title]    [⇅ Reorder]
   ```
   Tapping `← All posts` immediately clears the lens and returns to the master timeline.
4. **Dedicated Reordering Workspaces**: Collection owners have dedicated visual tools for both levels of content arrangement:
   - **Collection Level (`ReorderPresetsModal.tsx`)**: Rearranges the sequence of preset channels themselves on the Presets tab.
   - **Item Level (`ReorderCollectionModal.tsx`)**: Rearranges the sequence of individual posts/blocks within a specific preset.
5. **Two-Tiered Ordering Architecture**:
   - **Collection Level**: Curated collections are ordered by the creator's defined sequence, managed via the `⇅ Rearrange Presets` modal.
   - **Item Level (Posts)**: Each curated collection preserves its own author-defined item order (up to 100 items), managed via the `⇅ Reorder` workspace launched from the active timeline breadcrumb.

---

## 2. Component Structure & Hierarchy

```
src/app/[username]/presets/
└── page.tsx                    # Dedicated Presets switchboard route (SSR + client hydration)

src/components/profile/
└── ProfileView.tsx             # Houses the Presets switchboard tab, breadcrumb, active preset filter state

src/components/collections/
├── ReorderPresetsModal.tsx     # Modal for rearranging preset collections order on the profile Presets tab
├── ReorderCollectionModal.tsx  # Visual 100-card post reordering workspace for collection owners
├── CreateCollectionModal.tsx   # Modal for creating presets with emoji picker and quick-pin toggle
└── AddToCollectionModal.tsx    # Modal for assigning posts/links to presets with instant checkboxes
```

### Component Responsibilities

1. **Presets Tab View (`ProfileView.tsx` & `src/app/[username]/presets/page.tsx`)**:
   - **Curated Channels Grid**: Responsive 2-column grid (`grid-cols-1 sm:grid-cols-2 gap-3`) displaying all creator-defined collections.
     - Displays custom emoji icon, title, description snippet, post count pill, and optional `⭐ Pinned` status badge.
     - Clicking any channel card immediately transitions to the **Posts** tab with that collection active and the breadcrumb displayed.
   - **Owner Controls**: Profile owners (`isSelf`) have left-aligned action controls:
     - `+ New Collection`: Opens `CreateCollectionModal.tsx` to create a new preset.
     - `⇅ Rearrange Presets`: Opens `ReorderPresetsModal.tsx` to drag/drop or use step arrows to arrange the visual sequence of preset channels.

2. **Active Lens Breadcrumb (`ProfileView.tsx`)**:
   - Renders directly above the timeline on the **Posts** tab when `activeCollectionId` is set.
   - **Mobile-First 1-Line Layout**:
     - `← All posts`: Back action with arrow icon to clear the filter.
     - `[Icon] [Title]`: Centered/inline badge indicating the active collection preset.
     - `[⇅ Reorder]`: Visible only to the profile owner (`isSelf`), launching `ReorderCollectionModal.tsx`.

3. **`ReorderPresetsModal.tsx`**:
   - Dedicated modal for rearranging the top-level sequence of curated post collections on the profile Presets tab.
   - **Primary Access Point**: Launched via the **`[ ⇅ Rearrange Presets ]`** button on the Presets tab owner action bar.
   - **Features**: Rank badges (`#1`, `#2`), emoji icons, titles, drag-and-drop handles (`GripVertical`), and step-arrows (`ChevronUp` / `ChevronDown`).
   - **Persistence**: Dispatches ordered collection ID lists to `reorderCollections()`, updating `sort_order` in Supabase and local cache.

4. **`ReorderCollectionModal.tsx`**:
   - Dedicated visual reordering workspace for collection owners (`isSelf`).
   - **Primary Access Point**: Launched via the prominent **`[ ⇅ Reorder ]`** button on the profile's active preset breadcrumb directly above the feed.
   - **100-Card Visual Workspace Grid**: Displays all posts within the collection in a responsive grid (`sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).
   - **Item Controls**:
     - Visual position badges (`#1` to `#100`).
     - Post media thumbnails (photos, carousels, boards, link previews) or snippet text.
     - Native drag handles (`GripVertical`).
     - One-click step arrows (`↑` move up, `↓` move down).
     - Removal button (`✕`) to unassign an item from the collection without deleting the underlying post.
   - **Real-time Persistence**: Dispatches reordered ID sequences via `onReorderCollectionItems`, synchronizing immediately with local state, `localStorage`, and Supabase.

5. **`CreateCollectionModal.tsx`**:
   - Modal form for creating new collections with title, optional description, quick emoji picker, and a `Pin to quick-access` toggle.
   - Directly calls `createCollection` from `src/lib/collections.ts`. Enforces the 50-collection maximum cap across client and backend logic.

5. **`AddToCollectionModal.tsx`**:
   - Triggered via the `FolderPlus` icon on any post card (`PostCard.tsx`).
   - Displays real-time checkboxes for all existing presets, supporting instant multi-collection membership assignments.
   - **Capacity Indicator**: Displays the current item count and capacity per collection (e.g. `24/100`). If a collection reaches 100 posts, a `Full` badge appears and further additions are disabled.
   - Includes an inline "+ Create new collection" trigger to streamline workflow without losing context.

---

## 3. Data Models & TypeScript Types

Defined in [`src/lib/mockData.ts`](src/lib/mockData.ts):

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
   - Enforced in `CreateCollectionModal.tsx` and `createCollection` in `src/lib/collections.ts`.

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

### 1. Zero Clutter by Default
When a visitor loads a profile, the Posts feed renders directly beneath the tab bar without secondary stadium rows or dropdown chevrons. The profile looks completely clean and native to Twitter/X.

### 2. Exploring Presets
* Visitors tap the **Presets** tab to view the author's collection directory.
* The directory shows the master timeline card and channel cards in a 2-column grid.
* Tapping any channel immediately switches the active tab to **Posts** with that collection activated.

### 3. Active Lens State Indicators
When any collection preset is active:
* A minimalist breadcrumb bar renders directly above the Posts feed:
  ```
  ← All posts    [📁] [Collection Title]    [⇅ Reorder]
  ```
  - `← All posts`: Resets the active collection back to `null` (viewing all posts).
  - `[⇅ Reorder]`: Visible only to the profile owner (`isSelf`). Opens `ReorderCollectionModal.tsx` to arrange the post sequence.

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

The system is backed by two relational tables in Supabase (`public.collections` and `public.collection_items`), declared in [`supabase_collections.sql`](supabase_collections.sql) and [`supabase_schema.sql`](supabase_schema.sql), paired with a zero-latency `localStorage` hydration and offline cache layer:

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
   - On page mount and browser refresh, [`ProfileView.tsx`](src/components/profile/ProfileView.tsx) synchronizes state immediately from `localStorage` to eliminate any flicker or flash of an empty collection bar while the asynchronous network query completes.
4. **Demo / Unauthenticated Fallback**:
   - For demo accounts (such as `amberlyn`) or unauthenticated local development where Supabase Auth is unavailable, mutations persist reliably in `localStorage`. Custom collections, item assignments, and custom sort orders survive browser reloads.
