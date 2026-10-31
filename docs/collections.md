# Curated Collections & Presets System

This document outlines the architecture, component structure, relational data models, and persistence strategy for the **Curated Collections & Presets System** on `oomfs.org`.

---

## 1. Architecture & Core Philosophy

On `oomfs.org`, the legacy "Posts" and "Presets" tabs are unified into a single master **"Boards"** tab. Presets operate as creator-curated playlists of boards.

### Core Pillars
1. **Unified Boards Tab**: Presets live directly on the **Boards** tab via an Instagram story/highlight-style horizontal bar anchored to the top of the timeline.
2. **Tabs Operate Directly as Presets (Zero Intermediate Directory Grid)**:
   - Eliminates redundant intermediate preset cards, nested collections directories, and drill-down flows.
   - The horizontal bar (`BoardPresetsBar.tsx`) directly houses the preset selector tabs.
   - The first tab is **`All Boards`**, displaying all authored boards in the 2-column Pinterest scroll grid.
   - Subsequent tabs represent the creator's curated presets (capped at 12 slots for clean horizontal scrolling).
   - Tapping any preset tab provides instant, 1-tap filtering directly to that preset's boards.
3. **Direct Board Surface**: The timeline content surface exclusively renders individual boards (`BoardGridCard.tsx`) in a 2-column Pinterest grid.
4. **Typographic Minimalism (Zero Emojis, Zero Descriptions)**: Presets are defined strictly by their clean title and contained board count.
5. **Two-Tiered Ordering Architecture**:
   - **Preset Level (`ReorderPresetsModal.tsx`)**: Controls the sequence of preset tabs and preset deletion.
   - **Item Level (`ReorderCollectionModal.tsx`)**: Rearranges the sequence of individual boards within a specific preset (up to 100 boards).

---

## 2. Component Structure & Hierarchy

```
src/components/profile/
└── ProfileView.tsx             # Houses the unified Boards tab and active preset filter state

src/components/feed/
├── BoardPresetsBar.tsx         # Pinned horizontal scroll bar (All Boards, preset tabs, owner actions)
└── BoardGridCard.tsx           # 2-column Pinterest board card (2:1 aspect ratio)

src/components/collections/
├── ReorderPresetsModal.tsx     # Modal to drag-reorder preset tabs and delete presets
├── ReorderCollectionModal.tsx  # Visual 100-card board reordering workspace for collection owners
├── CreateCollectionModal.tsx   # Modal for creating presets (Title only)
└── AddToCollectionModal.tsx    # Modal for assigning boards to presets with real-time checkboxes
```

---

## 3. Presets Bar (`BoardPresetsBar.tsx`)

Anchored at `sticky top-[53px]` directly below the main profile header:

```
┌──────────────┐ │ ┌──────────────┐ ┌──────────────┐ ┌─────┐ ┌────────┐
│  All Boards  │ │ │  Brutalism   │ │ 35mm Tokyo   │ │ +   │ │ ⇅      │
│   6 boards   │ │ │   3 boards   │ │   1 board    │ │ New │ │ Manage │
└──────────────┴─┴─┴──────────────┴─┴──────────────┴─┴─────┴─┴────────┘
  (Master Tab)          (Curated Preset Tabs)           (Owner Actions)
```

* **Master Tab (`All Boards`)**: Displays all authored boards in the 2-column Pinterest grid. Shows total board count. Active when `activeCollectionId === null`.
* **Divider**: Vertical separator dividing the master tab from creator presets.
* **Preset Tabs**: Rendered as clean rounded rectangles (`min-w-[100px] h-[58px]`). Displays preset title and board count. Tapping provides instant 1-tap board filtering. Capped at 12 slots for smooth horizontal scrolling.
* **Owner Controls**:
  * `[+ New]`: Launches `CreateCollectionModal.tsx`.
  * `[Manage]`: Launches `ReorderPresetsModal.tsx` (visible when `collections.length > 0`).

---

## 4. Board Grid Card (`BoardGridCard.tsx`)

Rendered in the responsive 2-column Pinterest grid across both `All Boards` and preset views:

```
┌──────────────────────────────────────────────┐
│                                              │
│               Main Hero Image                │
│         (Full width, aspect-[2/1])           │
│                                              │
│  ┌───┐                                       │
│  │ 2 │───┐        <- Cascading Overlapping Circles
│  └───┘ 3 │───┐       (2nd+ secondary images in board)
│      └───┘ 4 │───┐
│          └───┘+2 │
└──────────────┴───┴───────────────────────────┘
Brutalist Architecture
6 items
```

* **Card Geometry**: 2:1 aspect ratio rounded card (`rounded-2xl`, `aspect-[2/1]`, `border-[#cfd9de]`), maintaining compact card height while widening the hero image to span the full 100% width.
* **Main Hero Image**: Edge-to-edge full-bleed presentation of the lead image or mutual user avatar in the board. Framed precisely during creation using `BoardCropModal.tsx` in the composer to eliminate awkward auto-crops. Scales subtly (`scale-[1.02]`) on hover.
* **Cascading Overlapping Circles**: Overlaid in the bottom-left corner over a soft gradient scrim ("also followed by" pattern).
  * **Stacking Order**: Leftmost circle (2nd board item) has highest z-index (`z-30`) and is fully visible. Subsequent circles (3rd, 4th) tuck underneath (`-ml-2`, `ring-2 ring-white`).
  * Shows secondary images or mutual avatar embeds (`type: 'user'`).
  * If $> 4$ items exist total ($> 3$ secondary items), an overflow bubble (`+N`) appears at the end.
  * Hovering any circle displays a native tooltip with the item's caption or collaborator name.
