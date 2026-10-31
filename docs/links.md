# Links System & External Account Portal (`links.md`)

This document defines the complete architecture, rendering pipeline, 3D Canvas engine, component hierarchy, platform registry, and creation workflows for the **Links System** on `oomfs.org`.

---

## 1. Overview & Core Philosophy

The **Links** tab functions as a high-performance, Twitter-native alternative to Linktree, designed specifically for creators, gamers, artists, and digital natives:

1. **Clear Separation of Concerns**:
   - **`Posts` & `Presets`**: Content-focused timeline, curated feed playlists, and post lenses.
   - **`Links`**: Identity-focused portal for personal accounts, destinations, and communities (e.g. Discord, Twitch, Steam, YouTube, 𝕏, GitHub, Spotify, Instagram, TikTok, Patreon, OnlyFans, Substack, Fansly, pixiv).
2. **Borderless 3-Column Scrollable Grid**:
   - Renders inside the standard 600px center feed column as a responsive 3-column scrollable grid (`grid-cols-3 gap-3`).
   - Clean visual hierarchy: High-DPI 3D animated icon above (`w-16 h-16 sm:w-20 sm:h-20`), with title alone below (`text-xs sm:text-[13px] font-bold text-[#0f1419]`).
   - Clicking any card opens the destination link in a new tab (`target="_blank" rel="noopener noreferrer"`).
3. **Pure Code-Based 3D Canvas Icons**:
   - Zero raster GIFs or heavy video files. All 16 icons are synthesized in real-time on HTML5 `<canvas>` elements at native display refresh rates (60fps) with full HiDPI retina resolution (`window.devicePixelRatio`).
4. **Universal Clean Silhouette Standard**:
   - All icons render clean physical silhouettes with dynamic contact floor shadows and subtle radial aura glows.
   - **Universal Rule**: Zero outer boundary rings and zero squashed base orbit rings across all platform components.
5. **Physical 360° Double-Sided Perspective**:
   - Every emblem rotates continuously through 360° with true physical double-sided rendering.
   - Past 180°, front and rear caps flip laterally according to real-world physics (e.g., YouTube play arrow points left, Twitch tail points right, steam flywheel on opposite side) with rear-facing specular lighting.
   - Continuous scale mapping down to `0.0005` prevents matrix singularities and eliminates 1-frame flip or teleport glitches.

---

## 2. Directory Hierarchy & Core Files

```
src/app/[username]/
└── links/
    ├── page.tsx                    # Dedicated server route: Resolves profile and renders LinksPortal
    └── [slug]/
        └── page.tsx                # Backward-compatibility redirect ensuring bookmarks never 404

src/components/links/
├── LinksPortal.tsx                 # 3-column grid portal, platform registry, 2-step modal
├── LoopingGlobeIcon.tsx            # 3D Canvas infinite looping network globe icon (universal fallback)
├── LoopingDiscordIcon.tsx          # 3D Canvas extruded Discord Clyde mascot figurine
├── LoopingXIcon.tsx                # 3D Canvas extruded 𝕏 monogram prism figurine
├── LoopingYouTubeIcon.tsx          # 3D Canvas extruded YouTube crimson screen badge token
├── LoopingTwitchIcon.tsx           # 3D Canvas extruded Twitch Glitch chat mascot figurine
├── LoopingSteamIcon.tsx            # 3D Canvas extruded Steam locomotive linkage medallion token
├── LoopingSpotifyIcon.tsx          # 3D Canvas extruded Spotify vinyl disc & soundwave token
├── LoopingRedditIcon.tsx           # 3D Canvas extruded Reddit Snoo mascot coin token
├── LoopingGitHubIcon.tsx           # 3D Canvas extruded GitHub Invertocat dark coin token
├── LoopingInstagramIcon.tsx         # 3D Canvas extruded Instagram sunset squircle badge token
├── LoopingTikTokIcon.tsx            # 3D Canvas extruded TikTok chromatic glitch note coin token
├── LoopingPatreonIcon.tsx           # 3D Canvas extruded Patreon coral crest token
├── LoopingOnlyFansIcon.tsx          # 3D Canvas extruded OnlyFans dual-tone cyan donut & wing figurine
├── LoopingSubstackIcon.tsx          # 3D Canvas extruded Substack radiant orange bookmark token
├── LoopingFanslyIcon.tsx            # 3D Canvas extruded Fansly azure ribbon heart figurine
├── LoopingPixivIcon.tsx             # 3D Canvas extruded pixiv radiant azure squircle token with white "p"

src/components/profile/
└── ProfileView.tsx                 # Embeds LinksPortal within the 5-tab profile navigation
```

### Route Resolution

