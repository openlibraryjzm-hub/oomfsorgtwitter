# Profile Banner System (`docs/banners.md`)

This document serves as the canonical technical reference for the profile header banner system on `oomfs.org`. It details the 1:1 X/Twitter visual geometry, the interactive 1500×500 crop engine, the resilient storage pipeline, and cross-view presentation parity.

---

## 1. System Overview & Core Philosophy

Header banners are a core component of digital identity on X/Twitter. On `oomfs.org`, banners satisfy three requirements:
1. **1:1 Twitter Web Parity**: Preserves standard 3:1 geometry ($1500 \times 500\text{px}$) with an authentic neutral slate fallback (`#cfd9de`) and zero artificial styling.
2. **True Crop Precision**: What users see and frame in the crop modal viewfinder maps with mathematical 1:1 parity to the rasterized output.
3. **Cross-View Uniformity**: The banner appears identically—without vertical or horizontal clipping—on user profile timelines, the native "Edit profile" modal preview, and the **Card View** on follower/network pages.

```
┌────────────────────────────────────────────────────────┐
│                   Interactive Viewfinder               │
│        (BannerCropModal.tsx: 3:1 aspect ratio)         │
└───────────────────────────┬────────────────────────────┘
                            │
               1500×500 Canvas Rasterization
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Storage Pipeline                     │
│  ├── Primary: Supabase Storage bucket ('banners')      │
│  └── Fallback: High-resolution inline Data URL         │
└───────────────────────────┬────────────────────────────┘
                            │
              Persist to public.profiles.banner_url
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Display Layer                        │
│  ├── Profile Page: w-full aspect-[3/1]                 │
│  ├── Edit Profile Modal: w-full aspect-[3/1]           │
│  └── Follower List (Cards): w-full aspect-[3/1]        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Component Hierarchy & File Map

| File Path | Description |
| :--- | :--- |
| [`src/components/profile/BannerCropModal.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/BannerCropModal.tsx) | 1:1 X/Twitter "Edit media" modal with 3:1 crop viewfinder, base cover scaling, bounded pan, and zoom slider. |
| [`src/lib/bannerStorage.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/bannerStorage.ts) | Upload engine targeting Supabase Storage with graceful fallback to client-side data URLs. |
| [`supabase_banners_storage.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/supabase_banners_storage.sql) | Storage bucket definition and RLS policies for public reads and user-folder scoped writes. |
| [`supabase_profile_columns.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/supabase_profile_columns.sql) | DDL migration ensuring `banner_url`, `location`, and `website` columns exist on `public.profiles`. |
| [`src/components/profile/ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx) | Profile timeline header rendering, Edit Profile modal banner controls, and schema-resilient profile updates. |
| [`src/components/profile/CanvasPreview.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/CanvasPreview.tsx) | Collaborative r/place community canvas renderer supporting main banner, miniature, and fullscreen viewports. |
| [`src/components/profile/FullscreenMediaModal.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/FullscreenMediaModal.tsx) | Fullscreen lightbox with native photo viewing for banners and interactive entry portal for community canvas. |
| [`src/components/network/UserNetworkView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/network/UserNetworkView.tsx) | Follower, Following, and OOMFs network directory rendering banners in Cards, Canvas, and Link Wall modes. |

---

## 3. Interactive Crop Engine (`BannerCropModal.tsx`)

When a user selects an image from the "Edit profile" modal, `BannerCropModal` mounts to handle positioning and cropping:

### 3.1 Base Cover Dimensions at $\text{Zoom} = 1.0$
To avoid displaying unscaled high-resolution photos that appear overly zoomed in, the image is scaled to fit the 3:1 viewfinder using an `object-fit: cover` equivalent base calculation:

$$\text{viewAspect} = \frac{\text{viewWidth}}{\text{viewHeight}} = 3.0$$

$$\text{imgAspect} = \frac{\text{naturalWidth}}{\text{naturalHeight}}$$

- **Wide Images ($\text{imgAspect} \ge 3.0$)**:
  $$\text{baseHeight} = \text{viewHeight}, \quad \text{baseWidth} = \text{viewHeight} \times \text{imgAspect}$$
- **Tall / Standard Images ($\text{imgAspect} < 3.0$)**:
  $$\text{baseWidth} = \text{viewWidth}, \quad \text{baseHeight} = \frac{\text{viewWidth}}{\text{imgAspect}}$$

### 3.2 Zoom & Dynamic Pan Bounding
- **Zoom Range**: Constrained from $1.0\times$ (full cover) to $3.0\times$. Zoom can be adjusted via the range slider or mouse wheel scrolling directly over the viewfinder.
- **Pan Clamping**: Dragging is bounded dynamically against current rendered dimensions ($\text{currentWidth} = \text{baseWidth} \times \text{zoom}$, $\text{currentHeight} = \text{baseHeight} \times \text{zoom}$):
  $$\text{maxPanX} = \max\left(0, \frac{\text{currentWidth} - \text{viewWidth}}{2}\right)$$
  $$\text{maxPanY} = \max\left(0, \frac{\text{currentHeight} - \text{viewHeight}}{2}\right)$$
  This guarantees that transparent gaps or empty backgrounds are never exposed inside the 3:1 viewfinder.

### 3.3 1:1 Canvas Rasterization
Clicking **Apply** translates the active viewfinder coordinates into natural image space and draws them onto an offscreen HTML5 canvas:
- Output dimensions: Exactly $1500 \times 500\text{px}$.
- Format: `image/jpeg` at $0.92$ quality.
- The exported crop produces both an optimized binary `Blob` (for upload) and an instant `dataUrl` (for optimistic preview).

---

## 4. Storage & Persistence Architecture

Defined in [`src/lib/bannerStorage.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/bannerStorage.ts):

