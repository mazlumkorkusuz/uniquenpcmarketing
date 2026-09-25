# Dashboard overrides

Rules here override `../MASTER.md` for the dashboard (`src/app/page.tsx`).
Decided by the product owner on 2026-09-25.

1. **Colors** — use MASTER colors as-is. Platform brand colors stay for platform
   content: Twitch `#9146FF`, YouTube `#FF0000`, Kick `#53FC18`, Steam `#1B2838`
   (full list in `src/lib/theme.ts`).
2. **Typography** — Calistoga for headings, Inter for body. JetBrains Mono is not used.
3. **Spacing, shadows, components** — from MASTER (`--space-*`, `--shadow-*`, button,
   card and input specs).
4. **Style** — Glassmorphism on dashboard cards, with text contrast of at least 4.5:1:
   - Primary (accent) buttons use MASTER's On Accent `#000000` text on `#EA580C`
     (white on `#EA580C` is ~3.6:1 and fails).
   - Cards are white glass (`#FFFFFF` at 72% + backdrop blur) over a `#F8FAFC`
     background with faint primary/accent light sources, not the `#F8FAFC` card fill
     in the card snippet (it would match the page background).
   - Solid white cards when the user prefers reduced transparency.
5. **Layout** — keep the existing dashboard structure: AI bar; row 1 stats; row 2
   meetings / notes / quick access; row 3 Steam top sellers / Steam most played /
   Twitch / news; row 4 Gamalytic. MASTER's "Hero + Features + CTA" page pattern
   does not apply.
