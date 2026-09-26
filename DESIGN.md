---
name: Unique NPC Games Marketing
description: The launch control room for Unique NPC's game marketing team: layered glass, Mission Violet, one Launch Flare per view.
colors:
  mission-violet: "#6D28D9"
  violet-glow: "#7C3AED"
  violet-tint: "#F3EEFF"
  flare-magenta: "#C026D3"
  on-air-rose: "#E11D48"
  on-air-rose-ink: "#BE123C"
  on-air-rose-tint: "#FFF1F3"
  console-ink: "#17122B"
  console-ink-soft: "#4A4462"
  console-ink-muted: "#655F7D"
  hairline: "#E8E4F1"
  hairline-strong: "#D8D2E6"
  lavender-mist: "#F6F5FB"
  surface: "#FFFFFF"
  row-mist: "#FAF9FD"
  glass: "rgba(255, 255, 255, 0.72)"
  success-ink: "#047857"
  success-tint: "#ECFDF5"
  warning-ink: "#B45309"
  warning-tint: "#FFFBEB"
  danger-ink: "#B91C1C"
  danger-tint: "#FEF2F2"
  info-ink: "#1D4ED8"
  info-tint: "#EFF6FF"
  orange-ink: "#C2410C"
  orange-tint: "#FFF7ED"
  teal-ink: "#0F766E"
  teal-tint: "#F0FDFA"
  neutral-tint: "#F4F2F9"
  sidebar-black: "#000000"
  sidebar-text: "#A1A4A5"
  twitch: "#9146FF"
  youtube: "#FF0000"
  kick: "#53FC18"
  soop: "#00A8FF"
  chzzk: "#00FFA3"
  bilibili: "#00A1D6"
  douyin: "#FF0050"
  steam: "#1B2838"
  x-twitter: "#1D9BF0"
  instagram: "#E1306C"
  instagram-deep: "#C13584"
  tiktok: "#FE2C55"
  reddit: "#FF4500"
  linkedin: "#0A66C2"
typography:
  display:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(28px, 3.2vw, 40px)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(24px, 2.6vw, 32px)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  subhead:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  metric:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  body:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  input:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "28px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
components:
  button-primary:
    backgroundColor: "{colors.mission-violet}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.console-ink}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.mission-violet}"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.console-ink-muted}"
    rounded: "{rounded.sm}"
    size: "36px"
  button-icon-hover:
    backgroundColor: "{colors.violet-tint}"
    textColor: "{colors.mission-violet}"
  card-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.console-ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  hero-card:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.console-ink}"
    rounded: "{rounded.xl}"
    padding: "28px 28px 24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.console-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  input-ask:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.console-ink}"
    rounded: "14px"
    height: "56px"
    padding: "6px 6px 6px 16px"
  status-tag:
    backgroundColor: "{colors.success-tint}"
    textColor: "{colors.success-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  tab-active:
    backgroundColor: "{colors.violet-tint}"
    textColor: "{colors.mission-violet}"
    rounded: "{rounded.sm}"
    padding: "8px 18px"
  table-header:
    backgroundColor: "{colors.row-mist}"
    textColor: "{colors.console-ink-muted}"
    typography: "{typography.label}"
    padding: "10px 16px"
  sidebar-item:
    backgroundColor: "{colors.sidebar-black}"
    textColor: "{colors.sidebar-text}"
    rounded: "10px"
    height: "32px"
---

# Design System: Unique NPC Games Marketing

## Overview

**Creative North Star: "The Launch Control Room"**

This is where a game launch is run. The room is light: a lavender-mist floor lit from two soft corners, one Mission Violet and one On-Air Rose, with frosted glass panels floating over it. Every panel holds one part of the launch (streamers, curators, spend, meetings), and everything is visible at once. The energy is a gaming studio's, confident and a little playful, but it lives in specific places: the Launch Flare gradient, the platforms' own brand colors, rank badges, live indicators, and motion that reacts to your hand. The surfaces themselves stay quiet so dense data stays readable all day.

The room has a fixed dark console, the black sidebar, which never changes and never animates. Everything to its right is light. Glass is quiet at rest (a lit rim and a near-flat shadow) and responds when touched: it lifts 2px, the frost deepens a step, the rim brightens, and a violet spotlight follows the cursor. There is exactly one Launch Flare per view, the thing to act on or the thing that matters most.

