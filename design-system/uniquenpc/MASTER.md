# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/uniquenpc/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** UniqueNPC — B2B game marketing platform
**Regenerated:** 2026-09-26 (replaces the 2026-09-25 "SaaS General" version; old copy in git history)
**Category:** B2B SaaS × Gaming
**Mode:** Light first (dark is not the default)

**Sources (ui-ux-pro-max v2.13.0):**
- Style — `--domain style "bento grid dashboard"` → **Bento Box Grid**; key effects from the
  `--design-system` match **Glassmorphism** (backdrop blur 10–20px, light sources, Z-depth).
- Color — `--domain color "gaming esports vibrant"` → **Gaming** (neon purple `#7C3AED` + rose
  `#F43F5E`), which is a dark palette. Here it is adapted to light mode and every text pair is
  checked for 4.5:1 or better (ratios below).
- Typography — `--domain typography "modern dashboard geometric tech"` → **Tech Startup**
  (Space Grotesk + DM Sans).
- Motion — `--design-system --motion 6` → **Stagger List (Standard)**, 300–450ms, done in CSS
  (no GSAP dependency).

---

## Color Palette

| Role | Hex | CSS Variable | Contrast |
|------|-----|--------------|----------|
| Background | `#F6F5FB` | `--bg` | — |
| Surface / Card | `#FFFFFF` | `--surface` | — |
| Glass card | `rgba(255,255,255,0.72)` + blur 18px | `--glass` | — |
| Foreground (ink) | `#17122B` | `--ink` | 18.1:1 on white |
| Secondary text | `#4A4462` | `--ink-2` | 9.2:1 on white |
| Muted text | `#655F7D` | `--ink-3` | 6.0:1 on white, 5.6:1 on bg |
| Border | `#E8E4F1` | `--line` | decorative |
| Border strong | `#D8D2E6` | `--line-2` | decorative |
| Primary | `#6D28D9` | `--primary` | white on it 7.1:1 |
| Primary glow (gradients only) | `#7C3AED` | `--primary-2` | white on it 5.7:1 |
| Primary tint | `#F3EEFF` | `--primary-tint` | primary text on it 6.3:1 |
| Accent / CTA (rose) | `#E11D48` | `--accent` | white on it 4.7:1 |
| Accent text on tint | `#BE123C` on `#FFF1F3` | `--accent-ink` | 5.7:1 |
| Success | `#047857` on `#ECFDF5` | `--ok` | 5.2:1 |
| Warning | `#B45309` on `#FFFBEB` | `--warn` | 4.8:1 |
| Danger | `#B91C1C` on `#FEF2F2` | `--danger` | 5.9:1 |
| Info | `#1D4ED8` on `#EFF6FF` | `--info` | 6.2:1 |
| Focus ring | `#6D28D9` 2px + 2px offset | `--ring` | — |

**Signature gradient:** `linear-gradient(135deg, #7C3AED 0%, #C026D3 55%, #E11D48 100%)`.
Use it for **one** hero moment per view (the display headline highlight, primary CTA, rank-1
badges). Never put body text on it.

**Platform brand colors** (`src/lib/theme.ts` → `PLATFORM_COLORS`) are used only for platform
content: logos, segment bars, dots. Never use them for UI text on light backgrounds (Kick
`#53FC18` and Chzzk `#00FFA3` fail contrast as text).

## Typography

| Role | Font | Weight | Size / line-height | Tracking |
|------|------|--------|--------------------|----------|
| Display (page hero) | Space Grotesk | 600 | clamp(28px, 3.2vw, 40px) / 1.1 | -0.03em |
| H2 (card title) | Space Grotesk | 600 | 15px / 1.3 | -0.01em |
| Section eyebrow | DM Sans | 600 | 12px / 1.4, uppercase | 0.08em |
| KPI number | Space Grotesk | 600 | 32px / 1, `tabular-nums` | -0.03em |
| Body | DM Sans | 400/500 | 14px / 1.5 (16px in inputs) | 0 |
| Meta | DM Sans | 500 | 12.5px / 1.4 | 0 |

Load with `next/font/google` (`Space_Grotesk`, `DM_Sans`, subsets `latin` + `latin-ext` for
Turkish), exposed as `--font-display` / `--font-body`. Numbers always use
`font-variant-numeric: tabular-nums`.

## Spacing (density 7 → standard-dense)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | icon-text gaps |
| `--space-2` | 8px | inline gaps, row padding |
| `--space-3` | 12px | list rows |
| `--space-4` | 16px | card padding (mobile), grid gap |
| `--space-5` | 20px | card padding (desktop), bento gap |
| `--space-6` | 24px | section gaps |
| `--space-8` | 32px | page padding (desktop) |
| `--space-12` | 48px | between page sections |

## Radius & Elevation