| Route | View Rendered | Purpose |
| :--- | :--- | :--- |
| `/[username]/links` | Dedicated Links Route | Direct link-in-bio URL for social profiles (`oomfs.org/user/links`). |
| `/[username]` (Tab: Links) | In-situ profile Links tab | In-profile tab switch without leaving the primary profile shell. |
| `/[username]/links/[slug]` | Redirects to `/[username]/links` | Backward-compatibility redirect ensuring bookmarks never 404. |

---

## 3. 3D Canvas Rendering Engine Architecture

Each 3D looping icon follows a standardized, highly optimized mathematical rendering architecture built on HTML5 Canvas 2D.

### A. HiDPI Retina Initialization
Canvases initialize with physical pixel backing proportional to device pixel ratio:
```ts
const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;
canvas.width = size * dpr;
canvas.height = size * dpr;
// In render loop:
ctx.scale(dpr, dpr);
```

### B. Trigonometric Projection & Perspective Tilt
Rotation angle $\theta$ increments at $\approx 0.024\text{ rad/frame}$ ($\approx 3.4\text{s}$ full revolution). Perspective forward tilt is standardized at $\approx 12.5^\circ$ ($\text{tiltX} = 0.22\text{ rad}$):
```ts
const tiltX = 0.22;
const cosAngle = Math.cos(angle);
const sinAngle = Math.sin(angle);
```

### C. Volumetric Micro-Extrusion Slicing
Depth is achieved through dense layer slicing ($24\text{ to }28\text{ slices}$) sorted back-to-front in camera space:
```ts
const isFacingFront = cosAngle >= 0;
const sliceIndices: number[] = [];
for (let i = 0; i < numSlices; i++) sliceIndices.push(i);
if (!isFacingFront) sliceIndices.reverse();

for (let idx = 0; idx < sliceIndices.length; idx++) {
  const i = sliceIndices[idx];
  const isTopFace = (idx === sliceIndices.length - 1);
  const normZ = (i / (numSlices - 1)) - 0.5;
  const localZ = normZ * thickness;

  const offsetX = localZ * sinAngle;
  const offsetY = -localZ * cosAngle * Math.sin(tiltX) - 1.5;

  ctx.save();
  ctx.translate(cx + offsetX, cy + offsetY);
```

### D. Continuous Perspective Scale Mapping (Edge-On Continuity)
To prevent singular transformation matrices while eliminating 1-frame discontinuous flip/teleport glitches when an object passes $90^\circ$ or $270^\circ$, `safeScaleX` is clamped strictly near absolute zero:
```ts
const rawScaleX = cosAngle * scale;
const safeScaleX = Math.abs(rawScaleX) < 0.0005 
  ? (rawScaleX < 0 ? -0.0005 : 0.0005) 
  : rawScaleX;
const scaleY = scale * Math.cos(tiltX);
ctx.scale(safeScaleX, scaleY);
```

### E. Directional Lighting & Rim Wall Shading
Intermediate slices (the extruded 3D rim wall) receive dynamic directional light:
```ts
const sideLightDot = sinAngle * 0.7 + 0.3;
const rimShade = Math.max(0.4, Math.min(1.15, 0.65 + sideLightDot * 0.45));
const r = Math.round(baseR * rimShade);
const g = Math.round(baseG * rimShade);
const b = Math.round(baseB * rimShade);
ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
```

### F. Dynamic Floor Contact Shadow
A dynamic radial gradient shadow on the ground floor expands and squashes in sync with the rotating geometry:
```ts
const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
const shadowY = cy + R * 0.72;
const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.60);
shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.40)');
shadowGrad.addColorStop(0.5, brandShadowColor);
shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
ctx.fillStyle = shadowGrad;
ctx.beginPath();
ctx.ellipse(cx, shadowY, R * 0.56 * shadowBroadness, R * 0.14, 0, 0, Math.PI * 2);
ctx.fill();
```

---

## 4. 3D Icon Component Catalog & Archetypes

