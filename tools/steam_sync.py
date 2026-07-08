#!/usr/bin/env python3
"""
Steam library fetcher — local validation tool.

Pulls your owned games from the Steam Web API and writes them as JSON in the
app's data model (steam_games.json). Optionally enriches each game with genre
and Metacritic score from the Steam storefront.

Your API key is read from an environment variable and is NEVER printed or stored
in the output file. Run it yourself; you don't need to share the key with anyone.

--------------------------------------------------------------------------------
SETUP (one time)
--------------------------------------------------------------------------------
1. Get a Steam Web API key (free, instant):
     https://steamcommunity.com/dev/apikey
   Sign in, enter any domain (e.g. "localhost"), agree, copy the key.

2. Find your SteamID64 (a 17-digit number):
     Go to https://steamid.io/ , paste your profile URL, copy "steamID64".

3. Make sure your Steam profile game details are Public:
     Steam > Profile > Edit Profile > Privacy Settings >
     "Game details" = Public  (otherwise the API returns 0 games).

--------------------------------------------------------------------------------
RUN
--------------------------------------------------------------------------------
    cd "game-library-tracker/tools"
    export STEAM_API_KEY="your_key_here"
    export STEAM_ID="7656119xxxxxxxxxx"

    python3 steam_sync.py                 # owned games only (fast)
    python3 steam_sync.py --metadata      # + genre/Metacritic (slower, throttled)
    python3 steam_sync.py --metadata 30   # enrich only the 30 most-played games

Output: steam_games.json  (import this into the app later)
"""

import getpass
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date

OWNED_URL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
APPDETAILS_URL = "https://store.steampowered.com/api/appdetails"
CDN = "https://cdn.cloudflare.steamstatic.com/steam/apps"

OUTFILE = "steam_games.json"


def die(msg):
    print(f"\n✖ {msg}\n", file=sys.stderr)
    sys.exit(1)


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "game-library-tracker/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_owned(key, steamid):
    params = urllib.parse.urlencode({
        "key": key,
        "steamid": steamid,
        "include_appinfo": 1,
        "include_played_free_games": 1,
        "format": "json",
    })
    try:
        data = get_json(f"{OWNED_URL}?{params}")
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            die("Steam rejected the request (401/403). Check your API key.")
        die(f"HTTP error from Steam: {e.code} {e.reason}")
    except Exception as e:
        die(f"Could not reach Steam: {e}")

    games = (data.get("response") or {}).get("games")
    if games is None:
        die("No games returned. Is your SteamID64 correct and 'Game details' set to Public?")
    return games


def to_model(g):
    """Map a Steam game object to the app's data model."""
    appid = g["appid"]
    minutes = g.get("playtime_forever", 0)
    last_ts = g.get("rtime_last_played", 0)
    last_played = ""
    if last_ts:
        last_played = date.fromtimestamp(last_ts).isoformat()
    return {
        "id": f"steam_{appid}",
        "appid": appid,
        "title": g.get("name", f"App {appid}"),
        "platform": "Steam",
        "status": "Backlog",
        "score": None,
        "playtime": round(minutes / 60, 1),
        "lastPlayed": last_played,
        "genre": "",
        "metacritic": None,
        "cover": f"{CDN}/{appid}/header.jpg",
        "added": int(time.time() * 1000),
        "purchaseDate": None,
        "purchasePrice": None,
    }


def enrich(game):
    """Add genre + Metacritic from the storefront. Best-effort; failures ignored."""
    params = urllib.parse.urlencode({
        "appids": game["appid"],
        "filters": "genres,metacritic",
    })
    try:
        data = get_json(f"{APPDETAILS_URL}?{params}")
        entry = data.get(str(game["appid"]), {})
        if not entry.get("success"):
            return
        d = entry.get("data", {})
        genres = d.get("genres") or []
        if genres:
            game["genre"] = ", ".join(x["description"] for x in genres[:2])
        mc = d.get("metacritic")
        if mc and mc.get("score"):
            game["metacritic"] = mc["score"]
    except Exception:
        pass  # storefront is flaky/rate-limited; skip quietly


def clean(s):
    """Strip whitespace and any stray surrounding quotes from pasted input."""
    return (s or "").strip().strip('"').strip("'").strip()


