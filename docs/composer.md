# Unified Post Composer (`PostComposer.tsx`)

This document details the architecture, design principles, media compression pipeline, and state synchronization flow of the unified creation composer on `oomfs.org`.

---

## 1. Overview & Core Philosophy

The unified composer ([`src/components/feed/PostComposer.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/PostComposer.tsx)) allows users to draft native 1:1 X/Twitter text posts alongside specialized visual and bio-link content blocks:

* **Standard Post (`standard`)**: Native text post with character input (`"What is happening?!"`).
* **Photo Carousel (`carousel`)**: Uncapped horizontal photo dump with slide ordering and bottom captions.
* **Curated Board (`board`)**: Pinterest-style visual curation boards ($3+$ images).
* **Bio Link Card (`link_card`)**: Outbound destination card for Linktree replacement.
* **Web Badge (`badge`)**: Early-web 88×31 retro button badges.

### The "Flush Builder" Principle
Unlike conventional social platforms that force a generic tweet text area above every attachment, `oomfs.org` renders specialized builders **100% flush at the top** of the composer:
- The upper textarea is strictly displayed for **Standard** text posts.
- When switching to a Carousel, Board, Bio Link, or Web Badge, the generic text area is hidden so the creator focuses immediately on the specialized media or link parameters without redundant note fields.

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

## 3. Format Selection & Bottom Action Bar

Format switching is controlled via the **bottom icon action bar** mirroring Twitter's native compose chrome:

| Icon | Lucide Component | Format | Click Behavior |
| :--- | :--- | :--- | :--- |
| 🖼️ | `ImageIcon` | Image Upload | Triggers file picker; promotes `'standard'` to `'carousel'` |
| 🎞️ | `Layers` | Carousel | Toggles between `'carousel'` and `'standard'` |
| 📌 | `LayoutGrid` | Board | Toggles between `'board'` and `'standard'` |
| 🔗 | `Link2` | Bio Link | Toggles between `'link_card'` and `'standard'` |
| ✨ | `Sparkles` | Web Badge | Toggles between `'badge'` (Color/Image) and `'standard'` |
| 👥 | `Users` | OOMF Avatar Badge | Opens badge builder directly in `'avatar'` mode and triggers OOMF picker |

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
### 88×31 Web Badge Compression Pipeline (`compressBadgeImage`)
For image badges (`badgeType: 'image'`), `compressBadgeImage(file)` performs client-side center-cropping and downscaling:
1. **Source Detection**: If an authentic $88 \times 31$ retro button is uploaded, its raw pixels are preserved 1:1 without rescaling blur.
2. **$3\times$ HiDPI Master ($264 \times 93\text{px}$)**: For standard photos, logos, and art, graphics are rendered onto a $3\times$ canvas ($264 \times 93\text{px}$) with `imageSmoothingQuality = 'high'` so badges look razor-sharp on modern Retina, mobile, and 4K screens.
3. **PNG Encoding**: Exports as a clean PNG data URL (~$8\text{–}14\text{ KB}$ payload) stored inside `public.blocks.content`, eliminating JPEG compression block artifacts.

### Bio Link Card Image Pipeline (`handleLinkImageChange`)
For bio link cards (`type: 'link_card'`), creators can upload an optional cover image for the card's flush right half:
1. **Canvas Compression**: Uses `compressImageFile(file, 900, 0.85)` to scale and compress the graphic client-side into a lightweight base64 JPEG data URL.
2. **URL Paste Fallback**: Alternatively allows direct pasting of an external image URL.
3. **Optional Nature**: If omitted, the card renders a graceful neutral gradient with watermark icon, ensuring link cards can be drafted quickly with or without imagery.
4. **Live Interactive Preview**: An exact 1:1 preview box renders above the inputs, dynamically displaying the left half (icon/emoji, title, subtitle, URL) and right half (flush cover image).

### OOMF Avatar Selection Pipeline (`SelectOomfModal.tsx`)
For avatar badges (`badgeType: 'avatar'`), clicking the `Users` icon on the toolbar or choosing `Avatar` in the badge builder opens `SelectOomfModal.tsx`:
1. **Graph Query**: Fetches followed users and mutual OOMFs for the active user via Supabase or fallback mock directory.
2. **Real-Time Filtering**: Auto-focuses a search bar to filter accounts by name or `@username`.
3. **Auto-Population**: Selecting an account automatically sets `badgeImageUrl` to the user's avatar, `badgeUrl` to `/${user.username}`, and `badgeText` to `@${user.username}`.

*For detailed visual specifications and gallery layout rules, see [Web Badges Documentation](badges.md) and [Link Pages Documentation](links.md).*

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
   - badge:     hasUrl && (avatar mode: hasImageUrl; image mode: hasImageUrl && textOk; color mode: textOk)
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
   - `ProfileView.tsx` listens and immediately prepends the post to active state
   - Automatically switches active tab ('links' for bio links / badges, 'posts' for media)
       │
       ▼
5. Collection Assignment (`addItemToCollection`)
   - If an existing collection or Link Page was chosen from the "Add to collection" dropdown, the new post or link ID is immediately assigned to that collection in `public.collection_items` and local storage.
```

### Collection & Link Page Assignment During Drafting
Above the composer submit chrome, a collection selector dropdown displays all available presets for the active tab:
- **Posts Tab (`standard`, `carousel`, `board`)**: Shows post collections (`userPostCols`).
- **Links Tab (`link_card`, `badge`)**: Shows link sub-pages (`userLinkCols`), defaulting to the active link page (or `[ 🌐 Main ]` if none active).
- Creators can publish directly to a specific sub-page (e.g. `[ 💼 Work ]` or `[ 📝 Writing ]`) in a single click without needing a secondary sorting step after publishing.

---

## 6. Testing & Prototyping Utilities

To accelerate testing, the composer includes built-in preset loaders:
* **"Load 5 Sample Slides"**: Immediately populates a 5-slide photo carousel with Unsplash test images and captions.
* **"Load 5 Sample Board Images"**: Immediately populates a 5-image curated architecture/design board.
