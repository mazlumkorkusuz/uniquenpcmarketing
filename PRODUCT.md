# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Marketing team (primary):** Unique NPC's in-house marketing team, working at their desks every day. They use it to run a game launch: find and contact streamers and Steam curators, send outreach mail, plan social and Reddit content, track budget, and keep meeting notes.
- **Leadership (secondary):** founders and leadership open the dashboard to see where the launch stands: reach, pipeline, spend, and upcoming meetings.

## Product Purpose

An internal launch command center for Unique NPC Games (name in the app: "Unique NPC Games Marketing", "Oyun şirketi pazarlama takip paneli"). It pulls everything a game launch needs into one place: outreach, social, Reddit, the content calendar, budget, and meetings.

Success means the launch runs on schedule and on budget, and the team and leadership can see its state without leaving the tool.

## Positioning

*Inferred from the repository; not stated by the user.* A generic CRM or spreadsheet can't cover the same ground: the tool tracks streamers on both Western and Asian platforms (Twitch, Kick, YouTube, SOOP, Chzzk, BiliBili, Douyin). It sits next to game-market data (Steam top sellers and most played, Steam curators, Gamalytic sales estimates) and runs the outreach mail from the same place.

## Operating Context

- Desktop and laptop screens during the workday; mobile only has to work.
- The team signs in with Supabase auth; there are no public pages apart from login.
- Live data comes from Twitch, Steam, Gamalytic and PC Gamer news. Streamers, curators, meetings, notes, budget and mail campaigns are stored in Supabase.
- Sections: Dashboard, Platformlar & Partnerler (Lurkit, Terminals.io, Mythic Talent), Yayıncılar (per platform), Toplantılar, Notlar, Sosyal Medya, Reddit, Bütçe, İçerik Planlaması, Sosyal Medya Planlama, Steam Küratörleri, Gamalytic, News, Mail Servisi (kampanyalar, şablonlar, tracking, ayarlar).

## Capabilities and Constraints

- **Language:** Turkish-only UI; no i18n planned. Keep the product's Turkish terms (yayıncı, küratör, toplantı, bütçe, kampanya).
- **One game at a time:** built around one game, currently *Tales of the Trade*. Multi-game support is not a requirement.
- **Desktop-first:** layouts are designed for desktop first; mobile must stay usable without horizontal scrolling.
- **Planned:** the dashboard question bar ("Verilerinize soru sorun…") will become a real feature that answers questions about the team's data. It has no backend today.
- **Undecided:** the question bar's scope and data sources; whether leadership gets its own view or permissions.

## Brand Commitments

- Company name: Unique NPC Games. Logo: `public/uniqlogo.png`. Login banner: `public/banner.png`.
- Platform logos in `public/icons/` stay as the platforms' own marks.

## Evidence on Hand

- Featured game: *Tales of the Trade* (the Steam/Gamalytic data and cover art the app loads).
- Real operational data lives in Supabase: streamers, curators, meetings, notes, budget, mail campaigns.
- This is an internal tool: no testimonials, customers or marketing claims exist, and none should be invented.

## Product Principles

1. **Launch state at a glance.** Anyone, the team or leadership, should see where the launch stands in seconds: pipeline, spend, what's next.
2. **Action next to information.** Wherever a streamer, curator or channel appears, the next step (contact, add note, schedule) is one click away.
3. **All platforms are equal.** Asian platforms (SOOP, Chzzk, BiliBili, Douyin) get the same depth as Twitch and YouTube.
4. **Real data only.** Show live or stored data or an honest empty/error state, never placeholder numbers.
5. **Fast for daily use.** Dense, scannable screens; motion and effects never slow down someone working through a list.

## Accessibility & Inclusion

Text contrast of at least 4.5:1 (3:1 for large text); `prefers-reduced-motion` and `prefers-reduced-transparency` are respected; visible keyboard focus. This matches the standard already set in `design-system/uniquenpc/MASTER.md`.
