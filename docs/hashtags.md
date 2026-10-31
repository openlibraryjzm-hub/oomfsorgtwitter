# Personal Hashtags Notepad (`hashtags.md`)

This document serves as the canonical technical reference for the personal hashtags notepad system on `oomfs.org`. It details the philosophy, data model, component architecture, keyboard interactions, dual persistence layer, and routing lifecycle.

---

## 1. System Overview & Core Philosophy

The **Hashtags** tab provides an authentic, hyper-minimalist personal notepad on user profiles (`oomfs.org/[username]/hashtags` or the 4th tab on `/[username]`). 

Unlike global tagging or search-indexer systems, the Hashtags tab is designed strictly for **creator self-description**:

1. **Densely Packed Paragraph Flow:** Tags are displayed in a continuous, flowing paragraph separated by commas (e.g. `#vibecoder, #gamer, #painter, #pixelart, #nightowl`), mimicking a personal notepad page rather than isolated pill badges or vertical list rows.
2. **Hyper-Minimalist UI:** Pure light-theme typography with zero extraneous borders, neon gradients, or nested cards. Tags feature Twitter Blue (`#1d9bf0`) `#` symbols, crisp primary dark text (`#0f1419`), and subtle secondary gray commas (`#536471`).
3. **Frictionless Creation via Comma Separation:** Profile owners add hashtags simply by typing words and pressing <kbd>,</kbd> (comma) to separate them.
4. **Single-Click Copy Utility:** Visitors and mutuals can tap any hashtag in the paragraph to copy it directly to their clipboard with inline visual feedback.

---

## 2. Profile Tab Position & Route Hierarchy

Hashtags occupy the **4th leftmost slot** in the 5-tab profile navigation bar:

```
[ 1. Boards ]  [ 2. Links ]  [ 3. Comments ]  [ 4. Hashtags ]  [ 5. Likes ]
```

### Route Lifecycle

1. **Dynamic Tab Switching:** Clicking **Hashtags** in [`ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx) activates the tab and uses `window.history.replaceState` to update the URL to `/[username]/hashtags` without reloading the page.
2. **Direct Server Route:** Navigating directly to `/[username]/hashtags` resolves via [`src/app/[username]/hashtags/page.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/app/[username]/hashtags/page.tsx), initializing `ProfileView` with `initialTab="hashtags"`.
3. **Static Prerendering:** Included in `generateStaticParams()` for key profiles (`amberlyn`, `dev_kyle`, `sora_arts`, `jack`).

---

## 3. Component Architecture & Modes

