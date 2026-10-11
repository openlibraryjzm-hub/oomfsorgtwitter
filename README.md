# oomfs.org 

> **A 1:1 Twitter/X-native alternative to Linktree.**  
> Users put `oomfs.org/username` in their X bio to link to a profile that looks and feels authentically like X, but serves as a personal hub with custom content blocks and an in-app mutual followers (**OOMFS**) graph.

---

## 🎯 Project Vision & Core Principles

1. **The Core Job-to-be-Done:**  
   Replace generic Linktree pages. When someone discovers a creator on X and taps their bio link (`oomfs.org/amberlyndev`), they stay within an interface that looks identical to X, complete with their banner, HD avatar, display name, verified badge, and bio.

2. **The "OOMFS" Differentiator:**  
   In Twitter/X culture, **OOMF** means *"One Of My Followers / Friends"*.
   * Followers and Following are tracked **in-app** (not through paid Twitter API firehoses).
   * When User A and User B follow each other on `oomfs.org`, they automatically earn an **OOMF mutual badge** ($A \leftrightarrow B$).
   * Mutuals are highlighted on user profiles and in the dedicated **OOMFS** tab.

3. **Unique Content Block Types (Beyond Tweets):**  
   Instead of just 280-character text posts, profiles showcase modular blocks that match the timeline aesthetic:
   * 🔗 **Bio Link Cards**: Clean link-in-bio buttons with domain tags, descriptions, and click tracking.
   * 🏆 **OOMF Vouches**: Verified testimonials and endorsements left by mutual followers.
   * 🎵 **Media / Audio Embeds**: Spotify playlist / track cards and multimedia showcases.
   * ⭐ **OOMF Spotlights**: Dedicated shoutouts featuring mutual besties.
   * ❓ **Q&A Prompts**: Conversational prompt and answer cards.
   * 📝 **Standard Posts**: Native 1:1 timeline tweets.

4. **"Profile-First" Strategy (Overcoming Cold Start):**  
   * We do **not** focus on global feeds, algorithmic discovery, or notifications yet.
   * Non-profile pages (`/explore`, `/notifications`) display low-pressure "Coming Soon" states.
   * 100% of product focus is on perfecting **`oomfs.org/[username]`** and organic **profile-hopping** between mutuals.

5. **Design System Rule (Strict North Star):**  
   * **Light Theme by default**: Clean white background (`#ffffff`), Twitter Blue (`#1d9bf0`), subtle gray borders (`#eff3f4`), secondary text (`#536471`), and primary text (`#0f1419`).
   * **Zero "Vibecoding" Fluff**: No forced dark modes, no neon gradients, no heavy glassmorphism or floating bubbles. Maintain 1:1 parity with Twitter Web light mode.

---

## 🛠 Tech Stack

