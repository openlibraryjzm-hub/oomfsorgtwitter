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
| **Bio Link Card** | `'link_card'` | Full-width outbound link card on the **Links** profile tab & sub-pages | Link showcase with direct outbound destination |
| **Web Badge & Avatar Badge** | `'badge'` | 88×31 buttons & circular avatars in the **Links** tab (Model B dynamic plaques) | Compact button badge with outbound destination |
| **Profile Comment** | `'comment'` | 1:1 X guestbook card on the **Comments** tab (1–4 photo grid, action bar) | Expanded focal view with *"Replying to @username"* and replies feed |

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
  subtitle?: string;
  description?: string;
  icon?: string;
  image?: string;
  buttonText?: string;
  pageId?: string;
}

export interface BadgeData {
  title: string;
  url: string;
  badgeType: 'image' | 'custom' | 'avatar';
  imageUrl?: string;
  label?: string;
  sublabel?: string;
  bgColor?: string;
  textColor?: string;
  icon?: string;
  showText?: boolean;
  targetUsername?: string;
  pageId?: string;
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
  - **Geometry & Layout**: Wide short rectangular card (`h-28 sm:h-32`) taking up a full-width row on the **Links** profile tab, link sub-pages (`/[username]/links/[slug]`), and timeline feeds.
  - **Left Half (50%)**: Padded content area with an icon/emoji positioned to the left of the title, primary title text, contextual subtitle directly beneath, and a clean domain URL (`https://` stripped).
  - **Right Half (50%)**: Dedicated cover image area flush with **no margins above, below, or to the right** (`object-cover`). If no image is provided, a subtle neutral gradient with watermark icon is rendered.
  - **Card Removal**: Profile owners can delete any link card directly via a top-corner hover `×` button when `isSelf && !isReordering`.
  - **Model B Unified Flow & Drag-and-Drop Reordering**: Integrated into the author's custom sequence (`itemIds`), allowing creators to reorder cards alongside retro badge clusters.
  - Can target specific link pages during drafting via the composer collection selector dropdown.

### 5. Web Badge & OOMF Avatar Badge (`type: 'badge'`)
- **Purpose**: Nostalgic micro-links and visual mutual badges for link-in-bio curation.
- **Key Formats**:
  1. **Color Badges (`badgeType: 'custom'`)**: Visual $88 \times 31$ buttons featuring custom color presets, a rainbow spectrum picker, and dynamic gradient effects (`Angle`, `Solid`, `Sheen`, `Glow`).
  2. **Image Badges (`badgeType: 'image'`)**: Client-side canvas center-crops and downscales uploaded graphics to authentic $88 \times 31$ dimensions ($3\times$ Retina master $264 \times 93\text{px}$ PNG).
  3. **OOMF Avatar Badges (`badgeType: 'avatar'`)**: Circular $52\text{px} \times 52\text{px}$ profile badges (`rounded-full border border-black/15 shadow-2xs`) honoring mutual friends, collaborators, and followed accounts, linked directly to their profile (`/[username]`).
- **Universal Underneath Label**:
  - Rather than obscuring small buttons with text overlays or complex frosted scrims, titles and destination labels are placed directly **underneath** the badge.
  - Each badge forms an $88\text{px}$ wide gallery tile (`w-[88px] flex flex-col items-center gap-1`).
  - Labels can be toggled off (`showText: false`) for buttons with pre-baked pixel graphics.
- **Model B Unified Flow & Reordering**:
  - Badges and link cards co-exist in an author-defined sequence (`itemIds`).
  - Consecutive badges naturally group into an authentic Badge Wall plaque (`border rounded-2xl bg-white p-3.5`), while link cards take full-width rows.
  - Profile owners can toggle Reorder Mode (`[ ⇅ Reorder ]`) to safely drag and swap badges or link cards.
- *For complete architectural details, see [Web Badges Documentation](badges.md) and [Link Pages Documentation](links.md).*

---

## 4. Drafting & Submitting Posts

The unified composer is implemented in [`src/components/feed/PostComposer.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/PostComposer.tsx).

### Entry Points & Format Selection
Post drafting can be initiated from:
1. **Left Sidebar `"Post"` Button**: Accessible from anywhere in the app; opens the composer in a modal overlay.
2. **Profile Page Header `"Create Post"` Button**: Toggles the composer drawer at the top of the profile.

Format switching is controlled via the **bottom icon action bar** (`ImageIcon`, `Layers`, `LayoutGrid`, `Link2`, `Sparkles`, `Users`). Special format builders (Carousel, Board, Bio Link, Badge) sit completely flush at the top of the composer without redundant tweet textareas.

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
