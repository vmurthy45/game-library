/* ============================================================
   Game Library — Phase 1 (local-only)
   Data lives in localStorage. No build step, no dependencies.
   Firebase/Vercel sync layers slot in later without changing
   this UI: replace `store.load`/`store.save` with async calls.
   ============================================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "gameLibrary.v1";
  const THEME_KEY = "gameLibrary.theme";
  const COLLAPSE_KEY = "gameLibrary.collapsed";
  const SNAP_KEY = "gameLibrary.snapshots.v1";

  // Display order for chips & sections (Archived is separate — hidden from
  // the default view and excluded from all reports).
  const STATUS_ORDER = ["Currently Playing", "Evergreen", "Backlog", "Finished", "Shelved"];
  const ARCHIVED = "Archived";
  const STATUSES = STATUS_ORDER.concat(ARCHIVED);
  const STATUS_COLORS = {
    "Currently Playing": "var(--st-playing)",
    "Evergreen": "var(--st-evergreen)",
    "Backlog": "var(--st-backlog)",
    "Finished": "var(--st-finished)",
    "Shelved": "var(--st-abandoned)",
    "Archived": "var(--st-archived)",
  };
  // Steam Deck brand icon (simple-icons).
  const DECK_ICON = '<svg class="deck-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.999 0v4.309c4.242 0 7.694 3.45 7.694 7.691s-3.452 7.691-7.694 7.691V24c6.617 0 12-5.383 12-12s-5.383-12-12-12Zm0 6.011c-3.313 0-6 2.687-5.998 6a5.999 5.999 0 1 0 5.998-6z"/></svg>';

  // Brand logos (from simple-icons, single-path 24x24). Xbox/Other fall back to emoji.
  const PLATFORM_LOGOS = {
    "Steam": '<svg class="plogo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/></svg>',
    "PlayStation": '<svg class="plogo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.984 2.596v17.547l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.18.76.814.76 1.505v5.875c2.441 1.193 4.362-.002 4.362-3.152 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.39-1.502zm4.656 16.241l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5V14.98l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.04 1.472 1.576 2.072-.465.6-1.622 1.036-1.622 1.036l-8.544 3.107V18.86zM1.807 18.6c-1.9-.545-2.214-1.668-1.352-2.32.801-.586 2.16-1.052 2.16-1.052l5.615-2.013v2.313L4.205 17c-.705.271-.825.632-.239.826.586.195 1.637.15 2.343-.12L8.247 17v2.074c-.12.03-.256.044-.39.073-1.939.331-3.996.196-6.038-.479z"/></svg>',
    "Nintendo": '<svg class="plogo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.176 24h3.674c3.376 0 6.15-2.774 6.15-6.15V6.15C24 2.775 21.226 0 17.85 0H14.1c-.074 0-.15.074-.15.15v23.7c-.001.076.075.15.226.15zm4.574-13.199c1.351 0 2.399 1.125 2.399 2.398 0 1.352-1.125 2.4-2.399 2.4-1.35 0-2.4-1.049-2.4-2.4-.075-1.349 1.05-2.398 2.4-2.398zM11.4 0H6.15C2.775 0 0 2.775 0 6.15v11.7C0 21.226 2.775 24 6.15 24h5.25c.074 0 .15-.074.15-.149V.15c.001-.076-.075-.15-.15-.15zM9.676 22.051H6.15c-2.326 0-4.201-1.875-4.201-4.201V6.15c0-2.326 1.875-4.201 4.201-4.201H9.6l.076 20.102zM3.75 7.199c0 1.275.975 2.25 2.25 2.25s2.25-.975 2.25-2.25c0-1.273-.975-2.25-2.25-2.25s-2.25.977-2.25 2.25z"/></svg>',
  };
  const PLATFORM_FALLBACK = { "Xbox": "🎮", "Other": "💿" };

  /* ---------- Persistence ---------- */
  const store = {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.warn("Could not read library:", e);
        return null;
      }
    },
    save(list) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.error("Could not save library:", e);
        alert("Could not save — your browser storage may be full or blocked.");
      }
    },
  };

  /* ---------- App state ---------- */
  // Starts empty; populate via "Import" (Steam JSON) or "Add game".
  let games = (store.load() || []).map(migrate);

  const ui = { search: "", platform: "", status: "", sort: "lastPlayed", view: "library" };
  let collapsed = loadCollapsed();

  function migrate(g) {
    if (g && g.status === "Abandoned") g.status = "Shelved"; // renamed
    return g;
  }
  function loadCollapsed() {
    try { return new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY)) || []); }
    catch (e) { return new Set(); }
  }
  function saveCollapsed() {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...collapsed]));
  }

  /* ---------- DOM refs ---------- */
  const $ = (sel) => document.querySelector(sel);
  const sectionsEl = $("#sections");
  const emptyState = $("#emptyState");
  const chipsEl = $("#statusChips");
  const dialog = $("#gameDialog");
  const form = $("#gameForm");

  /* ---------- Formatting helpers ---------- */
  function fmtHours(h) {
    if (h == null || h === "" || isNaN(h)) return "—";
    const n = Number(h);
    return n >= 100 ? Math.round(n) + "h" : n.toFixed(1).replace(/\.0$/, "") + "h";
  }
  function fmtDate(d) {
    if (!d) return "—";
    const date = new Date(d + "T00:00:00");
    if (isNaN(date)) return "—";
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function platformBadge(p) {
    const logo = PLATFORM_LOGOS[p] || "";
    const fallback = logo ? "" : `<span aria-hidden="true">${PLATFORM_FALLBACK[p] || "🎮"}</span> `;
    return `<span class="card__platform plat-${escapeHtml((p || "other").toLowerCase())}">${logo}${fallback}${escapeHtml(p)}</span>`;
  }
  function coverGlyph(p) {
    return PLATFORM_LOGOS[p] || `<span aria-hidden="true">${PLATFORM_FALLBACK[p] || "🎮"}</span>`;
  }

  /* ---------- Filtering / sorting ---------- */
  // Games that count toward the library view, counts, and all reports.
  function reportable() { return games.filter((g) => g.status !== ARCHIVED); }

  function getFiltered() {
    const q = ui.search.trim().toLowerCase();
    const viewingArchived = ui.status === ARCHIVED;
    const list = games.filter((g) => {
      // Archived is hidden unless its chip is explicitly selected.
      if (g.status === ARCHIVED) { if (!viewingArchived) return false; }
      else if (viewingArchived) return false;
      if (ui.platform && g.platform !== ui.platform) return false;
      if (ui.status && ui.status !== ARCHIVED && g.status !== ui.status) return false;
      if (q && !g.title.toLowerCase().includes(q)) return false;
      return true;
    });
    const cmp = {
      title: (a, b) => a.title.localeCompare(b.title),
      score: (a, b) => (b.score || 0) - (a.score || 0),
      playtime: (a, b) => (b.playtime || 0) - (a.playtime || 0),
      added: (a, b) => (b.added || 0) - (a.added || 0),
      lastPlayed: (a, b) => (b.lastPlayed || "").localeCompare(a.lastPlayed || ""),
    }[ui.sort];
    return list.sort(cmp);
  }

  /* ---------- Chips ---------- */
  function renderChips() {
    const counts = { "": reportable().length };
    STATUS_ORDER.forEach((s) => { counts[s] = games.filter((g) => g.status === s).length; });
    counts[ARCHIVED] = games.filter((g) => g.status === ARCHIVED).length;
    const totalHours = Math.round(reportable().reduce((s, g) => s + (Number(g.playtime) || 0), 0));

    const chip = (val, label, color) =>
      `<button class="chip${ui.status === val ? " chip--active" : ""}" type="button" data-status="${escapeHtml(val)}">
        ${color ? `<span class="chip__dot" style="background:${color}"></span>` : ""}
        <span class="chip__label">${label}</span>
        <span class="chip__count">${counts[val] || 0}</span>
      </button>`;

    let html = chip("", "All", "");
    STATUS_ORDER.forEach((s) => { html += chip(s, escapeHtml(s), STATUS_COLORS[s]); });
    if (counts[ARCHIVED]) html += chip(ARCHIVED, ARCHIVED, STATUS_COLORS[ARCHIVED]);
    const sync = lastSyncDate ? ` · synced ${fmtDate(lastSyncDate)}` : "";
    html += `<span class="chips__hours" title="Total play time${lastSyncDate ? "; last Steam sync " + lastSyncDate : ""}">Σ ${totalHours}h${sync}</span>`;
    chipsEl.innerHTML = html;
  }

  /* ---------- Card + sections ---------- */
  function cardHtml(g) {
    const cover = g.cover
      ? `<img src="${escapeHtml(g.cover)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="card__cover-fallback" style="display:none" aria-hidden="true">${coverGlyph(g.platform)}</span>`
      : `<span class="card__cover-fallback" aria-hidden="true">${coverGlyph(g.platform)}</span>`;
    const scoreStr = g.score ? `<span class="score">★ ${g.score}/10</span>` : "—";
    return `
      <button class="card" data-id="${g.id}" type="button" aria-label="Edit ${escapeHtml(g.title)}">
        <div class="card__cover">
          ${cover}
          ${platformBadge(g.platform)}
          <span class="card__status-dot" style="background:${STATUS_COLORS[g.status] || "#888"}" title="${escapeHtml(g.status)}"></span>
        </div>
        <div class="card__body">
          <h3 class="card__title">${escapeHtml(g.title)}</h3>
          <div class="card__meta">
            ${g.genre ? `<span>${escapeHtml(g.genre)}</span>` : ""}
            ${g.metacritic ? `<span>• MC ${g.metacritic}</span>` : ""}
            ${g.steamDeck ? `<span class="badge-deck" title="Played on Steam Deck">${DECK_ICON} Deck</span>` : ""}
            ${g.completed ? `<span class="badge-done" title="Completed">✓ ${fmtDate(g.completed)}</span>` : ""}
          </div>
          <div class="card__stats">
            <div class="card__stat"><b>${fmtHours(g.playtime)}</b><span>Play time</span></div>
            <div class="card__stat"><b>${scoreStr}</b><span>My score</span></div>
          </div>
          <div class="card__meta"><span>Last played: ${fmtDate(g.lastPlayed)}</span></div>
        </div>
      </button>`;
  }

  function sectionHtml(status, items) {
    const isCollapsed = collapsed.has(status);
    const cards = items.map(cardHtml).join("");
    return `
      <section class="section${isCollapsed ? " section--collapsed" : ""}" data-status="${escapeHtml(status)}">
        <button class="section__head" type="button" aria-expanded="${!isCollapsed}">
          <span class="section__chevron" aria-hidden="true">▸</span>
          <span class="section__dot" style="background:${STATUS_COLORS[status] || "#888"}"></span>
          <span class="section__title">${escapeHtml(status)}</span>
          <span class="section__count">${items.length}</span>
        </button>
        <div class="grid section__grid">${cards}</div>
      </section>`;
  }

  function render() {
    renderChips();
    const list = getFiltered();
    if (list.length === 0) {
      sectionsEl.innerHTML = "";
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    // Group by status, preserving each group's sorted order.
    const groups = {};
    list.forEach((g) => { (groups[g.status] = groups[g.status] || []).push(g); });

    const order = (ui.status === ARCHIVED ? [ARCHIVED] : STATUS_ORDER)
      .filter((s) => groups[s] && groups[s].length);
    sectionsEl.innerHTML = order.map((s) => sectionHtml(s, groups[s])).join("");
  }

  /* ---------- Star rating widget ---------- */
  const starsEl = $("#scoreStars");
  function buildStars() {
    let html = "";
    for (let i = 1; i <= 10; i++) {
      html += `<button type="button" class="star" data-val="${i}" tabindex="-1" aria-label="${i} out of 10">★</button>`;
    }
    html += `<button type="button" class="star-clear" data-val="0" title="Clear rating">✕</button>`;
    starsEl.innerHTML = html;
  }
  function setStars(val) {
    const v = val == null ? 0 : Number(val);
    $("#f_score").value = v ? v : "";
    starsEl.setAttribute("aria-valuenow", v);
    starsEl.querySelectorAll(".star").forEach((el) => {
      el.classList.toggle("on", Number(el.dataset.val) <= v);
    });
    starsEl.dataset.val = v;
  }

  /* ---------- Dialog (add / edit) ---------- */
  function openDialog(game) {
    const isEdit = !!game;
    $("#dialogTitle").textContent = isEdit ? "Edit game" : "Add game";
    $("#gameId").value = isEdit ? game.id : "";
    $("#f_title").value = isEdit ? game.title : "";
    $("#f_platform").value = isEdit ? game.platform : "Steam";
    $("#f_status").value = isEdit ? game.status : "Backlog";
    setStars(isEdit ? game.score : 0);
    $("#f_playtime").value = isEdit && game.playtime != null ? game.playtime : "";
    $("#f_lastPlayed").value = isEdit ? (game.lastPlayed || "") : "";
    $("#f_firstPlayed").value = isEdit ? (game.firstPlayed || "") : "";
    $("#f_completed").value = isEdit ? (game.completed || "") : "";
    $("#f_purchaseDate").value = isEdit ? (game.purchaseDate || "") : "";
    $("#f_purchasePrice").value = isEdit && game.purchasePrice != null ? game.purchasePrice : "";
    $("#f_steamDeck").checked = isEdit ? !!game.steamDeck : false;
    $("#f_genre").value = isEdit ? (game.genre || "") : "";
    $("#f_metacritic").value = isEdit && game.metacritic != null ? game.metacritic : "";
    $("#f_cover").value = isEdit ? (game.cover || "") : "";
    $("#deleteBtn").hidden = !isEdit;
    updateSteamDeckVisibility();

    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    $("#f_title").focus();
  }
  function closeDialog() {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }
  function updateSteamDeckVisibility() {
    $("#f_steamDeckRow").hidden = $("#f_platform").value !== "Steam";
  }
  function readForm() {
    const num = (v) => (v === "" || v == null ? null : Number(v));
    const platform = $("#f_platform").value;
    return {
      id: $("#gameId").value || uid(),
      title: $("#f_title").value.trim(),
      platform: platform,
      status: $("#f_status").value,
      score: clamp(num($("#f_score").value), 1, 10),
      playtime: Math.max(0, num($("#f_playtime").value) || 0),
      lastPlayed: $("#f_lastPlayed").value || "",
      firstPlayed: $("#f_firstPlayed").value || "",
      completed: $("#f_completed").value || "",
      purchaseDate: $("#f_purchaseDate").value || "",
      purchasePrice: (function () { const v = $("#f_purchasePrice").value; return v === "" ? null : Math.max(0, Number(v)); })(),
      steamDeck: platform === "Steam" ? $("#f_steamDeck").checked : false,
      genre: $("#f_genre").value.trim(),
      metacritic: clamp(num($("#f_metacritic").value), 0, 100),
      cover: $("#f_cover").value.trim(),
    };
  }
  function saveGame(e) {
    e.preventDefault();
    const data = readForm();
    if (!data.title) { $("#f_title").focus(); return; }
    const idx = games.findIndex((g) => g.id === data.id);
    if (idx >= 0) games[idx] = Object.assign({}, games[idx], data);
    else { data.added = Date.now(); games.push(data); }
    store.save(games);
    render();
    closeDialog();
  }
  function deleteGame() {
    const id = $("#gameId").value;
    if (!id) return;
    const g = games.find((x) => x.id === id);
    if (!confirm(`Delete “${g ? g.title : "this game"}” from your library?`)) return;
    games = games.filter((x) => x.id !== id);
    store.save(games);
    render();
    closeDialog();
  }

  /* ---------- Import / Export ----------
     merge(): update play-derived fields from a sync source (Steam), but never
     clobber the user's own score/status/manual metadata. Same behaviour the
     live "Sync from Steam" button will use later. */
  function mergeGames(incoming) {
    const byId = new Map(games.map((g) => [g.id, g]));
    let added = 0, updated = 0;
    incoming.forEach((raw) => {
      const inc = normalizeImported(raw);
      if (!inc || !inc.title) return;
      const existing = byId.get(inc.id);
      if (!existing) {
        games.push(inc); byId.set(inc.id, inc); added++;
      } else {
        existing.playtime = inc.playtime;                 // Steam = source of truth
        if (inc.lastPlayed) existing.lastPlayed = inc.lastPlayed;
        if (inc.title) existing.title = inc.title;
        if (!existing.cover && inc.cover) existing.cover = inc.cover;
        if (!existing.genre && inc.genre) existing.genre = inc.genre;
        if (existing.metacritic == null && inc.metacritic != null) existing.metacritic = inc.metacritic;
        // score & status are USER data — untouched.
        updated++;
      }
    });
    return { added, updated };
  }
  function normalizeImported(raw) {
    if (!raw || typeof raw !== "object" || !raw.title) return null;
    const num = (v) => (v === "" || v == null || isNaN(v) ? null : Number(v));
    let status = raw.status === "Abandoned" ? "Shelved" : raw.status;
    return {
      id: raw.id || (raw.appid ? "steam_" + raw.appid : uid()),
      appid: raw.appid,
      title: String(raw.title).slice(0, 200),
      platform: raw.platform || "Steam",
      status: STATUSES.includes(status) ? status : "Backlog",
      score: clamp(num(raw.score), 1, 10),
      playtime: Math.max(0, num(raw.playtime) || 0),
      lastPlayed: typeof raw.lastPlayed === "string" ? raw.lastPlayed : "",
      firstPlayed: typeof raw.firstPlayed === "string" ? raw.firstPlayed : "",
      completed: typeof raw.completed === "string" ? raw.completed : "",
      purchaseDate: typeof raw.purchaseDate === "string" ? raw.purchaseDate : "",
      purchasePrice: raw.purchasePrice == null || isNaN(raw.purchasePrice) ? null : Number(raw.purchasePrice),
      steamDeck: !!raw.steamDeck,
      genre: raw.genre ? String(raw.genre) : "",
      metacritic: clamp(num(raw.metacritic), 0, 100),
      cover: raw.cover ? String(raw.cover) : "",
      added: raw.added || Date.now(),
    };
  }
  function handleImportFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let parsed;
      try { parsed = JSON.parse(reader.result); }
      catch (e) { alert("That file isn't valid JSON. Pick the steam_games.json the script produced."); return; }
      const list = Array.isArray(parsed) ? parsed : parsed.games;
      if (!Array.isArray(list)) { alert("Couldn't find a list of games in that file."); return; }
      const { added, updated } = mergeGames(list);
      store.save(games);
      recordSnapshot();       // for the daily-playtime graph
      applyFirstPlayed();     // capture first-play transitions
      render();
      alert(`Import complete:\n• ${added} new game${added === 1 ? "" : "s"} added\n• ${updated} existing updated (your scores & statuses kept)`);
    };
    reader.onerror = () => alert("Could not read that file.");
    reader.readAsText(file);
  }
  function exportLibrary() {
    downloadBlob(JSON.stringify(games, null, 2), "application/json",
      `game-library-${new Date().toISOString().slice(0, 10)}.json`);
  }
  function csvCell(v) {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function exportCSV() {
    const cols = ["Title", "Platform", "Status", "Score", "Play time (h)", "First played",
      "Last played", "Completion date", "Purchase date", "Purchase price", "Steam Deck", "Genre", "Metacritic"];
    const rows = games.map((g) => [
      g.title, g.platform, g.status, g.score || "", g.playtime || 0,
      g.firstPlayed || "", g.lastPlayed || "", g.completed || "",
      g.purchaseDate || "", g.purchasePrice != null ? g.purchasePrice : "",
      g.steamDeck ? "Yes" : "", g.genre || "", g.metacritic || "",
    ].map(csvCell).join(","));
    const csv = cols.join(",") + "\n" + rows.join("\n");
    downloadBlob(csv, "text/csv", `game-library-${new Date().toISOString().slice(0, 10)}.csv`);
  }
  function exportDailyCSV() {
    const data = computeDailyPlaytime();
    const csv = "Date,Hours played\n" + data.map((d) => `${d.date},${d.hours.toFixed(2)}`).join("\n");
    downloadBlob(csv, "text/csv", `playtime-daily-${new Date().toISOString().slice(0, 10)}.csv`);
  }
  function downloadBlob(content, type, filename) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  /* ---------- Snapshots → daily playtime ----------
     Steam only exposes TOTAL hours per game, not a day-by-day history. So we
     snapshot totals on each sync/import and diff consecutive snapshots to get
     hours added per day. The graph fills in from the 2nd sync onward. */
  function loadSnapshots() {
    try { return JSON.parse(localStorage.getItem(SNAP_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveSnapshots(snaps) { localStorage.setItem(SNAP_KEY, JSON.stringify(snaps)); }
  // Union local + server snapshots by date (server wins on conflicts).
  function mergeSnapshots(serverSnaps) {
    if (!Array.isArray(serverSnaps)) return;
    const byDate = new Map(loadSnapshots().map((s) => [s.date, s]));
    serverSnaps.forEach((s) => { if (s && s.date) byDate.set(s.date, s); });
    const merged = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    saveSnapshots(merged);
  }

  /* ---------- Auto-sync from the daily GitHub Action ----------
     The scheduled workflow commits data/steam_games.json + data/snapshots.json.
     On load we pull them in: play time/last-played refresh, snapshot history
     (built server-side even when the site is closed) drives the daily graph.
     Fails silently offline / when the files aren't there (e.g. local file://). */
  let lastSyncDate = null;
  async function autoSyncFromServer() {
    try {
      const [gRes, sRes] = await Promise.all([
        fetch("data/steam_games.json", { cache: "no-store" }).catch(() => null),
        fetch("data/snapshots.json", { cache: "no-store" }).catch(() => null),
      ]);
      let changed = false;
      if (sRes && sRes.ok) {
        mergeSnapshots(await sRes.json());
        const snaps = loadSnapshots();
        if (snaps.length) lastSyncDate = snaps[snaps.length - 1].date;
        changed = true;
      }
      if (gRes && gRes.ok) {
        const list = await gRes.json();
        if (Array.isArray(list)) { mergeGames(list); store.save(games); changed = true; }
      }
      if (changed) {
        applyFirstPlayed();
        render();
        if (ui.view === "insights") renderInsights();
        else if (ui.view === "year") renderYearReview();
        else if (ui.view === "details") renderDetails();
      }
    } catch (e) {
      /* offline or files absent — nothing to do */
    }
  }
  function recordSnapshot() {
    const snaps = loadSnapshots();
    const totals = {};
    games.forEach((g) => { totals[g.id] = Number(g.playtime) || 0; });
    const today = new Date().toISOString().slice(0, 10);
    // If the last snapshot is from today, replace it (avoid double-counting same-day syncs).
    if (snaps.length && snaps[snaps.length - 1].date === today) snaps.pop();
    snaps.push({ date: today, ts: Date.now(), totals });
    // keep it bounded
    while (snaps.length > 400) snaps.shift();
    localStorage.setItem(SNAP_KEY, JSON.stringify(snaps));
  }
  function archivedIds() {
    return new Set(games.filter((g) => g.status === ARCHIVED).map((g) => g.id));
  }
  function computeDailyPlaytime() {
    const snaps = loadSnapshots();
    if (snaps.length < 2) return [];
    const skip = archivedIds();
    const perDay = {};
    for (let i = 1; i < snaps.length; i++) {
      const prev = snaps[i - 1].totals, cur = snaps[i].totals;
      let delta = 0;
      Object.keys(cur).forEach((id) => {
        if (skip.has(id)) return;
        const d = (cur[id] || 0) - (prev[id] || 0);
        if (d > 0) delta += d;
      });
      perDay[snaps[i].date] = (perDay[snaps[i].date] || 0) + delta;
    }
    return Object.keys(perDay).sort().map((date) => ({ date, hours: perDay[date] }));
  }
  // Per-game hours added within a given calendar year (from snapshot diffs).
  function computeGameHoursForYear(year) {
    const snaps = loadSnapshots();
    const skip = archivedIds();
    const perGame = {};
    for (let i = 1; i < snaps.length; i++) {
      if (snaps[i].date.slice(0, 4) !== String(year)) continue;
      const prev = snaps[i - 1].totals, cur = snaps[i].totals;
      Object.keys(cur).forEach((id) => {
        if (skip.has(id)) return;
        const d = (cur[id] || 0) - (prev[id] || 0);
        if (d > 0) perGame[id] = (perGame[id] || 0) + d;
      });
    }
    return perGame;
  }
  // Auto-set "First played" when a game genuinely transitions 0 → >0 across syncs.
  // (Pre-existing games can't be back-dated — Steam gives no first-played date.)
  function applyFirstPlayed() {
    const snaps = loadSnapshots();
    if (snaps.length < 2) return;
    const firstTransition = {};
    for (let i = 1; i < snaps.length; i++) {
      const prev = snaps[i - 1].totals, cur = snaps[i].totals;
      Object.keys(cur).forEach((id) => {
        if ((cur[id] || 0) > 0 && (prev[id] || 0) === 0 && !firstTransition[id]) {
          firstTransition[id] = snaps[i].date;
        }
      });
    }
    let changed = false;
    games.forEach((g) => {
      if (!g.firstPlayed && firstTransition[g.id]) { g.firstPlayed = firstTransition[g.id]; changed = true; }
    });
    if (changed) store.save(games);
  }

  /* ---------- Insights view ---------- */
  let insightsYear = new Date().getFullYear();

  function availableYears() {
    const set = new Set();
    games.forEach((g) => {
      [g.completed, g.firstPlayed, g.lastPlayed].forEach((d) => { if (d) set.add(d.slice(0, 4)); });
      if (g.added) set.add(new Date(g.added).getFullYear().toString());
    });
    loadSnapshots().forEach((s) => set.add(s.date.slice(0, 4)));
    set.add(String(new Date().getFullYear()));
    return [...set].filter(Boolean).sort().reverse();
  }

  function renderInsights() {
    const el = $("#insightsMain");
    const data = reportable();   // exclude Archived from all reports
    if (data.length === 0) {
      el.innerHTML = `<div class="empty"><p class="empty__title">No data yet</p>
        <p class="empty__hint">Import your Steam library to see insights.</p></div>`;
      return;
    }
    const total = data.length;
    const totalHours = data.reduce((s, g) => s + (Number(g.playtime) || 0), 0);
    const hoursThisMonth = computeHoursThisMonth();
    const rated = data.filter((g) => g.score);
    const avgScore = rated.length ? (rated.reduce((s, g) => s + g.score, 0) / rated.length) : 0;
    const finished = data.filter((g) => g.status === "Finished").length;
    const cost = computeCostPerHour(data);

    const tiles = [
      { n: total, l: "Games" },
      { n: Math.round(totalHours).toLocaleString() + "h", l: "Total played" },
      { n: hoursThisMonth ? fmtHours(hoursThisMonth) : "—", l: "Hours this month" },
      { n: rated.length ? avgScore.toFixed(1) : "—", l: "Avg score" },
      { n: total ? Math.round(finished / total * 100) + "%" : "—", l: "Finished" },
      { n: cost.avg != null ? formatMoney(cost.avg) + "/h" : "—", l: "Avg cost/hour" },
    ];
    const tilesHtml = tiles.map((t) =>
      `<div class="itile"><div class="itile__n">${t.n}</div><div class="itile__l">${t.l}</div></div>`).join("");

    el.innerHTML = `
      <div class="insights__head">
        <div class="insights__actions">
          <button class="btn" id="csvBtn" type="button"><span aria-hidden="true">⬇</span> Library CSV</button>
          <button class="btn" id="csvDailyBtn" type="button"><span aria-hidden="true">⬇</span> Play-time CSV</button>
        </div>
      </div>
      <div class="itiles">${tilesHtml}</div>
      <div class="icards">
        ${cardBlock("Daily play time", dailyChart())}
        ${cardBlock("Top 10 by play time", topGamesChart())}
        ${cardBlock("By status", statusChart())}
        ${cardBlock("Score distribution", scoreChart())}
        ${cardBlock("Top genres", genreChart())}
        ${cardBlock("Cost per hour", costPerHourChart(cost))}
        ${cardBlock("Monthly breakdown", monthlyBreakdownTable(), true)}
      </div>`;

    $("#csvBtn").addEventListener("click", exportCSV);
    $("#csvDailyBtn").addEventListener("click", exportDailyCSV);
  }

  /* ---------- Year in Review (own tab) ---------- */
  function renderYearReview() {
    const el = $("#yearMain");
    if (reportable().length === 0) {
      el.innerHTML = `<div class="empty"><p class="empty__title">No data yet</p>
        <p class="empty__hint">Import your Steam library to see your year in review.</p></div>`;
      return;
    }
    const years = availableYears();
    if (!years.includes(String(insightsYear))) insightsYear = Number(years[0]);
    const yearOpts = years.map((y) =>
      `<option value="${y}"${Number(y) === insightsYear ? " selected" : ""}>${y}</option>`).join("");
    el.innerHTML = yearReviewBlock(insightsYear, yearOpts);
    const ys = $("#yearSelect");
    if (ys) ys.addEventListener("change", (e) => { insightsYear = Number(e.target.value); renderYearReview(); });
  }

  function yearReviewBlock(year, yearOpts) {
    const y = String(year);
    const data = reportable();
    const inYear = (d) => d && d.slice(0, 4) === y;
    const finishedThisYear = data.filter((g) => inYear(g.completed));
    const startedThisYear = data.filter((g) => inYear(g.firstPlayed));
    const addedThisYear = data.filter((g) => g.added && new Date(g.added).getFullYear() === year);
    const ratedThisYear = finishedThisYear.filter((g) => g.score);
    const avg = ratedThisYear.length
      ? (ratedThisYear.reduce((s, g) => s + g.score, 0) / ratedThisYear.length).toFixed(1) : "—";
    const spentThisYear = data.filter((g) => inYear(g.purchaseDate))
      .reduce((s, g) => s + (Number(g.purchasePrice) || 0), 0);

    const hoursByGame = computeGameHoursForYear(year);
    const hoursThisYear = Object.values(hoursByGame).reduce((s, h) => s + h, 0);
    const topByHours = Object.keys(hoursByGame)
      .map((id) => ({ g: games.find((x) => x.id === id), h: hoursByGame[id] }))
      .filter((x) => x.g).sort((a, b) => b.h - a.h).slice(0, 5);

    const topRated = finishedThisYear.slice().sort((a, b) => (b.score || 0) - (a.score || 0))[0];

    const stats = [
      { n: hoursThisYear ? Math.round(hoursThisYear) + "h" : "—", l: "Hours played" },
      { n: finishedThisYear.length, l: "Finished" },
      { n: startedThisYear.length, l: "Newly started" },
      { n: addedThisYear.length, l: "Added" },
      { n: avg, l: "Avg score" },
      { n: spentThisYear ? formatMoney(spentThisYear) : "—", l: "Spent" },
    ];
    const statHtml = stats.map((s) =>
      `<div class="yr__stat"><div class="yr__n">${s.n}</div><div class="yr__l">${s.l}</div></div>`).join("");

    let highlights = "";
    if (topByHours.length) {
      highlights += `<div class="yr__col"><h4>Most played this year</h4><ol class="yr__list">` +
        topByHours.map((x) => `<li>${escapeHtml(x.g.title)} <span>${fmtHours(x.h)}</span></li>`).join("") +
        `</ol></div>`;
    }
    if (finishedThisYear.length) {
      highlights += `<div class="yr__col"><h4>Finished this year</h4><ol class="yr__list">` +
        finishedThisYear.slice(0, 5).map((g) =>
          `<li>${escapeHtml(g.title)} <span>${g.score ? "★" + g.score : ""}</span></li>`).join("") +
        `</ol></div>`;
    }
    if (topRated) {
      highlights += `<div class="yr__col"><h4>Top rated</h4><p class="yr__pick">${escapeHtml(topRated.title)}<br><span>★ ${topRated.score || "—"}/10</span></p></div>`;
    }
    if (!highlights) {
      highlights = `<p class="icard__empty">No completions or tracked play time recorded for ${y} yet. Set completion dates on games, and daily hours will accrue as syncs run.</p>`;
    }

    return `
      <section class="yr">
        <div class="yr__head">
          <h2 class="yr__title">🎉 ${y} in Review</h2>
          <label class="yr__year">Year
            <select id="yearSelect" class="field__select">${yearOpts}</select>
          </label>
        </div>
        <div class="yr__stats">${statHtml}</div>
        <div class="yr__cols">${highlights}</div>
      </section>`;
  }
  function cardBlock(title, inner, wide) {
    return `<div class="icard${wide ? " icard--wide" : ""}"><h3 class="icard__title">${title}</h3>${inner}</div>`;
  }

  // Hours played within the current calendar month (from snapshot diffs).
  function computeHoursThisMonth() {
    const ym = new Date().toISOString().slice(0, 7);
    return computeDailyPlaytime()
      .filter((d) => d.date.slice(0, 7) === ym)
      .reduce((s, d) => s + d.hours, 0);
  }

  // Per-game hours added, bucketed by calendar month (from snapshot diffs).
  function computeMonthlyBreakdown() {
    const snaps = loadSnapshots();
    const skip = archivedIds();
    const byMonth = {};
    for (let i = 1; i < snaps.length; i++) {
      const month = snaps[i].date.slice(0, 7);
      const prev = snaps[i - 1].totals, cur = snaps[i].totals;
      const bucket = byMonth[month] = byMonth[month] || {};
      Object.keys(cur).forEach((id) => {
        if (skip.has(id)) return;
        const d = (cur[id] || 0) - (prev[id] || 0);
        if (d > 0) bucket[id] = (bucket[id] || 0) + d;
      });
    }
    return byMonth;
  }

  function monthlyBreakdownTable() {
    const byMonth = computeMonthlyBreakdown();
    const months = Object.keys(byMonth).sort().reverse().slice(0, 12);
    if (!months.length) {
      return `<p class="icard__empty">Monthly breakdown appears after your <strong>next sync</strong> — we need at least two snapshots to see hours per month.</p>`;
    }
    const rows = months.map((m) => {
      const bucket = byMonth[m];
      const total = Object.values(bucket).reduce((s, h) => s + h, 0);
      const top = Object.keys(bucket)
        .map((id) => ({ g: games.find((x) => x.id === id), h: bucket[id] }))
        .filter((x) => x.g).sort((a, b) => b.h - a.h).slice(0, 3);
      const label = new Date(m + "-01T00:00:00").toLocaleDateString(undefined, { month: "short", year: "numeric" });
      const topStr = top.map((x) => `${escapeHtml(x.g.title)} (${fmtHours(x.h)})`).join(", ") || "—";
      return `<tr><td>${label}</td><td>${fmtHours(total)}</td><td>${topStr}</td></tr>`;
    }).join("");
    return `<div class="table-wrap"><table class="mtable">
      <thead><tr><th>Month</th><th>Hours</th><th>Top games</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  }

  // Cost-per-hour = purchasePrice ÷ playtime. Only meaningful for priced,
  // played games; unplayed purchases are called out separately.
  function computeCostPerHour(data) {
    const priced = data.filter((g) => g.purchasePrice != null);
    const played = priced.filter((g) => (g.playtime || 0) > 0);
    const ranked = played.map((g) => ({ g, cph: g.purchasePrice / g.playtime })).sort((a, b) => a.cph - b.cph);
    const totalHours = played.reduce((s, g) => s + g.playtime, 0);
    const totalSpentPlayed = played.reduce((s, g) => s + g.purchasePrice, 0);
    return {
      ranked,
      avg: totalHours > 0 ? totalSpentPlayed / totalHours : null,
      unplayedPriced: priced.filter((g) => !((g.playtime || 0) > 0)),
    };
  }

  function costPerHourChart(cost) {
    if (!cost.ranked.length) {
      return `<p class="icard__empty">Add a purchase price to some played games to see this.</p>`;
    }
    const list = (items) => `<ol class="yr__list">` +
      items.map((x) => `<li>${escapeHtml(x.g.title)} <span>${formatMoney(x.cph)}/h</span></li>`).join("") +
      `</ol>`;
    let html;
    if (cost.ranked.length <= 6) {
      html = `<div class="yr__col"><h4>Ranked (best → worst value)</h4>${list(cost.ranked)}</div>`;
    } else {
      html = `<div class="yr__cols">
        <div class="yr__col"><h4>Best value</h4>${list(cost.ranked.slice(0, 5))}</div>
        <div class="yr__col"><h4>Worst value</h4>${list(cost.ranked.slice(-5).reverse())}</div>
      </div>`;
    }
    if (cost.unplayedPriced.length) {
      html += `<p class="icard__empty">${cost.unplayedPriced.length} purchased game(s) not yet played aren't shown.</p>`;
    }
    return html;
  }
  function hbars(rows, colorFn) {
    if (!rows.length) return `<p class="icard__empty">No data yet.</p>`;
    const max = Math.max.apply(null, rows.map((r) => r.value)) || 1;
    return `<div class="hbars">` + rows.map((r) => `
      <div class="hbar">
        <span class="hbar__label" title="${escapeHtml(r.label)}">${escapeHtml(r.label)}</span>
        <span class="hbar__track"><span class="hbar__fill" style="width:${Math.max(2, r.value / max * 100)}%;background:${colorFn ? colorFn(r) : "var(--primary)"}"></span></span>
        <span class="hbar__val">${r.display != null ? r.display : r.value}</span>
      </div>`).join("") + `</div>`;
  }
  function topGamesChart() {
    const rows = reportable().slice().sort((a, b) => (b.playtime || 0) - (a.playtime || 0)).slice(0, 10)
      .map((g) => ({ label: g.title, value: g.playtime || 0, display: fmtHours(g.playtime) }));
    return hbars(rows);
  }
  function statusChart() {
    const rows = STATUS_ORDER.map((s) => ({
      label: s, value: games.filter((g) => g.status === s).length, status: s,
    })).filter((r) => r.value > 0);
    return hbars(rows, (r) => STATUS_COLORS[r.status]);
  }
  function genreChart() {
    const map = {};
    reportable().forEach((g) => {
      if (!g.genre) return;
      String(g.genre).split(",").map((x) => x.trim()).filter(Boolean).forEach((gen) => {
        map[gen] = (map[gen] || 0) + 1;
      });
    });
    const rows = Object.keys(map).map((k) => ({ label: k, value: map[k] }))
      .sort((a, b) => b.value - a.value).slice(0, 8);
    if (!rows.length) return `<p class="icard__empty">Run <code>steam_sync.py --metadata</code> and re-import to populate genres.</p>`;
    return hbars(rows, () => "var(--accent)");
  }
  function scoreChart() {
    const counts = new Array(11).fill(0);
    reportable().forEach((g) => { if (g.score) counts[g.score]++; });
    const max = Math.max.apply(null, counts.slice(1)) || 1;
    if (!counts.slice(1).some((c) => c)) return `<p class="icard__empty">Rate some games to see this.</p>`;
    let bars = "";
    for (let i = 1; i <= 10; i++) {
      bars += `<div class="vbar" title="${counts[i]} game(s) rated ${i}">
        <span class="vbar__fill" style="height:${counts[i] / max * 100}%"></span>
        <span class="vbar__x">${i}</span></div>`;
    }
    return `<div class="vbars">${bars}</div>`;
  }
  function dailyChart() {
    const data = computeDailyPlaytime();
    if (!data.length) {
      return `<p class="icard__empty">Daily play time appears after your <strong>next sync</strong> — we compare snapshots to see hours added each day. (Snapshot saved ✓)</p>`;
    }
    const max = Math.max.apply(null, data.map((d) => d.hours)) || 1;
    const bars = data.slice(-30).map((d) => `
      <div class="vbar" title="${d.date}: ${d.hours.toFixed(1)}h">
        <span class="vbar__fill" style="height:${Math.max(2, d.hours / max * 100)}%"></span>
        <span class="vbar__x">${d.date.slice(5)}</span></div>`).join("");
    return `<div class="vbars vbars--wide">${bars}</div>`;
  }

  /* ---------- Details (filterable/sortable table + CSV) ---------- */
  const DETAIL_COLS = [
    { key: "title", label: "Title" },
    { key: "platform", label: "Platform" },
    { key: "status", label: "Status" },
    { key: "score", label: "Score", numeric: true },
    { key: "playtime", label: "Hours", numeric: true },
    { key: "firstPlayed", label: "First played" },
    { key: "lastPlayed", label: "Last played" },
    { key: "completed", label: "Completed" },
    { key: "purchaseDate", label: "Purchased" },
    { key: "purchasePrice", label: "Price", numeric: true },
    { key: "steamDeck", label: "Deck" },
    { key: "genre", label: "Genre" },
    { key: "metacritic", label: "MC", numeric: true },
  ];
  const detailsUi = { search: "", platform: "", status: "", sortKey: "title", sortDir: 1 };

  function getDetailsFiltered() {
    const q = detailsUi.search.trim().toLowerCase();
    const list = games.filter((g) => {
      if (detailsUi.platform && g.platform !== detailsUi.platform) return false;
      if (detailsUi.status && g.status !== detailsUi.status) return false;
      if (q && !g.title.toLowerCase().includes(q)) return false;
      return true;
    });
    const col = detailsUi.sortKey;
    const dir = detailsUi.sortDir;
    list.sort((a, b) => {
      let av = a[col], bv = b[col];
      if (DETAIL_COLS.find((c) => c.key === col).numeric) {
        av = av == null ? -Infinity : Number(av);
        bv = bv == null ? -Infinity : Number(bv);
        return (av - bv) * dir;
      }
      av = (av || "").toString().toLowerCase();
      bv = (bv || "").toString().toLowerCase();
      return av.localeCompare(bv) * dir;
    });
    return list;
  }

  function detailsCell(g, col) {
    switch (col.key) {
      case "title": return escapeHtml(g.title);
      case "score": return g.score || "—";
      case "playtime": return fmtHours(g.playtime);
      case "firstPlayed": case "lastPlayed": case "completed": case "purchaseDate":
        return fmtDate(g[col.key]);
      case "purchasePrice": return g.purchasePrice != null ? formatMoney(g.purchasePrice) : "—";
      case "steamDeck": return g.steamDeck ? "✓" : "";
      case "metacritic": return g.metacritic != null ? g.metacritic : "—";
      default: return escapeHtml(g[col.key] || "—");
    }
  }

  function renderDetails() {
    const head = $("#detailsHead");
    head.innerHTML = DETAIL_COLS.map((c) => {
      const active = detailsUi.sortKey === c.key;
      const arrow = active ? (detailsUi.sortDir === 1 ? " ▲" : " ▼") : "";
      return `<th><button type="button" class="dtable__sort${active ? " dtable__sort--active" : ""}" data-key="${c.key}">${c.label}${arrow}</button></th>`;
    }).join("");

    const list = getDetailsFiltered();
    $("#detailsCount").textContent = `${list.length} of ${games.length} games`;
    $("#detailsBody").innerHTML = list.map((g) =>
      `<tr>${DETAIL_COLS.map((c) => `<td>${detailsCell(g, c)}</td>`).join("")}</tr>`
    ).join("") || `<tr><td colspan="${DETAIL_COLS.length}" class="icard__empty">No games match.</td></tr>`;
  }

  function exportDetailsCSV() {
    const list = getDetailsFiltered();
    const header = DETAIL_COLS.map((c) => c.label).join(",");
    const rows = list.map((g) => DETAIL_COLS.map((c) => {
      if (c.key === "steamDeck") return csvCell(g.steamDeck ? "Yes" : "");
      return csvCell(g[c.key] != null ? g[c.key] : "");
    }).join(","));
    downloadBlob(header + "\n" + rows.join("\n"), "text/csv",
      `game-library-details-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  /* ---------- Tabs ---------- */
  function switchView(view) {
    ui.view = view;
    $("#libraryView").hidden = view !== "library";
    $("#insightsView").hidden = view !== "insights";
    $("#yearView").hidden = view !== "year";
    $("#detailsView").hidden = view !== "details";
    $("#filterToggle").hidden = view !== "library";
    document.querySelectorAll(".tab").forEach((t) => {
      const active = t.dataset.view === view;
      t.classList.toggle("tab--active", active);
      if (active) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    });
    if (view === "insights") renderInsights();
    else if (view === "year") renderYearReview();
    else if (view === "details") renderDetails();
  }
  function toggleControls() {
    const c = $("#controls");
    const show = c.hidden;
    c.hidden = !show;
    $("#filterToggle").setAttribute("aria-expanded", String(show));
    $("#filterToggle").classList.toggle("tabs__filter--active", show);
    if (show) $("#searchInput").focus();
  }

  /* ---------- Helpers ---------- */
  function uid() { return "g_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function clamp(n, lo, hi) { if (n == null || isNaN(n)) return null; return Math.min(hi, Math.max(lo, n)); }
  function formatMoney(n) {
    return "$" + (Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function debounce(fn, ms) { let t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  /* ---------- Theme ---------- */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    if (ui.view === "insights") renderInsights();
  }

  /* ---------- Wire up ---------- */
  function init() {
    initTheme();
    buildStars();
    applyFirstPlayed();
    render();
    autoSyncFromServer();   // pull in data the daily GitHub Action committed

    $("#addBtn").addEventListener("click", () => openDialog(null));
    $("#themeBtn").addEventListener("click", toggleTheme);
    $("#filterToggle").addEventListener("click", toggleControls);
    $("#f_platform").addEventListener("change", updateSteamDeckVisibility);
    $("#exportBtn").addEventListener("click", exportLibrary);
    $("#importBtn").addEventListener("click", () => $("#importFile").click());
    $("#importFile").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleImportFile(file);
      e.target.value = "";
    });
    $("#closeDialog").addEventListener("click", closeDialog);
    $("#cancelBtn").addEventListener("click", closeDialog);
    $("#deleteBtn").addEventListener("click", deleteGame);
    form.addEventListener("submit", saveGame);

    // Tabs
    document.querySelectorAll(".tab").forEach((t) =>
      t.addEventListener("click", () => switchView(t.dataset.view)));

    // Status chips
    chipsEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      ui.status = chip.dataset.status;
      render();
    });

    // Sections: click card → edit; click header → collapse
    sectionsEl.addEventListener("click", (e) => {
      const head = e.target.closest(".section__head");
      if (head) {
        const sec = head.closest(".section");
        const status = sec.dataset.status;
        if (collapsed.has(status)) collapsed.delete(status); else collapsed.add(status);
        saveCollapsed();
        sec.classList.toggle("section--collapsed");
        head.setAttribute("aria-expanded", String(!sec.classList.contains("section--collapsed")));
        return;
      }
      const card = e.target.closest(".card");
      if (!card) return;
      const g = games.find((x) => x.id === card.dataset.id);
      if (g) openDialog(g);
    });

    // Star widget: click + hover-preview + keyboard
    starsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-val]");
      if (!btn) return;
      const v = Number(btn.dataset.val);
      // click the current top star again → clear
      setStars(v === Number(starsEl.dataset.val) ? 0 : v);
    });
    starsEl.addEventListener("mouseover", (e) => {
      const btn = e.target.closest(".star");
      if (!btn) return;
      const hv = Number(btn.dataset.val);
      starsEl.querySelectorAll(".star").forEach((el) =>
        el.classList.toggle("hover", Number(el.dataset.val) <= hv));
    });
    starsEl.addEventListener("mouseleave", () => {
      starsEl.querySelectorAll(".star.hover").forEach((el) => el.classList.remove("hover"));
    });
    starsEl.addEventListener("keydown", (e) => {
      const cur = Number(starsEl.dataset.val) || 0;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { setStars(Math.min(10, cur + 1)); e.preventDefault(); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { setStars(Math.max(0, cur - 1)); e.preventDefault(); }
      else if (e.key === "Home") { setStars(0); e.preventDefault(); }
      else if (e.key === "End") { setStars(10); e.preventDefault(); }
      else if (/^[0-9]$/.test(e.key)) { setStars(e.key === "0" ? 10 : Number(e.key)); e.preventDefault(); }
    });

    // Controls
    $("#searchInput").addEventListener("input", debounce(function () {
      ui.search = $("#searchInput").value; render();
    }, 120));
    $("#platformFilter").addEventListener("change", (e) => { ui.platform = e.target.value; render(); });
    $("#sortSelect").addEventListener("change", (e) => { ui.sort = e.target.value; render(); });

    dialog.addEventListener("click", (e) => { if (e.target === dialog) closeDialog(); });

    // Details tab
    $("#detailsSearch").addEventListener("input", debounce(function () {
      detailsUi.search = $("#detailsSearch").value; renderDetails();
    }, 120));
    $("#detailsPlatform").addEventListener("change", (e) => { detailsUi.platform = e.target.value; renderDetails(); });
    $("#detailsStatus").addEventListener("change", (e) => { detailsUi.status = e.target.value; renderDetails(); });
    $("#detailsCsvBtn").addEventListener("click", exportDetailsCSV);
    $("#detailsHead").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-key]");
      if (!btn) return;
      const key = btn.dataset.key;
      if (detailsUi.sortKey === key) detailsUi.sortDir *= -1;
      else { detailsUi.sortKey = key; detailsUi.sortDir = 1; }
      renderDetails();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
