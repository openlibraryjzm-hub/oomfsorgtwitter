# Navigation & Shell Layout Architecture (`docs/navigation.md`)

This document serves as the technical reference for the global application shell, the left navigation sidebar (`LeftSidebar.tsx`), desktop geometry parity, navigation item registry, and authentication drawer.

---

## 1. Global Shell Geometry & Parity Rules

`oomfs.org` adheres strictly to a 1:1 desktop layout geometry matching Twitter/X Web Light Theme, defined in [`src/components/layout/MainLayout.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/layout/MainLayout.tsx):

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             max-w-[1265px] Container                             │
│                                                                                  │
│   Left Sidebar         Center Content Timeline           Right Spacer Column     │
│   (xl:w-[275px])       (max-w-[600px] border-x)          (xl:w-[350px])          │
│                                                                                  │
│   [O] Logo             ┌─────────────────────────┐       Legal & Footer Links    │
│   Home                 │ Dynamic Page Route:     │                               │
│   Explore              │ • Timeline Feed (/)     │                               │
│   Notifications        │ • Profile (/[username]) │                               │
│   localyt.tv           │ • Thread (/status/[id]) │                               │
│   Bookmarks            │ • Network (/oomfs)      │                               │
│   Profile              │                         │                               │
│   Settings             │                         │                               │
│   [Post] Button        │                         │                               │
│   [Account Pill]       └─────────────────────────┘                               │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Layout Column Constraints:
1. **Left Navigation Column (`xl:w-[275px]`)**: Sticky, full viewport height (`sticky top-0 h-screen`), flex column with vertical distribution (`justify-between`), right border (`border-r border-[#eff3f4]`).
2. **Center Timeline Column (`max-w-[600px] w-full`)**: Primary content area bounded by subtle vertical borders (`border-x border-[#eff3f4]`). Houses all timeline feeds, threads, profile views, and network directories.
3. **Right Spacer Column (`xl:w-[350px]`)**: Maintains authentic 1:1 X desktop visual balance and hosts legal, disclaimer, and auxiliary navigation links. Hidden on compact screens (`hidden lg:block`).

---

## 2. Navigation Item Registry (`LeftSidebar.tsx`)

The left navigation menu is driven by the `navItems` registry in [`src/components/layout/LeftSidebar.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/layout/LeftSidebar.tsx):

| Order | Label | Icon | Route / Target | Type | Description |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **1** | **Home** | `Home` | `/` | Live Link | Primary timeline route. |
| **2** | **Explore** | `Search` | `/explore` | Live Link | Clean "Coming Soon" search & discovery route. |
| **3** | **Notifications** | `Bell` | `/notifications` | Live Link | Clean "Coming Soon" notifications route. |
| **4** | **localyt.tv** | `Tv` | `null` | Auxiliary Button | Monochromatic television icon; placeholder for video integration. |
| **5** | **Bookmarks** | `Bookmark` | `null` | Auxiliary Button | Classic ribbon bookmark icon; placeholder for saved posts. |
| **6** | **Profile** | `UserIcon` | `/${activeUsername}` | Dynamic Link | Routes to active user's profile (or current session mock if logged out). |
| **7** | **Settings** | `Settings` | `null` | Auxiliary Button | Classic multi-tooth gear icon; placeholder for user preferences. |

### Functional vs. Non-Functional Navigation Rendering:
- **Live Links (`isNonFunctional = false`)**: Rendered using Next.js `<Link href={item.href}>`. Active state is evaluated dynamically against `usePathname()`. Active routes apply bold weight (`font-bold text-[#0f1419]`) and heavier icon stroke (`stroke-[2.5]`).
- **Auxiliary Non-Functional Buttons (`isNonFunctional = true`)**: Rendered as `<button type="button" onClick={(e) => e.preventDefault()}>`. Retains identical hover styling (`hover:bg-[#f7f9f9] text-[#0f1419] font-normal cursor-pointer`) without navigating or modifying URL history.

---

## 3. Responsive Geometry & Breakpoint Behavior

The navigation sidebar automatically adapts between mobile, tablet, and desktop layouts:

```tsx
// Example responsive class structure in LeftSidebar.tsx
<aside className="sticky top-0 h-screen flex flex-col justify-between py-3 px-2 sm:px-4 xl:w-[275px] border-r border-[#eff3f4]">
```

1. **Desktop Viewport (`xl:` $\ge 1280\text{px}$)**:
   - Fixed width of `275px`.
   - Navigation links render as full-width rounded stadium pills (`xl:w-full`) displaying icon + text label (`text-lg font-normal`).
   - "Post" button renders as full-width stadium button with text (`Post`).
   - User account pill renders full name, `@username`, avatar, and `···` menu trigger.
2. **Compact Viewport (`< 1280\text{px}$`)**:
   - Collapses to icon-only circular pills (`w-fit`). Text labels are hidden via `hidden xl:inline`.
   - "Post" button collapses to circular icon button displaying the feather icon (`Feather`).
   - User account pill collapses to avatar-only circular trigger.

---

## 4. Action Triggers & Account Management

### 4.1 Global "Post" Composer Trigger
- Clicking the primary blue **Post** button in the sidebar triggers the `onOpenComposer` callback supplied by [`MainLayout.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/components/layout/MainLayout.tsx).
- Opens the global post drafting modal overlay, allowing users to draft and publish `standard` posts (with 1–4 attachments) or `board` blocks from any page.

### 4.2 Account Drawer & Authentication State
Located at the bottom of `LeftSidebar.tsx`:
- **Authenticated State (`user !== null`)**:
  - Displays user avatar (`formatTwitterAvatar(activeAvatar)`), display name, and `@username`.
  - Clicking toggles the popup menu drawer (`menuOpen`).
  - Drawer contains the **"Log out @{username}"** action invoking `signOut()` from [`AuthContext.tsx`](file:///c:/Users/GGPC/Desktop/oomfsorg%20twitter/src/context/AuthContext.tsx).
- **Guest / Unauthenticated State (`user === null`)**:
  - Displays **"Connect Account / Sign in with X"** button invoking `signInWithTwitter()` via Twitter OAuth 2.0 PKCE (`provider: 'x'`).

---

## 5. Technical Invariants & Agent Guidelines

When extending or modifying the navigation shell:

1. **Next.js 16 Partial Prerendering & `usePathname()`**:
   - `LeftSidebar.tsx` invokes `usePathname()` for route matching.
   - Any layout component invoking dynamic client hooks must be wrapped inside a `<Suspense>` boundary within `MainLayout.tsx` to prevent build-time prerender bailouts during static page generation.
2. **Iconography Standard**:
   - Navigation icons must be imported from `lucide-react` using uniform `w-6 h-6` dimensions and standard stroke widths (`stroke-[1.75]` inactive, `stroke-[2.5]` active).
3. **No Foreign Layout Drift**:
   - Maintain strict 1:1 X Web token styling: Light Theme background (`#ffffff`), borders (`#eff3f4`), primary text (`#0f1419`), and hover states (`#f7f9f9`). Do not introduce non-standard floating bars or drawer side-drawers.
