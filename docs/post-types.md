# Post Types on oomfs.org

This document outlines the post type architecture for `oomfs.org`. It defines the post formats, data models, rendering behaviors, drafting workflows, and instructions for developers and agents.

---

## 1. Architecture & Core Philosophy

On `oomfs.org`, timeline content is modeled as modular blocks stored in Supabase (`public.blocks`) and displayed on user profile timelines (`/[username]`) or in dedicated thread routes (`/[username]/status/[id]`).

### Sole Timeline Post Type: Board (`type: 'board'`)

Standard text posts have been retired. **Curated Boards (`'board'`)** are the **sole timeline post type** across user profiles.

| Post Type | Type Identifier | Profile Timeline View | Thread View (`/[username]/status/[id]`) |
| :--- | :--- | :--- | :--- |
| **Board** *(Sole Timeline Post Type)* | `'board'` | Pinterest-style 2-column scroll card with 2:1 full-bleed hero cover image, bottom cascading secondary circle avatars, bold title, and item count | Full thread view with bold board title, expanded 2-column Pinterest-style masonry grid, collaborator links, and conversational replies |
| **Profile Comment** | `'comment'` | Guestbook card on the **Comments** tab (text + optional 1–4 photos, metrics) | Expanded focal thread view with *"Replying to @username"* and replies list |

---

## 2. Data Models & TypeScript Types

