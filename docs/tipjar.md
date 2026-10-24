# Glass Tip Jar System (`docs/tipjar.md`)

This document serves as the canonical technical reference for the interactive **Glass Tip Jar** system on `oomfs.org`. It details the visual physics, the staggered banner crossing geometry, the 3-coin seed trinity, the alt account overwrite architecture, and creator support mechanics.

---

## 1. System Overview & Core Philosophy

On traditional social and Linktree profiles, tipping is reduced to a sterile generic button or an awkward text counter (e.g., `0 tips`), which creates a cold-start psychological barrier where creators feel unpatronized and visitors hesitate to be the first to tip.

On `oomfs.org`, tipping is reimagined as a **physical, gamified glass jar** resting on the profile shelf:

1. **Physicality & Delight**: Tippers' avatars are immortalized as circular coins/cookies stacked inside a translucent glass jar with realistic light refractions.
2. **The Barista Seed Tradition**: Baristas and buskers never leave their jar empty because social proof shows people avoid empty containers. Every jar on `oomfs.org` starts with a foundational **3-coin starter stack**, ensuring no creator ever displays an empty jar.
3. **Alt Account Synergy**: Creators can overwrite default starter coins with their **secondary/alt accounts** (`@art_wip`, `@priv`), turning the jar into an instant portal for multi-account discovery without cluttering bio text.

```text
┌────────────────────────────────────────────────────────┐
│                   Profile Header View                  │
│   ├── Banner Crossing: Cork stopper crosses by ~18px   │
│   ├── Glass Body: Rests on white profile shelf         │
│   └── Base: 3-Coin Starter Stack (Gold, Silver, Bronze)│
└───────────────────────────┬────────────────────────────┘
                            │
               Tap / Click Glass Tip Jar
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Interactive Modal                    │
│                 (TipJarModal.tsx)                      │
│   ├── Enlarged Glass Jar Showcase                      │
│   ├── Coin Selector: House Tip / Guilder / Lucky Penny │
│   ├── Lore Details Card & Attribution                  │
│   └── Primary Action: [ 🪙 Drop a Tip for @username ]   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Component Hierarchy & File Map

| File Path | Description |
| :--- | :--- |
| [`src/components/profile/TipJar.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/TipJar.tsx) | Micro glass jar renderer with cork coin slot, glass glare highlights, and 3-coin starter cluster. |
| [`src/components/profile/TipJarModal.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/TipJarModal.tsx) | Interactive enlarged jar inspection modal with coin selector, lore details card, and drop tip portal. |
| [`src/components/profile/ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx) | Avatar row integration, staggered banner crossing geometry, and modal lifecycle state. |
| [`docs/profile-page.md`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/docs/profile-page.md) | Profile architecture reference documenting the removal of raw text counters in favor of the Tip Jar. |

---

## 3. Staggered Banner Crossing Geometry

To make the profile header feel like a physical desk or shelf, items in the identity row use a **staggered vertical depth hierarchy**:

```text
┌────────────────────────────────────────────────────────┐
│                      MAIN BANNER                       │
│                   ╭───╮ (Cork/Lid crosses by ~16-20px) │
└───────────────────│───│────────────────────────────────┘ (Banner bottom line)
  ╭──────────╮      │ 🏺│
  │  AVATAR  │      │   │            [ Ask! ]  [ Follow ]
  ╰──────────╯      ╰───╯
  (Crosses 64px)  (Crosses 18px)     (Baseline 0px)
```

### 3.1 Mathematical Clearance
* **Avatar Overlap**: High overlap (`-mt-16 sm:-mt-20` $\approx 64\text{px}$–$80\text{px}$ crossing), serving as the anchor hero element.
* **Tip Jar Overlap**: Subtle overlap (`-mt-4 sm:-mt-5` $\approx 16\text{px}$–$20\text{px}$ crossing). The cork stopper and coin slot rest on the banner, while the curved glass base rests on the white profile background.
* **Action Buttons**: Flush with the bottom baseline ($0\text{px}$ overlap, `mb-2`).