The 16 looping icons are grouped into three architectural design archetypes:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        3D ICON DESIGN ARCHETYPES                       │
├────────────────────────┬───────────────────────┬───────────────────────┤
│  A. Token / Medallion  │  B. Free Figurine     │  C. Network Globe     │
│  • Circular / squircle │  • Standalone contour │  • 3D wireframe mesh  │
│  • Embossed front/back │  • Zero disc / coin   │  • Pulsing nodes      │
│  • Beveled outer rim   │  • Centroid centered  │  • Universal fallback │
└────────────────────────┴───────────────────────┴───────────────────────┘
```

### Complete Component Catalog

| Platform | Component | Archetype | Brand Colors | Key 3D Features |
| :--- | :--- | :--- | :--- | :--- |
| **Globe** | `LoopingGlobeIcon` | Network Globe | `#1d9bf0` (Cyan) | Wireframe longitude & latitude rings, pulsing network nodes, high-speed equatorial rings. Universal default. |
| **Discord** | `LoopingDiscordIcon` | Free Figurine | `#5865F2` (Blurple) | Standalone extruded Clyde mascot with beveled horns, mirrored game controller contour, dual-sided eye cutouts. |
| **𝕏 / Twitter** | `LoopingXIcon` | Free Figurine | `#0f1419` / `#ffffff` | Monogram geometric prism extruded along oblique axis with mirrored diagonal facets. |
| **YouTube** | `LoopingYouTubeIcon` | Token / Badge | `#FF0000` (Crimson) | Curved television screen badge with raised white enamel play triangle pointing laterally. |
| **Twitch** | `LoopingTwitchIcon` | Free Figurine | `#9146FF` (Purple) | Standalone Glitch chat bubble with asymmetrical bottom-left tail, embossed twin vertical slit eyes. |
| **Steam** | `LoopingSteamIcon` | Token / Medallion | `#171a21` (Navy/Steel) | Steel medallion with embossed off-center flywheel, articulating linkage arm, and concentric drive pin. |
| **Spotify** | `LoopingSpotifyIcon` | Token / Medallion | `#1DB954` (Green) | Vinyl record coin with raised white concentric audio waves and subtle grooved disc sheen. |
| **Reddit** | `LoopingRedditIcon` | Token / Medallion | `#FF4500` (Orange-Red) | High-contrast token with raised Snoo alien face, orange antenna pom, and circular ear nubs. |
| **GitHub** | `LoopingGitHubIcon` | Token / Medallion | `#24292f` (Obsidian) | Obsidian token with embossed silver-white Invertocat silhouette (ears, whiskers, cat tail). |
| **Instagram** | `LoopingInstagramIcon` | Token / Squircle | Sunset Gradient | 5-color diagonal sunset squircle (`#feda75` $\rightarrow$ `#4f5bd5`) with raised enamel camera squircle, lens, and flash dot. |
| **TikTok** | `LoopingTikTokIcon` | Token / Medallion | `#000000` / Glitch | Dark graphite token with multi-layer chromatic aberration musical note (Electric Cyan `#25F4EE` & Magenta `#FE2C55`). |
| **Patreon** | `LoopingPatreonIcon` | Token / Medallion | `#FF424D` (Coral) | Coral vermillion token with raised solid white enamel pillar and circular orb crest. |
| **OnlyFans** | `LoopingOnlyFansIcon` | Free Figurine | `#00aeef` / `#008ccf` | Standalone dual-tone cyan donut ("O") with attached aerodynamic right wing ("F"). Centroid-anchored $(350, 278)$. |
| **Substack** | `LoopingSubstackIcon` | Token / Medallion | `#FF6719` (Orange) | Radiant orange token with raised solid white enamel triple-bar bookmark crest. |
| **Fansly** | `LoopingFanslyIcon` | Free Figurine | `#2799f6` (Azure Blue) | Standalone electric azure interlocking ribbon heart with center cutout pip. Centroid-anchored $(16.275, 13.505)$. |
| **pixiv** | `LoopingPixivIcon` | Token / Squircle | `#0096fa` (Electric Blue) | Radiant blue squircle badge with raised solid white enamel "p" monogram and inner circular cutout. |

---

## 5. Platform Registry & Taxonomy (`PLATFORM_REGISTRY`)

Defined in [`src/components/links/LinksPortal.tsx`](src/components/links/LinksPortal.tsx), the registry encompasses 35+ platforms organized into 7 key categories:

| Category | Platforms Included | Key Brand Colors | Default Action Labels |
| :--- | :--- | :--- | :--- |
| **Gaming** | Discord, Steam, Twitch, Xbox, PlayStation, Nintendo, Roblox, Epic Games, Battle.net, Riot Games, Chess | Discord `#5865F2`, Steam `#171a21`, Twitch `#9146FF`, Xbox `#107C10`, PlayStation `#003791` | `Join`, `Play`, `Watch` |
| **Social** | X / Twitter, Bluesky, Threads, Reddit, Instagram, Telegram, WhatsApp, Pinterest, LinkedIn | X `#0f1419`, Bluesky `#0285FF`, Reddit `#FF4500`, Instagram `#E4405F`, Telegram `#229ED9` | `Follow`, `Chat`, `Subscribe` |
| **Video & Streaming** | YouTube, TikTok, Kick | YouTube `#FF0000`, TikTok `#000000`, Kick `#53FC18` | `Watch`, `Subscribe` |
| **Music & Audio** | Spotify, Apple Music, SoundCloud, Bandcamp | Spotify `#1DB954`, SoundCloud `#FF5500`, Apple Music `#FA243C` | `Listen` |
| **Art & Creative** | pixiv, ArtStation, DeviantArt, Behance, Dribbble | pixiv `#0096fa`, ArtStation `#13AFF0`, Dribbble `#EA4C89` | `View`, `Portfolio`, `Illustrations` |
| **Support & Creator** | Patreon, OnlyFans, Fansly, Substack, Ko-fi, Buy Me a Coffee | Patreon `#FF424D`, OnlyFans `#00AFF0`, Fansly `#2799f6`, Substack `#FF6719`, Ko-fi `#FF5E5B` | `Support`, `Subscribe`, `Follow` |
| **Tech & Dev** | GitHub, Figma, Notion | GitHub `#24292e`, Figma `#F24E1E`, Notion `#000000` | `View`, `Repositories`, `Projects` |

