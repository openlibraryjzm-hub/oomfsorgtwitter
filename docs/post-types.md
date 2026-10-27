# Post Types on oomfs.org

This document outlines the post type architecture for `oomfs.org`. It defines the active post types, data models, rendering behaviors, drafting workflows, and instructions for adding new post types in the future.

---

## 1. Architecture & Core Philosophy

On `oomfs.org`, content is modeled as modular blocks stored in Supabase (`public.blocks`) and displayed either on a user's profile timeline (`/[username]`) or in a dedicated thread route (`/[username]/status/[id]`).

`oomfs.org` supports focused, expressive media post formats tailored to creative portfolios and X-native culture.

### Active Post Types

| Post Type | Type Identifier | Profile Timeline View | Thread View (`/[username]/status/[id]`) |
| :--- | :--- | :--- | :--- |
| **Standard** | `'standard'` | 1:1 X-style post with text and optional media attachments (1–4 photos or user avatars) | Expanded focal view with thread replies |
| **Board** | `'board'` | Pinterest-style 3-item preview (`50%` left, `25%`+`25%` right, `+N` badge) with images and/or mutual avatars | Expanded 2-column Pinterest-style masonry grid |
| **Profile Comment** | `'comment'` | 1:1 X guestbook card on the **Comments** tab (1–4 photo grid, action bar) | Expanded focal view with *"Replying to @username"* and replies feed |

---

## 2. Data Models & TypeScript Types

Defined in [`src/lib/mockData.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/mockData.ts):

```typescript
export interface BoardImage {
  id: string;
  type?: 'image' | 'user';
  url: string;
  caption?: string; // Optional item note
  username?: string;
  name?: string;
  avatar?: string;
}

export type BoardItem = BoardImage;

export interface BoardData {
  images: BoardItem[]; // Minimum 3 items required (images or avatars)
}

export interface ImageAttachment {
  type: 'image';
  url: string;
}

export interface UserAttachment {
  type: 'user';
  username: string;
  name: string;
  avatar: string;
  id?: string;
}

export type PostAttachment = ImageAttachment | UserAttachment;

export interface Post {
  id: string;
  author: User;
  createdAt: string;
  type: 'standard' | 'board' | 'comment';
  text: string;
  images?: string[];
  attachments?: PostAttachment[];
  targetUsername?: string;
  targetUserId?: string;
  boardData?: {
    images: BoardImage[];
  };
  badgeData?: BadgeData;
  likesCount: number;
  repostsCount: number;
  repliesCount: number;
  viewsCount: string;
  isLiked?: boolean;
  isReposted?: boolean;
}
```

---

## 3. Detailed Specifications of Post Types

### 1. Standard Post (`type: 'standard'`)
- **Purpose**: Native 1:1 tweet post adhering strictly to the Twitter/X Web Light Theme design system.
- **Unified Attachments (1–4 items)**:
  - Supports attaching 1–4 items: photos, user/mutual avatars, or a blend of both.
  - Rendered identically via [`TwitterMediaGrid.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/TwitterMediaGrid.tsx):
    - **1 Item**: Full card aspect ratio.
    - **2 Items**: 2 equal vertical columns (`grid-cols-2`).
    - **3 Items**: 50% left half, two 25% stacked right half cells.
    - **4 Items**: 2x2 grid (`grid-cols-2 grid-rows-2`).
  - **User/Avatar Attachment**: Displays circular avatar, display name, `@username`, and navigates to `/[username]`.
- **Interactions**: Clicking the post card navigates to the thread route `/[username]/status/[id]`. Supports like, reply, repost, and view counts.

### 2. Board (`type: 'board'`)
- **Purpose**: Pinterest-style visual curation boards (e.g. architectural studies, design references, collaborative moodboards). Requires at least 3 items (images and/or mutual avatar circles).
- **Dual Presentation Modes**:
  1. **Timeline Mode (`isThreadView = false`)**:
     - Renders a 3-item preview adhering to consistent attachment layout geometry.
     - **Item 1**: Occupies the left half (`50%` width, 100% height; renders photo or circular user avatar).
     - **Items 2 & 3**: Stacked vertically on the right half (`25%` area each; renders photo or circular user avatar).
     - **Badge**: If the board has more than 3 items, Item 3 displays a `+N more in thread` overlay badge.
     - **Board Indicator Mini Banner**: Directly between the media cards and post action metrics, a dedicated banner indicates the curation style (e.g. `Click to view [N] more items on this board → Explore board`) and directly routes to the expanded thread.
     - Clicking the post opens the thread view.
  2. **Thread View Mode (`isThreadView = true` at `/[username]/status/[id]`)**:
     - Expands all `3+` items into an authentic **2-column Pinterest-style masonry grid**.
     - Image cards maintain natural aspect ratios with optional notes underneath.
     - User avatar cards render circular avatars, display names, `@username` handles, and optional collaboration captions underneath, routing directly to `/[username]`.

