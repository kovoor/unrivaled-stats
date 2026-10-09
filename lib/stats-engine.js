/* ==================================================================
   Shared behavior for the /stats/team mocks: page state (season,
   season type, per mode, sort, tab) kept in the URL like the real
   page's search params, the numbers a table needs (sorted rows, ranks
   with ties, league average, best and worst), the stats tabs, and the
   review chrome.

   URL parameters (the screenshot tool uses these; handy for sharing):
     ?season=2025|2026|2027
     ?seasonType=Regular%20Season|Playoffs
     ?perMode=Per%20Game|Total
     ?sort=pts|or|dr|reb|ast|stl|blk|to|pf   &dir=asc|desc
     ?tab=leaders|player|team
     ?static=1   no entrance animations (html.is-static)
     ?rv=0       hide the review chrome
   ================================================================== */
(function () {
  var D = window.STATS;
  var root = document.documentElement;
  var qs = new URLSearchParams(location.search);
  var KEYS = D.columns.map(function (c) { return c.key; });
  var TABS = ['leaders', 'player', 'team'];
  var COLS = {};
  D.columns.forEach(function (c) { COLS[c.key] = c; });

  function defaultDir(key) { return COLS[key] && COLS[key].better === 'low' ? 'asc' : 'desc'; }

  function clean(s) {
    var out = {};
    out.season = D.seasons.some(function (x) { return x.year === s.season; }) ? s.season : D.defaultSeason;
    out.seasonType = D.seasonTypes.indexOf(s.seasonType) >= 0 ? s.seasonType : D.seasonTypes[0];
    out.perMode = D.perModes.indexOf(s.perMode) >= 0 ? s.perMode : D.perModes[0];
    out.sort = KEYS.indexOf(s.sort) >= 0 ? s.sort : 'pts';
    out.dir = s.dir === 'asc' || s.dir === 'desc' ? s.dir : defaultDir(out.sort);
    out.tab = TABS.indexOf(s.tab) >= 0 ? s.tab : 'team';
    return out;
  }

  var state = clean({
    season: qs.get('season'),
    seasonType: qs.get('seasonType'),
    perMode: qs.get('perMode'),
    sort: qs.get('sort'),
    dir: qs.get('dir'),
    tab: qs.get('tab') || ({ '/stats': 'leaders', '/stats/player': 'player', '/stats/team': 'team' })[location.pathname],
  });
  var listeners = [];

  function writeUrl() {
    var p = new URLSearchParams(location.search);
    var defaults = clean({});
    ['season', 'seasonType', 'perMode', 'sort', 'tab'].forEach(function (k) {
      if (state[k] === defaults[k]) p.delete(k);
      else p.set(k, state[k]);
    });
    if (state.dir === defaultDir(state.sort)) p.delete('dir');
    else p.set('dir', state.dir);
    var q = p.toString();
    try { history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash); } catch (e) { /* file:// in some browsers */ }
  }

  function set(patch) {
    var prev = state;
    var next = Object.assign({}, state, patch);
    // A new sort column starts best first unless a direction was given with it.
    if (patch.sort && patch.sort !== prev.sort && !patch.dir) next.dir = defaultDir(patch.sort);
    state = clean(next);
    writeUrl();
    syncTabs();
    listeners.forEach(function (fn) { fn(state, prev); });
    document.dispatchEvent(new CustomEvent('stats:change', { detail: { state: state, prev: prev } }));
  }

  /** Clicking a column: a new column sorts best first; the same column again flips the direction. */
  function sortBy(key) {
    if (key === state.sort) set({ dir: state.dir === 'desc' ? 'asc' : 'desc' });
    else set({ sort: key, dir: defaultDir(key) });
  }

  // ---------- Numbers ----------

  function isTotal(perMode) { return (perMode || state.perMode) === 'Total'; }

  /** 77.7 per game, 1,088 in totals. */
  function fmt(value, perMode) {
    if (value === null || value === undefined || isNaN(value)) return '';
    return isTotal(perMode)
      ? Math.round(value).toLocaleString('en-US')
      : value.toFixed(1);
  }

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  /** A rank with ties: { n: 2, tied: true } reads "T-2". */
  function rankLabel(r) { return (r.tied ? 'T-' : '') + r.n; }

  function seasonLabel(year) {
    var s = D.seasons.filter(function (x) { return x.year === year; })[0];
    return s ? s.label : year;
  }

  function rawRows(s) {
    return D.tables[s.season + '|' + s.seasonType] || null;
  }

  /**
   * The table for the current state (or another state passed in):
   *   null when there are no games yet (the page's empty state), otherwise
   *   { rows, stats, state } where
   *   rows  = sorted [{ slug, name, logo, url, club, gp, v: {key: number}, d: {key: '77.7'}, rank: {key: {n, tied}} }]
   *   stats = { key: { min, max, avg, avgDisplay, best, worst, spread, leaders: [slug] } }
   * Rank 1 is the league best: most for most columns, fewest for TO and PF.
   */
  function table(s) {
    s = s ? clean(Object.assign({}, state, s)) : state;
    var src = rawRows(s);
    if (!src || !src.length) return null;
    var total = isTotal(s.perMode);
    var rows = src.map(function (r) {
      var club = D.clubs[r.club];
      var v = {};
      KEYS.forEach(function (k) { v[k] = total ? r.total[k] : r.perGame[k]; });
      var d = {};
      KEYS.forEach(function (k) { d[k] = fmt(v[k], s.perMode); });
      return { slug: r.club, name: club.name, logo: club.logo, url: club.url, club: club, gp: r.gp, v: v, d: d, rank: {} };
    });
    var stats = {};
    KEYS.forEach(function (k) {
      var low = COLS[k].better === 'low';
      var vals = rows.map(function (r) { return r.v[k]; });
      var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
      var avg = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
      rows.forEach(function (r) {
        var better = vals.filter(function (x) { return low ? x < r.v[k] : x > r.v[k]; }).length;
        var same = vals.filter(function (x) { return x === r.v[k]; }).length;
        r.rank[k] = { n: better + 1, tied: same > 1 };
      });
      var best = low ? min : max, worst = low ? max : min;
      stats[k] = {
        min: min, max: max, avg: avg, avgDisplay: total ? Math.round(avg).toLocaleString('en-US') : avg.toFixed(1),
        best: best, worst: worst, spread: max - min,
        leaders: rows.filter(function (r) { return r.v[k] === best; }).map(function (r) { return r.slug; }),
      };
    });
    var dir = s.dir === 'asc' ? 1 : -1;
    rows.sort(function (a, b) {
      var diff = (a.v[s.sort] - b.v[s.sort]) * dir;
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
    return { rows: rows, stats: stats, state: s };
  }

  /**
   * The Player Stats tab's scale test (2025 regular season, per game, every player who played):
   *   { columns, rows, stats } with rows sorted by `sort` (default pts) in `dir` (default best first),
   *   rows = [{ name, club (meta), slug, v: {key: number|null}, d: {key: '21.4'|'45.5%'|''}, rank: {key: {n, tied}} }].
   * Percentages with no attempts are null, show as '' and sort last.
   */
  function playerTable(opts) {
    var P = D.playerPreview;
    opts = opts || {};
    var pcols = {};
    P.columns.forEach(function (c) { pcols[c.key] = c; });
    var sort = pcols[opts.sort] ? opts.sort : 'pts';
    var dir = opts.dir === 'asc' || opts.dir === 'desc' ? opts.dir : pcols[sort].better === 'low' ? 'asc' : 'desc';
    var rows = P.rows.map(function (r) {
      var club = D.clubs[r.club];
      var v = {}, d = {};
      P.columns.forEach(function (c) {
        v[c.key] = r[c.key];
        d[c.key] = r[c.key] === null ? '' : c.kind === 'count' ? String(r[c.key]) : c.kind === 'percent' ? r[c.key].toFixed(1) : r[c.key].toFixed(1);
      });
      return { name: r.name, slug: r.club, club: club, logo: club && club.logo, v: v, d: d, rank: {} };
    });
    var stats = {};
    P.columns.forEach(function (c) {
      var low = c.better === 'low';
      var vals = rows.map(function (r) { return r.v[c.key]; }).filter(function (x) { return x !== null; });
      var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
      rows.forEach(function (r) {
        var x = r.v[c.key];
        if (x === null) { r.rank[c.key] = null; return; }
        var better = vals.filter(function (y) { return low ? y < x : y > x; }).length;
        var same = vals.filter(function (y) { return y === x; }).length;
        r.rank[c.key] = { n: better + 1, tied: same > 1 };
      });
      stats[c.key] = { min: min, max: max, avg: vals.reduce(function (a, b) { return a + b; }, 0) / vals.length, best: low ? min : max, worst: low ? max : min };
    });
    var sign = dir === 'asc' ? 1 : -1;
    rows.sort(function (a, b) {
      var x = a.v[sort], y = b.v[sort];
      if (x === null && y === null) return a.name.localeCompare(b.name);
      if (x === null) return 1;
      if (y === null) return -1;
      return (x - y) * sign || a.name.localeCompare(b.name);
    });
    return { columns: P.columns, rows: rows, stats: stats, sort: sort, dir: dir, season: P.season, seasonType: P.seasonType, perMode: P.perMode };
  }

  /** What the page says when a table is empty, by cause. Options may restyle or reword. */
  function emptyState(s) {
    s = s ? clean(Object.assign({}, state, s)) : state;
    if (rawRows(s)) return null;
    var label = seasonLabel(s.season);
    var hasAnyGames = D.seasonTypes.some(function (t) { return !!D.tables[s.season + '|' + t]; });
    if (!hasAnyGames) {
      return { kind: 'future-season', title: label + ' has not tipped off', body: 'Team stats fill in after the first game of ' + label + '.' };
    }
    var kind = s.seasonType === 'Playoffs' ? 'playoff' : 'regular season';
    return { kind: 'no-games', title: 'No ' + kind + ' games yet', body: 'Team stats for the ' + s.season + ' ' + (s.seasonType === 'Playoffs' ? 'playoffs' : 'regular season') + ' fill in after the first game.' };
  }

  // ---------- Tabs ----------
  // Any [data-tab="leaders|player|team"] link is a stats tab; any [data-tab-panel="..."] is its panel.
  // The shell keeps aria-current="page" on the active links and `hidden` on the other panels.

  function syncTabs() {
    document.querySelectorAll('[data-tab]').forEach(function (a) {
      if (a.getAttribute('data-tab') === state.tab) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-tab-panel]').forEach(function (p) {
      p.hidden = p.getAttribute('data-tab-panel') !== state.tab;
    });
    root.dataset.tab = state.tab;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-tab]');
    if (!a) return;
    e.preventDefault();
    var tab = a.getAttribute('data-tab');
    if (tab !== state.tab) set({ tab: tab });
  });

  // ---------- Review chrome ----------

  function review() {
    var rv = document.querySelector('.rv');
    var notes = document.querySelector('.rv-notes');
    if (!rv) return;
    rv.addEventListener('click', function (e) {
      if (e.target.closest('[data-rv-notes]') && notes) { notes.setAttribute('data-open', String(notes.getAttribute('data-open') !== 'true')); return; }
      if (e.target.closest('[data-rv-min]')) rv.setAttribute('data-min', String(rv.getAttribute('data-min') !== 'true'));
    });
    if (notes) {
      notes.addEventListener('click', function (e) { if (e.target.closest('[data-rv-close]')) notes.setAttribute('data-open', 'false'); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') notes.setAttribute('data-open', 'false'); });
    }
    if (window.matchMedia('(max-width: 720px)').matches) rv.setAttribute('data-min', 'true');
  }

  if (qs.get('static') === '1') root.classList.add('is-static');
  if (qs.get('rv') === '0') root.dataset.rv = '0';
  root.dataset.tab = state.tab;

  window.TS = {
    data: D,
    columns: D.columns,
    col: function (key) { return COLS[key]; },
    club: function (slug) { return D.clubs[slug]; },
    get state() { return state; },
    set: set,
    sortBy: sortBy,
    defaultDir: defaultDir,
    on: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
    table: table,
    playerTable: playerTable,
    emptyState: emptyState,
    fmt: fmt,
    ordinal: ordinal,
    rankLabel: rankLabel,
    seasonLabel: seasonLabel,
    isTotal: isTotal,
    params: qs,
    /** True when ?static=1 asked for no entrance animations (screenshots). */
    get isStatic() { return root.classList.contains('is-static'); },
    reducedMotion: function () { return root.classList.contains('is-static') || window.matchMedia('(prefers-reduced-motion: reduce)').matches; },
  };

  function start() {
    review();
    syncTabs();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