### 3.2 Responsive Sizing
* **Mobile ($375\text{px}$–$414\text{px}$)**: Width `w-10` ($40\text{px}$), Height `h-14` ($56\text{px}$). Fits comfortably beside the avatar without squeezing `"Ask!"` and `"Follow"` buttons.
* **Desktop ($600\text{px}$ center column)**: Width `sm:w-12` ($48\text{px}$), Height `sm:h-16` ($64\text{px}$).

---

## 4. The 3-Coin Starter Trinity Stack

Assuming a user does not have an alt account configured on Day 1, the jar automatically renders the **Default Metallic Trinity (Gold, Silver, Copper)**:

```text
       ┌───────────┐
       │   CORK    │
   ┌───┴───────────┴───┐
   │                   │
   │    (Open Glass    │  <-- Clear space for incoming
   │    for Tippers)   │      supporter avatars
   │                   │
   │     ╭───────╮     │
   │     │ 🐱 1  │     │  <-- Coin 1: The House Tip (Gold)
   │ ╭───┴───╮ ╭─┴───╮ │
   │ │ 🤝 2  │ │ ★ 3 │ │  <-- Coin 2: Mutual Guilder (Silver) & Coin 3: Lucky Penny (Copper)
   └──┴──────┴─┴─────┴─┘
```

### 4.1 Coin 1: The "House Tip" (Gold) — *Platform Lore*
* **Visual**: Polished yellow gold coin with engraved `oomfs.org` Shushing Cat mascot face (`CatShushIcon`) and `✦` sparkles.
* **The Lore**: Every new citizen of `oomfs.org` receives a \$1 house tip to guarantee they never face an empty jar.
* **Message**:
  > *"Here's $1 on the house to get your jar rolling. Every great citizen starts with a foundation coin from the house!"*

### 4.2 Coin 2: The "Mutual Guilder" (Silver) — *Friendship Lore*
* **Visual**: Gleaming silver coin embossed with bidirectional mutual arrows ($A \leftrightarrow B$) and `"OOMF"` micro-text.
* **The Lore**: Minted in celebration of mutual followers and reciprocal friendship on X and `oomfs.org`.
* **Message**:
  > *"Minted in honor of OOMFs everywhere. Two accounts following each other create an unbreakable bond. Follow back to earn the badge!"*

### 4.3 Coin 3: The "Lucky Penny" (Copper / Bronze) — *Folklore Anchor*
* **Visual**: Warm antiqued copper coin with a milled border, stamped with retro star `★` and `1¢`.
* **The Lore**: The ancient superstition (*"Find a penny, pick it up, all day long you'll have good luck"*).
* **Message**:
  > *"Find a penny, pick it up, all day long you'll have good luck. Never leave a jar empty—this penny ensures endless good fortune."*

---

## 5. Alt Account Overwrite Architecture

In Twitter/X culture, creators frequently maintain secondary accounts (sketch accounts, private accounts, gaming alts). 

### Overwrite Rules:
1. Profile owners can link secondary handles in their profile settings.
2. Linking an alt inserts that account's **400×400 HD avatar** into one of the 3 starter coin slots.
3. Tapping an alt coin inside [`TipJarModal.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/TipJarModal.tsx) displays:
   * Alt display name & handle (`@username_alt`).
   * Custom label (e.g., *"My Sketch Dump"* or *"Personal Alt"*).
   * Direct 1-click navigation link to that profile.

---

## 6. Future Tipping Pipeline & Roadmap

1. **Supporter Avatar Stacking**:
   * As incoming tips arrive, supporters' avatars are drawn as circular coins dropped through the cork slot.
   * Coin sizing scales with tip tiers:
     * Small Tip (\$1–\$5): Standard $14\text{px}$ avatar coin.
     * Large Tip (\$10+): $20\text{px}$ avatar coin with a shimmering gold border.
2. **Payment Integrations**:
   * Direct creator payout routing via Stripe Connect, Web3 / Solana wallets, or Lightning network.
