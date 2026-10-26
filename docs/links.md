# Links System & External Account Portal (`links.md`)

This document defines the architecture, routing, component hierarchy, platform registry, and creation workflows for the **Links System** on `oomfs.org`.

---

## 1. Overview & Core Philosophy

The **Links** tab functions as a modern, Twitter-native alternative to Linktree, designed specifically for creators, gamers, artists, and digital natives:

1. **Clear Separation of Concerns**:
   - **`Posts` & `Presets`**: Content-focused timeline, curated feed playlists, and post lenses (e.g. a curated collection of your top 15 Reddit posts or design moodboards).
   - **`Links`**: Identity-focused portal for your **own accounts and destinations** (e.g. your Discord server, Twitch stream, Steam profile, YouTube channel, X handle, GitHub, Spotify).
2. **Vertical Stack Format**: Replaces cluttered grid consoles with a sleek, readable vertical stack of branded link cards with hover micro-interactions, custom brand accents, and outbound visit action pills.
3. **Dense 35+ Platform Registry**: Built-in vector SVG brand icons, distinct brand color accents, and auto-detection across gaming, streaming, music, art, and developer services.
4. **Custom Logo & Image Engine**: Allows creators to upload custom photo icons (via client-side data URLs) for bespoke destinations, custom communities, or unique personal branding.

---

## 2. Route Hierarchy & Component Structure

```
src/app/[username]/
└── links/
    ├── page.tsx            # Dedicated server route: Resolves profile and renders the Links Portal
    └── [slug]/
        └── page.tsx        # Backward-compatibility redirect ensuring bookmarks never 404

src/components/links/
└── LinksPortal.tsx         # Complete Linktree-style vertical portal, 35+ platform registry, 2-step modal, & reordering

src/components/profile/
└── ProfileView.tsx         # Embeds LinksPortal within the 5-tab profile navigation
```

### URL Structure & Resolution

| Route | View Rendered | Purpose |
| :--- | :--- | :--- |
| `/[username]/links` | Dedicated Links Route | Direct link-in-bio URL for social profiles (`oomfs.org/user/links`). |
| `/[username]` (Tab: Links) | In-situ profile Links tab | In-profile tab switch without leaving the primary profile shell. |
| `/[username]/links/[slug]` | Redirects to `/[username]/links` | Backward-compatibility redirect ensuring bookmarks never 404. |

---

## 3. Platform Registry (`PLATFORM_REGISTRY`)

Defined in [`src/components/links/LinksPortal.tsx`](src/components/links/LinksPortal.tsx), the registry encompasses 35+ platforms organized into 7 key categories:

| Category | Platforms Included | Key Brand Colors | Default Action Labels |
| :--- | :--- | :--- | :--- |
| **Gaming** | Discord, Steam, Twitch, Xbox, PlayStation, Nintendo, Roblox, Epic Games, Battle.net, Riot Games | Discord `#5865F2`, Steam `#171a21`, Twitch `#9146FF`, Xbox `#107C10`, PlayStation `#003791` | `Join`, `Play`, `Watch` |
| **Social** | X / Twitter, Bluesky, Mastodon, Threads, Reddit, Telegram, Tumblr | X `#0f1419`, Bluesky `#0285FF`, Reddit `#FF4500`, Telegram `#229ED9` | `Follow`, `Chat`, `Subscribe` |
| **Video & Streaming** | YouTube, TikTok, Kick | YouTube `#FF0000`, Kick `#53FC18` | `Watch`, `Subscribe` |
| **Music & Audio** | Spotify, Apple Music, SoundCloud | Spotify `#1DB954`, SoundCloud `#FF5500` | `Listen` |
| **Art & Portfolio** | Instagram, Pinterest, ArtStation, Behance, Dribbble | Instagram `#E4405F`, ArtStation `#13AFF0`, Dribbble `#EA4C89` | `View`, `Portfolio` |
| **Support & Monetization** | Patreon, Ko-fi, Buy Me a Coffee, PayPal | Patreon `#FF424D`, Ko-fi `#FF5E5B`, PayPal `#00457C` | `Support`, `Donate`, `Tip` |
| **Tech & Dev** | GitHub, LinkedIn | GitHub `#24292e`, LinkedIn `#0A66C2` | `View`, `Connect` |

