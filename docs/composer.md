# Board Composer (`PostComposer.tsx`)

This document details the architecture, design principles, media compression pipeline, and state synchronization flow of the board creation composer on `oomfs.org`.

---

## 1. Overview & Core Philosophy

The composer ([`src/components/feed/PostComposer.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/PostComposer.tsx)) is dedicated exclusively to drafting **Curated Boards (`type: 'board'`)**, which are the sole timeline post type on user profiles.

* **Board Title**: Bold, clean typography title (e.g., `Brutalist Architecture`) without emojis. Subtitles and captions have been removed so the title is the sole clean text identifier of the board.
* **Visual Items (Exactly 5 items required)**: Image uploads (compressed client-side via canvas) and/or mutual/user avatar link embeds (`SelectOomfModal`). Follows the philosophy: *"If you do not have 5 images, it is not board-worthy."*
* **Preset Assignment**: Direct dropdown selection to assign the new board to a curated preset collection upon creation.

---

## 2. Composer Entry Points

Board creation can be initiated from two primary surfaces:

1. **Global Navigation ("Create Board" Button)**:
   - Located in [`LeftSidebar.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/layout/LeftSidebar.tsx).
   - Opens `PostComposer` inside a centered modal overlay with backdrop blur (`MainLayout.tsx`).
   - Accessible anywhere across the application.

2. **Profile Header ("Create Board" Button)**:
   - Located in [`ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx).
   - Toggles an inline accordion drawer directly above the profile tabs for rapid drafting.

---

## 3. Board Builder & Unified Attachments

Boards treat **image uploads** and **mutual/user avatars** as unified interchangeable items:
1. **Visual Slots (Exactly 5 Slots)**: Fixed to exactly 5 item slots corresponding to the 2x2 grid (Slots 1–4) and the centered circular avatar (Slot 5). Creators can choose either **"Image"** (file upload) or **"Avatar"** (picking a mutual friend via `SelectOomfModal`).
2. **Item Captions**: Optional clean notes per slot. Zero emojis.

### 3.1 Hybrid Multi-Image Ingestion Engine
To eliminate the friction of manually uploading photos one by one into individual slots, `PostComposer.tsx` provides a seamless hybrid upload pipeline:
* **Multi-File Selection (`multiple`)**: Both the primary "Upload Images" button and individual slot "Image" buttons support multi-file selection, sequentially auto-populating empty slots up to the 5-item ceiling.
* **One-Click Folder Upload (`webkitdirectory`)**: A dedicated "Upload Folder" action enables PC creators to select an entire moodboard folder in 1 click (populating up to the 5 slots).
* **Full Drag-and-Drop Target**: Dropping loose images or directories directly onto the Board Builder area recurses via `webkitGetAsEntry()`, auto-extracting and populating board slots up to 5 items.
* **Smart Natural Ordering**: Ingested files are sorted numerically and alphabetically (`01.jpg`, `02.jpg`), preserving the creator's curated sequencing.

### 3.2 Cover Photo Framing & Viewfinder Cropper (`BoardCropModal.tsx`)
- **Focal Framing on Slot 1 Only**: Cropping is strictly confined to the board's first image (Slot 1) to determine how it appears as the 2:1 thumbnail on the Boards tab. Secondary slots cannot be cropped.
- **Full Image Preservation**: The crop action only updates `thumbnailUrl` for the card preview. The original `item.url` remains 100% untouched and uncropped so that when the board is opened in full thread view, all images display in full natural height within the 2-column masonry grid.
- **Interactive Viewfinder Modal**: Uploading to Slot 1 (or clicking the Crop icon on Slot 1) launches `BoardCropModal.tsx`:
  - Enforces the exact 2:1 card ratio (`aspect-[2/1]`) inside a high-contrast darkroom viewfinder.
  - Supports interactive drag-to-pan with touch and mouse clamping, ensuring no empty margins appear.
  - Zoom slider, mouse wheel zoom, and pinch-to-zoom up to 3× magnification.
  - Displays rule-of-thirds alignment grid lines during active dragging.
  - "Apply" rasters the framed crop onto an in-memory canvas and updates the slot's `thumbnailUrl` with the 2:1 JPEG data URL.

---

## 4. Client-Side Image Compression Pipeline

To support rich multi-image photo dumps and moodboards without requiring external object storage buckets or cloud upload latency during prototyping, `PostComposer.tsx` features an in-browser canvas compression pipeline:

```typescript
async function compressImageFile(
  file: File, 
  maxDimension = 1080, 
  quality = 0.82
): Promise<string>
```

### Pipeline Steps:
1. **File Ingestion**: Reads local image files via `FileReader` as data URLs.
2. **Aspect Ratio Preservation**: Calculates proportional width and height, scaling the largest dimension to $1080\text{px}$ while never forcing square crops.
3. **Canvas Rasterization**: Renders the image onto an HTML5 `<canvas>`.
4. **JPEG Encoding**: Exports a base64 Data URL at `0.82` compression quality, drastically reducing payload size while retaining crisp mobile and desktop HD clarity.

### OOMF & Mutuals Avatar Selection (`SelectOomfModal.tsx`)
- Clicking the `Users` icon in the action bar (or clicking "Avatar" inside a board slot) launches the mutual picker.
- Searches the user's active following graph and mutual OOMFs.
- Selecting a friend attaches their circular avatar, name, handle, and profile link (`/[username]`) directly into the board slot.

---

## 5. Submission & Synchronization Lifecycle

When the creator taps **"Create Board"**:

```
[User clicks Create Board]
       │
       ▼
1. Validation Check (`canSubmit()`)
   - Title required: `title.trim().length > 0`
   - Exactly 5 filled items: `filledBoardItems.length === 5`
       │
       ▼
2. Supabase Persistence (`public.blocks`)
   - If user is authenticated via OAuth 2.0 PKCE:
     INSERT INTO public.blocks (user_id, type = 'board', content = { title, text: title, boardData })
       │
       ▼
3. Local Session Storage (`saveSessionPost`)
   - Saves new board in client-side runtime store (`src/lib/postStore.ts`)
   - Guarantees immediate zero-latency resolution when visiting `/[username]/status/[id]`
       │
       ▼
4. Global Event Broadcast (`oomfs:post-created`)
   - Emits window event with payload: `{ post: newPost, collectionId: targetColId }`
   - `ProfileView.tsx` listens and immediately prepends the board to active posts state
   - Automatically sets active tab to `'boards'`
       │
       ▼
5. Preset Assignment (`addItemToCollection`)
   - If an existing preset collection was chosen from the "Add to preset" dropdown, the new board ID is immediately assigned to that collection in `public.collection_items` and local storage.
```

---

## 6. Fresh Agent Onboarding Checklist & Critical Composer Rules

When modifying composer state, media handling, or UI controls:

- [ ] **Boards Are the Sole Post Type**:
  Do not introduce separate standard text post toggles. The composer is dedicated purely to crafting visual boards.
- [ ] **Strictly No Subtitles**:
  The composer only captures the board title. Do not add subtitle or caption textareas to the board form.
- [ ] **Fixed 5 Visual Slots**:
  The Board Builder is fixed to exactly 5 slots (Slots 1–4 for the 2x2 grid, Slot 5 for the center circle). Maximum images is capped strictly at 5.
- [ ] **Strict 5-Image Enforcement**:
  Disable the submit button until a non-empty title is provided AND all 5 slots have valid images or avatar embeds. If fewer than 5 items are present, display `5 images required (X/5 added)` helper text and block submission.
- [ ] **Zero Emojis**:
  Strip emojis from board titles and slot captions to preserve typographic minimalism.
- [ ] **Submitting to Presets**:
  Always ensure `addItemToCollection(targetCollection, newPostId, authorUser.id)` runs if a preset was selected, and include `collectionId: targetCollection` in the `oomfs:post-created` custom event payload.
