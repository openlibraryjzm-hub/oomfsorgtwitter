# 88×31 Web Badge System (`badges.md`)

This document defines the architecture, design principles, canvas compression engine, and presentation layers for early-web **88×31 button badges** across `oomfs.org`.

---

## 1. Overview & Cultural Philosophy

Web badges (also known as button badges, 88×31 micro-banners, or affiliate buttons) were a defining aesthetic of the late-1990s and early-2000s independent web. Websites, personal homepages, and webrings exchanged $88 \times 31$ pixel graphics to link to mutual friends, software, web standards, and personal projects.

On `oomfs.org`, 88×31 badges serve as:
1. **A Link-in-Bio Alternative**: Compact, high-density micro-links sitting directly above larger link cards.
2. **Personal Curation**: Visual flair representing mutual friends ("OOMFs"), affiliations, retro badges, or portfolio destinations.
3. **Gallery Presentation**: Bounded inside the 600px center timeline column on the profile **Links** tab without spilling into sidebars or cluttering standard text posts.

---

## 2. Universal Underneath Label Architecture

Early iterations of button badges often attempted to overlay text directly across the tiny $88 \times 31$ bitmap. On modern high-resolution screens, overlaying text, drop shadows, or frosted glass plaques over 2,728 physical pixels severely degrades both text legibility and background artwork.

`oomfs.org` employs a **Universal Underneath** layout across all badges:

```
┌─────────────────────────────────┐
│     88×31 Clickable Button      │  <-- Pure visual artwork or color gradient
└─────────────────────────────────┘
           Label Text                <-- High-contrast typography underneath
```

### Visual Specifications
* **Button Container**: Strict `w-[88px] h-[31px]` dimensions with `rounded-xs`, subtle border (`border border-black/20` to `border-black/30`), and light shadow (`shadow-xs`).
* **Underneath Label**: 
  - Rendered at `text-[10px]` (on profile wall) or `text-xs` (in composer preview & post card).
  - Semibold weight (`font-semibold`), secondary neutral color (`text-[#536471]`), smoothly transitioning to primary black (`text-[#0f1419]`) on parent hover.
  - Horizontally centered and truncated (`truncate w-full text-center`) to prevent horizontal spillover.
* **Optional Display**: Creators can disable the underneath label (`showText: false`) for authentic retro buttons that already contain pixel lettering within the graphic.

---

## 3. Tri-Mode Creation (`PostComposer.tsx`)

Badges can be authored in one of three modes via a segmented pill switcher:

### Mode 1: Color Badges (`badgeType: 'custom'`)
For creators who want an immediate, clean, branded button without preparing an external image file:
* **Palette Swatches**: Single-row quick picker of popular curated hues (Twitter Blue, Coral Red, Cyber Yellow, Emerald Green, Indigo Purple, Hot Pink, Pure Charcoal).
* **Spectrum Color Wheel**: Conic gradient color picker input enabling any custom hex value.
* **Dynamic Style Engine**:
  - `Angle` (Default): 135° diagonal linear gradient blending the base hue with a lighter tint (`linear-gradient(135deg, ${base} 0%, ${tint} 100%)`).
  - `Solid`: Flat pure color (`${base}`).
  - `Sheen`: Top-to-bottom glossy sheen (`linear-gradient(180deg, ${highlight} 0%, ${base} 55%, ${shadow} 100%)`).
  - `Glow`: Radial center luminous glow (`radial-gradient(circle at 50% 30%, ${glow} 0%, ${base} 85%)`).

### Mode 2: Image Badges (`badgeType: 'image'`)
For creators uploading authentic pixel art, vintage buttons, or custom graphics:
* **File Upload**: Native file input accepting standard image formats (`image/*`).
* **Instant Thumbnail Status**: Shows an 11×4 preview with replacement and removal actions.

### Mode 3: OOMF Avatar Badges (`badgeType: 'avatar'`)
For creators wanting to feature mutual friends, collaborators, and followed accounts as circular badges of honor:
* **Visual Geometry**: Rendered as a $52\text{px} \times 52\text{px}$ circular avatar (`rounded-full border border-black/15 shadow-2xs hover:scale-105 transition-all`) inside the standard $88\text{px}$ column wrapper.
* **In-Composer OOMF Picker**: Features a dedicated `[ 👥 Browse OOMFs ]` button opening `SelectOomfModal.tsx`. Creators can search by name or `@username` across mutual OOMFs and followed accounts, automatically populating avatar art, profile URL (`/[username]`), and `@handle` label.
* **Model B Grid Interoperability**: Because the column wrapper is identically $88\text{px}$, circular avatar badges and rectangular $88 \times 31$ buttons can sit together in any order within the same badge plaque and be reordered via drag-and-drop.

