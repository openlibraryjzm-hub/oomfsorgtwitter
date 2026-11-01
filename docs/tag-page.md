# Dedicated Hashtag Page Architecture (`docs/tag-page.md`)

This document serves as the canonical technical reference for dedicated hashtag pages (`oomfs.org/hashtag/[tag]`) on `oomfs.org`. It details the routing hierarchy, normalization engine, hero presentation, creator query architecture, dual-tab design (`Creators` & `Posts`), integrated post/comment composer, and cross-platform navigation integration.

---

## 1. System Overview & Core Philosophy

Hashtags on `oomfs.org` originate on creator profile notepads (`HashtagsNotepad.tsx`) and creator discovery cards on the Home timeline (`src/app/page.tsx`). 

Rather than treating hashtags merely as static text badges or transient clipboard copy utilities, `oomfs.org` elevates every hashtag into a **first-class, dedicated discovery destination**:

1. **Dedicated Page per Tag:** Navigating to any hashtag (e.g. `#vibecoder`) routes to its standardized dedicated hub (`oomfs.org/hashtag/vibecoder`).
2. **1:1 Twitter/X Layout Parity:** Renders strictly inside the centered 600px desktop timeline container (`max-w-[600px] border-x border-[#eff3f4]`) flanked by `LeftSidebar` (275px) and `RightSidebar` (350px) using Twitter Light Theme color tokens.
3. **Dual Discovery Surfaces (`Creators` + `Posts`):**
   * **Creators Tab:** Aggregates all profiles that have adopted the hashtag on their personal notepads.
   * **Posts Tab (Tag Comment Section):** Direct port of the conversational guestbook model detailed in [`docs/comments.md`](comments.md). Acts as a public timeline and discussion thread dedicated exclusively to the tag, complete with an inline composer, multi-photo attachments, and StrawPage-style doodling.
4. **First-Class Thread Routing:** Every post created under a hashtag is a full content block. Clicking any post navigates into its canonical thread view (`/[author]/status/[id]`), enabling nested conversational replies.
5. **Interactive Relationship Actions:** Direct follow/unfollow capability with optimistic UI updates and reciprocal relationship badges (`Follows you`).

---

## 2. Route Hierarchy & URL Normalization

```
Dynamic Routes:
├── /hashtag/[tag]          # Canonical dynamic hashtag route (SSR with Suspense)
├── /tag/[tag]              # Compatibility redirect -> /hashtag/[tag]
└── /hashtags/[tag]         # Compatibility redirect -> /hashtag/[tag]
```

### 2.1 Canonical Path: `/hashtag/[tag]`
Following Twitter/X Web convention (`x.com/hashtag/[tag]`), the canonical URL is prefixed with `/hashtag/`.

### 2.2 Normalization Rules
To ensure resilience across diverse user inputs, links, and URL encoding schemes:
* **Prefix Stripping:** Strips any leading `#` or duplicate `%23` entities (`#vibecoder` $\rightarrow$ `vibecoder`).
* **URI Decoding:** Standardizes decoded strings (`decodeURIComponent(tag)`).
* **Case Folding:** Stored and matched uniformly in lowercase (`VibeCoder` $\rightarrow$ `vibecoder`).
* **Trimming:** Strips leading and trailing whitespace.
* **Aliases:** Visiting `/tag/[tag]` or `/hashtags/[tag]` automatically issues a server redirect to `/hashtag/[tag]`.

---

## 3. Component Architecture & UI Anatomy

The dedicated hashtag experience is encapsulated across two primary files:
* **Route Entry:** [`src/app/hashtag/[tag]/page.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/app/hashtag/[tag]/page.tsx) — Next.js 16 dynamic App Router server component with `generateStaticParams`, dynamic Open Graph metadata generation, and `<Suspense>` boundaries.
* **Client View:** [`src/components/hashtags/HashtagClientView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/hashtags/HashtagClientView.tsx) — Sticky header, hero presentation, dual-tab switchboard (`Creators` & `Posts`), inline post composer, doodler modal, and thread integration.

### 3.1 Sticky Header
* **Back Button:** Native circular `ArrowLeft` button triggering `router.back()`.
* **Title & Subtitle:** Displays active tag (`#tag`) and context-aware metric subtitle (`N creators` or `N posts`).
* **Share Action:** Top-right action button copying `window.location.href` to clipboard with transient `Link copied!` feedback.

### 3.2 Hero Banner Card
* **Hashtag Glyph:** Twitter Blue (`#1d9bf0`) `#` glyph housed inside a soft rounded badge.
* **Tag Title:** Bold `#0f1419` heading with `#1d9bf0` hash prefix.
* **Badge:** Subdued `HASHTAG` pill.
* **One-Click Tag Copy:** Dedicated `Copy tag` action pill copying `#tag` to the visitor's clipboard with instant checkmark confirmation.

### 3.3 Dual-Tab Navigation Bar
Pinned at `sticky top-[53px]` with standard Twitter active underline indicator:
1. **Creators Tab (`creators`):** Displays real-time count `Creators (N)` and lists all profiles using this tag.
2. **Posts Tab (`posts`):** Displays real-time count `Posts (N)` and houses the tag's dedicated comment/post section.

---

