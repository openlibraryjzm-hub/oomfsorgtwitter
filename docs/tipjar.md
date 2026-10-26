# Tip Circle & Supporter Constellation System (`docs/tipjar.md`)

This document serves as the canonical technical reference for the interactive **Tip Circle & Supporter Constellation** system on `oomfs.org`. It details the twin hero circle layout geometry, the organic physics-based circle packing engine, the autobalancing area slider sandbox, and the supporter modal architecture.

---

## 1. System Overview & Core Philosophy

On traditional social and Linktree profiles, creator funding is reduced to a generic link button or an awkward text counter (e.g. `0 tips`), generating a cold-start psychological barrier where visitors hesitate to be the first to tip.

On `oomfs.org`, creator support is elevated into the profile's primary visual identity as a **Twin Hero Circle** anchored directly beside the profile avatar:

1. **Twin Hero Stature ($A \leftrightarrow B$)**:
   * Circle 1 ($A$): The Creator's Profile Avatar.
   * Circle 2 ($B$): The Community Supporter Constellation (`TipCircle.tsx`).
   * Both share identical dimensions (`w-28 h-28 sm:w-36 sm:h-36`) and banner-crossing offset (`-mt-16 sm:-mt-20`).
2. **Transparent, Borderless Cluster**:
   * The container of the Tip Circle is completely transparent and borderless. There is no enclosing white ring or background plate.
   * Between the packed circular avatars, the **profile banner (top half)** and the **white profile shelf (bottom half)** show through naturally across the seam.
3. **Scale-Driven Hierarchy Without Forced Centering**:
   * Contribution amounts correlate directly to avatar area ($\text{Area} \propto \text{tip amount}$).
   * Avatars are not artificially pinned to $(50, 50)$ (which creates an awkward "donut ring" that starves medium supporters). Instead, positions are emergent: large supporters establish the macro structure and smaller supporters nestle into the natural crevices between them.
4. **Default Orbit (Twin Coins)**:
   * Across all profiles, the default orbit displays two coins at 50% size each: Amb Coin (`/ambcoin.png`) anchored on the left and My Coin (`/My_Coin (1).png`) anchored on the right.
   * If a profile has zero custom tips, this balanced twin coin constellation renders seamlessly as the default visual signature.

