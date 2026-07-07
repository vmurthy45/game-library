# Game Library

A personal video game collection tracker — Steam, PlayStation, Xbox, Nintendo — with
scoring, play time, statuses, and metadata. Built as a **zero-build static site** so it
runs directly on GitHub Pages with no toolchain.

## Status: Phase 1 (local-only) ✅

Data currently lives in your browser's `localStorage`. Everything works offline.
Later phases add cloud sync (Firebase) and automatic library imports (Vercel + Steam/IGDB APIs)
**without changing this UI** — see Roadmap.

## Features (Phase 1)

- Library grid with cover art, platform badge, and status colour
- Per-game: **1–10 score**, **play time (hours)**, **Last Played** date, genre, Metacritic
- Status tags: **Currently Playing · Evergreen · Backlog · Finished · Shelved · Archived** (Archived is hidden from the library and excluded from all reports)
- **Status filter chips** with live counts (Archived chip appears only when you have archived games)
- **Collapsible sections** grouping the library by status
- **Steam / PlayStation / Nintendo logos** on cards
- **Interactive 1–10 star rating** (click, hover-to-preview, or keyboard) in the editor
- Search by title; filter by platform; sort by last played, title, score, play time, recently added
- Per-game fields: **Played on Steam Deck** (Steam only, with Deck icon), **First played** (auto-captured on 0→played transition, overwritable), **Completion date**, **Purchase date + price** (Steam has no price API, so these are manual)
- Search / platform / sort tucked behind a **Search & Sort** toggle in the tab bar
- **Insights tab** (landing page for reports): tiles (games, hours, hours this month, avg score, % finished, avg cost/hour), daily play-time graph, top 10 by play time, status & score breakdowns, top genres, **cost-per-hour** ranking, and a **monthly breakdown** table (hours + top games per month)
- **Year in Review tab**: a separate per-year recap (hours, finished/started/added, avg score, spend, highlights) — kept out of the main Insights view since it's only relevant once a year
- **Details tab**: full metadata in a sortable, filterable table (search, platform, status), with its own **CSV export** of the filtered rows
- Add / edit / delete via dialog
- **Import** a Steam library (see `tools/steam_sync.py`) — merges in, preserving your scores/statuses
- **Export**: JSON backup, **Library CSV**, and **daily Play-time CSV**
- Responsive (desktop + mobile) and light/dark themes
- Accessible: keyboard nav, focus styles, ARIA labels, reduced-motion support

## Run locally

No install needed. Any static server works, e.g.:

```bash
python3 -m http.server 8090 --directory game-library-tracker
# then open http://localhost:8090
```

Or just open `index.html` in a browser.

## Import your Steam library

```bash
python3 tools/steam_sync.py            # prompts for API key + SteamID64
python3 tools/steam_sync.py --metadata # + genre/Metacritic (throttled)
```

This writes `tools/steam_games.json`. In the app, click **Import** and pick that file.
Re-running later refreshes play time / last-played without touching your scores or statuses.
See the header of `tools/steam_sync.py` for how to get a (free) Steam API key and SteamID64.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup + dialog |
| `styles.css` | Theme tokens, responsive layout |
| `app.js` | State, localStorage, rendering, filtering, import/export, insights, auto-sync |
| `tools/steam_sync.py` | Fetches your Steam library → `steam_games.json` (+ `--out data` for the daily job) |
| `.github/workflows/steam-sync.yml` | Daily GitHub Action that syncs Steam and commits `data/` |

## Deploy + daily sync

See **[DEPLOY.md](DEPLOY.md)**. In short: push this folder as a repo, add your
`STEAM_API_KEY` + `STEAM_ID` as GitHub Secrets, enable Pages, and the included
GitHub Action syncs your library **once a day automatically** — capturing play
time even when you never open the site. The site auto-loads the committed `data/`.

## Roadmap

- **Done — Daily sync:** GitHub Actions runs `steam_sync.py` daily and commits
  `data/steam_games.json` + `data/snapshots.json`; the site auto-loads them.
- **Optional — Cross-device personal data:** Firebase Firestore (free tier) to sync
  your scores/statuses/completion dates across devices. Swap `store.load`/`store.save`
  in `app.js` for async Firestore calls; UI unchanged.
- **Optional — PlayStation:** no public play-time API; plan is manual entry /
  PS-Timetracker import as a baseline.
- **Optional — IGDB:** richer cross-platform metadata than the Steam storefront.

## Data model (one game)

```js
{
  id, title, platform,        // "Steam" | "PlayStation" | "Xbox" | "Nintendo" | "Other"
  status,                     // "Currently Playing" | "Evergreen" | "Backlog" | "Finished" | "Shelved" | "Archived"
  score,                      // 1–10 or null
  playtime,                   // hours (number)
  lastPlayed,                 // "YYYY-MM-DD"
  firstPlayed, completed,     // "YYYY-MM-DD" (firstPlayed auto-captured; both overwritable)
  purchaseDate,               // "YYYY-MM-DD" (manual)
  purchasePrice,              // number or null (manual — Steam has no price API)
  steamDeck,                  // boolean (Steam only)
  genre, metacritic, cover,   // metadata (from Steam storefront)
  added                       // timestamp
}
```
