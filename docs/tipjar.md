# Twin Coin System (`docs/tipjar.md`)

This document serves as the canonical technical reference for the permanent **Twin Coin** system on `oomfs.org`. It details the twin hero circle layout geometry, the fixed left-over-right layering specification, the borderless transparent container, and the temporary style testing modal architecture.

---

## 1. System Overview & Core Philosophy

On traditional social and Linktree profiles, creator funding is reduced to a generic link button or an awkward text counter (e.g. `0 tips`), generating a cold-start psychological barrier where visitors hesitate to be the first to tip.

On `oomfs.org`, creator support is elevated into the profile's primary visual identity as a **Twin Hero Circle** anchored directly beside the profile avatar:

1. **Twin Hero Stature ($A \leftrightarrow B$)**:
   * Circle 1 ($A$): The Creator's Profile Avatar.
   * Circle 2 ($B$): The Twin Coin Orbit (`TipCircle.tsx`).
   * Both share identical dimensions (`w-28 h-28 sm:w-36 sm:h-36`) and banner-crossing offset (`-mt-16 sm:-mt-20`).
2. **Transparent, Borderless Cluster**:
   * The container of the Twin Coin circle is completely transparent and borderless. There is no enclosing white background plate or artificial outer ring.
   * Between and around the two circular coins, the **profile banner (top half)** and the **white profile shelf (bottom half)** show through naturally across the seam.
3. **Permanent Foundation**:
   * All profiles feature the **Twin Coin format** as their core visual identity foundation.
   * Profiles render the clean, balanced twin coin signature as their visual creator currency.
4. **Default Coin Assets**:
   * **Left Coin (Slot 1)**: Amb Coin (`/ambcoin.png`)
   * **Right Coin (Slot 2)**: My Coin (`/My_Coin (1).png`)

```text
┌────────────────────────────────────────────────────────┐
│                   MAIN PROFILE BANNER                  │
│                                                        │
│   ╭──────────────╮               ╭─────╮               │
└───│──────────────│───────────────│─╮   │───────────────┘ (Banner bottom line)
    │              │               │ │ 🪙│                  [ Follow ]
    │   CREATOR    │  (gap-3)      ╰─│───╯
    │    AVATAR    │                 ╰───╯
    ╰──────────────╯          (Left Overlaps Right)
    Profile Avatar               Twin Coin Orbit
     (w-28 / w-36)                (w-28 / w-36)
            │                           │
            └─────────────┬─────────────┘
                          │
               Tap / Click Twin Coins
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│                   Interactive Modal                    │
│                 (SupporterModal.tsx)                   │
│   ├── Expanded Twin Coin Preview Arena                 │
│   ├── Layer Hierarchy Indicator (Left Overlaps Right)   │
│   ├── Slot 1 (Left Coin): Temp Image Uploader & Reset  │
│   ├── Slot 2 (Right Coin): Temp Image Uploader & Reset │
│   └── Session Style Testing (Zero Persistence)         │
└────────────────────────────────────────────────────────┘
```

---

## 2. Component Hierarchy & File Map

| File Path | Description |
| :--- | :--- |
| [`src/components/profile/TipCircle.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/TipCircle.tsx) | Twin circle component on the profile header, rendering the borderless, transparent twin coins with left-over-right layering. |
| [`src/components/profile/SupporterModal.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/SupporterModal.tsx) | Interactive testing studio featuring the expanded preview arena and dual coin slot temporary image uploaders. |
| [`src/lib/mockData.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/mockData.ts) | Canonical `DEFAULT_SUPPORTERS` pair (Amb Coin & My Coin) and profile supporter resolvers. |
| [`src/components/profile/ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx) | Header integration, avatar row flex wrapping geometry, and modal lifecycle state. |

---

## 3. Twin Coin Geometry & Layering Rules

The Twin Coin layout is mathematically precise, stable, and deterministic:

