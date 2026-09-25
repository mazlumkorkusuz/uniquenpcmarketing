# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** uniquenpc
**Generated:** 2026-09-25 16:22:19
**Category:** SaaS (General)
**Design Dials:** Density 8/10 (Dense / Dashboard)

---

## Project Decisions (override the generated values below)

The sections after this one are the raw `ui-ux-pro-max --design-system` output for
"B2B Gaming Marketing SaaS" (density 8). The generator matched a landing-page pattern
and a Glassmorphism style, which don't fit an internal dashboard app, and the product
owner's style brief sets colors explicitly. **Where they conflict, this section wins.**

| Topic | Generated | Applied | Why |
|---|---|---|---|
| Page pattern | Hero + Features + CTA | Dashboard grid (stats row, 3-col, 4-col widgets) | Internal tool, not a marketing page |
| Style | Glassmorphism | Flat light SaaS cards, soft shadow | Brief: "clean cards, subtle shadows"; blur hurts dense data |
| Background | `#F8FAFC` | `#FFFFFF` | Brief |
| Card | `#FFFFFF` | `#F5F5F5`, border `#EBEBEB`, radius 14px | Brief |
| Card shadow | `0 4px 6px rgba(0,0,0,.1)` | `0 2px 8px rgba(0,0,0,0.08)` (`--shadow-card`) | Brief |
| Text | `#1E293B` / `#475569` | `#111111` primary, `#444444` secondary, `#6B6B6B` muted | Brief; muted still ≥4.5:1 on `#F5F5F5` |
| Primary / CTA | Blue `#2563EB`, orange `#EA580C` | Black `#111111` buttons | Platform brand colors carry all chroma; a blue/orange primary competes with them |
| Table header fill | — | `#EDEDED` (`--color-bg-section`) | Must separate from `#F5F5F5` cards |
| Platform colors | — | Twitch `#9146FF`, YouTube `#FF0000`, Kick `#53FC18`, Steam `#1B2838` (+ others in `src/lib/theme.ts`) | Brief |
| Typography | Plus Jakarta Sans | Plus Jakarta Sans 400–800, tabular numbers on dashboards | Kept |
| Spacing | Dense scale (density 8) | Kept | Data-heavy screens |

**Where tokens live:** CSS variables in `src/app/globals.css` (`@theme`), mirrored in
`src/lib/theme.ts` for inline styles. Components use `var(--color-bg-card)`,
`var(--shadow-card)`, `var(--color-border-card)`, `var(--color-bg-section)` instead of raw hex.

**Responsive:** sidebar becomes an off-canvas drawer under 900px (`.app-sidebar`, `.app-topbar`
in `globals.css`); dashboard grids step 4 → 2 → 1 columns.

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#2563EB` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#3B82F6` | `--color-secondary` |
| On Secondary | `#000000` | `--color-on-secondary` |
| Accent/CTA | `#EA580C` | `--color-accent` |
| On Accent/CTA | `#000000` | `--color-on-accent` |
| Background | `#F8FAFC` | `--color-background` |
| Foreground | `#1E293B` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#1E293B` | `--color-card-foreground` |
| Muted | `#E9EFF8` | `--color-muted` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border | `#E2E8F0` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#2563EB` | `--color-ring` |

**Color Notes:** Trust blue + orange CTA contrast [Accent adjusted from #F97316]

### Typography

- **Heading Font:** Plus Jakarta Sans
- **Body Font:** Plus Jakarta Sans
- **Mood:** friendly, modern, saas, clean, approachable, professional
- **Google Fonts:** [Plus Jakarta Sans + Plus Jakarta Sans](https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

*Density: 8/10 — Dense / Dashboard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `2px` / `0.125rem` | Tight gaps |
| `--space-sm` | `4px` / `0.25rem` | Icon gaps, inline spacing |
| `--space-md` | `8px` / `0.5rem` | Standard padding |
| `--space-lg` | `12px` / `0.75rem` | Section padding |
| `--space-xl` | `16px` / `1rem` | Large gaps |
| `--space-2xl` | `24px` / `1.5rem` | Section margins |
| `--space-3xl` | `32px` / `2rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #EA580C;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #2563EB;
  border: 2px solid #2563EB;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #F8FAFC;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #2563EB;
  outline: none;
  box-shadow: 0 0 0 3px #2563EB20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Glassmorphism

**Keywords:** Frosted glass, transparent, blurred background, layered, vibrant background, light source, depth, multi-layer

**Best For:** Modern SaaS, financial dashboards, high-end corporate, lifestyle apps, modal overlays, navigation

**Key Effects:** Backdrop blur (10-20px), subtle border (1px solid rgba white 0.2), light reflection, Z-depth

### Page Pattern

**Pattern Name:** Hero + Features + CTA

- **Conversion Strategy:** Deep CTA placement. For CTA label text, verify at least 4.5:1 against the button fill; use 7:1 only when the product explicitly targets AAA normal-text contrast. Keep focus and component boundaries independently visible. Disable hero parallax under reduced motion and render its static final state.
- **CTA Placement:** Hero (sticky) + Bottom
- **Section Order:** Hero with headline/image > Value prop > Key features (3-5) > CTA section > Footer

---

## Anti-Patterns (Do NOT Use)

- ❌ Excessive animation
- ❌ Dark mode by default

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
