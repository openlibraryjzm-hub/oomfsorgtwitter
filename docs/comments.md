# Profile Comments & Conversational Threads (`comments.md`)

This document serves as the canonical technical reference for the profile comments system and conversational thread architecture on `oomfs.org`. It details the data model, database schema, cross-profile scoping, media pipeline, component hierarchy, and routing lifecycle.

---

## 1. System Overview & Core Philosophy

On `oomfs.org`, comments serve a dual architectural role:

1. **Profile Guestbook:** Rendered directly beneath the tab bar on a user's **Comments** profile tab (`/[username]`), serving as a public guestbook where visitors, friends, and mutuals (OOMFs) leave notes, feedback, and photos.
2. **First-Class 1:1 X/Twitter Posts:** Unlike legacy guestbook systems with flat, dead-end text entries, every comment created on `oomfs.org` is a full-fledged content block. Comments support:
   - Up to 4 attached images formatted in Twitter's signature 1–4 photo grid.
   - Standard Twitter interaction suites (Reply, Repost, Like, Share).
   - Direct click-to-thread navigation opening into a dedicated canonical URL (`/[commentAuthor]/status/[commentId]`).
   - Nested conversational reply feeds in the dedicated thread view.

### The Two-Way Scoping Model

Every comment establishes a directed relationship between two profiles:
* **The Author (`user_id`)**: The authenticated user creating the comment (`auth.uid()`).
* **The Recipient (`target_user_id`)**: The user owning the profile page where the comment is posted.

```
┌────────────────────────┐                    ┌────────────────────────┐
│  Commenter (@alice)    │                    │  Profile Owner (@bob)  │
│  user_id = Alice.id    ├──── Writes on ────►│  target_user_id =      │
│                        │     Bob's Guestbook│             Bob.id     │
└────────────────────────┘                    └────────────────────────┘
            │                                             │
            ▼                                             ▼
Canonical Status URL:                         Guestbook Display:
oomfs.org/alice/status/[id]                   oomfs.org/bob (Comments tab)
Replying to @bob                              Shows Alice's comment & photos
```

This model provides two distinct query vectors:
1. **Guestbook Scoping:** Bob's profile loads all comments where `target_user_id = Bob.id`.
2. **Author Activity & Search:** Alice's global activity can query all comments where `user_id = Alice.id`, making it trivial to surface all comments a user has ever written across the site.

---

## 2. Database Schema & Tables

Comments are stored within the core `public.blocks` table in Supabase PostgreSQL, governed by Row Level Security (RLS). All definitions are maintained in [`supabase_schema.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/supabase_schema.sql) and [`supabase_comments_target.sql`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/supabase_comments_target.sql).

### 2.1 `public.blocks` (Comment Records)

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, `default gen_random_uuid()` | Unique comment identifier |
| `user_id` | `uuid` | Not Null, `references public.profiles(id) on delete cascade` | Comment author's user profile ID |
| `target_user_id` | `uuid` | Nullable, `references public.profiles(id) on delete cascade` | Target profile recipient ID (where comment lives) |
| `type` | `text` | Not Null, Check `in ('standard', 'board', 'badge', 'comment')` | Set to `'comment'` |
| `content` | `jsonb` | Not Null, Default `'{}'::jsonb` | Structured comment payload (text, images, author snapshot) |
| `created_at` | `timestamptz` | Not Null, Default `timezone('utc', now())` | Creation timestamp |

### 2.2 Content JSONB Structure (`content`)

```typescript
{
  "text": "The portfolio updates look incredible amber!",
  "images": [
    "data:image/jpeg;base64,...",
    "https://images.unsplash.com/..."
  ],
  "targetUsername": "amberlyn",
  "author": {
    "id": "usr_dev_kyle",
    "username": "dev_kyle",
    "name": "Kyle Phillips",
    "avatar": "https://...",
    "isVerified": true
  },
  "likesCount": 8,
  "repliesCount": 3,
  "repostsCount": 1
}
```

### 2.3 Database Indexes

To maintain rapid single-digit millisecond query performance on high-traffic profile guestbooks:

```sql
create index if not exists idx_blocks_target_user_id_type 
  on public.blocks (target_user_id, type);
```

---

## 3. Row-Level Security (RLS) & Permissions Matrix

Comments utilize fine-grained PostgreSQL RLS policies to guarantee security while supporting social guestbook interactions:

| Operation | Policy Name | Enforcement (`USING` / `WITH CHECK`) | Description |
| :--- | :--- | :--- | :--- |
| **SELECT** | Blocks are viewable by everyone | `true` | Public read access for profile visitors and search crawlers |
| **INSERT** | Authenticated users can insert blocks | `auth.uid() = user_id` | Comment author must be the signed-in user |
| **UPDATE** | Users can update their own blocks | `auth.uid() = user_id` | Only the original comment author can edit comment content |
| **DELETE** | Users can delete their own blocks or comments on their profile | `auth.uid() = user_id OR (type = 'comment' AND auth.uid() = target_user_id)` | **Dual Delete:** Either author OR recipient profile owner can delete |

### The Dual Delete Model
A profile guestbook requires owner moderation. If User A leaves a comment on User B's profile:
* User A (author) can delete their own comment (`auth.uid() = user_id`).
* User B (recipient) can remove unwanted comments from their own guestbook (`auth.uid() = target_user_id`).

---

## 4. Query Lifecycle & Data Separation

To prevent comments from leaking into standard post timelines, data fetching strictly separates authored posts from guestbook comments in [`src/components/profile/ProfileView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/profile/ProfileView.tsx):