### Registry Configuration Schema
Each registry entry implements `PlatformConfig`:
* `type`: Unique identifier matching `PlatformType` union (`discord`, `pixiv`, `onlyfans`, etc.).
* `name`: Clean display name.
* `categoryTag`: Categorical grouping tag for search and filtering.
* `defaultActionLabel`: Action pill text (`Follow`, `Watch`, `Listen`, `Support`).
* `defaultPlaceholderUrl`: Example URL structure.
* `badgeBg` & `badgeText`: Tailwind utility classes for category badges.
* `iconBg` & `iconText`: Styling classes for 2D icon chips.
* `borderColor`, `hoverBorder`, `hoverBg`: Dynamic border hover styling.
* `renderIcon`: Function returning the 2D SVG vector icon component (`<FanslyIcon />`, `<PixivIcon />`).

---

## 6. URL Auto-Detection Pipeline

The `detectPlatform(url: string, title?: string)` helper inspects pasted URLs or link titles to automatically assign the matching platform:

```ts
export function detectPlatform(url: string, title?: string): PlatformType {
  const lower = (url || '').toLowerCase();
  const lowerTitle = (title || '').toLowerCase();

  // Examples:
  if (lower.includes('pixiv.net') || lower.includes('fanbox.cc') || lowerTitle.includes('pixiv')) return 'pixiv';
  if (lower.includes('fansly.com') || lowerTitle.includes('fansly')) return 'fansly';
  if (lower.includes('onlyfans.com') || lowerTitle.includes('onlyfans')) return 'onlyfans';
  if (lower.includes('substack.com') || lowerTitle.includes('substack')) return 'substack';
  if (lower.includes('github.com') || lowerTitle.includes('github')) return 'github';
  // ...
  return 'custom';
}
```

---

## 7. 2-Step Creation & Editing Workflow

When a creator clicks **`+ Add Link`** (or the pencil edit button on an existing card):

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Select 3D Animated Icon (Responsive Grid)                      │
│ • Responsive 4-column grid (2 columns on mobile, 4 on desktop)         │
│ • Live 360° rotating Canvas icons in each card (size=52)               │
│ • Cards #1–#16 covering all platforms                                  │
│ • Tile #17: Upload Custom Photo tile                                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (select icon or upload photo)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Configure Details                                              │
│ • Active 3D Icon Preview Slot (size=48)                                │
│   ├── "Change icon" (returns to Step 1 grid)                           │
│   └── "Custom photo" (swaps directly to file picker)                   │
│ • Destination URL (with live platform auto-detection)                  │
│ • Card Title (rendered cleanly below icon in grid)                     │
│ • Save & Local Persistence                                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Custom Logo & Photo Engine

In addition to the 16 standard 3D animated platform icons, creators can upload bespoke graphics:
1. **Direct File Picker**: An *"Upload Photo"* tile in Step 1 allows selecting any local image file (`image/*`).
2. **Dynamic Step 2 Replacement**: Creators can click *"Custom photo"* at any point in Step 2 to swap the 3D animated canvas for an uploaded avatar or brand mark.
3. **Client-Side Data URL Pipeline**: Images are ingested via `FileReader.readAsDataURL` on the client and stored directly in the `customIcon` property of the `BioLink` record.
4. **Visual Consistency**: Custom images render inside the identical icon container slot with `rounded-2xl`, `object-cover`, and subtle shadow styling matching standard platform tiles.

---

## 9. Owner Controls & Local Persistence

When viewing one's own profile (`isSelf === true`):

1. **Header Action Bar**: Left-aligned **`+ Add Link`** action button anchored directly above the grid, matching the minimal geometry of the Presets owner bar.
2. **Card Reordering**: Each link card displays step arrows (`↑` / `↓`) to instantly move cards within the 3-column flow.
3. **Card Editing**: A pencil icon button opens the modal directly into Step 2 with existing values pre-populated.
4. **Card Deletion**: A delete button (`✕`) immediately removes the link card with optimistic UI update.
5. **Persistence Engine**:
   - Links synchronize in browser `localStorage` under the key `oomfs_profile_links_<userId>`.
   - On initial load, state hydrates from the profile's `bioLinks` array (or `MOCK_BIO_LINKS`), falling back to local storage cache for instant, zero-flicker rendering.