Density is standard-dense: a 12-column bento on the dashboard, tables and stat grids elsewhere. Motion is choreographed once per view (blocks rise in, sections below the fold reveal as they arrive) and never loops, apart from live indicators and loading shimmer.

**Key Characteristics:**
- Light glass panels over a lit lavender floor; a fixed black console sidebar.
- One Launch Flare (violet → magenta → rose gradient) per view.
- Space Grotesk for the voice, DM Sans for the work.
- Platform brand colors mark platform content only: logos, dots, bars.
- Quiet at rest, responsive on touch: lift, spotlight, rim light.
- Tabular numerals everywhere numbers line up.

## Colors

A violet-and-rose gaming palette tuned for light surfaces; every text pairing clears 4.5:1.

### Primary
- **Mission Violet** (#6D28D9): the color of what's active and selected. Links, focus rings, the active tab and its text, selected filters, section indices, table-row hover tint (at 4%). White text on it measures 7.1:1.
- **Violet Glow** (#7C3AED): gradient and glow only (the first stop of the Launch Flare, the primary button's hover glow, ambient light). Never used for text.
- **Violet Tint** (#F3EEFF): active-tab and icon-button hover fill, and the primary status tag's background. Mission Violet text on it measures 6.3:1.

### Secondary
- **On-Air Rose** (#E11D48): live states and the hot end of the Launch Flare. It marks what is happening right now (the "CANLI" pill, live dots). White text on it measures 4.7:1.
- **On-Air Rose Ink** (#BE123C) on **Rose Tint** (#FFF1F3): rose text on its tint for accent tags and callouts.

### Tertiary
- **Flare Magenta** (#C026D3): the middle stop of the Launch Flare. Gradient only.

### Neutral
- **Console Ink** (#17122B): primary text and headings; violet-black rather than gray, so it belongs to the palette.
- **Console Ink Soft** (#4A4462): secondary text, labels in forms, table body text that is not the key value.
- **Console Ink Muted** (#655F7D): meta text, table headers, captions, icon buttons at rest. 6.0:1 on white.
- **Hairline** (#E8E4F1) / **Hairline Strong** (#D8D2E6): card borders and dividers / input and secondary-button borders, and card borders on hover.
- **Lavender Mist** (#F6F5FB): the floor of every page.
- **Surface** (#FFFFFF) and **Row Mist** (#FAF9FD): modals, inputs and solid fallbacks / table headers and alternating rows.
- **Status inks on tints:** success #047857 on #ECFDF5, warning #B45309 on #FFFBEB, danger #B91C1C on #FEF2F2, info #1D4ED8 on #EFF6FF, orange #C2410C on #FFF7ED, teal #0F766E on #F0FDFA, neutral Console Ink Soft on #F4F2F9. Solid dots, bars and icons in a status family use its ink.
- **Console Black** (#000000) with **Console Text** (#A1A4A5): the sidebar.

### Platform colors
Streaming: Twitch #9146FF, YouTube #FF0000, Kick #53FC18, SOOP #00A8FF, Chzzk #00FFA3, BiliBili #00A1D6, Douyin #FF0050, Steam #1B2838. Social: X #1D9BF0, Instagram #E1306C (deep #C13584), TikTok #FE2C55, Reddit #FF4500, LinkedIn #0A66C2. These are the platforms' own marks, not the product's palette: a platform's page header, logo tile, row tint and pagination may carry its color (and its own secondary brand color in a header gradient); every non-platform page header uses Mission Violet.

### Named Rules
**The One Flare Rule.** The Launch Flare (`linear-gradient(135deg, #7C3AED 0%, #C026D3 55%, #E11D48 100%)`) appears for one moment per view: the primary action, the headline highlight, or rank-1 badges in a list. Never behind body text.

**The Brand-Mark Rule.** Platform colors paint platform content (logos, dots, segment bars, tints behind a platform's own row) and nothing else. When one must be text on light, it goes through `inkOf()` (`src/lib/theme.ts`), which darkens it to 5.6:1 on white. Kick and Chzzk are never raw text.

## Typography

**Display Font:** Space Grotesk (with ui-sans-serif, system-ui)
**Body Font:** DM Sans (with ui-sans-serif, system-ui)
**Sidebar Font:** Inter (the console keeps its own voice)

**Character:** Space Grotesk's squared, slightly technical letterforms give headlines and numbers a mission-display confidence; DM Sans is round and even, so long streamer lists and tables stay easy to scan. Both load with `latin-ext` for Turkish.

### Hierarchy
- **Display** (600, clamp(28px, 3.2vw, 40px), 1.1, -0.03em): the dashboard hero headline only.
- **Headline** (600, clamp(24px, 2.6vw, 32px), 1.1, -0.03em): page titles in the page header.
- **Subhead** (600, 18px, 1.25, -0.01em): modal titles and inline stat values inside cards.
- **Title** (600, 15px, 1.3, -0.01em): card and widget titles.
- **Metric** (Space Grotesk 600, 32px, 1, -0.03em, tabular): KPI numbers in stat cards.
- **Body** (400/500, 14px, 1.5): everything you read and scan, including table cells and button labels.
- **Input** (400, 16px, 1.5): text typed into fields (16px also stops iOS zooming on focus).
- **Label** (600, 12px, 0.08em, uppercase): stat labels and table headers.
- **Meta** (500, 12.5px, 1.4): subtitles and captions under titles.

### Named Rules
**The Tabular Rule.** Any number that sits in a column or updates in place (viewer counts, prices, KPIs, table cells) uses `font-variant-numeric: tabular-nums`.

## Layout

A fixed 248px console sidebar on the left; the content column scrolls beside it and becomes a drawer with a 56px top bar below 900px.

- **Dashboard:** a 12-column bento with a 20px gap. Hero (8) with featured game (4); four KPIs (3 each); sections of 5/4/3 and 4/4/4 widgets; full-width news. Max width 1440px, page padding 28px 32px 64px.
- **Pages:** the page header (28px 32px 20px), then content in 32px side padding. Stat grids use auto-fit columns; tables sit inside one glass card.
- **Breakpoints:** 1279px (bento to 2 columns; hero and feature stacked), 900px (sidebar becomes a drawer), 767px (single column; 16px gutter; 14px gap), 559px (KPIs to 1 column, quick links to 2).
- **Rhythm:** 4/8/12/16/20/24/32/48px. Tight inside groups (8–12px), 20px between bento tiles, 28–48px between sections.

## Elevation & Depth

Layered glass over a lit floor. Depth comes from translucency (72% white plus an 18px frost with 140% saturation), a lit inset rim, and very soft shadows. Surfaces are nearly flat at rest and lift only in response to the hand. The floor carries fixed, blurred violet and rose light sources so the glass always has color behind it to frost.

### Shadow Vocabulary
- **Glass rest** (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(23,18,43,0.03), 0 1px 2px rgba(23,18,43,0.04), 0 1px 1px rgba(23,18,43,0.03)`): every card at rest.
- **Glass lifted** (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.95), 0 12px 32px -12px rgba(76,29,149,0.18), 0 2px 6px rgba(23,18,43,0.05)`): hover on cards, with a 2px rise on clickable ones.
- **Flare glow** (`box-shadow: 0 8px 24px -6px rgba(124,58,237,0.45)`): hover on the primary (Launch Flare) button only.
- **Dialog** (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 24px 64px -16px rgba(23,18,43,0.28), 0 2px 6px rgba(23,18,43,0.06)`): modals, over a 40% Console Ink scrim with a 4px blur.

### Named Rules
**The Quiet Glass Rule.** At rest, glass says nothing: lit rim, near-flat shadow. Lift, spotlight and rim brightening appear only on hover or focus, and only clickable cards rise.

**The Defeatable Glass Rule.** With `prefers-reduced-transparency`, every glass panel becomes solid Surface white with no blur.

## Shapes

Softly rounded and nested by size: 8px for controls (buttons, inputs, tags), 12px for rows, thumbnails and icon tiles, 20px for cards, 28px for the dashboard hero, and fully round (9999px) for count pills and avatars. Borders are 1px hairlines; dashboard cards add a masked 1px edge ring that is bright at the top-left and fades toward violet at the bottom-right. Status tags carry a 6px dot. Avatars are circles or 1/3.5-radius squircles depending on the platform page.

## Components

### Buttons
Crisp and small; the primary is the one loud thing on the screen.
- **Shape:** gently rounded (8px), 40px tall (44px touch targets on coarse pointers), 16px side padding, 14px/600 text.
- **Primary:** the Launch Flare gradient with white text. Hover adds the flare glow and a 1px rise; press scales to 0.97 in 80ms.
- **Secondary:** Surface white with a Hairline Strong border and Console Ink text; the border and text turn Mission Violet on hover.
- **Icon:** 36×36, transparent, Console Ink Muted icon; hover fills Violet Tint and the icon turns Mission Violet. Always has an `aria-label`.
- **Icon micro-motion:** arrows and chevrons in links nudge 3px toward their direction; plus icons turn 90° and refresh icons 60° on hover (240ms, ease-out).

### Chips / Tags
- **Status tag:** a status tint with its matching ink, 12px/600, 8px radius, a 6px dot in the ink color. Green (done/active), orange (pending), red (cancelled), blue (in progress), violet (priority), gray (other).
- **Filter chips / tabs:** transparent at rest with Console Ink Muted text; the active state is a Violet Tint fill with Mission Violet text.

### Cards / Containers
- **Corner Style:** 20px (28px for the dashboard hero).
- **Background:** Glass (72% white) with the 18px frost; solid Surface when reduced transparency is set.
- **Shadow Strategy:** Glass rest → Glass lifted (see Elevation & Depth).
- **Border:** 1px Hairline; Hairline Strong on hover.
- **Internal Padding:** 20px (18px 20px 12px for card headers).
- **Spotlight:** a 360px violet radial light at 7% follows the cursor on hover.

### Inputs / Fields
- **Style:** Surface white, 1px Hairline Strong border, 8px radius, 10px 12px padding, 14px text; placeholder #8C86A3.
- **Focus:** the border turns Mission Violet with a 4px violet ring at 12%.
- **Ask bar (dashboard):** 56px tall, 14px radius, with a keyboard-shortcut hint; on focus it gets a gradient ring and a soft glow.

### Navigation
- **Sidebar (console):** black, 248px, Inter 14px. Items are 32px tall with a 10px radius. Console Text at rest; white on 5% white on hover; white on 8% white when active. Sub-items use a 1px guide line and 4px dots. Below 900px it becomes a drawer over a Console Ink scrim.

### Tables
- **Header:** Row Mist fill, 12px/600 uppercase Console Ink Muted labels, 1px Hairline underline.
- **Rows:** 14px Console Ink cells with 12px 16px padding, alternating Surface and Row Mist. Hover tints the row violet at 4%, press at 8%, and keyboard focus inside a row at 5%. Numbers are tabular.

### Rank Row (signature)
A rank number (the top three get Launch Flare badges), a platform thumbnail, the name, the value, and a magnitude bar that grows from zero on entrance. Used for Twitch live, Steam top sellers and most played. On narrow cards the compact variant shrinks the rank to 20px and the thumbnail to 48px, and drops the struck-through old price.

### Page transitions and entrances
Route changes are view transitions: the old page leaves in 160ms (fade, 3px blur, 6px rise) while the sidebar holds still. The new page's first-viewport blocks rise 14px in 420ms, staggered by at most 300ms in total. Below-the-fold blocks reveal once on scroll (28px, 600ms). Modals rise out of a 4px blur in 320ms and exit in 140ms. Easing is `cubic-bezier(0.22, 1, 0.36, 1)`.

## Do's and Don'ts

### Do:
- **Do** keep one Launch Flare per view: the primary action, the headline highlight, or rank-1 badges.
- **Do** set every page on the Lavender Mist floor with glass cards (72% white, 18px frost, 20px radius, lit rim).
- **Do** use Mission Violet for anything active, selected or focused: tabs, links, focus rings (2px, 2px offset).
- **Do** route platform colors through `inkOf()` whenever they become text on light.
- **Do** use tabular numerals for every number in a column or a KPI.
- **Do** keep motion to one entrance per view, exits faster than entrances, and a reduced-motion path of short fades only.
- **Do** keep the sidebar black and still across every route.

### Don't:
- **Don't** put Kick (#53FC18) or Chzzk (#00FFA3) raw as text on a light surface.
- **Don't** put body text on the Launch Flare or use more than one Flare per view.
- **Don't** lift or spotlight cards that aren't clickable. Hover lift is for clickable cards only.
- **Don't** use emojis as icons. Use Lucide at a consistent stroke, or the platform's logo file.
- **Don't** animate the blur radius on large lists of cards, or loop anything other than live indicators and loading shimmer.
- **Don't** introduce gray (#8F8F8F-style) neutrals; neutrals are violet-tinted Console Ink.
- **Don't** delay or hide table rows and list items for animation; only whole blocks reveal.
