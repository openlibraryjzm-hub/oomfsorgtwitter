# Link Pages Architecture & Technical Guide (`links.md`)

This document defines the complete architecture, routing, component hierarchy, creation workflows, layout mechanics, drag-and-drop reordering, and persistence engine for the **Links System** on `oomfs.org`.

---

## 1. Overview & Core Philosophy

On `oomfs.org`, the **Links** tab functions as an expressive, high-density alternative to conventional link-in-bio tools (such as Linktree, Bento, or Carrd). Rather than presenting a static list of uniform buttons, `oomfs.org` combines:

1. **Large Outbound Link Cards**: High-visibility full-width rows highlighting key portfolio pieces, projects, or primary platforms.
2. **Web Badges (88×31 Button Badges)**: Retro micro-links packed into tight, nostalgic visual plaques.
3. **Circular OOMF Avatar Badges**: Circular $52\text{px} \times 52\text{px}$ avatar buttons honoring mutual friends ("OOMFs"), collaborators, and affiliations.
4. **Standalone Sub-Pages with Clean URLs**: Independent link sub-pages (e.g. `/[username]/links/work`, `/[username]/links/writing`) rather than a single congested list.
5. **Model B Unified Flow Grid**: Badges and link cards co-exist in an author-ordered sequence where consecutive badges dynamically cluster into plaques while cards expand full-width.
6. **Interaction-Safe Reorder Mode**: A dedicated mode enabling profile owners to drag and swap items without accidental outbound click navigation.

---

## 2. Route Hierarchy & Navigation

Link pages are accessible via dedicated Next.js App Router endpoints as well as within the client-side profile view:

```
src/app/[username]/
├── links/
│   ├── page.tsx            # Server route: Resolves profile and renders the Main link page
│   └── [slug]/
│       └── page.tsx        # Server route: Resolves profile and renders a custom link sub-page
```

### URL Structure & Dynamic Resolution

| Route | View Rendered | Purpose |
| :--- | :--- | :--- |
| `/[username]/links` | Main / Default Link Page | Primary bio links, core socials, and featured badges. |
| `/[username]/links/[slug]` | Custom Sub-Page (e.g. `/work`) | Specialized link page for specific domains (projects, music, writing). |
| `/[username]` (Tab: Links) | In-situ profile Links tab | In-profile tab rendering without leaving the primary profile shell. |

### Zero-Flicker Client Navigation
When a visitor or creator switches between link pages using the secondary collection pill bar:
- The component invokes `window.history.replaceState(null, '', `/${username}/links/${slug}`)`.
- This updates the browser URL and history stack instantaneously with **zero latency** and no full-page reload or re-mounting flicker.
- Direct external visits or page refreshes (`F5`) to `/[username]/links/[slug]` are handled server-side by `src/app/[username]/links/[slug]/page.tsx`, ensuring deep-linking and SEO parity.

---

## 3. Supported Link Post Types & Data Models

Items displayed on a link page are modeled as modular blocks stored in Supabase (`public.blocks`) or profile links, represented by the `Post` and `BadgeData` interfaces:

### 1. Bio Link Card (`type: 'link_card'`)
- **Visual Presentation**: Wide short rectangular card (`h-28 sm:h-32`) occupying the entire 600px center timeline column.
- **Layout Geometry**:
  - **Left Half (50%)**: Padded content area featuring an icon/emoji to the left of the title, title text, subtitle underneath, and outbound domain link.
  - **Right Half (50%)**: Dedicated cover image area flush with **no margins above, below, or to the right** (`object-cover`). If no image is provided, a clean subtle neutral gradient with watermark icon is displayed.
- **Card Removal**: Profile owners can delete any link card directly via a top-corner hover `×` button when `isSelf && !isReordering`.
- **Fields**:
  - `title`: Primary headline text.
  - `subtitle`: Contextual note or tagline displayed beneath the title.
  - `icon`: Leading emoji or icon identifier (e.g. 🎨, 🌐, 🚀).
  - `image`: Optional cover image URL or compressed data URL.
  - `url`: Destination URL (display strips protocol e.g. `amberlyn.design`).
  - `clicks`: Outbound click analytics counter.

