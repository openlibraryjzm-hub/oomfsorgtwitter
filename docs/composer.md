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
| ✨ | `Sparkles` | Web Badge | Toggles between `'badge'` and `'standard'` |

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
5. **Direct Payload Storage**: The compressed data URL is stored directly inside `public.blocks.content` JSONB in Supabase.

---

## 5. Submission & Synchronization Lifecycle

When the user taps **"Post"**:

```
[User clicks Post]
       │
       ▼
1. Validation Check (`canSubmit()`)
   - standard: text.trim().length > 0
   - carousel: mediaItems.length >= 1
   - board:    mediaItems.length >= 3
   - link_card: linkTitle && linkUrl
   - badge:    badgeUrl && (badgeLabel || badgeTitle)
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
   - Emits window event with post payload
   - `ProfileView.tsx` listens and immediately prepends the post to active state
   - Automatically switches active tab ('links' for bio links / badges, 'posts' for media)
```

---

## 6. Testing & Prototyping Utilities

To accelerate testing, the composer includes built-in preset loaders:
* **"Load 5 Sample Slides"**: Immediately populates a 5-slide photo carousel with Unsplash test images and captions.
* **"Load 5 Sample Board Images"**: Immediately populates a 5-image curated architecture/design board.
* **Badge Presets**: One-click quick presets for popular buttons (Neocities, GitHub, Spotify).