### 3. Profile Comment (`type: 'comment'`)
- **Purpose**: Guestbook comments placed on user profiles via the Comments tab.
- Supports attached photos (1–4 items) via `TwitterMediaGrid`, full interaction metrics, and replies.

---

## 4. Drafting & Submitting Posts

The unified composer is implemented in [`src/components/feed/PostComposer.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/PostComposer.tsx).

### Entry Points & Format Selection
Post drafting can be initiated from:
1. **Left Sidebar `"Post"` Button**: Accessible from anywhere in the app; opens the composer in a modal overlay.
2. **Profile Page Header `"Create Post"` Button**: Toggles the composer drawer at the top of the profile.

Attachments and format switching are controlled via the **bottom icon action bar**:
- `ImageIcon`: Attach photos to standard post (1–4 total attachments).
- `Users`: Attach mutual/user avatar (opens `SelectOomfModal`, 1–4 total attachments).
- `LayoutGrid`: Toggle between standard post and Board builder (pre-filling 5 blank image slots).

*For full composer architecture and media pipeline details, see [Composer Documentation](composer.md).*

### Media Upload & Compression
- **Computer File Uploads**: Users can select multiple image files from their local machine.
- **Client-Side `<canvas>` Compression**: In `PostComposer.tsx`, `compressImageFile(file, 1080, 0.82)` resizes high-resolution camera photos down to a maximum dimension of 1080px (JPEG quality 0.82) while preserving the exact natural aspect ratio. This allows rich image previews and saves directly into `public.blocks` without requiring external storage buckets.
- **URL Paste Fallback**: Users can also input external image URLs for boards.
- **5-Slot Pre-Filled Templates**: Boards initialize with 5 blank upload slots and faint grey placeholder suggestions (`Board — 01` to `Board — 05`) that only save as notes if explicitly typed.

### Persistence & Event Flow
```
User clicks "Post" in PostComposer
  │
  ├─► 1. If authenticated: INSERT into Supabase `public.blocks`
  │       (user_id = authUser.id, type = postType, content = { text, attachments, boardData })
  │
  ├─► 2. Save in client runtime store: `saveSessionPost(newPost)`
  │       (Guarantees immediate resolution when clicking into `/[username]/status/[id]`)
  │
  ├─► 3. Call local callback: `onAddPost(newPost)`
  │
  └─► 4. Broadcast global event: `window.dispatchEvent(new CustomEvent('oomfs:post-created', { detail: newPost }))`
```

---

## 5. Adding New Post Types in the Future

The removal of siloed post types (like the old standalone grid and carousel) leaves a clean, extensible architectural foundation:

1. **Attachment Extensibility**: New attachment types (e.g. video clips, audio snippets, link embeds) can simply be added to the `PostAttachment` union:
   ```typescript
   export type PostAttachment = ImageAttachment | UserAttachment | AudioAttachment | ...;
   ```
   and rendered inside `TwitterMediaGrid.tsx` following the same 1–4 slot layout geometry.
2. **Full Custom Block Formats**: For completely new visual experiences (e.g. full interactive canvases), follow the Board pattern:
   - Add the new format identifier to `Post['type']` and `supabase_schema.sql`.
   - Add a format icon toggle to `PostComposer.tsx`'s bottom action bar.
   - Render the format block in `PostCard.tsx` under a dedicated `renderNewFormat()` method.

---

## 6. Fresh Agent Onboarding Checklist & Critical Architecture Rules

When adding, modifying, or testing post formats or attachments:

- [ ] **Unified Attachments vs Format Bloat**:
  Always prefer adding new media kinds to `PostAttachment` (`ImageAttachment | UserAttachment | ...`) inside standard posts and boards, rather than inventing dedicated top-level post types. Standard posts and boards share Twitter's proven layout math and geometry.
- [ ] **1–4 Attachment Limit on Standard Posts**:
  Standard posts support a strict maximum of 4 total attachments (photos, user avatars, or a blend). When users select more files or avatar chips, enforce `attachments.length < 4` and disable the action icons when full.
- [ ] **Board 3-Item Minimum Requirement**:
  Boards require at least 3 filled items (`mediaItems.filter(m => m.url.trim().length > 0).length >= 3`) before submission. Slots can be filled with either images or mutual avatars.
- [ ] **Dual Presentation Parity for Boards**:
  Boards must render in two distinct modes:
  1. Timeline Mode: 3-item split (50% left, two 25% stacked right cells, with `+N more in thread` badge if > 3 items) and a mini exploration banner.
  2. Thread Mode (`isThreadView = true` at `/[username]/status/[id]`): 2-column Pinterest-style masonry grid showing all items.
- [ ] **Preserve Session Store Synchronization**:
  Whenever creating a post in `PostComposer.tsx`, always call `saveSessionPost(newPost)` and emit the `oomfs:post-created` window event so navigating to `/[username]/status/[id]` resolves instantly without latency.