### 4.1 Timeline Posts Query (Excluding Comments)
The primary **Posts** tab displays only content created by the profile owner, deliberately excluding guestbook comments:

```typescript
const { data: dbPosts } = await supabase
  .from('blocks')
  .select('*')
  .eq('user_id', targetUserId)
  .neq('type', 'comment')
  .order('created_at', { ascending: false });
```

### 4.2 Guestbook Comments Query (Targeted to Profile)
The **Comments** tab queries blocks targeted to the active profile, joined with the author's live profile record:

```typescript
const { data: dbComments } = await supabase
  .from('blocks')
  .select('*, profiles:user_id(*)')
  .eq('type', 'comment')
  .or(`target_user_id.eq.${targetUserId},and(user_id.eq.${targetUserId},target_user_id.is.null),content->>targetUsername.eq.${initialUser.username}`)
  .order('created_at', { ascending: false });
```

*Note: The `.or()` filter handles migrated `target_user_id` records, self-authored comments on one's own profile, and legacy un-migrated JSONB target references with zero client disruption.*

---

## 5. Inline Comment Composer (`ProfileView.tsx`)

Rendered at the top of the **Comments** tab directly beneath the tab bar, adhering strictly to Twitter/X compose geometry:

```
┌────────────────────────────────────────────────────────┐
│ [Avatar]  Replying to @username                        │
│           Leave a comment for @username...             │
│                                                        │
│           [Thumbnail 1] [Thumbnail 2]                 │
│           ──────────────────────────────────────────   │
│           [📷 Image (2/4)]                   [Comment] │
└────────────────────────────────────────────────────────┘
```

### Composer Capabilities:
1. **Context Indicator**: Displays *"Replying to @username"* in `#536471` text above the input.
2. **Multi-Image Attachments**:
   - Accepts up to 4 images via file picker (`accept="image/*" multiple`).
   - Dynamic counter badge on the camera icon button (`${images.length}/4`).
   - Disabled once 4 images are reached.
3. **Interactive Previews**:
   - Thumbnails display with rounded corners (`rounded-xl border border-[#eff3f4] aspect-square`).
   - Each thumbnail features an absolute-positioned top-right `✕` button to remove the attachment before publishing.
4. **Client-Side Compression Pipeline (`compressImageFile`)**:
   - Uploaded files pass through `compressImageFile(file, 1200, 0.85)` in [`src/lib/utils.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/utils.ts).
   - Natural aspect ratios are preserved while clamping maximum dimensions to 1200px at 85% JPEG quality.
   - Prevents database payload bloat and eliminates upload timeouts.
5. **Instant Hydration & Session Persistence**:
   - Newly submitted comments are saved to Supabase `public.blocks`.
   - Simultaneously cached via `saveSessionPost(commentPost)` in [`src/lib/postStore.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/postStore.ts).
   - If the user clicks the new comment immediately, the status route resolves without waiting for server round-trips.

---

## 6. Twitter Media Grid Engine (`TwitterMediaGrid.tsx`)

