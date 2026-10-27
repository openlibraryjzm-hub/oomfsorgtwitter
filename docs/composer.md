# Unified Post Composer (`PostComposer.tsx`)

This document details the architecture, design principles, media compression pipeline, and state synchronization flow of the unified creation composer on `oomfs.org`.

---

## 1. Overview & Core Philosophy

The unified composer ([`src/components/feed/PostComposer.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/PostComposer.tsx)) allows users to draft native 1:1 X/Twitter posts with unified attachment capabilities, alongside specialized visual boards:

* **Standard Post (`standard`)**: Native text post with character input (`"What is happening?!"`) and support for **1–4 attachments** (photos and/or mutual/user circular avatars) following authentic Twitter media grid rules.
* **Curated Board (`board`)**: Pinterest-style visual curation boards ($3+$ items: images and/or mutual/user avatar circles).

### Universal Post Commentary
Every post type presents as an authentic timeline post with a top commentary/caption textarea, allowing creators to add thoughts or commentary above any visual format:
- **Standard**: `"What is happening?!"`
- **Board**: `"Add thoughts or a caption for your board... (optional)"`

---

## 2. Composer Entry Points

Post creation can be initiated from two primary surfaces:

1. **Global Navigation ("Post" Button)**:
   - Located in [`LeftSidebar.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/layout/LeftSidebar.tsx).
   - Opens `PostComposer` inside a centered modal overlay with backdrop blur (`MainLayout.tsx`).
   - Accessible anywhere across the application.

2. **Profile Header ("Create Post" Button)**:
   - Located at the top right of the profile header in [`ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx).
   - Toggles an inline accordion drawer directly above the profile tabs for rapid drafting.

---

## 3. Format Selection & Attachment Bar

Post format switching and attachments are controlled directly via the **bottom icon action bar** mirroring Twitter's native compose chrome:

| Icon | Lucide Component | Format / Action | Click Behavior |
| :--- | :--- | :--- | :--- |
| 🖼️ | `ImageIcon` | Attach Photos | Triggers file picker; attaches 1–4 photos to standard post, or uploads photos to Board |
| 👥 | `Users` | Attach Mutual Avatar | Opens `SelectOomfModal` to attach a friend/user avatar chip (to standard post or Board) |
| 📌 | `LayoutGrid` | Board | Toggles between `'board'` and `'standard'` (5 blank board item slots) |

### Unified Attachments System & Board Avatars
Both standard posts and visual boards treat **image uploads** and **mutual/user avatars** as unified interchangeable items sharing consistent layout constraints and rules:
1. **Standard Posts (1–4 items)**: Up to 4 total attachments per standard post (any combination of photos and user avatars) previewed inline with individual `X` delete badges.
2. **Visual Boards (3+ items)**: Pre-fills 5 blank item slots where creators can choose either **"Image"** (file upload) or **"Avatar"** (picking a mutual friend via `SelectOomfModal`). In addition, bottom action buttons allow adding photos or mutual avatars to the board dynamically.
3. **Geometry**:
   - 1 item: full-width responsive card.
   - 2 items: 2 equal side-by-side columns (`grid-cols-2`).
   - 3 items: 50% left column, two 25% stacked right column cells.
   - 4 items: 2x2 grid (`grid-cols-2 grid-rows-2`).

### Toggle-to-Standard Mechanics
Clicking the active `LayoutGrid` icon a second time smoothly toggles the composer back to `'standard'` text mode and clears format-specific errors, providing a frictionless reset.

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
- Clicking the `Users` icon in the bottom action bar (or clicking "Avatar" inside a board slot) launches the mutual picker.
- Searches the user's active following graph and mutual OOMFs.
- Selecting a friend attaches their circular avatar, name, handle, and profile link (`/[username]`) directly into the standard post's attachment tray or into the board slot.

---

## 5. Submission & Synchronization Lifecycle

When the user taps **"Post"**:

```
[User clicks Post]
       │
       ▼
1. Validation Check (`canSubmit()`)
   - standard:  text.trim().length > 0 || attachments.length > 0
   - board:     mediaItems.filter(m => m.url.trim().length > 0).length >= 3
       │
       ▼
2. Supabase Persistence (`public.blocks`)
   - If user is authenticated via OAuth 2.0 PKCE:
     INSERT INTO public.blocks (user_id, type, content)
       │
       ▼
3. Local Session Storage (`saveSessionPost`)
   - Saves new post in client-side runtime store (`src/lib/postStore.ts`)
   - Guarantees immediate zero-latency resolution when visiting `/[username]/status/[id]`
       │
       ▼
4. Global Event Broadcast (`oomfs:post-created`)
   - Emits window event with payload: `{ post: newPost, collectionId: targetColId }`
   - `ProfileView.tsx` listens and immediately prepends the post to active posts state
   - Automatically switches active tab to 'posts'
       │
       ▼
5. Collection Assignment (`addItemToCollection`)
   - If an existing post collection was chosen from the "Add to collection" dropdown, the new post ID is immediately assigned to that collection in `public.collection_items` and local storage.
```

### Collection Assignment During Drafting
Above the composer submit chrome, a collection selector dropdown displays all available post collections (`userPostCols`):
- All post types (`standard`, `board`) can be added directly to any Post Collection playlist.
- Creators can publish directly into a specific collection (e.g. `[ 🎨 Moodboards ]` or `[ 💻 Dev Notes ]`) in a single click without needing a secondary sorting step after publishing.

---

## 6. Fresh Agent Onboarding Checklist & Critical Composer Rules

When modifying composer state, media handling, or UI controls:

- [ ] **Unified Action Bar Behavior**:
  - `ImageIcon`: Triggers file upload. In standard mode, adds photos to `attachments` (up to 4 total). In board mode, uploads photos to fill empty slots or append new slots.
  - `Users`: Triggers `SelectOomfModal`. In standard mode, adds a user avatar chip to `attachments` (up to 4 total). In board mode, fills a target slot or appends an avatar item to the board.
  - `LayoutGrid`: Toggles between `'board'` and `'standard'` modes cleanly.
- [ ] **Dual Slot Choices in Board Builder**:
  Empty board slots provide distinct buttons for **"Image"** (uploading a photo) and **"Avatar"** (selecting an OOMF mutual or followed user), guaranteeing consistent media and link behavior.
- [ ] **Inline Tray Parity**:
  The composer's inline attachment preview tray uses the exact same geometry (1-item responsive card, 2-item 50/50 columns, 3-item left 50% / right stacked 25%, 4-item 2x2 grid) as timeline cards rendered via `TwitterMediaGrid.tsx`.
- [ ] **Submitting to Collections**:
  Always ensure `addItemToCollection(targetCollection, newPostId, authorUser.id)` runs if a collection was selected, and include `collectionId: targetCollection` in the `oomfs:post-created` custom event payload.