| Token | Value | Usage |
|-------|-------|-------|
| `--r-sm` | 8px | chips, buttons, inputs inside cards |
| `--r-md` | 12px | list rows, thumbnails |
| `--r-lg` | 20px | bento cards |
| `--r-xl` | 28px | hero card |
| `--shadow-1` | `0 1px 2px rgba(23,18,43,.04), 0 1px 1px rgba(23,18,43,.03)` | resting card |
| `--shadow-2` | `0 12px 32px -12px rgba(76,29,149,.18), 0 2px 6px rgba(23,18,43,.05)` | hover card |
| `--shadow-glow` | `0 8px 24px -6px rgba(124,58,237,.45)` | primary CTA |

## Motion

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | entrances, hovers |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | small pops (badges, icon nudge) |
| `--dur-1` | 150ms | color/border changes |
| `--dur-2` | 240ms | hover lift, press |
| `--dur-3` | 420ms | entrance per item |
| `--stagger` | 60ms | per bento tile (`--i` index) |

Rules:
1. One choreographed entrance per view (bento tiles rise 12px + fade, staggered). Nothing loops
   except "live" indicators and loading shimmer.
2. Hover lifts use `transform: translateY(-2px)` + shadow. No scale on cards (no layout shift).
3. Press feedback: `scale(0.97)` on buttons.
4. Animate only `transform` and `opacity` (the bar/ring fills use `transform: scaleX` and
   `stroke-dashoffset`).
5. `prefers-reduced-motion: reduce` → no entrance, no count-up, no pulse; render the final state.
6. `prefers-reduced-transparency: reduce` → solid white cards, no backdrop blur.

### Motion system (implemented 2026-09-26)

- **Route change:** React `<ViewTransition>` (`experimental.viewTransition`) in `AppShell`. The outgoing
  page leaves in 160ms (fade + 3px blur + 6px rise); the sidebar never animates.
- **Page entrance:** `PageMotion` (GSAP) staggers the first-viewport blocks in (14px rise, 420ms,
  total stagger capped at 300ms). Pages with their own CSS entrance set `data-css-entrance`;
  `data-reveal-root` picks the container whose children are the blocks.
- **Below the fold:** blocks reveal once via `ScrollTrigger.batch` (28px rise, 600ms). Tables and
  lists inside a block are never hidden or delayed on their own.
- **Glass:** cards carry a lit inset rim (`--shadow-card`); dashboard cards add a masked 1px edge ring
  that brightens on hover. Every card gets the cursor spotlight (`DashboardFx`).
- **Modals:** framer-motion `AnimatePresence`: rise out of a 4px blur in 320ms, exit in 140ms.
- Nothing is hidden unless its script runs; reduced motion keeps only short opacity fades.

## Components

**Bento card.** Glass surface, `--r-lg`, 1px `--line` border, `--shadow-1`. When interactive:
lift on hover plus a cursor-tracking radial "spotlight" (`--mx`/`--my`, primary at 8% alpha),
`cursor: pointer`.

**Primary button.** Signature gradient, white 600 text, `--r-sm`, 40px tall (44px touch target
including padding on mobile), `--shadow-glow` on hover, a visible focus ring.

**Secondary button.** White, `--line-2` border, ink text; the border turns `--primary` on hover.

**Icon button.** 36×36 (44×44 on touch), transparent, `--ink-3` icon; hover is `--primary-tint`
bg + primary icon. Always has an `aria-label`.

**Status tag.** Tinted background plus the matching ink from the palette table, 12px/600,
`--r-sm`, with a 6px dot.

**Rank row.** Rank number (the top 3 get a gradient badge), thumbnail, name, value, and a relative
magnitude bar under the value that grows from 0 on entrance.

**Input (AI query).** White, 52px tall, 16px text, `--r-md`; on focus the border becomes a
gradient ring and a soft glow appears.

**Skeleton.** `--line` → `#F1EEF8` shimmer, same geometry as the loaded content (no CLS).

## Anti-Patterns (Do NOT Use)

- ❌ Dark mode by default
- ❌ Emojis as icons (use Lucide + platform logo files)
- ❌ Gradient text or backgrounds behind body copy
- ❌ Platform neon colors (Kick, Chzzk) as text on light surfaces
- ❌ Scale transforms on cards / layout-shifting hovers
- ❌ More than one looping animation per card
- ❌ Instant state changes (always 150–300ms)
- ❌ Invisible focus states
- ❌ Missing `cursor: pointer` on clickable elements

## Pre-Delivery Checklist

- [ ] No emojis used as icons
- [ ] `cursor: pointer` on all clickable elements
- [ ] Hover transitions of 150–300ms
- [ ] Text contrast of at least 4.5:1 (see the table)
- [ ] Focus rings visible for keyboard navigation
- [ ] `prefers-reduced-motion` and `prefers-reduced-transparency` respected
- [ ] Responsive at 375, 768, 1024 and 1440px
- [ ] No horizontal scroll on mobile
