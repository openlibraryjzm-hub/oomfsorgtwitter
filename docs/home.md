# Home Route Architecture (`docs/home.md`)

This document serves as the canonical technical reference for the primary **Home** route (`/`) on `oomfs.org`.

---

## 1. System Overview & Core Philosophy

The **Home** timeline (`/`) presents a clean, minimalist 1:1 X placeholder landing and coming-soon state within the standard desktop shell (`MainLayout.tsx`).

During early development, platform engineering is concentrated 100% on:
1. **The Creator Profile Page** (`/[username]`) as an authentic, high-signal portfolio and Linktree alternative.
2. **Custom Curated Boards** (`/[username]/status/[id]`) and preset lenses.
3. **The OOMFs Mutuals Graph** (`/[username]/oomfs`), enabling organic profile-hopping between creators.

---

## 2. Route Hierarchy & Component Structure

```
src/app/
└── page.tsx                     # Primary Home route (Client Component with MainLayout shell)

src/components/layout/
├── MainLayout.tsx               # 1:1 Shell geometry (max-w-[1265px], Left 275px, Center 600px, Right 350px)
└── LeftSidebar.tsx              # Active route highlighting for Home ('/')
```

---

## 3. Visual Anatomy & Behavior

The Home page mirrors the coming-soon architecture of auxiliary routes (`/explore` and `/notifications`):

1. **Sticky Header (`header`)**:
   - Fixed sticky top navigation with 1:1 X styling (`sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-[#eff3f4] p-4`).
   - Title: `Home` (`font-extrabold text-xl text-[#0f1419]`).
2. **Centered Content Canvas**:
   - Centered inside the 600px middle timeline column.
   - Distinctive icon container with light blue badge styling (`w-16 h-16 bg-[#1d9bf0]/10 text-[#1d9bf0] rounded-2xl`).
   - Primary heading: `Home Timeline Coming Soon` (`font-black text-2xl text-[#0f1419] tracking-tight mb-2`).
   - Contextual explanation: Explains platform focus on profile pages, boards, and mutuals.
3. **Authentication-Aware Call-to-Action**:
   - **Signed In**: Surfaces a direct link button routing to `/${activeUsername}` (`View Your Profile (@${activeUsername})`).
   - **Signed Out**: Surfaces a primary `Connect X Account` button triggering Twitter OAuth 2.0 PKCE via `signInWithTwitter()`.
