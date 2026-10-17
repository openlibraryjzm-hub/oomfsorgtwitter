# Curated Collections & Feed Presets System

This document outlines the architecture, data models, rendering behaviors, and future roadmap for the **Curated Collections & Presets System** on `oomfs.org`.

---

## 1. Architecture & Core Philosophy

On traditional social networks and link-in-bio tools, user content is locked into a rigid structure:
* **Posts** are constrained strictly to reverse-chronological order (newest first). Older high-signal work gets buried over time.
* **Links** are displayed in a static, one-size-fits-all vertical list.

The **Curated Collections & Presets System** introduces flexible, author-curated lenses across both the **Posts** and **Links** tabs:
1. **Custom Ordering**: Authors group specific post or link IDs into curated sets presented in an exact, bespoke sequence (e.g., *Group A, B, C* rather than date-ordered).
2. **On-Demand Discovery**: Presets remain collapsed by default to preserve a clean, native profile layout, but expand instantly when the visitor or creator clicks the active tab header.
3. **Scalability Beyond 4 Items**: Uses a hybrid pill-and-modal pattern to support dozens of collections per profile without cluttering the horizontal tab strip.

---

## 2. Component Structure & Hierarchy

```
src/components/collections/
├── CollectionLensBar.tsx       # Horizontal stadium-pill scrollbar with quick-access lenses
└── AllCollectionsModal.tsx     # Fullscreen/centered searchable modal displaying all presets

src/components/profile/
└── ProfileView.tsx             # Controls tab toggling, active filter states, and feed reordering
```

### Component Responsibilities

1. **`CollectionLensBar.tsx`**:
   - **`[ All (N) ]` Pill**: Clears any active preset and restores the default chronological feed or standard link list.
   - **Top Pinned Stadium Pills (`isPinned: true`)**: Surfaces up to 4 quick-access presets (e.g. `[ ⭐ Starred ]`, `[ 💼 Work ]`) with emoji icons and item count badges.
   - **Dynamic Active Pill**: If an unpinned preset is selected from the modal, it automatically surfaces into this bar with an inline `(×)` dismiss button.
   - **`[ ⊞ All (N) ▾ ]` Modal Trigger**: Scalability anchor. Displays the total number of presets and triggers `AllCollectionsModal`.

2. **`AllCollectionsModal.tsx`**:
   - Centered backdrop-blur modal.
   - **Real-Time Search Input**: Auto-focuses on open; filters presets by title or description text.
   - **"All Items" Row**: Quick action to reset filter back to the full feed.
   - **Collection Cards**: Displays preset icon, title, item count, pinned indicator (`⭐`), description snippet, and active selection checkmark.
   - **Dynamic Labels**: Accepts `itemTypeLabel="posts"` or `itemTypeLabel="links"` to format counters (`N posts` vs `N links`).

3. **`ProfileView.tsx` Integration**:
   - Houses the independent state for both post collections and link collections.
   - Computes reordered feeds (`timelinePosts` and `linkCards`) based on the active preset.
   - Handles tab header click-to-toggle interactions and renders the active indicator banner.

---

## 3. Data Models & TypeScript Types

Defined in [`src/lib/mockData.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/mockData.ts):

```typescript
export interface Collection {
  id: string;               // Unique collection ID (e.g., 'col_highlights', 'col_link_work')
  title: string;            // Display title (e.g., 'Design Systems')
  description?: string;     // Secondary description snippet shown in the modal
  icon?: string;            // Emoji or icon glyph (e.g., '🎨', '⭐', '🎧')
  itemIds: string[];        // Array of Post IDs or Link IDs defining membership & custom order
  isPinned?: boolean;       // If true, pinned to the top quick-access row (first 4 items)
}
```

### Placeholder Datasets (Shared Across Profiles)

To validate high-scale UI interactions prior to backend database persistence, two shared placeholder arrays are exported in [`src/lib/mockData.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/mockData.ts):

* **`MOCK_COLLECTIONS: Collection[]`** (12 collections for Posts):
  - *Pinned (4)*: `⭐ Highlights`, `🎨 Design Systems`, `📸 Film Photography`, `🌿 Brutalism`
  - *Unpinned (8)*: `⚡ WebGL & Shaders`, `📝 Essays & Notes`, `☕ Studio Setups`, `🚀 Product Drops`, `🎧 Late Night Focus`, `🛠️ Dev Stack`, `🎯 Best of 2025`, `👾 Retro Web`
* **`MOCK_LINK_COLLECTIONS: Collection[]`** (12 collections for Links):
  - *Pinned (4)*: `⭐ Starred & Top Links`, `💼 Work & Case Studies`, `📝 Writing & Essays`, `🎧 Sound & Playlists`
  - *Unpinned (8)*: `🛠️ Code & Open Source`, `🌐 Socials & Networks`, `🚀 Side Quests & Drops`, `☕ Office Hours & Chat`, `💡 Design Inspo & Assets`, `💬 Communities & Discords`, `📚 Reading List 2026`, `📦 Archive & Legacy`

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

---

## 5. Feed Filtering & Custom Ordering Engine

When a collection is selected, items are resolved and ordered strictly by the order of IDs in `col.itemIds`:

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

// 3. Graceful fallback for non-mock or custom user profiles:
// If browsing a profile whose post IDs do not match the mock itemIds,
// deterministic slicing prevents blank states during prototyping:
if (matchedPosts.length === 0 && rawTimelinePosts.length > 0) {
  return rawTimelinePosts.slice(0, Math.min(rawTimelinePosts.length, col.itemIds.length));
}
```

---

## 6. Future Database Migration & Creator Curation Plan

When moving from mock placeholders to production Supabase persistence:

### Proposed Relational Schema

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
  created_at timestamptz default now()
);

-- RLS: Public read, owner manage
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
```

### Creator Curation UI
1. **"Add to Collection" Action on Post/Link Cards**: Profile owners can click a `BookmarkPlus` or `Layers` icon on any card to add it to one or more presets.
2. **Drag-and-Drop Sequence Manager**: In the modal or settings drawer, owners can reorder the items within each preset.
3. **Pin Manager**: Creators can select up to 4 presets to pin as quick-access chips on their profile.