* **Metadata Below**: Clean bold board title (strictly zero emojis) and item count (`X items`).
* **Owner Actions**: Hover action icons (`FolderPlus` for adding to presets, `Trash2` for deletion) plus 3-dots action dropdown.

---

## 5. Modal Specifications

### 1. Create Preset Modal (`CreateCollectionModal.tsx`)
* **Title Only**: Input for preset title (e.g. `Design Systems`, `Brutalism`, `Tokyo 35mm`). Description field has been completely removed. Zero emojis.
* **Pin to Top Bar Toggle**: Checkbox with Star icon: *"Pin to top bar — Show this preset as a quick-access rectangle directly on your profile's pinned scroll"*. Defaults to checked.
* **Limit**: Hard cap of 50 collections per profile.

### 2. Manage Presets Modal (`ReorderPresetsModal.tsx`)
* **Drag-and-Drop Reordering**: Native HTML5 drag handles (`GripVertical`) and keyboard-accessible step arrows (`ChevronUp` / `ChevronDown`).
* **Instant 1-Tap Pin/Unpin**: Star button on each row allowing creators to toggle top-bar pinned status directly. Enforces a maximum of 10 pinned presets on the bar.
* **Preset Deletion**: Trash button (`Trash2`) on each row with confirmation dialog: *"Delete preset [name]? Your boards will remain intact on your profile."*
  * Deleting purges the preset from state, `localStorage`, and Supabase. If the deleted preset was active, the timeline seamlessly resets to `All Boards`.

### 3. Add to Preset Modal (`AddToCollectionModal.tsx`)
* Triggered via the `FolderPlus` icon on any board card.
* Real-time multi-select checkboxes for all presets with capacity indicators (`X/100`).

---

## 6. Data Models & TypeScript Types

Defined in [`src/lib/mockData.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/mockData.ts):

```typescript
export interface Collection {
  id: string;                  // Unique collection ID (UUID or local ID)
  title: string;               // Display title (e.g., 'Design Systems') — zero emojis
  description?: string;        // Retained for database schema compatibility, omitted from UI
  icon?: string;               // Retained for database schema compatibility, omitted from UI
  itemIds: string[];           // Array of Board IDs defining membership & custom order (max 100)
  isPinned?: boolean;          // If true, pinned to top horizontal bar (up to 10 slots)
  isExclusive?: boolean;       // Retained for link pages compatibility
  slug?: string;               // Used for Link Pages (/username/links/[slug])
  tabType?: 'posts' | 'links'; // 'posts' represents Board Presets
  userId?: string;             // Creator profile owner ID
  sortOrder?: number;          // Position index determining bar sequence
  createdAt?: string;          // Timestamp of creation
}
```

---

## 7. Database Schema & Persistence Strategy

Backed by two relational tables in Supabase (`public.collections` and `public.collection_items`):

```sql
-- 1. Collections master table
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tab_type text not null check (tab_type in ('posts', 'links')),
  title text not null,
  description text,
  icon text default '',
  is_pinned boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- 2. Ordered join table referencing blocks
create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  item_id text not null, -- references blocks.id
  position integer not null default 0,
  created_at timestamptz default now(),
  unique (collection_id, item_id)
);
```

### Persistence & Hydration Lifecycle (`src/lib/collections.ts`)
* **Live Supabase Synchronization**: Authenticated mutations write directly to `public.collections` and `public.collection_items`.
* **Immediate Local Cache**: All mutations mirror immediately to `localStorage` (`oomfs_collections_v1_<userId>`).
* **Demo / Offline Fallback**: Mutations for demo profiles (e.g. `amberlyn` / `usr_amberlyn`) persist across reloads via `saveLocalCollections`.

---

## 8. Fresh Agent Onboarding Checklist & Rules

When maintaining collections or presets:

- [ ] **Unified Boards Tab**: Never reintroduce a standalone "Presets" tab in the main profile tab list. Presets are a sub-view within **Boards**.
- [ ] **Direct Preset Tabs**: The pinned bar (`BoardPresetsBar.tsx`) houses `All Boards` followed directly by creator preset tabs (capped at 12 slots for smooth horizontal scrolling), with zero intermediate directory cards or drill-down screens.
- [ ] **Full-Bleed 2:1 Hero Geometry**: In `BoardGridCard.tsx`, the hero image occupies 100% width at `aspect-[2/1]` with secondary items cascading as overlapping circles in the bottom-left corner.
- [ ] **Composer Viewfinder Crop**: Ensure cover images uploaded to Slot 1 in the composer trigger `BoardCropModal.tsx` for 2:1 aspect framing to avoid awkward auto-cropping or letterboxing.
- [ ] **Zero Description Text**: Do not render `col.description` in preset cards or modals.
- [ ] **Zero Emojis**: Clean preset titles with emoji-stripping regex before rendering or saving.
- [ ] **Cascading Circles Z-Index**: In `BoardGridCard.tsx`, ensure the leftmost circle (2nd board item) has the highest z-index (`z-30`) so overlapping follows the "also followed by" pattern.