### 2. Rectangular Web Badge (`type: 'badge'`, `badgeType: 'image' | 'custom'`)
- **Visual Presentation**: $88\text{px} \times 31\text{px}$ retro button badge inside an $88\text{px}$ wide gallery column.
- **Modes**:
  - **Color Gradient (`'custom'`)**: Authored via color presets, spectrum picker, and gradient styles (`Angle`, `Solid`, `Sheen`, `Glow`).
  - **Image Badge (`'image'`)**: Client-side canvas center-cropped and compressed to $3\times$ Retina dimensions ($264 \times 93\text{px}$ PNG).
- **Label Architecture**: Text label sits **underneath** the button rather than overlaying the bitmap, maintaining high contrast and retro aesthetic. Can be hidden (`showText: false`) for pre-baked pixel graphics.

### 3. Circular OOMF Avatar Badge (`type: 'badge'`, `badgeType: 'avatar'`)
- **Visual Presentation**: $52\text{px} \times 52\text{px}$ circular avatar image (`rounded-full border border-black/15 shadow-2xs`) inside the standard $88\text{px}$ column wrapper.
- **Purpose**: Direct profile badges linking to mutual friends, mentors, or featured accounts (`/[targetUsername]`).
- **Label**: Features `@handle` or user name centered beneath the circular avatar.

```typescript
export interface BadgeData {
  title: string;
  url: string;
  badgeType: 'image' | 'custom' | 'avatar';
  imageUrl?: string;
  label?: string;
  sublabel?: string;
  bgColor?: string;
  textColor?: string;
  showText?: boolean;
  targetUsername?: string;
  pageId?: string;
}
```

---

## 4. Creation & Upload Pipelines (`PostComposer.tsx`)

