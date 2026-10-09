# Unrivaled Stats

Next.js App Router port of `team-stats-filters-1-one-track-v19-leaders.html`.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. The root opens Team Stats; `/stats` opens Leaders,
`/stats/player` opens Player Stats, and `/stats/team` opens Team Stats.

```sh
npm run build
npm start
npm run typecheck
npm test
```

## Structure

- `app/`: Next.js routes, metadata, and the original responsive styles.
- `components/`: React page shell, icons, navigation, stats panels, footer, and design notes.
- `lib/stats-data.js`: the supplied snapshot, including embedded club assets extracted to `public/assets`.
- `lib/stats-engine.js`: filtering, formatting, ranking, and query-string state.
- `lib/stats-view.js`: the reference's interactive filters, tables, mobile rows, and leader cards.
- `scripts/build-stats.mjs`: combines the reference's behavior modules into one ordered browser script, loaded by Next Script after hydration. Runs before dev/build.

The interactive stats DOM retains the reference implementation; React renders the page shell.
This is a faithful port, not a live API integration. Player stats/leaders include only
the supplied 2025 regular-season per-game data. Game-winner counts remain explicitly
labelled placeholders; player portraits use initials. Team seasons without data show
the original empty states. Other site navigation links lead to the Unrivaled website.

The reference's design-note drawer is retained. Use `?rv=0` to hide its controls,
`?static=1` to disable entrance animations, and query parameters such as
`?season=2025&sort=ast&tab=team` to share a view. Google Fonts requires connectivity;
the Sequel font, branding, and club logos are served locally.
