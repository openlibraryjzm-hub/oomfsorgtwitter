# Post Types on oomfs.org

This document outlines the post type architecture for `oomfs.org`. It defines the active post types, data models, rendering behaviors, drafting workflows, and instructions for adding new post types in the future.

---

## 1. Architecture & Core Philosophy

On `oomfs.org`, content is modeled as modular blocks stored in Supabase (`public.blocks`) and displayed either on a user's profile timeline (`/[username]`) or in a dedicated thread route (`/[username]/status/[id]`).

Unlike generic social platforms with rigid 4-image grid constraints, `oomfs.org` supports rich, expressive media post formats tailored to creative portfolios and X-native culture.

### Active Post Types

| Post Type | Type Identifier | Profile Timeline View | Thread View (`/[username]/status/[id]`) |
| :--- | :--- | :--- | :--- |
| **Standard** | `'standard'` | 1:1 X-style text post with optional single attachment | Expanded focal view with thread replies |
| **Carousel** | `'carousel'` | Uncapped horizontal scroll strip, universal header, per-image captions | Uncapped horizontal scroll strip, full header & captions |
| **Board** | `'board'` | Pinterest-style 3-image preview (`50%` left, `25%`+`25%` right, `+N` badge) | Expanded 2-column Pinterest-style masonry grid |
| **Bio Link Card** | `'link_card'` | Compact link showcase button (featured on the **Links** profile tab) | Link showcase with direct outbound destination |
| **Web Badge** | `'badge'` | Exclusively in the **Links** tab (unified Badge Wall above cards) | Compact 88×31 button badge with outbound destination |

---

## 2. Data Models & TypeScript Types