Creators draft and publish links through the unified composer ([`src/components/feed/PostComposer.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/PostComposer.tsx)).

### 1. Destination Page Targeting
Above the composer action buttons, the **"Add to collection"** dropdown adapts dynamically when drafting links or badges:
- Defaults to the active link page (or `[ 🌐 Main ]` if none selected).
- Displays all existing link pages owned by the creator (`userLinkCols`).
- Automatically tags the new block with `pageId` and assigns its ID to the targeted collection's `itemIds`.

### 2. Bio Link Card Creation (`Link2` Icon)
1. Toggles composer into `'link_card'` mode with a live 1:1 preview card.
2. **Icon / Emoji Selector**: Quick-tap suggestion pills (`🌐`, `🎨`, `💼`, `📝`, `🎧`, `⚡`, `☕`, `🔗`, `🚀`, `📸`) or custom typed emoji positioned to the left of the title.
3. **Title & Subtitle**: Headline title and secondary descriptive tagline.
4. **Destination URL**: Outbound website link (e.g. `https://amberlyn.design`).
5. **Right-Side Cover Image**: Local image upload with client-side canvas compression (`compressImageFile`) or direct URL paste (image is optional; defaults to a neutral gradient placeholder).

### 3. Web Badge Creation (`Sparkles` Icon)
1. Segmented control toggles between `Color`, `Image`, and `Avatar` modes.
2. **Color Mode**: Hex spectrum wheel, swatch presets, gradient angle selector.
3. **Image Mode**: Local file upload processed by client-side `compressBadgeImage(file)`:
   - Center-crops to $88:31$ ratio.
   - Encodes as a crisp $3\times$ HiDPI PNG base64 data URL.
4. Title and optional underneath label input.

### 4. OOMF Avatar Badge Creation (`Users` Icon)
1. Direct icon shortcut on the composer bottom toolbar (`Users` icon).
2. Automatically sets `postType = 'badge'` and `badgeMode = 'avatar'`.
3. Opens [`SelectOomfModal.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/SelectOomfModal.tsx):
   - Fetches following and mutual accounts from Supabase or mock graph.
   - Real-time search filter by display name or `@username`.
   - Selecting a user populates their avatar URL, sets destination to `/${user.username}`, and pre-fills label to `@${user.username}`.

---

## 5. Model B Unified Layout & Dynamic Clustering

Because badges ($88\text{px}$ tiles) and link cards ($100\%$ full-width rows) have different geometric properties, they cannot be forced into a single uniform grid without breaking layouts.

### Dynamic Render Grouping
[`ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx) parses the ordered list of items (`unifiedPageItems`) into render groups:

```
[unifiedPageItems]
  │
  ├─ Item 1: Badge 1      ┐
  ├─ Item 2: Badge 2      ├─► Dynamic Group: `badge_cluster` (Renders in single Badge Wall plaque)
  ├─ Item 3: Avatar Badge ┘
  │
  ├─ Item 4: Link Card 1  ──► Dynamic Group: `link_card` (Takes full 100% row)
  │
  ├─ Item 5: Badge 3      ──► Dynamic Group: `badge_cluster` (Renders in second Badge Wall plaque)
  │
  └─ Item 6: Link Card 2  ──► Dynamic Group: `link_card` (Takes full 100% row)
```

### Visual Styling
- **Badge Clusters**: Wrapped in a clean plaque:
  ```tsx
  <div className="border rounded-2xl bg-white p-3 sm:p-3.5 shadow-2xs">
    <div className="flex flex-wrap gap-3 items-start justify-start">
      {/* 88px badges & circular avatars */}
    </div>
  </div>
  ```
- **Link Cards**: Rendered as wide short rectangles (`w-full h-28 sm:h-32 border border-[#eff3f4] rounded-2xl bg-white overflow-hidden flex flex-row group hover:border-[#1d9bf0]/50 transition-all`):
  - **Left Half (50%)**: Padded section (`p-3 sm:p-4`) containing icon/emoji, bold title, subtitle below, and destination URL with collection organizer icon.
  - **Right Half (50%)**: Dedicated cover image flush with **no margins above, below, or to the right** (`object-cover`). If no image is provided, renders a clean neutral gradient placeholder with watermark icon.
  - **Card Removal**: Profile owners can delete any link card via a top-corner hover `×` button when `isSelf && !isReordering`.

---

## 6. Drag-and-Drop Reordering Engine

Creators can freely reorder badges, circular avatars, and link cards together on any link page.

### Reorder Mode (`isReordering`)
- **Activation**: Profile owners click the **`[ ⇅ Reorder ]`** button in the link page header.
- **Safety Safeguard**: When active, all `<a>` tag clicks are intercepted with `e.preventDefault()`, ensuring creators can grab and drag items without accidentally opening outbound destination websites.
- **Visual Feedback**:
  - Dotted drag handles (`GripVertical`) appear on link cards.
  - Hovering and dragging displays grabbing cursors (`cursor-grab active:cursor-grabbing`).
  - Active dragged item dims (`opacity-30 scale-95`).
  - Drop targets display a glowing blue indicator ring (`ring-2 ring-[#1d9bf0] ring-offset-2`).
  - A persistent notification banner announces: *"Reorder Mode: Drag badges and link cards to rearrange. Links are paused while reordering."*

### Reorder Sequence Lifecycle
1. User drops an item on another: `handleItemDrop(e, targetId)`.
2. Computes the reordered array of item IDs (`updatedIds`).
3. Optimistically updates React state via `setLinkCollections`.
4. Persists the new sequence through `reorderCollectionItems(targetColId, updatedIds, effectiveUserId)`.

---

## 7. Dual-Layer Persistence & Multi-Key Storage

Link pages and custom item sequences are stored using a resilient dual-layer architecture:

### 1. Supabase Persistence (`public.collections` & `public.collection_items`)
- Link pages are stored with `tab_type: 'links'`, `slug`, `title`, and `is_default`.
- Items within a page are stored in `public.collection_items` with an integer `position` index:
  ```sql
  insert into public.collection_items (collection_id, item_id, position)
  values ($1, $2, $3)
  on conflict (collection_id, item_id) do update set position = excluded.position;
  ```

### 2. Tab-Preserving Local Storage (`src/lib/collections.ts`)
- To prevent network latency and provide offline / unauthenticated demo durability, collections are cached under `oomfs_collections_v1_<userId>`.
- **Tab Protection (`saveLocalCollections`)**: When saving link collections, the system inspects existing storage and preserves all `posts` collections. Saving one tab never erases the other.
- **Automatic Normalization (`isLinkCollection` / `isPostCollection`)**: Stored collections without explicit `tabType` attributes are automatically classified and backfilled upon read.
- **Alias Resolution**: Demo accounts (`amberlyn`, `usr_1`, `usr_amberlyn`) and UUID/handle variations are synchronized across all associated storage keys so changes persist reliably across browser reloads (`F5`).