All notepad logic is encapsulated in [`HashtagsNotepad.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/hashtags/HashtagsNotepad.tsx).

### 3.1 View Mode (Default & Visitors)

* **Continuous Text Block:** Hashtags render inside a fluid, paragraph-level text block with natural line wrapping:
  ```tsx
  <p className="text-[15px] sm:text-[16px] leading-[1.8] sm:leading-[1.9] text-[#0f1419] font-normal break-words">
    {hashtags.map((tag, index) => (
      <React.Fragment key={tag}>
        <span onClick={() => handleCopyTag(tag)} className="...">
          <span className="text-[#1d9bf0] font-bold">#</span>
          <span>{tag.replace(/^#/, '')}</span>
        </span>
        {!isLast && <span className="text-[#536471] mr-1.5">,</span>}
      </React.Fragment>
    ))}
  </p>
  ```
* **Click-to-Copy:** Clicking any hashtag writes `#tag` to `navigator.clipboard` and displays a transient floating tooltip (`Copied!`) directly above the clicked tag for 1.5 seconds.
* **Header Controls:** Displays the notepad glyph (`Hash`), label (`NOTEPAD`), and tag counter. If viewing one's own profile (`isSelf = true`), an `[Edit]` button is available in the top-right corner.
* **Empty State:** When no hashtags are set, visitors see `@username hasn't written any hashtags yet`, while the owner sees a prompt with an action button to enter Edit mode.

### 3.2 Edit Mode (Owner Exclusive)

Tapping `[Edit]` transitions the component into live editing:

1. **Inline Flow Editor (Default):**
   * Pre-existing hashtags render in place with trailing commas and a subtle <kbd>×</kbd> button on hover for individual deletion.
   * An inline input field sits right after the final tag:
     * **Comma Auto-Commit:** Typing a word followed by <kbd>,</kbd> (comma) instantly commits the hashtag, adds a comma, and clears the input for the next tag.
     * **Enter Key:** Pressing <kbd>Enter</kbd> commits the current input as a hashtag.
     * **Backspace Deletion:** Pressing <kbd>Backspace</kbd> when the input is empty removes the previous hashtag in the list.
     * **Pasting Multi-Tag Text:** Pasting a comma-separated string (e.g. `gamer, painter, lofi`) automatically splits, trims, normalizes, and appends all tags at once.
2. **Raw Paragraph Mode:**
   * A secondary toggle (`Edit as raw paragraph`) switches to a full textarea populated with the raw comma-separated text string (`#tag1, #tag2, #tag3`).
   * Edits in this textarea re-parse hashtags in real time.
3. **Exiting Edit Mode:**
   * Clicking `[Done]` commits any remaining text in the active input, persists state, and returns to View mode.

---

## 4. Data Layer & Schema

### 4.1 Database Definition (`public.profiles`)

Hashtags are stored in the `public.profiles` table in Supabase PostgreSQL:

```sql
alter table public.profiles 
  add column if not exists hashtags text[] default array[]::text[];
```

* **Type:** PostgreSQL native text array (`text[]`).
* **Default:** Empty array (`array[]::text[]`).
* **RLS Policies:** Inherits existing profile row policies (select is public, update is restricted to `auth.uid() = id`).
* **Migration Scripts:** Managed via [`supabase_hashtags.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg twitter/supabase_hashtags.sql) and documented in [`supabase_schema.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg twitter/supabase_schema.sql).

### 4.2 TypeScript Interfaces

Defined in [`src/lib/mockData.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg twitter/src/lib/mockData.ts):

```typescript
export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  banner: string;
  bio: string;
  // ...
  links: BioLink[];
  hashtags?: string[];
}
```

### 4.3 Profile Resolver Integration

[`src/lib/resolveUser.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg twitter/src/lib/resolveUser.ts) maps database records to the `User` object:

```typescript
hashtags: Array.isArray(dbUser.hashtags) 
  ? dbUser.hashtags 
  : (MOCK_USERS[username]?.hashtags || [])
```

---

## 5. Dual-Persistence Architecture

Hashtags follow the platform's dual-persistence pattern:

```
User Action (Add / Delete / Edit)
              │
              ├──► 1. localStorage (Synchronous, instant)
              │       Key: `oomfs_profile_hashtags_<userId>`
              │
              └──► 2. Supabase Database (Asynchronous, non-blocking)
                      `update public.profiles set hashtags = :tags where id = :userId`
```

1. **Mount Hydration Priority:**
   `localStorage` $\rightarrow$ `user.hashtags` $\rightarrow$ Demo Defaults (`DEFAULT_AMBERLYN_HASHTAGS`) $\rightarrow$ `[]`.
2. **Resilience & Fallback:**
   If the remote database column is unmigrated or encounters network errors, the client catches the exception silently, ensuring local functionality remains 100% operational.
3. **Demo Fallback:**
   For the default showcase account (`amberlyn`), fallback values (`#vibecoder`, `#gamer`, `#painter`, `#pixelart`, `#nightowl`) are provided so new visitors immediately experience populated hashtags.

---

## 6. Normalization Rules

All input strings pass through the normalization pipeline before storage:

* **Prefixing:** Automatically ensures a leading `#` (e.g. `vibecoder` $\rightarrow$ `#vibecoder`).
* **Trimming & Sanitization:** Strips duplicate leading `#` signs, trims external whitespace, and replaces inner spaces with underscores (e.g. `pixel art` $\rightarrow$ `#pixel_art`).
* **Case Folding:** Stored in uniform lowercase for deduplication and consistent aesthetic styling.
* **Uniqueness:** Duplicates are filtered out case-insensitively during insertion.

---

## 7. File Map & Key References

| File | Purpose |
| :--- | :--- |
| [`src/components/hashtags/HashtagsNotepad.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg twitter/src/components/hashtags/HashtagsNotepad.tsx) | Primary UI component: View/Edit modes, comma separator engine, clipboard copy, and persistence |
| [`src/app/[username]/hashtags/page.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg twitter/src/app/[username]/hashtags/page.tsx) | Next.js dynamic App Router entry for direct URLs (`/[username]/hashtags`) |
| [`src/components/profile/ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg twitter/src/components/profile/ProfileView.tsx) | 5-tab profile navigation bar and container for `HashtagsNotepad` |
| [`src/lib/mockData.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg twitter/src/lib/mockData.ts) | `User` interface definition and demo accounts with initial hashtags |
| [`src/lib/resolveUser.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg twitter/src/lib/resolveUser.ts) | Server profile resolver mapping database and mock hashtags |
| [`supabase_hashtags.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg twitter/supabase_hashtags.sql) | Standalone SQL migration script for `public.profiles.hashtags` |
| [`supabase_schema.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg twitter/supabase_schema.sql) | Baseline PostgreSQL database schema |
