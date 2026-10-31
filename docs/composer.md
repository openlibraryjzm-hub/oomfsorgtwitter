# Board Composer (`PostComposer.tsx`)

This document details the architecture, design principles, media compression pipeline, and state synchronization flow of the board creation composer on `oomfs.org`.

---

## 1. Overview & Core Philosophy

The composer ([`src/components/feed/PostComposer.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/PostComposer.tsx)) is dedicated exclusively to drafting **Curated Boards (`type: 'board'`)**, which are the sole timeline post type on user profiles.

* **Board Title**: Bold, clean typography title (e.g., `Brutalist Architecture`) without emojis. Subtitles and captions have been removed so the title is the sole clean text identifier of the board.
* **Visual Items ($3+$ items required)**: Image uploads (compressed client-side via canvas) and/or mutual/user avatar link embeds (`SelectOomfModal`).
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
1. **Visual Slots (3+ items)**: Pre-fills 5 blank item slots where creators can choose either **"Image"** (file upload) or **"Avatar"** (picking a mutual friend via `SelectOomfModal`). In addition, bottom action buttons allow adding photos or mutual avatars to the board dynamically.
2. **Item Captions**: Optional clean notes per slot. Zero emojis.

### 3. Cover Photo Framing & Viewfinder Cropper (`BoardCropModal.tsx`)
- **Focal Framing on Slot 1**: Slot 1 serves as the board's hero cover photo displayed in the 2-column feed.
- **Interactive Viewfinder Modal**: Uploading to Slot 1 (or clicking the Crop icon on any image slot) launches `BoardCropModal.tsx`:
  - Enforces the exact 2:1 card ratio (`aspect-[2/1]`) inside a high-contrast darkroom viewfinder.
  - Supports interactive drag-to-pan with touch and mouse clamping, ensuring no empty margins appear.
  - Zoom slider, mouse wheel zoom, and pinch-to-zoom up to 3× magnification.
  - Displays rule-of-thirds alignment grid lines during active dragging.
  - "Apply" rasters the framed crop onto an in-memory canvas and updates the slot with the 2:1 JPEG data URL.

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
   - Minimum 3 filled items: `filledBoardItems.length >= 3`
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
- [ ] **Dual Slot Choices in Board Builder**:
  Empty board slots provide distinct buttons for **"Image"** (uploading a photo) and **"Avatar"** (selecting an OOMF mutual or followed user), guaranteeing consistent media and link behavior.
- [ ] **Validation Guardrails**:
  Disable the submit button until a non-empty title is provided AND at least 3 slots have valid images or avatar embeds.
- [ ] **Zero Emojis**:
  Strip emojis from board titles and slot captions to preserve typographic minimalism.
- [ ] **Submitting to Presets**:
  Always ensure `addItemToCollection(targetCollection, newPostId, authorUser.id)` runs if a preset was selected, and include `collectionId: targetCollection` in the `oomfs:post-created` custom event payload.