```text
┌────────────────────────────────────────────────────────┐
│                   MAIN PROFILE BANNER                  │
│                                                        │
│   ╭──────────────╮             ●    👑    ●            │
└───│──────────────│───────────●─────────────────────────┘ (Banner bottom line)
    │              │             ●    ●    ●                [ Follow ]
    │   CREATOR    │  (gap-3)       ●    ●
    │    AVATAR    │
    ╰──────────────╯          (Transparent Gaps)
    Profile Avatar             Supporter Constellation
     (w-28 / w-36)              (w-28 / w-36)
            │                         │
            └───────────┬─────────────┘
                        │
             Tap / Click Tip Circle
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│                   Interactive Modal                    │
│                 (SupporterModal.tsx)                   │
│   ├── Expanded Celestial Orbit Arena                   │
│   ├── Autobalancing Area Slider Sandbox                │
│   ├── Scenario Presets Switchboard                     │
│   ├── Supporter Inspector & Lore Notes Card            │
│   └── Primary Action: [ 🪙 Send Tip & Join Orbit ]     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Component Hierarchy & File Map

| File Path | Description |
| :--- | :--- |
| [`src/components/profile/TipCircle.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/TipCircle.tsx) | Twin circle component on the profile header, rendering the borderless, transparent constellation of packed supporter avatars. |
| [`src/components/profile/SupporterModal.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/SupporterModal.tsx) | Interactive modal featuring the expanded constellation arena, autobalancing area sliders, scenario switcher, and tip form. |
| [`src/lib/circlePacking.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/circlePacking.ts) | Organic circle packing engine: greedy tangential pocket placement, physics collision relaxation, and edge expansion. |
| [`src/lib/supporterPresets.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/supporterPresets.ts) | Registry of realistic avatar placeholders (`AVATAR_POOL`) and 6 preset test distributions. |
| [`src/lib/mockData.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/mockData.ts) | `Supporter` data model, per-user mock clusters, and resolver helpers. |
| [`src/components/profile/ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx) | Header integration, avatar row flex wrapping geometry, and modal lifecycle state. |

---

## 3. The Organic Circle-Packing Engine (`circlePacking.ts`)

The layout of avatars inside both the profile circle and modal arena is computed by a deterministic, physics-based circle packing engine:

### 3.1 Mathematical Area Model
* A circular disk has area $A = \pi R^2$. In 2D space, the maximum theoretical circle-packing limit is $\approx 83\%$ area density.
* Target radius for any avatar with relative area share $p_i \in (0, 100]$:
  $$r_i = \sqrt{\frac{p_i}{100} \cdot 0.83} \cdot R_{\text{container}}$$
* When an avatar's diameter doubles, its area increases by $4\times$ ($r^2$), visually reflecting generous patronage.

### 3.2 Four-Stage Packing Pipeline

1. **Largest-First Sorting**:
   Circles are sorted by size/amount descending. The largest circles are positioned first to establish the foundation.
2. **Greedy Tangential Pocket Placement**:
   For each incoming circle $C_i$, the engine tests all pairs of already-placed tangent circles $(C_j, C_k)$ and finds the candidate tangent pocket that:
   - Produces zero overlap with any existing circle.
   - Minimizes distance from the cluster center of mass.
3. **Multi-Pass Physics Relaxation**:
   Runs 65 iterations of separation physics:
   - **Collision Separation**: If distance $d_{ij} < r_i + r_j + \text{gap}$, circles push apart proportionally to their relative sizes.
   - **Soft Central Gravity**: Applies a subtle inward gravitational pull towards $(50, 50)$ to prevent drifting.
   - **Boundary Confinement**: Clamps all circles to remain strictly within $R_{\text{container}}$.
4. **Outward Edge Expansion Pass**:
   The engine measures the maximum radial extent ($\max_i [d_i + r_i]$). If below $R_{\text{container}}$, it expands all coordinates and radii outward proportionally until the outermost circles are **literally tangent to the outer circle's edge**, maximizing space utilization.

---

## 4. Layout & Geometry Parity

* **Dimensions**:
  * Mobile ($375\text{px}$–$414\text{px}$): `w-28 h-28` ($112\text{px}$), `-mt-16` overlap into the header banner.
  * Desktop ($600\text{px}$ center column): `sm:w-36 sm:h-36` ($144\text{px}$), `sm:-mt-20` overlap into the header banner.
* **Seam Clearance**:
  * The top half of the circle overlaps the header banner; the bottom half rests on the white profile shelf.
* **Mobile Wrap Protection**:
  * The identity container in `ProfileView.tsx` uses `flex flex-wrap sm:flex-nowrap justify-between items-end pb-3 gap-y-3`. On narrow viewports ($<390\text{px}$), the action button (`Follow` / `Edit profile`) wraps gracefully beneath the dual circles without clipping or horizontal overflow.
* **Zero Size Jumping**:
  * Hovering or selecting individual avatars in either view does **not** enlarge or jump their size (`scale`).
  * Instead, interactive focus is conveyed via a clean **Twitter Blue (`#1d9bf0`) outline ring**, preserving stable geometric alignment.

---

## 5. Interactive Modal Capabilities (`SupporterModal.tsx`)

The modal offers two distinct operational modes via top-level tab controls:

### 5.1 Autobalancing Area Slider Sandbox (`activeTab === 'sandbox'`)
* **State Initialization**: Dynamically populates directly from the active profile supporters (`DEFAULT_SUPPORTERS`), defaulting to the twin coin pair (**Amb Coin** and **My Coin**) with sliders preset to an exact **50% area share** each. This guarantees 1:1 visual parity between the profile circle and the sandbox workspace.
* Displays a flat, clean list of active supporters with their avatar, display name, and handle (`@username`).
* Each person has an interactive **Area Percentage Slider** ($1\%–75\%$).
* **Proportional Autobalancing**: When any person's slider is moved, all other supporters' shares scale automatically so that the total area **always sums to exactly $100\%$**:
  $$p_j^{\text{new}} = p_j^{\text{old}} \cdot \frac{100 - p_k^{\text{new}}}{100 - p_k^{\text{old}}}$$
* Controls:
  * `+ Add Person`: Injects the next contributor from `AVATAR_POOL` and rebalances space.
  * `✕` Remove: Deletes a person and redistributes their area proportionally to the remaining group.
  * `Equalize All`: Resets all sliders to equal share ($100 \div N\%$).
  * Quick Count Pills: Instant presets for $3, 5, 8, 12,$ or $20$ supporters.
  * **Custom Temporary Image Upload**: Clicking any avatar in the slider list opens a file picker to upload a custom image for testing layouts in real-time (session-only, non-persisted).
* **Live Profile Sync**: Any slider movement updates the profile banner circle in real time via `onScenarioChange`. The packing engine computes twin radii as $r = \sqrt{0.5 \cdot 0.83} \cdot 49.2 \approx 31.69\%$, producing symmetrical centers at $x = 32.5\%$ and $x = 67.5\%$ on the $y = 50\%$ horizontal axis with natural soft-bubble overlap.

### 5.2 Scenario Presets Switchboard (`activeTab === 'presets'`)
Provides instant, 1-click test scenarios:
1. `🪙 Default Orbit (2)`: Default twin coin orbit featuring Amb Coin (left) and My Coin (right) at 50% area share each.
2. `🐳 Solo Whale (1 x $100)`: Single large patron filling $99\%$ of the circle edge-to-edge.
3. `⚖️ Balanced Orbit (6)`: Balanced distribution with 1 hero, 2 patrons, and 3 supporters.
4. `👑 Whales + Outer Swarm (20)`: 2 prominent whale patrons surrounded by an 18-supporter micro-cloud.
5. `🐝 Swarm of Small (25)`: High-density crowdfund swarm ($2–$5 tips) packed tightly.
6. `🤝 OOMFS Mutuals Ring (10)`: 10 verified mutual followers ($A \leftrightarrow B$).

### 5.3 Creator Support Form
* Preset tier buttons ($5, $10, $25, $50) and custom message input field.
* Submitting optimistically injects the visitor's avatar directly into the active orbit constellation with instant visual feedback.