Defined in [`src/lib/mockData.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/mockData.ts):

```typescript
export interface BoardImage {
  id: string;
  type?: 'image' | 'user'; // Supports both compressed image uploads and mutual avatar link embeds
  url: string;
  caption?: string; // Optional clean note per item (zero emojis)
  username?: string; // Present when type === 'user'
  name?: string;     // Present when type === 'user'
  avatar?: string;   // Present when type === 'user'
}

export type BoardItem = BoardImage;

export interface BoardData {
  images: BoardItem[]; // Minimum 3 items required (images or avatars)
}

export interface Post {
  id: string;
  author: User;
  createdAt: string;
  type: 'board' | 'comment' | 'standard'; // 'board' is the sole authored timeline type
  title?: string; // Bold title (e.g., "Brutalist Architecture") — no emojis
  text: string;   // Retained for database schema compatibility, mirrored to title
  images?: string[];
  boardData?: BoardData;
  likesCount: number;
  repostsCount: number;
  repliesCount: number;
  viewsCount: string;
  isLiked?: boolean;
  isReposted?: boolean;
}
```

---

## 3. Detailed Specifications

### 1. Board (`type: 'board'`) — Sole Timeline Post Type

* **Purpose**: Visual moodboards, architectural studies, design references, and creative collaborations. Requires a title and at least 3 items (images and/or mutual user avatars).
* **Zero Emojis**: Board titles, item notes, and tags enforce strict clean typography without emoji glyphs.
* **Dual Presentation Modes**:

#### A. Timeline Grid Mode (`BoardGridCard.tsx`)
Rendered inside a 2-column Pinterest-style scroll grid (`grid-cols-2 gap-2.5 sm:gap-3`):
* **Thumbnail Geometry**: Tightly packed rounded rectangle maintaining the compact **$2:1$ aspect ratio** (`aspect-[2/1]`, `rounded-2xl`, `border-[#cfd9de]`):
  * **Main Hero Image**: Full-bleed edge-to-edge presentation of the primary board image (or collaborator avatar card) spanning the full 100% width and 100% height, framed precisely using `BoardCropModal.tsx` in the composer.
  * **Cascading Overlapping Circles**: Overlaid in the bottom-left corner over a soft gradient scrim ("also followed by" pattern). Shows up to 3 secondary images/avatars (`w-6 h-6 sm:w-7 sm:h-7`, `ring-2 ring-white`, `-ml-2`).
  * **Overflow Badge**: If the board has more than 4 items (3 secondary), the final bubble renders `+N` count.
* **Avatar Link Embeds (`type: 'user'`)**: Cells render circular HD avatars, display names, and `@handles` (`SelectOomfModal`).
* **Title & Metadata**: Clean bold title displayed directly under the rectangle, followed by item count (e.g. `6 items`).
* **Hover Menu**: Owner 3-dots menu providing **"Add to preset"** and **"Delete board"** actions.
* **Navigation**: Clicking the card navigates directly to `/[username]/status/[id]`.

#### B. Full Thread View Mode (`ThreadClientView.tsx` & `PostCard.tsx`)
At `/[username]/status/[id]`:
* **Header**: Displays a bold, large board title (`text-xl font-bold text-[#0f1419]`).
* **Masonry Grid**: Expands all board items into a responsive 2-column Pinterest masonry grid with natural photo heights, captions, and interactive collaborator profile links.
* **Replies Feed**: Standard conversational reply composer and threaded responses below the board media.
* **Owner Actions**: Owners can delete the board directly from the thread view, triggering confirmation, cache invalidation, and redirection back to the profile.

---

### 2. Profile Comment (`type: 'comment'`)

* **Purpose**: Guestbook comments left by visitors or mutuals on a creator's profile via the **Comments** tab.
* Supports attached photos (1–4 images) via `TwitterMediaGrid`, full interaction metrics, and replies.

---

## 4. Drafting Boards (`PostComposer.tsx`)

The creator composer is dedicated exclusively to drafting Boards:

### Entry Points
1. **Left Sidebar ("Create Board" Button)**: Accessible from anywhere in the app; opens the composer inside a centered modal overlay (`MainLayout.tsx`).
2. **Profile Page Header ("Create Post / Board" Button)**: Toggles an inline accordion drawer directly above the profile tabs (`ProfileView.tsx`).

### Validation & Form Rules
* **Board Title Required**: Creators must provide a title (e.g., `Brutalist Architecture`). Subtitles and captions have been completely eliminated.
* **Minimum 3 Items**: At least 3 slots must be populated (image uploads or mutual avatar links) before the "Create Board" submit button is enabled.
* **Pre-Filled Template**: Initializes with 5 visual slots for rapid drafting.
* **Preset Assignment**: Includes an inline dropdown (`Add to preset:`) allowing immediate assignment to a curated preset collection.

### Media Pipeline
* **In-Browser Compression**: Camera photos and file uploads are compressed client-side via HTML5 canvas (`compressImageFile(file, 1080, 0.82)`) to 1080px JPEG, avoiding upload latency and external bucket dependencies.
* **Mutual Avatar Picker**: The "Avatar" slot action opens `SelectOomfModal` to search and select mutual friends (`oomfs`) to embed directly into the board.

---

## 5. Persistence, State, & Deletion Flow

```
Creator submits Board in PostComposer
  │
  ├─► 1. If authenticated: INSERT into Supabase `public.blocks`
  │       (user_id = authUser.id, type = 'board', content = { title, text: title, boardData })
  │
  ├─► 2. Save in client runtime store: `saveSessionPost(newPost)`
  │       (Ensures immediate resolution when navigating to `/[username]/status/[id]`)
  │
  ├─► 3. If preset selected: `addItemToCollection(targetColId, newPostId, userId)`
  │
  ├─► 4. Call local callback: `onAddPost(newPost)`
  │
  └─► 5. Broadcast global event:
          `window.dispatchEvent(new CustomEvent('oomfs:post-created', { detail: { post, collectionId } }))`
```

### Deletion Architecture
* **Tombstone Persistence**: When a board is deleted via `BoardGridCard` or `ThreadClientView`, it is recorded in the deleted ID store (`markPostAsDeleted(id)` in `src/lib/postStore.ts`) across both `localStorage` and `sessionStorage`.
* **Immediate Removal**: The board is purged from local state, active collections, session cache, and Supabase `blocks` table.
* **Reload Resilience**: On page refresh, deleted IDs are checked so deleted boards never reappear during mock/demo rehydration.

---

## 6. Fresh Agent Onboarding Checklist & Rules

When maintaining or extending post formats:

- [ ] **Boards Are the Sole Timeline Post Type**:
  Do not introduce separate standard text posts to the profile timeline. All profile content lives within visual boards.
- [ ] **No Emojis Rule**:
  Preserve clean typography: strip emojis from board titles, preset names, and item captions.
- [ ] **Aspect Ratio Math ($2:1$) & Hero Geometry**:
  The timeline board thumbnail card MUST maintain the exact $2:1$ aspect ratio (`aspect-[2/1]`) featuring a 100% full-bleed hero image with secondary items cascading as overlapping circles in the bottom-left corner. Cover photos framed in composer via `BoardCropModal.tsx`.
- [ ] **3-Item Minimum**:
  Always validate that `filledBoardItems.length >= 3` before allowing board creation.
- [ ] **Subtitles Removed**:
  Do not re-add subtitle or caption textareas to the board composer. Board titles serve as the sole clean text identifier.
- [ ] **Tombstone Synchronization**:
  When implementing deletion features, always call both `deleteSessionPost(id)` and `markPostAsDeleted(id)` to prevent rehydration ghosts.
