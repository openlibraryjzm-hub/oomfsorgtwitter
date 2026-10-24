# Unified Post Composer (`PostComposer.tsx`)

This document details the architecture, design principles, media compression pipeline, and state synchronization flow of the unified creation composer on `oomfs.org`.

---

## 1. Overview & Core Philosophy

The unified composer ([`src/components/feed/PostComposer.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/PostComposer.tsx)) allows users to draft native 1:1 X/Twitter text posts alongside specialized visual and bio-link content blocks:

* **Standard Post (`standard`)**: Native text post with character input (`"What is happening?!"`).
* **Photo Carousel (`carousel`)**: Uncapped horizontal photo dump with slide ordering and bottom captions.
* **Curated Board (`board`)**: Pinterest-style visual curation boards ($3+$ images).
* **Bio Link Card (`link_card`)**: Outbound destination card for Linktree replacement.
* **Avatars & Links Grid (`grid`)**: 4 or 5 column matrix combining circular avatars and square generic links with dotted-outline slot builder.

### Universal Post Commentary
Every post type presents as an authentic timeline post with a top commentary/caption textarea, allowing creators to add thoughts or commentary above any visual format:
- **Standard**: `"What is happening?!"`
- **Carousel**: `"Add thoughts or a caption for your carousel... (optional)"`
- **Board**: `"Add thoughts or a caption for your board... (optional)"`
- **Bio Link Card**: `"Add thoughts or a caption for your link... (optional)"`
- **Avatars & Links Grid**: `"Add thoughts or a caption for your grid... (optional)"`

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

## 3. Format Selection & Direct In-Situ Drafting

Post format switching is controlled directly via the **bottom icon action bar** mirroring Twitter's native compose chrome:

| Icon | Lucide Component | Format | Click Behavior |
| :--- | :--- | :--- | :--- |
| 🖼️ | `ImageIcon` | Image Upload | Triggers file picker; promotes `'standard'` to `'carousel'` |
| 🎞️ | `Layers` | Carousel | Toggles between `'carousel'` and `'standard'` (5 blank slide slots) |
| 📌 | `LayoutGrid` | Board | Toggles between `'board'` and `'standard'` (5 blank board image slots) |
| 🔗 | `Link2` | Bio Link | Toggles between `'link_card'` and `'standard'` (in-situ card editing) |
| ⊞ | `Grid2X2` | Avatars & Links Grid | Toggles between `'grid'` and `'standard'` (dotted outline matrix) |

### Streamlined In-Situ Drafting Principles:
1. **Photo Carousel**: Pre-fills 5 blank image slots with upload placeholders and faint suggestion placeholders (`Post — 01` through `Post — 05`), removing title input clutter in favor of the universal post commentary.
2. **Curated Board**: Pre-fills 5 blank image slots with upload placeholders and faint suggestion placeholders (`Board — 01` through `Board — 05`), without thumbnail preview clutter.
3. **Bio Link Card**: Directly editable in-situ inside the card template itself (click right half to upload cover image, click left half to edit title, subtitle, destination URL, or select quick icon) with zero redundant form fields below.
4. **Avatars & Links Grid**: Interactive dotted-outline matrix (4 or 5 columns) with modal slot builder for circular avatars or square generic links.

### Toggle-to-Standard Mechanics
Clicking an active format icon a second time smoothly toggles the composer back to `'standard'` text mode and clears format-specific errors, providing a frictionless reset without needing a separate cancel button.

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
### Avatars & Links Grid Pipeline
For grid posts (`type: 'grid'`), creators populate a 4 or 5 column matrix with two item archetypes:
1. **OOMF & Mutuals Avatar Selection (`SelectOomfModal.tsx`)**:
   - For `kind: 'avatar'`, clicking an empty slot or selecting Avatar launches the mutual picker.
   - Searches the user's active following graph and mutual OOMFs.
   - Selecting a friend automatically populates their avatar image, name, and profile URL (`/[username]`).
2. **Generic Link Slot Media**:
   - For `kind: 'link'`, creators can upload a custom square graphic (compressed via `compressImageFile(file, 400, 0.85)`), or choose a preset color gradient with an emoji or icon.
3. **Micro-Labels & Tooltips**:
   - Slots support an optional underneath micro-label (`showLabel`), while desktop hover tooltips always reveal the title and target destination.

### Bio Link Card Image Pipeline (`handleLinkImageChange`)
For bio link cards (`type: 'link_card'`), creators can upload an optional cover image for the card's flush right half:
1. **Canvas Compression**: Uses `compressImageFile(file, 900, 0.85)` to scale and compress the graphic client-side into a lightweight base64 JPEG data URL.
2. **URL Paste Fallback**: Alternatively allows direct pasting of an external image URL.
3. **Optional Nature**: If omitted, the card renders a graceful neutral gradient with watermark icon, ensuring link cards can be drafted quickly with or without imagery.
4. **Live Interactive In-Situ Editing**: The card preview is editable in-place, allowing direct adjustments to title, subtitle, URL, icon, and flush right-half cover image.

---

## 5. Submission & Synchronization Lifecycle

When the user taps **"Post"**:

```
[User clicks Post]
       │
       ▼
1. Validation Check (`canSubmit()`)
   - standard:  text.trim().length > 0
   - carousel:  mediaItems.length >= 1
   - board:     mediaItems.length >= 3
   - link_card: linkTitle && linkUrl
   - grid:      gridItems.length >= 1
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
   - If an existing post collection was chosen from the "Add to collection" dropdown, the new post or link ID is immediately assigned to that collection in `public.collection_items` and local storage.
```

### Collection Assignment During Drafting
Above the composer submit chrome, a collection selector dropdown displays all available post collections (`userPostCols`):
- All post types (`standard`, `carousel`, `board`, `link_card`, `grid`) can be added directly to any Post Collection playlist.
- Creators can publish directly into a specific collection (e.g. `[ 💼 Work Links ]` or `[ 🎨 Moodboards ]`) in a single click without needing a secondary sorting step after publishing.

---

## 6. Testing & Prototyping Utilities

To accelerate testing, the composer includes built-in preset loaders:
* **"Load 5 Sample Slides"**: Immediately populates a 5-slide photo carousel with Unsplash test images and captions.
* **"Load 5 Sample Board Images"**: Immediately populates a 5-image curated architecture/design board.