### 4.1 Supabase Storage Pipeline
1. Upload target: Supabase Storage bucket named `'banners'`.
2. Path pattern: `${userId}/banner_${Date.now()}.jpg`.
3. Read access: Publicly readable via `supabase.storage.from('banners').getPublicUrl(path)`.
4. RLS security: Authenticated users can insert, update, and delete objects only inside their own top-level folder (`(storage.foldername(name))[1] = auth.uid()::text`).

### 4.2 Resilient Fallback Guarantee
If Supabase Storage has not been configured in a development environment, or if an RLS policy fails, `uploadBannerImage()` intercepts the exception and returns the high-resolution data URL. This prevents profile editing from failing.

### 4.3 Database Schema Cache Resilience
In [`ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx), profile updates are wrapped in an automated retry loop. If PostgREST reports that a non-critical column (e.g. `location`) is missing from the database schema cache, the client automatically strips that key and retries the update. This guarantees that `banner_url` saves and persists across page reloads.

---

## 5. Cross-View Presentation Parity

To prevent vertical cropping or letterboxing, all banner surfaces use responsive aspect ratio containers rather than hardcoded vertical pixel heights:

### 5.1 Profile Page Timeline (`ProfileView.tsx`)
```tsx
<div className="w-full aspect-[3/1] bg-[#cfd9de] relative overflow-hidden">
  {userProfile.banner ? (
    <img
      src={userProfile.banner}
      alt={`${userProfile.name}'s banner`}
      className="w-full h-full object-cover"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = 'none';
      }}
    />
  ) : (
    <div className="w-full h-full bg-gradient-to-r from-[#cfd9de] via-[#d5dde2] to-[#cfd9de]" />
  )}
</div>
```
- **Avatar Overlap**: Circular avatar overlaps the banner by $-50\%$ using `-mt-16 sm:-mt-20`.

### 5.2 Edit Profile Modal Preview (`ProfileView.tsx`)
- Container: `w-full aspect-[3/1] bg-[#cfd9de] relative overflow-hidden flex items-center justify-center`.
- Centered controls: Dark circular camera button (`bg-black/60 hover:bg-black/75`) to select an image, plus a remove button (`X`) when a custom banner is active.
- Overlapping avatar preview with camera icon at bottom left (`-mt-10 sm:-mt-12`).

### 5.3 Follower List Card View (`UserNetworkView.tsx`)
In the network directory (`/[username]/followers`, `/[username]/following`, `/[username]/oomfs`), switching to **Cards** mode renders tall mini-profile cards:
- Container: `block w-full aspect-[3/1] bg-[#cfd9de] relative overflow-hidden group/banner cursor-pointer`.
- Image: `w-full h-full object-cover group-hover/banner:scale-[1.02] transition-transform duration-300`.
- Overlapping Avatar: 80px circular avatar with `border-4 border-white` overlapping the bottom edge by $-50\%$ (`-mt-10 sm:-mt-12`).
- **No Cropping**: Because the card container uses the identical `aspect-[3/1]` ratio as the 1500×500 image, 100% of the banner artwork is displayed with zero top or bottom cropping.

---

## 6. Default Fallback Aesthetic

When a user has not uploaded a header banner:
- **Color Token**: Flat neutral slate `#cfd9de` (matching Twitter Web Light theme).
- **Subtle Wash**: `bg-gradient-to-r from-[#cfd9de] via-[#d5dde2] to-[#cfd9de]` to provide depth without distracting neon hues.
- **Error Suppression**: All banner `<img>` elements feature `onError={(e) => { e.currentTarget.style.display = 'none'; }}` so broken or inaccessible third-party URLs cleanly fall back to the neutral slate placeholder.

---

## 7. Agent Onboarding Checklist & Gotchas

When maintaining or extending banner functionality:

- [ ] **Always Use `aspect-[3/1]`**: Never substitute fixed heights like `h-28` or `h-32` on banner containers. Banners are strictly $3:1$ ($1500 \times 500\text{px}$); fixed heights distort the aspect ratio and cause vertical cropping on wide displays.
- [ ] **Preserve Bounded Pan Limits**: When modifying `BannerCropModal.tsx`, ensure `clampPan` continues to account for current zoom level to avoid exposing empty container areas.
- [ ] **Synchronize Schema Migrations**: When deploying to new Supabase instances, run both [`supabase_banners_storage.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/supabase_banners_storage.sql) and [`supabase_profile_columns.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/supabase_profile_columns.sql).
- [ ] **Check OAuth Banner Extraction**: Twitter OAuth callbacks in [`src/app/auth/callback/route.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/app/auth/callback/route.ts) preserve `profile_banner_url` when present in the v2 user payload.