---

## 4. HiDPI Canvas & Compression Pipeline (`compressBadgeImage`)

Standard 88×31 bitmaps suffer from severe blurriness when scaled across modern Retina and high-DPI displays (MacBooks, iPhones, 4K monitors) where the Device Pixel Ratio (DPR) is $2\times$ or $3\times$. Furthermore, JPEG encoding at micro-dimensions creates noticeable $8 \times 8$ discrete cosine transform (DCT) ringing artifacts.

To eliminate blurriness and compression noise, `compressBadgeImage(file)` implements a specialized client-side processing pipeline:

```
[Uploaded Image File]
        │
        ▼
1. Source Dimensional Check
   ├─ Exact 88×31 Retro Graphic? ──► Keep raw pixels 1:1, disable smoothing
   └─ High-Res Photo / Logo? ──────► Scale to 3× HiDPI (264×93px)
        │
        ▼
2. Aspect-Ratio Preserving Center Crop
   - Target Ratio: 88 / 31 (≈ 2.8387)
   - Computes source offsets (sx, sy, sWidth, sHeight) preserving center focal area
        │
        ▼
3. HTML5 Canvas Resampling
   - Canvas Dimensions: 264px × 93px (or 88px × 31px for exact retro assets)
   - Smoothing: ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
        │
        ▼
4. Luminance Sampling
   - Samples pixel data using standard relative luminance:
     Y = 0.2126*R + 0.7152*G + 0.0722*B
   - Computes average luminance across all pixels to set isLight flag
        │
        ▼
5. Lossless PNG Encoding
   - canvas.toDataURL('image/png')
   - Generates compact base64 payload (~8–14 KB)
   - Zero JPEG block artifacts, crisp edge contrast
```

### Display Rendering
Browsers display the resulting $264 \times 93$ PNG inside `w-[88px] h-[31px]` CSS boxes using standard bicubic downsampling, rendering sharp, Retina-grade buttons on any display.

---

## 5. Presentation Surfaces

### 1. The Badge Wall (`ProfileView.tsx`)
On the profile page under the **3. Links** tab, badges are filtered out of the timeline and grouped into a dedicated **Badge Wall**:
* **Layout Geometry**: Sits flush at the top of the Links tab above larger bio link cards. Uses `flex flex-wrap gap-3 items-start justify-start`.
* **Gallery Unit**: Each badge occupies an 88px wide column:
  ```tsx
  <div className="relative group/badge-item flex flex-col items-center w-[88px] gap-1 shrink-0">
    <a href={b.url} className="block w-[88px] h-[31px] shrink-0 rounded-xs overflow-hidden border border-black/25 shadow-xs hover:scale-105 active:scale-95 transition-all">
      {/* 88x31 visual button */}
    </a>
    {b.showText !== false && (
      <span className="text-[10px] font-semibold text-[#536471] group-hover/badge-item:text-[#0f1419] text-center truncate w-full leading-tight transition-colors">
        {b.label || b.title}
      </span>
    )}
  </div>
  ```
* **Owner Controls**: Profile owners hovering over any badge see a top-right `×` delete action that removes the block and dispatches real-time state updates.

### 2. Timeline Card (`PostCard.tsx`)
When a badge post is shared directly or viewed on a standalone permalink (`/[username]/status/[id]`):
* The $88 \times 31$ button renders flush within the timeline post body.
* The label underneath displays alongside a bullet separator and the clickable destination domain (`text-[#1d9bf0] font-mono text-[11px] hover:underline`).

---

## 6. Data Model (`BadgeData`)

Stored inside `public.blocks.content.badgeData` (JSONB) in Supabase:

```typescript
export interface BadgeData {
  title: string;              // Fallback title / accessibility text
  url: string;                // Outbound destination URL (e.g., https://amberlyn.design or /username)
  badgeType: 'image' | 'custom' | 'avatar';
  imageUrl?: string;          // 3x HiDPI PNG base64 data URL or external avatar URL
  label?: string;             // Text displayed underneath the badge
  bgColor?: string;           // CSS background property (color or gradient)
  showText?: boolean;         // Whether to render the label underneath (defaults to true)
  targetUsername?: string;    // Username for avatar badges
  pageId?: string;            // Link page destination (main or custom slug)
}
```

*For complete layout clustering and Model B reordering on link pages, see [Link Pages Documentation](links.md).*