def main():
    # Prefer env vars if set; otherwise prompt (avoids shell-quoting issues,
    # and the key stays out of your shell history).
    key = clean(os.environ.get("STEAM_API_KEY"))
    steamid = clean(os.environ.get("STEAM_ID"))
    if not key:
        key = clean(getpass.getpass("Steam API key (input hidden, press Enter): "))
    if not steamid:
        steamid = clean(input("SteamID64 (17-digit number): "))
    if not key:
        die("No Steam API key provided.")
    if not steamid:
        die("No SteamID64 provided.")
    if not steamid.isdigit() or len(steamid) != 17:
        print(f"⚠ '{steamid}' doesn't look like a 17-digit SteamID64 — continuing anyway.")

    want_meta = "--metadata" in sys.argv
    meta_limit = None
    if want_meta:
        i = sys.argv.index("--metadata")
        if i + 1 < len(sys.argv) and sys.argv[i + 1].isdigit():
            meta_limit = int(sys.argv[i + 1])

    # --out DIR : write into a data directory and maintain snapshot history
    # (used by the daily GitHub Action). Without it, behaves as before.
    out_dir = None
    if "--out" in sys.argv:
        i = sys.argv.index("--out")
        if i + 1 < len(sys.argv):
            out_dir = sys.argv[i + 1]

    print(f"Fetching owned games for SteamID {steamid} …")
    raw = fetch_owned(key, steamid)
    games = [to_model(g) for g in raw]
    games.sort(key=lambda x: x["playtime"], reverse=True)
    print(f"✔ {len(games)} games found. Top played:")
    for g in games[:5]:
        print(f"    {g['playtime']:>7.1f}h  {g['title']}")

    # Carry over previously-fetched genre/Metacritic so daily runs don't
    # re-scrape the whole library — only new/unenriched games hit the storefront.
    if out_dir:
        carry_over_metadata(os.path.join(out_dir, "steam_games.json"), games)

    if want_meta:
        # Only enrich games still missing metadata.
        targets = [g for g in games if not g["genre"]]
        if meta_limit is not None:
            targets = targets[:meta_limit]
        if targets:
            print(f"\nEnriching {len(targets)} games with genre/Metacritic (throttled)…")
            for n, g in enumerate(targets, 1):
                enrich(g)
                if n % 10 == 0:
                    print(f"    …{n}/{len(targets)}")
                time.sleep(1.5)  # respect storefront rate limits
        else:
            print("\nMetadata already up to date — nothing to enrich.")

    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
        games_path = os.path.join(out_dir, "steam_games.json")
        with open(games_path, "w", encoding="utf-8") as f:
            json.dump(games, f, indent=2, ensure_ascii=False)
        update_snapshots(os.path.join(out_dir, "snapshots.json"), games)
        print(f"\n✔ Wrote {len(games)} games to {games_path} and updated snapshots.json")
    else:
        with open(OUTFILE, "w", encoding="utf-8") as f:
            json.dump(games, f, indent=2, ensure_ascii=False)
        print(f"\n✔ Wrote {len(games)} games to {OUTFILE}")
    print("  (Your API key was not written to these files.)")


def carry_over_metadata(games_path, games):
    """Copy genre/Metacritic/purchase info from a previous steam_games.json onto
    matching games, so we don't re-scrape metadata that doesn't change and don't
    lose one-time-imported purchase history on the next daily run."""
    try:
        with open(games_path, "r", encoding="utf-8") as f:
            prev = json.load(f)
    except (FileNotFoundError, ValueError):
        return
    by_id = {g.get("id"): g for g in prev if isinstance(g, dict)}
    for g in games:
        old = by_id.get(g["id"])
        if not old:
            continue
        if not g["genre"] and old.get("genre"):
            g["genre"] = old["genre"]
        if g["metacritic"] is None and old.get("metacritic") is not None:
            g["metacritic"] = old["metacritic"]
        if old.get("purchaseDate") is not None:
            g["purchaseDate"] = old["purchaseDate"]
        if old.get("purchasePrice") is not None:
            g["purchasePrice"] = old["purchasePrice"]


def update_snapshots(path, games):
    """Append today's per-game total-hours snapshot; replace same-day. This is
    what makes the daily play-time graph accumulate even when the site is unused.
    Structure matches the app: {date, ts, totals:{gameId: hours}}."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            snaps = json.load(f)
        if not isinstance(snaps, list):
            snaps = []
    except (FileNotFoundError, ValueError):
        snaps = []

    today = date.today().isoformat()
    totals = {g["id"]: g["playtime"] for g in games}
    if snaps and snaps[-1].get("date") == today:
        snaps.pop()  # replace same-day snapshot
    snaps.append({"date": today, "ts": int(time.time() * 1000), "totals": totals})
    while len(snaps) > 400:
        snaps.pop(0)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(snaps, f, ensure_ascii=False)


if __name__ == "__main__":
    main()
