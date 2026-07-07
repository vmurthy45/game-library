# Deploying + Daily Steam Sync (one-time setup)

This gets your library on the web (GitHub Pages) and turns on the **daily sync**
that captures your play time automatically — even on days you never open the site.

## How it works

```
 GitHub Actions (runs 06:00 UTC daily)
   └─ runs tools/steam_sync.py with your Steam key (from encrypted Secrets)
   └─ commits data/steam_games.json + data/snapshots.json to the repo
 GitHub Pages serves the site
   └─ the site auto-loads data/ on open → play time + daily graph stay current
```

Your **Steam key** lives only in GitHub Secrets (encrypted, never in the code).
Your **scores / statuses / completion dates** stay in your browser (localStorage) —
they are *not* published to the repo.

## Steps

### 1. Put this folder in a GitHub repo
Make `game-library-tracker/` the **root** of a new repo (so `index.html`,
`tools/`, `data/`, and `.github/` sit at the top level). Push it to GitHub.

> Note: a **public** repo means your game list + hours are publicly viewable —
> the same data already public on your Steam profile. If you want them private,
> a private repo needs GitHub Pro for Pages (or switch to the Vercel+Firebase route).

### 2. Add your Steam secrets
Repo → **Settings → Secrets and variables → Actions → New repository secret**. Add two:

| Name | Value |
|------|-------|
| `STEAM_API_KEY` | your key from https://steamcommunity.com/dev/apikey |
| `STEAM_ID` | your 17-digit SteamID64 (`76561198022909290`) |

### 3. Allow the workflow to commit
Repo → **Settings → Actions → General → Workflow permissions** →
select **Read and write permissions** → Save.
(The daily job needs this to push the updated `data/` back to the repo.)

### 4. Turn on GitHub Pages
Repo → **Settings → Pages** → Source: **Deploy from a branch** →
Branch: `main`, folder: `/ (root)` → Save.
Your site appears at `https://<username>.github.io/<repo>/`.

### 5. Do the first sync now
Repo → **Actions → “Daily Steam sync” → Run workflow**.
The first run enriches all games with genre/Metacritic (~5–6 min); later runs are
fast because metadata is carried over. After it finishes, refresh your site —
your library and the “synced” date appear.

## After that

- It runs **once a day** automatically. Change the time in
  `.github/workflows/steam-sync.yml` (the `cron:` line) if you like.
- The **daily play-time graph** fills in from the 2nd day onward (it needs two
  snapshots to measure a day’s hours).
- Personal data (scores, statuses, completion, Steam Deck) lives in your browser.
  Use **Export** (JSON) now and then for a backup, or wait for the optional
  Firebase phase to sync those across devices.

## Local testing without deploying
```bash
python3 tools/steam_sync.py --out data --metadata   # writes data/ locally
python3 -m http.server 8090 --directory .            # open http://localhost:8090
```
