# Links System & Switchboard Architecture (`links.md`)

This document defines the architecture, routing, component hierarchy, creation workflows, and switchboard interaction design for the **Links System** on `oomfs.org`.

---

## 1. Overview & Core Philosophy

On `oomfs.org`, the **Links** tab functions as a unified, high-signal **Switchboard Hub** that bridges visitors to the creator's curated post collections and channels:

1. **Single Unified Links Page**: Replaced the multi-page sub-routing model (`/[username]/links/[slug]`) with **ONE clean, fast Links page** (`/[username]/links`).
2. **Link Types as First-Class Posts**: Bio link cards (`link_card`), retro 88×31 web badges (`badge`), and circular mutual avatar badges (`avatar`) are no longer quarantined to link pages—they are first-class post types rendered on the primary **Posts timeline** inside Twitter-native post cards.
3. **Curated Channels Switchboard**: The Links tab now serves as a central **Switchboard console**, presenting:
   - A master launcher card to open the **All Posts** chronological master feed.
   - A responsive grid of curated **Post Collections** (e.g., *Highlights*, *Design Systems*, *35mm Tokyo*, *Brutalism*).
   - Instant 1-click navigation that transitions to the **Posts** tab with that specific collection filter activated.
4. **Dual-Tab Post Composer**: The creation composer features a top `[ Post ]` vs `[ Link ]` segmented switcher. The `Post` tab houses all post types (text, carousels, boards, bio links, and badges), with all types assignable to any Post Collection during drafting.

---

## 2. Route Hierarchy & Navigation

```
src/app/[username]/
└── links/
    ├── page.tsx            # Single server route: Resolves profile and renders the Links Switchboard
    └── [slug]/
        └── page.tsx        # Redirects any legacy sub-page visits cleanly to /[username]/links
```

### URL Structure & Resolution

| Route | View Rendered | Purpose |
| :--- | :--- | :--- |
| `/[username]/links` | Unified Links Switchboard | Central channel hub launching all author-curated post collections. |
| `/[username]/links/[slug]` | Redirects to `/[username]/links` | Backward-compatibility redirect ensuring bookmarks never 404. |
| `/[username]` (Tab: Links) | In-situ profile Links tab | In-profile tab switch without leaving the primary profile shell. |

---

## 3. The Switchboard Console Architecture

The Links tab in [`src/components/profile/ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx) renders:

### 1. Console Header
- Displays title: **Switchboard** (`Sparkles` icon).
- Subtitle: *"Curated channels and post collections by @username"*.
- For profile owners (`isSelf`):
  - **`+ New Collection`**: Launches `CreateCollectionModal` to instantly spin up a new channel.
  - **`Manage`**: Opens `AllCollectionsModal` with search, pin/unpin toggles, and drag-and-drop reordering.

### 2. Master Feed Launcher
- A featured wide card at the top of the switchboard.
- Displays:
  - `Layers` icon badge.
  - Title: **All Posts (Master Timeline)**.
  - Dynamic count badge: `${allTimelinePosts.length} posts`.
  - Descriptive summary.
- Clicking smoothly switches `activeTab` to `'posts'` and clears `activeCollectionId`, displaying the complete master timeline.

### 3. Curated Channels Grid
- Responsive 2-column grid (`grid-cols-1 sm:grid-cols-2 gap-3`).
- Each card displays:
  - Custom Emoji / Icon (`col.icon || '📁'`).
  - Collection Title (`col.title`).
  - Optional `⭐ Pinned` indicator.
  - Post counter pill (`N posts`).
  - Channel description snippet.
  - `Explore →` call-to-action arrow.
- Tapping any card switches the profile tab to **Posts** and activates that specific collection filter with zero reload latency.

---

## 4. Timeline Embedding for Link Types (`PostCard.tsx`)

Rather than maintaining custom drag-and-drop plaques on the Links tab, link cards and badges are embedded directly within standard 1:1 Twitter post cards on the **Posts tab**:

1. **Bio Link Card Attachment (`type: 'link_card'`)**:
   - Renders inside `PostCard.tsx` beneath the optional tweet caption.
   - Left half: Emoji/icon, bold headline, secondary subtitle, and outbound domain link (`amberlyn.design`).
   - Right half: Dedicated flush cover image (`object-cover`) with zero margins to the borders.
2. **Web Badge Attachment (`type: 'badge'`)**:
   - $88\text{px} \times 31\text{px}$ retro button badge (color gradient or $3\times$ Retina PNG).
   - Underneath micro-label and outbound domain link.
3. **Circular OOMF Avatar Badge (`type: 'badge'`, `badgeType: 'avatar'`)**:
   - $52\text{px} \times 52\text{px}$ circular avatar honoring mutual followers, linking to `/[targetUsername]`.
4. **Universal Post Actions**:
   - Every link card and badge post includes full Twitter engagement chrome: replies, reposts, likes, views counter, and the `FolderPlus` icon to assign to any curated Post Collection.

---

## 5. PostComposer Dual-Tab System

In [`src/components/feed/PostComposer.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/PostComposer.tsx):

- **Header Switcher**: `[ 📝 Post ]` vs `[ 🔗 Link ]`.
- **Under `[ Post ]`**:
  - Full creation suite:
    - 📝 Standard text
    - 🖼️ Local image compression
    - 🎞️ Photo Carousel
    - 📌 Pinterest Board
    - 🔗 Bio Link Card
    - ✨ Retro Web Badge
    - 👥 OOMF Avatar Picker
  - **Universal Collection Selector**: An "Add to collection" dropdown surfaces all author **Post Collections**, allowing any format to be published directly into a thematic channel in one click.
- **Under `[ Link ]`**:
  - Guides creators on the Switchboard model, with direct 1-click shortcut buttons to start drafting Bio Link or Web Badge posts.