### 3.1 Mathematical Positioning & Diameter
* Container diameter: $100\%$ width and height of the circle component (`w-28 h-28 sm:w-36 sm:h-36`).
* Each coin has a diameter of **`63.4%`** relative to the container width.
* **Left Coin (Slot 1)**:
  * Horizontal Center ($x$): **`32.2%`**
  * Vertical Center ($y$): **`50.0%`**
  * Left Edge: $32.2\% - 31.7\% = 0.5\%$ (touching the outer left perimeter)
  * Right Edge: $32.2\% + 31.7\% = 63.9\%$
  * **Z-Index**: **`z-20` (Top Layer)**
* **Right Coin (Slot 2)**:
  * Horizontal Center ($x$): **`88.0%`** (shifted rightwards for a subtle overlap)
  * Vertical Center ($y$): **`50.0%`**
  * Left Edge: $88.0\% - 31.7\% = 56.3\%$
  * Right Edge: $88.0\% + 31.7\% = 119.7\%$
  * **Z-Index**: **`z-10` (Base Layer)**

### 3.2 Overlap Direction (Left Over Right, Very Slight Overlap)
* The distance between coin centers is $88.0\% - 32.2\% = 55.8\%$.
* Because the sum of both radii is $31.7\% + 31.7\% = 63.4\%$, there is a **subtle $7.6\%$ horizontal overlap zone** ($56.3\%$ to $63.9\%$), representing approximately $\sim 12\%$ of coin diameter.
* **Strict Rule**: The **Left Coin overlaps on top of the Right Coin**.
  * The Left Coin's circular boundary and subtle cast shadow (`shadow-sm`, `z-20`) rest cleanly on top of the Right Coin (`z-10`).
  * The Right Coin's leftmost rim is gently tucked underneath the Left Coin.
  * The outer circle container uses `overflow-visible` to allow the right coin to render fully without clipping.

---

## 4. Layout & Geometry Parity

* **Dimensions**:
  * Mobile ($375\text{px}$–$414\text{px}$): `w-28 h-28` ($112\text{px}$), `-mt-16` overlap into the header banner.
  * Desktop ($600\text{px}$ center column): `sm:w-36 sm:h-36` ($144\text{px}$), `sm:-mt-20` overlap into the header banner.
* **Seam Clearance**:
  * The top half of the circle overlaps the header banner; the bottom half rests on the white profile shelf.
* **Mobile Wrap Protection**:
  * The identity container in `ProfileView.tsx` uses `flex flex-wrap sm:flex-nowrap justify-between items-end pb-3 gap-y-3`. On narrow viewports ($<390\text{px}$), the action button wraps gracefully beneath the dual circles without clipping or horizontal overflow.
* **Permanent Black Outline**:
  * Both coins permanently display a clean black outline (`outline outline-1 outline-black`).
  * No secondary outline or color change on hover, maintaining stable 1:1 graphical presence.

---

## 5. Style Testing Modal (`SupporterModal.tsx`)

Tapping the profile Twin Coins launches the streamlined **Twin Coin Customizer** modal:

1. **Expanded Preview Arena**:
   * A large celestial orbit circle (`w-56 h-56 sm:w-64 sm:h-64`) rendering the exact left-over-right overlap with the permanent black outline.
   * Clicking either coin in the arena immediately opens the temporary file uploader for that slot.
2. **Dual Coin Slot Controls**:
   * **Slot 1 (Left Coin - Top Layer)**: Thumbnail preview, `TOP LAYER (z-20)` badge, upload button, and reset to Amb Coin action.
   * **Slot 2 (Right Coin - Base Layer)**: Thumbnail preview, `BASE LAYER (z-10)` badge, upload button, and reset to My Coin action.
3. **Session-Only Image Testing**:
   * Uploading a file (JPEG, PNG, SVG, WebP) converts the image client-side to a lightweight data URL via `compressImageFile()`.
   * **Live Profile Synchronization**: Updates the profile header twin coins immediately via `onScenarioChange([updatedLeft, updatedRight])`.
   * **Zero Persistence**: No database writes are made; the tester can freely experiment with iconography and visuals during design iterations.
4. **Reset Controls**:
   * Individual slot reset buttons and a global "Reset Both to Defaults" action to instantly restore the original Amb Coin and My Coin pair.
