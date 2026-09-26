# Dashboard overrides

Rules here override `../MASTER.md` for the dashboard (`src/app/page.tsx`).
Updated 2026-09-26: light bento redesign. The fixed row order from 2026-09-25 is lifted.

1. **Scope.** The dashboard keeps its own copy of the tokens (`dashboard.module.css` → `.root`).
   Since 2026-09-26 every other page uses the same MASTER tokens from `src/app/globals.css`
   (content area = `.app-main`). The sidebar and the login page stay dark.
2. **Ambient background.** Two large blurred color light sources (primary violet top-left, rose
   top-right) at 10–18% opacity behind the glass cards. They are decorative (`aria-hidden`) and
   static, not animated.
3. **Layout (12-column bento, 20px gap):**
   - Hero (8 cols): time-of-day greeting eyebrow, display headline with one gradient word, date,
     AI query bar with ⌘K and suggestion chips.
   - Featured game (4 cols): Tales of the Trade cover, Gamalytic wishlist count-up, facts.
   - KPIs (4 × 3 cols): streamers (platform segment bar), active platforms (platform dots),
     meetings (upcoming split), budget (SVG ring gauge).
   - "Ekibin gündemi" section: meetings (5), notes (4), quick access (3).
   - "Pazar nabzı" section: Twitch live (4), Steam top sellers (4), Steam most played (4).
   - "Sektörden haberler" section: 4 image cards (12).
   - Breakpoints: 1280px and up is full bento; 1024–1279px is hero and featured stacked, 2-col KPIs,
     2-col widgets; under 768px everything is 1 column.
4. **Motion budget.** Tile entrance stagger (once), KPI count-up (once, 900ms), bar/ring fills
   (once), live dot pulse (Twitch only). Hovers: lift plus spotlight.