Defined in [`src/lib/mockData.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/mockData.ts):

```typescript
export interface CarouselSlide {
  id: string;
  url: string;
  caption?: string; // Optional bottom overlay caption
}

export interface CarouselData {
  header: string; // Universal small header above the strip
  slides: CarouselSlide[]; // Uncapped (>4 supported)
}

export interface BoardImage {
  id: string;
  url: string;
  caption?: string; // Optional image note
}

export interface BoardData {
  images: BoardImage[]; // Minimum 3 images required
}

export interface LinkData {
  title: string;
  url: string;
  description?: string;
  buttonText?: string;
}

export interface BadgeData {
  title: string;
  url: string;
  badgeType: 'image' | 'custom';
  imageUrl?: string;
  label?: string;
  sublabel?: string;
  bgColor?: string;
  textColor?: string;
  icon?: string;
}

export interface Post {
  id: string;
  author: User;
  createdAt: string;
  type: 'standard' | 'carousel' | 'board' | 'link_card' | 'badge';
  text: string;
  carouselData?: CarouselData;
  boardData?: BoardData;
  linkData?: LinkData;
  badgeData?: BadgeData;
  likesCount: number;
  repostsCount: number;
  repliesCount: number;
  viewsCount?: string;
  isLiked?: boolean;
}
```

---

## 3. Detailed Specifications of Post Types

### 1. Standard Post (`type: 'standard'`)
- **Purpose**: Native 1:1 text post adhering strictly to the Twitter/X Web Light Theme design system.
- **Interactions**: Clicking the post card navigates to the thread route `/[username]/status/[id]`. Supports like, reply, repost, and view counts.

### 2. Carousel (`type: 'carousel'`)
- **Purpose**: Uncapped horizontal scrolling photo strip designed for photo dumps, studio updates, and camera rolls.
- **Key Features**:
  1. **Universal Header**: A small, clean header bar displayed directly above the strip (e.g. `october camera roll 📸`).
  2. **Uncapped Capacity**: Unlike Twitter/X's native 4-image upload limit, `oomfs.org` carousels have no hard slide cap (`>4` slides fully supported).
  3. **Natural Aspect Ratios**: Portrait images remain tall and thin, landscape images remain wide, with subsequent slides naturally peeking in from the right edge. Images are never forcefully cropped to uniform boxes.
  4. **Per-Slide Bottom Caption Overlays**: Each slide can feature its own translucent bottom caption overlay (`bg-gradient-to-t from-black/80 to-transparent`).
  5. **Controls**: Smooth touch scrolling on mobile with hover navigation chevrons (`←` / `→`) on desktop.

### 3. Board (`type: 'board'`)
- **Purpose**: Pinterest-style visual curation boards (e.g. architectural studies, design references, moodboards). Requires at least 3 images.
- **Dual Presentation Modes**:
  1. **Timeline Mode (`isThreadView = false`)**:
     - Renders a 3-image preview.
     - **Image 1**: Occupies the left half (`50%` width).
     - **Images 2 & 3**: Stacked vertically on the right half (`25%` height/width each).
     - **Badge**: If the board has more than 3 images, Image 3 displays a `+N more in thread` overlay badge.
     - Clicking the post opens the thread view.
  2. **Thread View Mode (`isThreadView = true` at `/[username]/status/[id]`)**:
     - Expands all `3+` images into an authentic **2-column Pinterest-style masonry grid**.
     - Each card maintains natural image aspect ratios and displays optional notes underneath.

### 4. Bio Link Card (`type: 'link_card'`)
- **Purpose**: Curated link showcase for Linktree replacement.
- **Key Features**:
  - Highlights title, domain URL (with `https://` stripped for clean display), optional description, and a `"Visit ↗"` pill.
  - Primed for display under the **3. Links** tab on the profile page, but can also be shared directly on the timeline.

### 5. Web Badge (`type: 'badge'`)
- **Purpose**: Early-internet 88×31 button badges & micro-links.
- **Key Features**:
  - **Exclusively on the Links Tab**: Filtered out of the primary timeline; aggregates into a single unified **Badge Wall** situated directly above larger link cards.
  - **Zero Card Clutter**: Badges are freed from standard Twitter card wrappers (no repeated avatar, handle, or timestamp per item) and pack together super tightly.
  - **Dual Mode Creation (Color vs. Image)**:
    - **Color Badges (`badgeType: 'custom'`)**: Visual $88 \times 31$ buttons featuring custom color presets, a rainbow spectrum picker, and dynamic gradient effects (`Angle`, `Solid`, `Sheen`, `Glow`).
    - **Image Badges (`badgeType: 'image'`)**: Client-side canvas center-crops and compresses any uploaded graphic down to exact $88 \times 31$ dimensions.
  - **Universal Underneath Label**:
    - Rather than obscuring small $88 \times 31$ buttons with text overlays or complex frosted scrims, titles and destination labels are placed directly **underneath** the badge.
    - Each badge forms an $88\text{px}$ wide gallery tile (`w-[88px] flex flex-col items-center gap-1`), authentic to early-webring galleries.
    - Labels can be toggled off (`showText: false`) for buttons with pre-baked pixel graphics.
  - **Interactive**: Outbound link click; profile owners can delete badges directly on hover.
  - *For complete canvas compression, HiDPI Retina pipelines, and Badge Wall gallery architecture, see [Web Badges Documentation](badges.md).*

---

## 4. Drafting & Submitting Posts

The unified composer is implemented in [`src/components/feed/PostComposer.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/PostComposer.tsx).

### Entry Points & Format Selection
Post drafting can be initiated from:
1. **Left Sidebar `"Post"` Button**: Accessible from anywhere in the app; opens the composer in a modal overlay.
2. **Profile Page Header `"Create Post"` Button**: Toggles the composer drawer at the top of the profile.

Format switching is controlled via the **bottom icon action bar** (`ImageIcon`, `Layers`, `LayoutGrid`, `Link2`, `Sparkles`). Special format builders (Carousel, Board, Bio Link, Badge) sit completely flush at the top of the composer without redundant tweet textareas.

*For full composer architecture and media pipeline details, see [Composer Documentation](composer.md).*

### Media Upload & Compression
- **Computer File Uploads**: Users can select multiple image files from their local machine.
- **Client-Side `<canvas>` Compression**: In `PostComposer.tsx`, `compressImageFile(file, 1080, 0.82)` resizes high-resolution camera photos down to a maximum dimension of 1080px (JPEG quality 0.82) while preserving the exact natural aspect ratio. This allows rich image previews and saves directly into `public.blocks` without requiring external storage buckets.
- **URL Paste Fallback**: Users can also input external image URLs.
- **1-Click Sample Previews**: The composer includes **"Load 5 Sample Slides"** and **"Load 5 Sample Board Images"** presets for instant development and testing.
- **Slide Controls**: Reorder slides left/right (`←`/`→`), delete slides (`×`), and type per-image bottom captions.

### Persistence & Event Flow
```
User clicks "Post" in PostComposer
  │
  ├─► 1. If authenticated: INSERT into Supabase `public.blocks`
  │       (user_id = authUser.id, type = postType, content = { text, carouselData, boardData, linkData })
  │
  ├─► 2. Save in client runtime store: `saveSessionPost(newPost)`
  │       (Guarantees immediate resolution when clicking into `/[username]/status/[id]`)
  │
  ├─► 3. Call local callback: `onAddPost(newPost)`
  │
  └─► 4. Broadcast global event: `window.dispatchEvent(new CustomEvent('oomfs:post-created', { detail: newPost }))`
          (ProfileView listens and automatically prepends newPost to active feed)
```

---

## 5. Guide for Adding Future Post Types

When introducing a new post type, follow this checklist:

1. **Update `src/lib/mockData.ts`**:
   - Define data interface (e.g. `CustomData`).
   - Add new type string to `Post['type']` union (e.g. `'custom_format'`).
   - Add optional field to `Post` (e.g. `customData?: CustomData`).
   - Add mock post examples.

2. **Update Database Contract (`public.blocks`)**:
   - Store the type in `type: 'custom_format'`.
   - Store all payload data inside `content` JSONB.

3. **Update `src/components/feed/PostCard.tsx`**:
   - Add a `renderCustomFormat()` helper.
   - Support both timeline preview mode (`isThreadView = false`) and full thread mode (`isThreadView = true`).
   - Add case in main `PostCard` render branch.

4. **Update `src/components/feed/PostComposer.tsx`**:
   - Add a tab pill for the new format in the type selector bar.
   - Add relevant draft inputs (text, media, settings).
   - Package the payload inside `blockContent` in `handleSubmit`.

5. **Update `src/app/[username]/status/[id]/page.tsx` & `ThreadClientView.tsx`**:
   - Verify that the new format's fields are mapped when loading from Supabase or session storage.