* **Framework:** Next.js 16+ (App Router, Turbopack, TypeScript, React 19).
* **Styling:** Tailwind CSS v4 (`globals.css` configured with Twitter color tokens).
* **Icons:** `lucide-react` (selected to mirror Twitter Web iconography).
* **Backend & Database:** [Supabase](https://supabase.com) (PostgreSQL + Row Level Security).
* **Authentication:** Supabase Auth via **X / Twitter OAuth 2.0 PKCE** (`provider: 'x'`).
* **Client SDKs:** `@supabase/supabase-js`, `@supabase/ssr`.

---

## 📂 Architecture & File Map

```
├── .env.local                          # Supabase project URL and API keys
├── src/
│   ├── app/
│   │   ├── [username]/
│   │   │   └── page.tsx                # Dynamic profile route (SSR with Supabase fetch + mock fallback)
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts            # OAuth code exchange & Twitter v2 bio enrichment handler
│   │   ├── explore/page.tsx            # Clean "Coming Soon" explore page
│   │   ├── notifications/page.tsx      # Clean "Coming Soon" notifications page
│   │   ├── oomfs/page.tsx              # Mutual followers directory
│   │   ├── page.tsx                    # Root redirect (forwards straight to /amberlyndev or active user)
│   │   ├── layout.tsx                  # Root layout with AuthProvider & metadata
│   │   └── globals.css                 # Twitter Light Theme CSS variables
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── LeftSidebar.tsx         # 1:1 Left navigation, active profile pill, Sign in with X
│   │   │   ├── RightSidebar.tsx        # Search, featured OOMFs, auth callout
│   │   │   └── MainLayout.tsx          # 3-column responsive layout wrapper
│   │   ├── profile/
│   │   │   └── ProfileView.tsx         # Core profile view, Edit Profile modal, tabs, sandbox composer
│   │   └── feed/
│   │       ├── PostCard.tsx            # 1:1 timeline post rendering all 6 content block types
│   │       └── PostComposer.tsx        # In-timeline block composer
│   │
│   ├── context/
│   │   └── AuthContext.tsx             # Supabase auth session, profile state, signInWithTwitter, signOut
│   ├── lib/
│   │   ├── mockData.ts                 # Offline mock accounts & sample content for prototyping
│   │   ├── utils.ts                    # formatTwitterAvatar() (400x400 HD upscaler)
│   │   └── supabase/
│   │       ├── client.ts               # Browser Supabase client (@supabase/ssr)
│   │       └── server.ts               # Server Supabase client
```

---

## 🗄 Database Schema (Supabase PostgreSQL)

### 1. `public.profiles`
Stores user profile information synced from Twitter or edited on `oomfs.org`:
* `id` (`uuid`, primary key, references `auth.users.id` on delete cascade)
* `username` (`text`, unique, lowercase handle without `@`)
* `name` (`text`, display name)
* `avatar_url` (`text`, 400x400 HD avatar URL)
* `banner_url` (`text`, optional banner image)
* `bio` (`text`, user biography)
* `location` (`text`, user location)
* `website` (`text`, website or oomfs.org link)
* `created_at` (`timestamptz`)

### 2. `public.blocks`
Stores custom profile content blocks (bio links, vouches, media, posts):
* `id` (`uuid`, primary key, `default gen_random_uuid()`)
* `user_id` (`uuid`, references `public.profiles.id` on delete cascade)
* `type` (`text`: `'link_card' | 'vouch_card' | 'media_card' | 'oomf_spotlight' | 'prompt_card' | 'standard'`)
* `content` (`jsonb`, block metadata like URL, title, endorsement, prompt, etc.)
* `created_at` (`timestamptz`)

### 3. `public.follows`
Tracks the internal follow graph and computes mutual OOMFs:
* `follower_id` (`uuid`, references `public.profiles.id`)
* `following_id` (`uuid`, references `public.profiles.id`)
* `created_at` (`timestamptz`)
* Primary Key: `(follower_id, following_id)`

> **Mutual OOMF Definition:**  
> User A and User B are **OOMFs** if:  
> `(follower_id = A AND following_id = B)` **AND** `(follower_id = B AND following_id = A)` both exist in `public.follows`.

---

## ⚡ Critical Gotchas & Agent Guidelines

When onboarding onto this codebase, remember these crucial implementation details:

1. **Supabase Provider Name is `'x'`, NOT `'twitter'`:**  
   Supabase's OAuth 2.0 integration for X uses `provider: 'x'`. Passing `'twitter'` invokes legacy OAuth 1.0a and triggers `"Unsupported provider: provider is not enabled"`.
   ```ts
   supabase.auth.signInWithOAuth({ provider: 'x' as any, options: { redirectTo: ... } })
   ```

2. **Twitter Avatar HD Upscaling:**  
   Twitter OAuth returns default avatars with `_normal.jpg` ($48 \times 48\text{px}$, pixelated).  
   Always pass avatar URLs through `formatTwitterAvatar(url)` from `src/lib/utils.ts`, which transforms `_normal.` into `_400x400.`.

3. **Twitter API v2 Bio Enrichment:**  
   Twitter's `/2/users/me` endpoint does **not** include `description` (bio) or `location` unless requested with `?user.fields=description,location`.  
   In `src/app/auth/callback/route.ts`, we use `session.provider_token` to fetch these fields and update `public.profiles`.

4. **Nullish Coalescing for Bios:**  
   When merging database profiles with fallbacks, **never** use `dbUser.bio || fallback`. Because empty string `""` or short bios like `"..."` are falsy in JS, `||` will incorrectly revert to placeholder text. Always use:
   ```ts
   dbUser.bio !== null && dbUser.bio !== undefined ? dbUser.bio : fallback
   ```

5. **Profile Editing:**  
   Users can edit their bio, name, location, and website directly via the native **"Edit profile"** modal on `ProfileView.tsx`, which persists updates to `public.profiles`.

---

## 🚀 Development Commands

```bash
# Start local development server (http://localhost:3000)
npm run dev

# Run TypeScript check and production build
npm run build
```

---

## 🗺 Roadmap & Next Steps

* [x] Next.js 16 + Tailwind CSS v4 1:1 X Light Theme UI Shell
* [x] Dynamic `/[username]` routing with direct Supabase SSR + Mock fallbacks
* [x] Twitter / X OAuth 2.0 PKCE authentication via Supabase (`provider: 'x'`)
* [x] HD Avatar resolution upscaling (`_400x400`)
* [x] Twitter bio extraction and native "Edit profile" modal persistence
* [x] Modular content block types (Bio Link Card, OOMF Vouch, Spotify Media, Spotlight, Q&A)
* [ ] Follow / Unfollow button wired to `public.follows`
* [ ] Real-time mutual follower count calculation (SQL view or RPC)
* [ ] Custom link click tracking / analytics for bio links
* [ ] Dynamic Open Graph (OG) image generation for Twitter Cards (`oomfs.org/[username]`)