Rendered in [`src/components/feed/TwitterMediaGrid.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/TwitterMediaGrid.tsx), implementing standard 1–4 photo layout geometries:

| Image Count | Grid Layout & Geometry | CSS Class Specs |
| :---: | :--- | :--- |
| **1 Image** | Single responsive hero image | `w-full max-h-[510px] rounded-2xl overflow-hidden border border-[#eff3f4] object-cover` |
| **2 Images** | 2 equal vertical columns side-by-side | `grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden h-64 sm:h-72 border border-[#eff3f4]` |
| **3 Images** | 1 large left half (50% width), 2 stacked right half (25% each) | `grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden h-72 sm:h-80 border border-[#eff3f4]` |
| **4 Images** | 2×2 grid with 4 equal quadrants | `grid grid-cols-2 grid-rows-2 gap-0.5 rounded-2xl overflow-hidden h-72 sm:h-80 border border-[#eff3f4]` |

*All images utilize `object-cover`, subtle hover opacity transitions, and event propagation guards so clicking text or links does not trigger accidental thread navigation.*

---

## 7. Comment Cards & Interaction Suite (`CommentCard.tsx`)

Component: [`src/components/feed/CommentCard.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/feed/CommentCard.tsx).

### 7.1 Visual Hierarchy & Elements
* **Author Avatar**: 40×40 circular avatar (`rounded-full`) linking to `/[commentAuthor]` with hover opacity.
* **Header Row**:
  * Author Display Name (bold, hover underline).
  * Blue Verified Badge (if verified).
  * Handle (`@username`).
  * Separator dot (`·`).
  * Relative timestamp (`comment.createdAt`).
  * Moderation delete button (shown if viewer is author OR profile owner).
  * More options button (`MoreHorizontal`).
* **Replying Context**: *"Replying to @[targetUsername]"* with clickable handle.
* **Body Text**: Preserves multi-line whitespace (`whitespace-pre-line text-[15px] leading-relaxed`).
* **Attached Media**: Renders `TwitterMediaGrid` if `comment.images` contains 1–4 URLs.
* **Action Bar**:
  * **Reply**: Message bubble icon + `repliesCount` (clicking navigates to thread).
  * **Repost**: Green hover cycle + `repostsCount` with optimistic count update.
  * **Like**: Pink heart icon + `likesCount` with optimistic toggle and count update.
  * **Share**: Copies canonical URL to clipboard (`navigator.clipboard.writeText`) with temporary `"Copied!"` indicator.

### 7.2 Card Click Handling
Clicking anywhere on the comment card navigates to:
$$\text{`/[commentAuthor]/status/[commentId]`}$$
Text selection (`window.getSelection()`) and nested link/button clicks automatically stop propagation to prevent accidental navigation while copying text or tapping author profiles.

---

## 8. Canonical Status Route & Thread Navigation

Path: [`src/app/[username]/status/[id]/page.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/app/[username]/status/[id]/page.tsx) and [`ThreadClientView.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/app/[username]/status/[id]/ThreadClientView.tsx).

### 8.1 URL Convention: Option B (`/[commentAuthor]/status/[id]`)
Comments are canonicalized under the author's handle:
* Standardizes all content blocks across `oomfs.org` to use `/[author]/status/[id]`.
* Matches authentic X/Twitter URL structure.
* Supports unified author search and indexing across all profiles.

### 8.2 Server & Fallback Resolution
1. **Database Query**: Queries `public.blocks` joined with `public.profiles` by `postId`.
2. **Client Session Store**: Checks `getSessionPost(postId)` from `src/lib/postStore.ts` for instantaneous same-session rendering of newly drafted comments.
3. **Mock Data Cross-Search**: If the block is not found in database or `MOCK_POSTS`, the resolver cross-searches `MOCK_COMMENTS` across all mock profiles, ensuring sample comments load in threads seamlessly during development and testing.

### 8.3 Thread View Layout (`ThreadClientView.tsx`)
* **Sticky Header**:
  * Back button (`←`) with smart history detection: executes `window.history.back()` to return directly to the guestbook, falling back to `/[targetUsername]`.
  * Title: `"Post"`.
* **Focal Post**: Rendered with expanded typography via `<PostCard post={post} isThreadView={true} />`.
* **Context Header**: Displays `"Replying to @[targetUsername]"` directly above the focal tweet text.
* **Reply Composer**: Allows visitors and users to submit nested replies directly to the comment.
* **Replies Feed**: Chronological list of replies to the comment thread.

---

## 9. TypeScript Types Reference

Defined in [`src/lib/mockData.ts`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/lib/mockData.ts):

```typescript
export interface Comment {
  id: string;
  author: User;
  createdAt: string;
  text: string;
  images?: string[];
  targetUsername?: string;
  targetUserId?: string;
  likesCount: number;
  repliesCount?: number;
  repostsCount?: number;
  isLiked?: boolean;
  isReposted?: boolean;
}

export interface Post {
  id: string;
  author: User;
  createdAt: string;
  type: 'standard' | 'board' | 'badge' | 'comment';
  text: string;
  images?: string[];
  attachments?: PostAttachment[];
  targetUsername?: string;
  targetUserId?: string;
  likesCount: number;
  repostsCount: number;
  repliesCount: number;
  viewsCount: string;
  isLiked?: boolean;
  isReposted?: boolean;
  // Format-specific payloads
  boardData?: BoardData;
  badgeData?: BadgeData;
}
```

---

## 10. Fresh Agent Onboarding Checklist & Critical Gotchas

When modifying comments, queries, or status routes:

- [ ] **Never query comments using `WHERE user_id = targetUserId` alone**:  
  Comments left by other users on a profile have `target_user_id = targetUserId`. Always query by `target_user_id` when loading a profile's Comments tab.
- [ ] **Always filter out comments on the Posts tab**:  
  When fetching author posts for the primary timeline, explicitly include `.neq('type', 'comment')`. Otherwise, comments written by the user on external profiles will erroneously appear in their personal post timeline.
- [ ] **Save to Session Store Immediately**:  
  When creating a comment in `handleAddComment`, call `saveSessionPost(commentAsPost)` with `type: 'comment'` so immediate clicks on the new card resolve instantly without 404s before Supabase database round-trips complete.
- [ ] **Preserve Dual Deletion in RLS**:  
  When writing database migrations or updating blocks RLS, ensure DELETE allows both the comment author (`auth.uid() = user_id`) and the recipient profile owner (`auth.uid() = target_user_id`).
- [ ] **Always Compress Image Attachments**:  
  Never upload raw multi-megabyte image files directly into the JSONB `content` payload. Always run files through `compressImageFile()` to keep client payloads lightweight and fast.