## 4. Posts Tab: Tag Comment Section & Composer

Adapting the architectural precedent established in [`docs/comments.md`](comments.md), the **Posts** tab serves as a dedicated, collective thread for the hashtag.

### 4.1 Inline Tag Composer
Positioned at the top of the **Posts** tab:
1. **User Identity:** Renders the active user's avatar (`formatTwitterAvatar`).
2. **Text Area:** Auto-expanding placeholder `Post something to #tag...`.
3. **Multi-Image Attachments (1–4 Photos):**
   - Uploads up to 4 images via file picker with compression (`compressImageFile` to max 1200px at 85% JPEG quality).
   - Previews render in a responsive thumbnail grid with `✕` removal buttons.
4. **StrawPage-Style Doodler (`DoodleModal.tsx`):**
   - Direct button to launch canvas doodling with Pen, Flood Fill Bucket, Eraser, and stroke width/color palettes.
   - Annotate directly on top of attached photos via the inline "Doodle" badge on any thumbnail.
   - Saves exported PNGs as image attachments alongside the post text.
5. **Publish Action:** Saves to Supabase `public.blocks` (`type: 'comment'`, `content.hashtag: tag`), caches in session store (`saveSessionPost`), and updates local storage.

### 4.2 Card Presentation & Thread Lifecycle
* **`CommentCard.tsx` Integration:** Rendered using standard Twitter cards with author metadata, timestamps, multi-line text, `TwitterMediaGrid` for attached photos/doodles, and interaction counts (Like, Repost, Share, Reply).
* **Click-to-Thread Navigation:** Clicking any post card opens into its dedicated status route:
  $$\text{oomfs.org/[postAuthor]/status/[postId]}$$
  The thread view (`ThreadClientView.tsx`) expands the post with threaded replies and reply composer.
* **Author Moderation:** Authors can delete their own posts directly via the card's `onDelete` handler, synchronizing deletion across `postStore`, `localStorage`, and Supabase.

---

## 5. Creator Resolution & Hydration Strategy

`HashtagClientView.tsx` executes a comprehensive multi-tier lookup to identify all accounts associated with the tag:

```
┌────────────────────────────────────────────────────────┐
│               Load Hashtag Creators                    │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌──────────────────┐ ┌─────────────┐ ┌───────────────┐
│ 1. Supabase      │ │ 2. Local    │ │ 3. Mock       │
│    `profiles`    │ │    Storage  │ │    Showcase   │
│    (hashtags[])  │ │    Cache    │ │    Users      │
└────────┬─────────┘ └──────┬──────┘ └───────┬───────┘
         └─────────────────┬┴────────────────┘
                           ▼
             Deduplicated Creator Array
```

1. **Supabase Profiles:** Queries PostgreSQL `public.profiles` (`hashtags` column).
2. **Synchronous LocalStorage Cache:** Inspects `oomfs_profile_hashtags_<userId>` so recently edited notepads reflect instantly without network latency.
3. **Showcase Demo Accounts:** Inspects `MOCK_USERS` (`amberlyn`, `dev_kyle`, `sora_arts`, `jack`) to guarantee rich discovery during offline or development runs.
4. **Deduplication:** Merged by lowercase handle (`Map<string, CreatorWithTag>`).

---

## 6. Cross-Platform Navigation Integration

Hashtags across `oomfs.org` now link directly to their dedicated pages:

### 6.1 Profile Notepad (`HashtagsNotepad.tsx`)
In View Mode, hashtags inside the continuous paragraph flow render as `<Link href="/hashtag/[tag]">`, allowing mutuals and visitors to tap any tag to explore everyone else using it.

### 6.2 Home Timeline Cards (`src/app/page.tsx`)
Hashtags replacing user bios on discovery cards render as interactive `<Link>` elements with `e.stopPropagation()` to prevent conflicting with card navigation.

---

## 7. File Map & Key References

| File | Purpose |
| :--- | :--- |
| [`src/app/hashtag/[tag]/page.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/app/hashtag/[tag]/page.tsx) | Server route entry, static params prerender, and Open Graph metadata |
| [`src/app/tag/[tag]/page.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/app/tag/[tag]/page.tsx) | Redirect route to `/hashtag/[tag]` |
| [`src/app/hashtags/[tag]/page.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/app/hashtags/[tag]/page.tsx) | Redirect route to `/hashtag/[tag]` |
| [`src/components/hashtags/HashtagClientView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/hashtags/HashtagClientView.tsx) | Dual-tab client view: Creators list, Tag Comment composer, DoodleModal, and CommentCard feed |
| [`src/components/feed/CommentCard.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/CommentCard.tsx) | 1:1 post/comment card with media grid and click-to-thread navigation |
| [`src/components/feed/DoodleModal.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/DoodleModal.tsx) | Canvas drawing and image annotation tool for post attachments |
| [`src/components/hashtags/HashtagsNotepad.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/hashtags/HashtagsNotepad.tsx) | Profile notepad component linking View mode tags to dedicated hashtag pages |
| [`src/app/page.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/app/page.tsx) | Home discovery feed linking card hashtags to dedicated hashtag pages |
| [`docs/comments.md`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/docs/comments.md) | Precedent technical specification for profile comments and conversational thread architecture |