Each registry entry specifies:
* `id`: Unique platform identifier (`discord`, `twitch`, `steam`, `x`, etc.).
* `name`: Clean display name.
* `category`: Categorical tag for search filtering.
* `color`: Hex brand color accent.
* `domain`: Base domain pattern for auto-detection (e.g. `discord.gg`, `twitch.tv`).
* `actionLabel`: Default action pill text (`Join`, `Watch`, `Follow`, `Listen`, `Support`).
* `svg`: Direct inline SVG `<path>` data for pixel-crisp vector rendering.

---

## 4. Custom Logo & Image Engine

In addition to standard brand logos, creators can use bespoke graphics:
1. **Direct File Picker**: An "Upload Custom Logo/Image" featured tile in Step 1 allows uploading local image files (`image/*`).
2. **Dynamic Step 2 Replacement**: Creators who select a standard platform logo can click "Custom photo" at any point in Step 2 to swap the vector logo for a custom avatar or project icon.
3. **Data URL Pipeline**: Images are read using `FileReader.readAsDataURL` on the client and stored directly in `customIcon` on the `BioLink` record.
4. **Rendering Parity**: Custom images are rendered within the same 44×44px rounded avatar slot, with `object-cover` and rounded-xl styling matching standard platform badges.

---

## 5. 2-Step Creation & Editing Workflow

When a creator clicks **`+ Add Link`** (or clicks the pencil edit icon on an existing card):

```
┌────────────────────────────────────────────────────────┐
│ Step 1: Select Platform or Custom Logo                 │
│ • Live search input (filters across all 35+ platforms) │
│ • Featured "Upload Custom Logo/Image" tile             │
│ • Super-dense 6-column vector logo grid                │
└───────────────────────────┬────────────────────────────┘
                            │ (select platform or upload)
                            ▼
┌────────────────────────────────────────────────────────┐
│ Step 2: Configure Details                              │
│ • Active Logo Preview Slot                             │
│   ├── "Change logo" (returns to Step 1)                │
│   └── "Custom photo" (swaps to uploaded image)         │
│ • Destination URL (with auto-detect domain matching)   │
│ • Title (e.g. "Community Discord", "Twitch Stream")    │
│ • Subtitle / Description                               │
│ • Action Pill Label (e.g. "Join", "Watch", "Play")     │
│ • Save & Persistence                                   │
└────────────────────────────────────────────────────────┘
```

### URL Auto-Detection
Typing or pasting a destination URL in Step 2 automatically parses the domain:
- If a matching platform is recognized (e.g. `https://discord.gg/my-community`), the platform's brand accent, logo, default title, and action label are automatically applied unless already customized by the user.

---

## 6. Owner Controls & Local Persistence

When viewing one's own profile (`isSelf === true`):

1. **Header Action Bar**: Left-aligned **`+ Add Link`** action button anchored directly above the vertical stack, matching the minimal geometry of the Presets tab owner bar. (For visitors, the tab renders directly into the link card stack with zero header prompt clutter).
2. **Card Reordering**: Each link card displays step arrows (`↑` / `↓`) to instantly move cards up or down in the vertical stack.
3. **Card Editing**: A pencil icon button opens the modal directly into Step 2 with existing values pre-populated.
4. **Card Deletion**: A delete button (`✕`) immediately removes the link card with optimistic UI update.
5. **Persistence**:
   - Links synchronize in browser `localStorage` under the key `oomfs_profile_links_<userId>`.
   - On initial load, state seamlessly hydrates from the profile's `bioLinks` array (or `MOCK_BIO_LINKS`), falling back to local storage cache for instant, zero-flicker rendering.
