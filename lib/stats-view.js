(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var icon = function (name, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; };
  var MIN_ATTEMPTS = 10;
  var TRACK_MAX = 4;

  // ==================================================================
  // The track. One component renders every filter set on the page and
  // in the drawer. A filter is { key, name, options, value, def, note }.
  // Every filter is a menu segment, its value and a chevron, whatever
  // its options count. An option can be disabled, and a note under the
  // items says why. A fifth filter and on fold into a More menu at the
  // end of the track.
  // ==================================================================
  var uid = 0;
  var openPop = null;

  function Track(o) {
    var id = 'trk' + (++uid);
    var root = o.root;
    var filters = o.filters.map(function (f, i) {
      return Object.assign({}, f, {
        folded: i >= TRACK_MAX,
        value: f.value === undefined ? f.options[0].value : f.value,
        def: f.def === undefined ? f.options[0].value : f.def,
      });
    });
    var byKey = {};
    filters.forEach(function (f) { byKey[f.key] = f; });
    var folded = filters.filter(function (f) { return f.folded; });

    function opt(f, v) { return f.options.filter(function (x) { return x.value === v; })[0] || f.options[0]; }
    function popId(key) { return id + '-' + key + '-menu'; }
    function btnId(f) { return f.id || id + '-' + f.key; }

    // Every option sits in the segment, stacked, with only the current one visible, so a segment is as wide
    // as its widest option and the track never reflows when a shorter value is chosen.
    function valueHtml(f) {
      return f.options.map(function (x) {
        return '<span class="seg__opt" data-on="' + (x.value === f.value) + '">' + (x.logo ? '<img class="seg__logo" src="' + x.logo + '" alt="">' : '') + esc(x.label) + '</span>';
      }).join('');
    }

    function slotHtml(f) {
      return '<div class="slot" data-slot="' + f.key + '"><button type="button" class="seg seg--menu" id="' + btnId(f) + '" data-menu="' + f.key + '" aria-haspopup="menu" aria-expanded="false" aria-controls="' + popId(f.key) + '" aria-label="' + esc(f.name + ': ' + opt(f, f.value).label) + '">' +
        '<span class="seg__value" data-value-of="' + f.key + '">' + valueHtml(f) + '</span>' + icon('chevron-down', 'seg__chev') + '</button></div>';
    }

    function moreSlotHtml() {
      return '<div class="slot" data-slot="more"><button type="button" class="seg seg--menu" id="' + id + '-more" data-menu="more" aria-haspopup="menu" aria-expanded="false" aria-controls="' + popId('more') + '" aria-label="More filters">' +
        '<span class="seg__value" data-value-of="more">More</span>' + icon('chevron-down', 'seg__chev') + '</button></div>';
    }

    function itemsHtml(f) {
      return f.options.map(function (x) {
        var lead = x.logo ? '<img class="pop__logo" src="' + x.logo + '" alt="">' : x.league ? '<span class="pop__logo pop__logo--league" aria-hidden="true"></span>' : '';
        return '<button type="button" class="pop__item" role="menuitemradio" tabindex="-1" aria-checked="' + (x.value === f.value) + '"' + (x.disabled ? ' aria-disabled="true"' : '') + ' data-key="' + f.key + '" data-value="' + esc(x.value) + '">' +
          lead + '<span class="pop__main">' + esc(x.main || x.label) + '</span>' + (x.sub ? '<span class="pop__sub">' + esc(x.sub) + '</span>' : '') + icon('check') + '</button>';
      }).join('') + (f.note ? '<p class="pop__note">' + esc(f.note) + '</p>' : '');
    }

    function popHtml(f) {
      return '<div class="pop" id="' + popId(f.key) + '" role="menu" aria-labelledby="' + btnId(f) + '" hidden>' + itemsHtml(f) + '</div>';
    }
    function morePopHtml() {
      return '<div class="pop" id="' + popId('more') + '" role="menu" aria-labelledby="' + id + '-more" hidden>' + folded.map(function (f) {
        return '<div role="group" aria-labelledby="' + id + '-' + f.key + '-label"><p class="pop__label" id="' + id + '-' + f.key + '-label">' + esc(f.name) + '</p>' + itemsHtml(f) + '</div>';
      }).join('<div class="pop__rule" role="separator"></div>') + '</div>';
    }

    var shown = filters.filter(function (f) { return !f.folded; });
    root.innerHTML =
      '<div class="track" role="toolbar" aria-label="' + esc(o.label) + '">' + shown.map(slotHtml).join('') + (folded.length ? moreSlotHtml() : '') + '</div>' +
      shown.map(popHtml).join('') +
      (folded.length ? morePopHtml() : '');

    var track = $('.track', root);

    // ---------- State into the DOM ----------
    function paint() {
      filters.forEach(function (f) {
        $$('[data-key="' + f.key + '"]', root).forEach(function (b) {
          b.setAttribute('aria-checked', String(b.getAttribute('data-value') === String(f.value)));
        });
        var label = $('[data-value-of="' + f.key + '"]', root);
        if (label) {
          label.innerHTML = valueHtml(f);
          label.parentNode.setAttribute('aria-label', f.name + ': ' + opt(f, f.value).label);
        }
      });
      // More names the folded value once it is not the default, so every choice stays readable at rest.
      if (folded.length) {
        var changed = folded.filter(function (f) { return f.value !== f.def; });
        var more = $('[data-value-of="more"]', root);
        more.textContent = changed.length ? changed.map(function (f) { var x = opt(f, f.value); return x.short || x.label; }).join(', ') : 'More';
        more.parentNode.setAttribute('aria-label', 'More filters' + (changed.length ? ': ' + more.textContent : ''));
      }
      if (o.reset) o.reset.setAttribute('data-on', String(isChanged()));
    }

    function isChanged() {
      return filters.some(function (f) { return f.value !== f.def; });
    }

    function choose(key, value) {
      var f = byKey[key];
      if (!f || String(f.value) === String(value)) return;
      f.value = value;
      paint();
      if (o.onChange) o.onChange(key, value, api);
    }

    // ---------- Keyboard: one toolbar, one tab stop, arrows along it ----------
    function rovers() { return $$('button.seg', track); }
    function rove(to) { rovers().forEach(function (b) { b.tabIndex = b === to ? 0 : -1; }); }
    rove(rovers()[0]);
    track.addEventListener('focusin', function (e) { var b = e.target.closest('button.seg'); if (b) rove(b); });
    track.addEventListener('keydown', function (e) {
      var list = rovers();
      var i = list.indexOf(document.activeElement);
      if (i < 0) return;
      var b = list[i];
      var next = null;
      if (e.key === 'ArrowRight') next = list[(i + 1) % list.length];
      else if (e.key === 'ArrowLeft') next = list[(i - 1 + list.length) % list.length];
      else if (e.key === 'Home') next = list[0];
      else if (e.key === 'End') next = list[list.length - 1];
      else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && b.hasAttribute('data-menu')) {
        e.preventDefault();
        open(b, e.key === 'ArrowUp' ? 'last' : 'checked');
        return;
      }
      if (next) { e.preventDefault(); next.focus(); }
    });

    // ---------- Menus ----------
    function popFor(btn) { return document.getElementById(btn.getAttribute('aria-controls')); }

    function place(pop, btn) {
      var f = root.getBoundingClientRect();
      var r = btn.getBoundingClientRect();
      var scope = root.closest('.rv-notes');
      var box = scope ? scope.getBoundingClientRect() : { left: 0, right: document.documentElement.clientWidth };
      pop.style.minWidth = Math.round(Math.max(220, Math.min(r.width - 8, 320))) + 'px';
      var w = pop.offsetWidth;
      var left = r.left + r.width / 2 - w / 2;
      left = Math.max(box.left + 12, Math.min(left, box.right - 12 - w));
      pop.style.left = Math.round(left - f.left) + 'px';
      pop.style.top = Math.round(r.bottom - f.top + 4) + 'px';
    }

    function open(btn, focus) {
      if (openPop && openPop.btn !== btn) openPop.close(false);
      var pop = popFor(btn);
      pop.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      place(pop, btn);
      openPop = { btn: btn, pop: pop, place: function () { place(pop, btn); }, close: function (refocus) { close(btn, refocus); } };
      var items = $$('[role="menuitemradio"]', pop);
      var target = focus === 'last' ? items[items.length - 1] : $('[aria-checked="true"]', pop) || items[0];
      if (target) target.focus({ preventScroll: true });
      // A long list scrolls its checked item into view.
      if (target && pop.scrollHeight > pop.clientHeight) pop.scrollTop = target.offsetTop - pop.clientHeight / 2 + target.offsetHeight / 2;
    }

    function close(btn, refocus) {
      var pop = popFor(btn);
      if (pop.hidden) return;
      pop.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (openPop && openPop.btn === btn) openPop = null;
      if (refocus) btn.focus({ preventScroll: true });
    }

    root.addEventListener('click', function (e) {
      var menuBtn = e.target.closest('button[data-menu]');
      if (menuBtn) {
        if (menuBtn.getAttribute('aria-expanded') === 'true') close(menuBtn, true);
        else open(menuBtn, 'checked');
        return;
      }
      var item = e.target.closest('[role="menuitemradio"]');
      if (!item || item.getAttribute('aria-disabled') === 'true') return;
      var owner = document.getElementById(item.closest('.pop').getAttribute('aria-labelledby'));
      close(owner, true);
      choose(item.getAttribute('data-key'), item.getAttribute('data-value'));
    });

    root.addEventListener('keydown', function (e) {
      var pop = e.target.closest('.pop');
      if (!pop) return;
      var owner = document.getElementById(pop.getAttribute('aria-labelledby'));
      var items = $$('[role="menuitemradio"]', pop);
      var i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(owner, true); }
      // Tab leaves from the button, so it lands on whatever follows the track.
      else if (e.key === 'Tab') close(owner, true);
    });

    if (o.reset) {
      o.reset.addEventListener('click', function () {
        filters.forEach(function (f) { f.value = f.def; });
        paint();
        rovers()[0].focus({ preventScroll: true });
        if (o.onReset) o.onReset(api);
      });
    }

    var api = {
      set: function (key, value) { if (byKey[key]) { byKey[key].value = value; paint(); } },
      get: function (key) { return byKey[key] && byKey[key].value; },
      values: function () { var v = {}; filters.forEach(function (f) { v[f.key] = f.value; }); return v; },
    };
    paint();
    return api;
  }

  // Outside a menu and its button, a press closes it; focus goes home when it was inside the menu.
  document.addEventListener('pointerdown', function (e) {
    if (!openPop) return;
    if (openPop.pop.contains(e.target) || openPop.btn.contains(e.target)) return;
    var inside = openPop.pop.contains(document.activeElement);
    openPop.close(inside);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openPop) { e.stopPropagation(); openPop.close(true); }
  }, true);
  // A phone fires resize as its toolbar collapses, so an open menu follows its segment instead of closing.
  window.addEventListener('resize', function () { if (openPop) openPop.place(); });

  // ---------- The shared option lists ----------
  var SEASONS = TS.data.seasons.map(function (x) { return { value: x.year, label: x.year + ' · ' + x.label, main: x.year, sub: x.label }; });
  var SEASON_TYPES = [{ value: 'Regular Season', label: 'Regular season' }, { value: 'Playoffs', label: 'Playoffs' }];
  var PER_MODES = [{ value: 'Per Game', label: 'Per game' }, { value: 'Total', label: 'Totals' }];
  var DEFAULTS = { season: TS.data.defaultSeason, seasonType: 'Regular Season', perMode: 'Per Game' };

  // ==================================================================
  // The table (Box Office, unchanged)
  // ==================================================================
  var player = { sort: 'pts', dir: 'desc', club: 'all' };
  var opened = { team: {}, player: {} };

  // A tied rank is the number with a small raised T, so the digits sit where they always do: "3" and "3T", "3rd" and "3rdT".
  function tieMark(text, r) {
    return r.tied ? '<span class="rankTied">' + text + '<sup class="tie" aria-hidden="true">T</sup><span class="sr-only">, tied</span></span>' : text;
  }
  function rankHtml(r) { return tieMark(String(r.n), r); }
  function ordinalRank(r) { return tieMark(TS.ordinal(r.n), r); }
  function valueCell(d) { return d === '' ? '<span class="none" aria-hidden="true"></span><span class="sr-only">No attempts</span>' : d; }
  function dirWord(col, dir) { return dir === 'asc' ? 'Fewest first' : 'Most first'; }

  // The phone picker: one segment per stat in a scrolling track, the pressed one brought to the middle.
  function syncPick(name, cols, sort) {
    var pick = $('[data-pick="' + name + '"]');
    if (!pick.children.length) {
      pick.innerHTML = cols.map(function (c) {
        return '<button type="button" class="seg" data-pick-stat="' + c.key + '" aria-pressed="false" title="' + esc(c.name) + '">' + c.label + '</button>';
      }).join('');
    }
    var pressed = null;
    $$('[data-pick-stat]', pick).forEach(function (b) {
      var on = b.getAttribute('data-pick-stat') === sort;
      b.setAttribute('aria-pressed', String(on));
      if (on) pressed = b;
    });
    if (pressed && pick.scrollWidth > pick.clientWidth) {
      var box = pick.getBoundingClientRect(), it = pressed.getBoundingClientRect();
      var left = pick.scrollLeft + (it.left - box.left) - (box.width - it.width) / 2;
      pick.scrollTo({ left: Math.max(0, left), behavior: TS.reducedMotion() ? 'auto' : 'smooth' });
    }
    fadePick(pick);
  }
  function fadePick(pick) {
    var max = pick.scrollWidth - pick.clientWidth;
    var x = pick.scrollLeft;
    pick.setAttribute('data-fade', max <= 1 ? 'none' : x <= 1 ? 'end' : x >= max - 1 ? 'start' : 'both');
  }
  $$('.pick').forEach(function (pick) { pick.addEventListener('scroll', function () { fadePick(pick); }, { passive: true }); });
  window.addEventListener('resize', function () { $$('.pick').forEach(fadePick); });

  function syncListHead(paper, col, dir) {
    $('[data-list-name]', paper).textContent = col.name;
    $('[data-list-sub]', paper).textContent = dirWord(col, dir).toLowerCase();
    $('[data-flip-icon]', paper).setAttribute('href', dir === 'asc' ? '#i-arrow-up' : '#i-arrow-down');
  }

  // The pinned columns dress up only once the stats have scrolled under them.
  $$('.paper--wide .scroll').forEach(function (sc) {
    var paper = sc.closest('.paper');
    var sync = function () { paper.setAttribute('data-scrolled', String(sc.scrollLeft > 0)); };
    sc.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  function syncAbbr(name, cols) {
    var dl = $('[data-abbr="' + name + '"]');
    if (dl.children.length) return;
    dl.innerHTML = cols.map(function (c) { return '<div><dt>' + c.label + '</dt><dd>' + esc(c.name) + '</dd></div>'; }).join('');
  }

  function tableHtml(o) {
    var head = '<tr>' +
      '<th scope="col" class="rk" title="League rank in the sorted stat">RK</th>' +
      '<th scope="col" class="who">' + o.who + '</th>' +
      (o.showGp ? '<th scope="col" class="gp" title="Games played">GP</th>' : '') +
      o.cols.map(function (c) {
        var sorted = c.key === o.sort;
        var dir = sorted ? o.dir : c.better === 'low' ? 'asc' : 'desc';
        var tip = c.name + (c.better === 'low' ? ', fewest is best' : '');
        return '<th scope="col" data-col="' + c.key + '"' + (sorted ? ' data-sorted="true"' : '') + ' aria-sort="' + (sorted ? (o.dir === 'asc' ? 'ascending' : 'descending') : 'none') + '">' +
          '<button type="button" class="sortBtn" data-sort="' + c.key + '" data-of="' + o.id + '" title="' + esc(tip) + '">' +
          icon(dir === 'asc' ? 'arrow-up' : 'arrow-down') + '<span>' + c.label + '</span><span class="sr-only">, ' + esc(c.name) + '</span></button></th>';
      }).join('') +
      '<th scope="col" class="more"><span class="sr-only">Full line</span></th></tr>';

    var body = o.rows.map(function (r, i) {
      var rk = r.rank[o.sort];
      var lineId = o.id + '-line-' + i;
      var isOpen = !!opened[o.id][r.key];
      return '<tr class="row" data-key="' + esc(r.key) + '">' +
        '<td class="rk">' + (rk ? rankHtml(rk) : '') + '</td>' +
        '<th scope="row" class="who">' + r.who + '</th>' +
        (o.showGp ? '<td class="gp">' + r.gp + '</td>' : '') +
        o.cols.map(function (c) {
          var sorted = c.key === o.sort;
          var lead = o.isLead(r, c);
          var cls = 'v' + (lead ? (sorted ? ' v--top' : ' v--lead') : '') + (o.isDim(r, c) ? ' v--dim' : '');
          return '<td data-col="' + c.key + '"' + (sorted ? ' data-sorted="true"' : '') + '><span class="' + cls + '">' + valueCell(r.d[c.key]) + '</span></td>';
        }).join('') +
        '<td class="more"><button type="button" class="open" aria-expanded="' + isOpen + '" aria-controls="' + lineId + '" aria-label="All stats for ' + esc(r.name) + '">' + icon('chevron-down') + '</button></td>' +
        '</tr>' +
        '<tr class="line" id="' + lineId + '" data-open="' + isOpen + '"' + (isOpen ? '' : ' inert') + '><td colspan="' + (o.cols.length + 4) + '">' + lineHtml(o, r) + '</td></tr>';
    }).join('');

    // The footer's label and values take the body's value box, so the row sits on the rows' height with its text centered.
    var foot = o.avg
      ? '<tr><td class="rk"></td><th scope="row" class="who"><span class="v">League average</span></th>' + (o.showGp ? '<td class="gp"></td>' : '') +
        o.cols.map(function (c) { return '<td data-col="' + c.key + '"' + (c.key === o.sort ? ' data-sorted="true"' : '') + '><span class="v">' + o.avg[c.key] + '</span></td>'; }).join('') +
        '<td class="more"></td></tr>'
      : '';

    return '<caption>' + esc(o.caption) + '</caption><thead>' + head + '</thead><tbody>' + body + '</tbody>' + (foot ? '<tfoot>' + foot + '</tfoot>' : '');
  }

  // The full line on a phone. Values stay plain so they line up; the rank carries the league-best mark instead.
  // Games played is a fact for the line's foot, not a ranked stat.
  function lineHtml(o, r) {
    return '<div class="lineBox"><dl class="lineGrid">' + o.cols.filter(function (c) { return c.key !== 'gp'; }).map(function (c) {
      var rk = r.rank[c.key];
      var sorted = c.key === o.sort;
      var lead = o.isLead(r, c);
      return '<div' + (sorted ? ' data-sorted="true"' : '') + '><dt title="' + esc(c.name) + '">' + c.label + '</dt>' +
        '<dd><span class="lineVal' + (o.isDim(r, c) ? ' lineVal--dim' : '') + '">' + valueCell(r.d[c.key]) + '</span>' +
        (rk ? '<small class="lineRank' + (lead ? (sorted ? ' lineRank--top' : ' lineRank--lead') : '') + '">' + ordinalRank(rk) + '</small>' : '') + '</dd></div>';
    }).join('') + '</dl>' + o.lineFoot(r) + '</div>';
  }

  // The table learns its stat column count and the width of its fixed columns (rank, name, and GP when shown),
  // which its stylesheet turns into each column's room and padding.
  function renderInto(table, html, cols, showGp) {
    var a = document.activeElement;
    var want = a && a.getAttribute && a.getAttribute('data-sort');
    var of = a && a.getAttribute && a.getAttribute('data-of');
    table.style.setProperty('--cols', String(cols));
    table.style.setProperty('--fixed', (236 + (showGp ? 44 : 0)) + 'px');
    table.innerHTML = html;
    if (want && of) {
      var again = $('[data-sort="' + want + '"][data-of="' + of + '"]', table);
      if (again) again.focus({ preventScroll: true });
    }
  }

  // ==================================================================
  // Team Stats
  // ==================================================================
  var teamTrack = Track({
    root: $('[data-filters="team"]'),
    label: 'Team stats filters',
    reset: $('[data-reset="team"]'),
    filters: [
      { key: 'season', id: 'seasonBtn', name: 'Season', options: SEASONS, value: TS.state.season, def: DEFAULTS.season },
      { key: 'seasonType', name: 'Season type', options: SEASON_TYPES, value: TS.state.seasonType, def: DEFAULTS.seasonType },
      { key: 'perMode', name: 'Per game or totals', options: PER_MODES, value: TS.state.perMode, def: DEFAULTS.perMode },
    ],
    onChange: function (key, value) { var p = {}; p[key] = value; TS.set(p); },
    onReset: function () { TS.set(DEFAULTS); },
  });

  function renderTeam() {
    var s = TS.state;
    var t = TS.table();
    var paper = $('[data-paper="team"]');
    var table = $('[data-table="team"]');
    var empty = $('.empty', paper);
    var col = TS.col(s.sort);
    var modeWord = s.perMode === 'Total' ? 'totals' : 'per game';
    var typeWord = s.seasonType === 'Playoffs' ? 'playoffs' : 'regular season';

    teamTrack.set('season', s.season);
    teamTrack.set('seasonType', s.seasonType);
    teamTrack.set('perMode', s.perMode);
    syncPick('team', TS.columns, s.sort);
    syncAbbr('team', TS.columns);
    syncListHead(paper, col, s.dir);
    $('[data-foot="team"]').hidden = !t;
    $('[data-pick="team"]').closest('.pickWrap').hidden = !t;

    if (!t) {
      var e = TS.emptyState();
      var latest = TS.data.seasons.filter(function (x) { return TS.data.tables[x.year + '|Regular Season']; })[0];
      var action = e.kind === 'future-season'
        ? '<button type="button" class="action" data-set-season="' + latest.year + '">See ' + esc(latest.label) + '</button>'
        : '<button type="button" class="action" data-set-type="Regular Season">See the regular season</button>';
      empty.innerHTML = '<p class="empty__title">' + esc(e.title) + '</p><p class="empty__body">' + esc(e.body) + '</p>' + action;
      empty.hidden = false;
      $('.listHead', paper).hidden = true;
      table.hidden = true;
      table.innerHTML = '';
      return;
    }

    empty.hidden = true;
    $('.listHead', paper).hidden = false;
    table.hidden = false;
    renderInto(table, tableHtml({
      id: 'team',
      who: 'Team',
      cols: TS.columns,
      sort: s.sort,
      dir: s.dir,
      showGp: s.perMode === 'Total',
      caption: 'Team stats, ' + s.season + ' ' + typeWord + ' (' + TS.seasonLabel(s.season) + '), ' + modeWord + ', sorted by ' + col.name.toLowerCase() + ', ' + dirWord(col, s.dir).toLowerCase() + '.',
      rows: t.rows.map(function (r) {
        return {
          key: r.slug, name: r.name, gp: r.gp, d: r.d, v: r.v, rank: r.rank, url: r.url,
          who: '<a class="club" href="' + esc(r.url) + '"><img src="' + r.logo + '" alt="" width="28" height="28"><span class="club__name">' + esc(r.name) + '</span></a>',
        };
      }),
      isLead: function (r, c) { return r.v[c.key] === t.stats[c.key].best; },
      isDim: function () { return false; },
      avg: Object.keys(t.stats).reduce(function (m, k) { m[k] = t.stats[k].avgDisplay; return m; }, {}),
      lineFoot: function (r) {
        return '<p class="lineFoot"><span>' + r.gp + ' game' + (r.gp === 1 ? '' : 's') + ' played</span><a href="' + esc(r.url) + '">Club page ' + icon('arrow-up-right') + '</a></p>';
      },
    }), TS.columns.length, s.perMode === 'Total');
  }

  // ==================================================================
  // Player Stats: the scale test, with the club filter as the fourth
  // ==================================================================
  function attempts(r, key) {
    var per = key === 'fgPct' ? r.v.fga : key === 'tpPct' ? r.v.tpa : key === 'ftPct' ? r.v.fta : null;
    return per === null || per === undefined ? null : Math.round(per * r.v.gp);
  }
  function qualifies(r, c) {
    if (c.kind !== 'percent') return r.v[c.key] !== null;
    var a = attempts(r, c.key);
    return r.v[c.key] !== null && a !== null && a >= MIN_ATTEMPTS;
  }

  var PREVIEW = TS.playerTable();
  // The preview has no player ids, so a player's page is addressed by name.
  function playerUrl(name) {
    return 'https://www.unrivaled.basketball/player/' + name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  var playerClubs = [];
  PREVIEW.rows.forEach(function (r) { if (playerClubs.indexOf(r.slug) < 0) playerClubs.push(r.slug); });
  var CLUBS = [{ value: 'all', label: 'All clubs', league: true }].concat(playerClubs.map(function (slug) {
    var c = TS.club(slug);
    return { value: slug, label: c.name, logo: c.logo };
  }).sort(function (a, b) { return a.label.localeCompare(b.label); }));
  // The preview has one season, season type, and per mode: the rest stay listed, greyed out, under a note.
  var previewNote = 'This preview holds the 2025 regular season, per game, only.';
  function only(options, value) { return options.map(function (x) { return Object.assign({}, x, { disabled: x.value !== value }); }); }

  var playerTrack = Track({
    root: $('[data-filters="player"]'),
    label: 'Player stats filters',
    reset: $('[data-reset="player"]'),
    filters: [
      { key: 'season', name: 'Season', options: only(SEASONS, PREVIEW.season), value: PREVIEW.season, def: PREVIEW.season, note: previewNote },
      { key: 'club', name: 'Club', options: CLUBS, value: 'all', def: 'all' },
      { key: 'seasonType', name: 'Season type', options: only(SEASON_TYPES, PREVIEW.seasonType), value: PREVIEW.seasonType, def: PREVIEW.seasonType, note: previewNote },
      { key: 'perMode', name: 'Per game or totals', options: only(PER_MODES, PREVIEW.perMode), value: PREVIEW.perMode, def: PREVIEW.perMode, note: previewNote },
    ],
    onChange: function (key, value) { if (key === 'club') { player.club = value; renderPlayer(); } },
    onReset: function () { player.club = 'all'; renderPlayer(); },
  });

  function renderPlayer() {
    var p = TS.playerTable({ sort: player.sort, dir: player.dir });
    var paper = $('[data-paper="player"]');
    var table = $('[data-table="player"]');
    var cols = p.columns;
    var col = cols.filter(function (c) { return c.key === p.sort; })[0];

    // A percentage on a handful of attempts says little: it ranks among the qualified only, and sorts last.
    var best = {};
    cols.forEach(function (c) {
      if (c.kind !== 'percent') { best[c.key] = p.stats[c.key].best; return; }
      var vals = p.rows.filter(function (r) { return qualifies(r, c); }).map(function (r) { return r.v[c.key]; });
      best[c.key] = vals.length ? Math.max.apply(null, vals) : null;
      p.rows.forEach(function (r) {
        if (!qualifies(r, c)) { r.rank[c.key] = null; return; }
        var x = r.v[c.key];
        r.rank[c.key] = { n: vals.filter(function (y) { return y > x; }).length + 1, tied: vals.filter(function (y) { return y === x; }).length > 1 };
      });
    });
    var rows = col.kind === 'percent'
      ? p.rows.filter(function (r) { return qualifies(r, col); }).concat(p.rows.filter(function (r) { return !qualifies(r, col); }))
      : p.rows;
    // The club filter narrows the list after ranking, so every player keeps her league rank.
    if (player.club !== 'all') rows = rows.filter(function (r) { return r.slug === player.club; });
    var clubName = player.club === 'all' ? '' : TS.club(player.club).name + ' players, ';

    playerTrack.set('club', player.club);
    syncPick('player', cols, p.sort);
    syncAbbr('player', cols);
    syncListHead(paper, col, p.dir);

    renderInto(table, tableHtml({
      id: 'player',
      who: 'Player',
      cols: cols,
      sort: p.sort,
      dir: p.dir,
      showGp: false,
      caption: 'Player stats preview, ' + clubName + p.season + ' regular season (Season 1), per game, sorted by ' + col.name.toLowerCase() + ', ' + dirWord(col, p.dir).toLowerCase() + '. Ranks are league ranks.',
      rows: rows.map(function (r) {
        return {
          key: r.name, name: r.name, gp: r.v.gp, d: r.d, v: r.v, rank: r.rank, club: r.club, url: playerUrl(r.name),
          who: '<span class="club club--still"><img src="' + r.logo + '" alt="' + esc(r.club.name) + '" width="24" height="24"><span class="club__name">' + esc(r.name) + '</span></span>',
        };
      }),
      isLead: function (r, c) { return c.kind !== 'count' && best[c.key] !== null && r.v[c.key] === best[c.key] && qualifies(r, c); },
      isDim: function (r, c) { return c.kind === 'percent' && r.v[c.key] !== null && !qualifies(r, c); },
      avg: null,
      lineFoot: function (r) {
        return '<p class="lineFoot"><span>' + r.gp + ' game' + (r.gp === 1 ? '' : 's') + ' played</span><a href="' + esc(r.url) + '">Player page ' + icon('arrow-up-right') + '</a></p>';
      },
    }), cols.length, false);
  }

  function sortPlayer(key) {
    var col = PREVIEW.columns.filter(function (c) { return c.key === key; })[0];
    if (!col) return;
    if (key === player.sort) player.dir = player.dir === 'desc' ? 'asc' : 'desc';
    else { player.sort = key; player.dir = col.better === 'low' ? 'asc' : 'desc'; }
    renderPlayer();
  }

  // ==================================================================
  // Leaders: the top five in each stat, on cards in two groups, from
  // the same preview as Player Stats. A card's footer jumps to Player
  // Stats sorted by its stat.
  // ==================================================================
  var MIN_GAMES = 5;
  var LEADERS = [
    { name: 'Offense', cards: [
      { key: 'pts', name: 'Points', label: 'PTS' },
      { key: 'ast', name: 'Assists', label: 'AST' },
      { key: 'tpm', name: '3-Pointers Made', label: '3PM' },
      { key: 'gw', name: 'Game Winners', label: 'GW' },
    ] },
    { name: 'Defense', cards: [
      { key: 'reb', name: 'Rebounds', label: 'REB' },
      { key: 'blk', name: 'Blocks', label: 'BLK' },
      { key: 'stl', name: 'Steals', label: 'STL' },
      { key: 'min', name: 'Minutes', label: 'MIN' },
    ] },
  ];
  // The preview has no game winners, so the top scorers carry placeholder counts and the card shows its shape.
  var GW_PLACEHOLDER = [2, 2, 1, 1, 1];

  var leadersTrack = Track({
    root: $('[data-filters="leaders"]'),
    label: 'Leaders filters',
    reset: $('[data-reset="leaders"]'),
    filters: [
      { key: 'season', name: 'Season', options: only(SEASONS, PREVIEW.season), value: PREVIEW.season, def: PREVIEW.season, note: previewNote },
      { key: 'seasonType', name: 'Season type', options: only(SEASON_TYPES, PREVIEW.seasonType), value: PREVIEW.seasonType, def: PREVIEW.seasonType, note: previewNote },
      { key: 'perMode', name: 'Per game or totals', options: only(PER_MODES, PREVIEW.perMode), value: PREVIEW.perMode, def: PREVIEW.perMode, note: previewNote },
    ],
  });

  function initials(name) {
    return name.split(/[\s-]+/).filter(Boolean).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  }
  // The club's color rings the disc, or its second color when the first is near black, or a plain ring when both are.
  function clubRing(club) {
    var light = function (hex) { var n = parseInt(hex.slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
    if (club.primary && light(club.primary) > 0.08) return club.primary;
    if (club.secondary && light(club.secondary) > 0.08) return club.secondary;
    return '';
  }

  function leaderRows(card, pool) {
    var rows;
    if (card.key === 'gw') {
      rows = pool.slice().sort(function (a, b) { return b.v.pts - a.v.pts; }).slice(0, GW_PLACEHOLDER.length).map(function (r, i) { return { r: r, value: GW_PLACEHOLDER[i], display: String(GW_PLACEHOLDER[i]) }; });
    } else {
      rows = pool.filter(function (r) { return r.v[card.key] !== null && r.v[card.key] > 0; }).map(function (r) { return { r: r, value: r.v[card.key], display: r.d[card.key] }; });
    }
    rows.sort(function (a, b) { return b.value - a.value; });
    var top = rows.slice(0, 5);
    top.forEach(function (x) {
      x.rank = { n: rows.filter(function (y) { return y.value > x.value; }).length + 1, tied: rows.filter(function (y) { return y.value === x.value; }).length > 1 };
    });
    return top;
  }

  function cardHtml(card, pool) {
    var rows = leaderRows(card, pool);
    var sortable = PREVIEW.columns.some(function (c) { return c.key === card.key; });
    return '<article class="lead" aria-labelledby="lead-' + card.key + '">' +
      '<header class="lead__head"><h3 class="lead__name" id="lead-' + card.key + '">' + esc(card.name) + '</h3><span class="lead__abbr">' + esc(card.label) + '</span></header>' +
      (rows.length
        ? '<ol class="lead__list">' + rows.map(function (x, i) {
            var club = TS.club(x.r.slug);
            var ring = clubRing(club);
            return '<li class="lead__row">' +
              '<span class="lead__rank">' + rankHtml(x.rank) + '</span>' +
              '<span class="lead__avatar" aria-hidden="true"' + (ring ? ' style="--club: ' + ring + '"' : '') + '>' + esc(initials(x.r.name)) + '</span>' +
              '<a class="lead__who" href="' + esc(playerUrl(x.r.name)) + '"><span class="lead__player">' + esc(x.r.name) + '</span><span class="lead__club">' + esc(club.name) + '</span></a>' +
              '<span class="lead__value"><span class="v' + (i === 0 ? ' v--top' : '') + '">' + esc(x.display) + '</span></span>' +
              '</li>';
          }).join('') + '</ol>'
        : '<p class="lead__empty">No ' + esc(card.name.toLowerCase()) + ' yet this season.</p>') +
      (sortable ? '<div class="lead__foot"><button type="button" class="lead__all" data-lead-all="' + card.key + '">Complete leaders' + icon('chevron-right') + '</button></div>' : '') +
      '</article>';
  }

  function renderLeaders() {
    var pool = PREVIEW.rows.filter(function (r) { return r.v.gp >= MIN_GAMES; });
    $('[data-leaders]').innerHTML = LEADERS.map(function (g) {
      return '<section class="group"><h2 class="group__name">' + esc(g.name) + '</h2><div class="group__grid">' + g.cards.map(function (c) { return cardHtml(c, pool); }).join('') + '</div></section>';
    }).join('');
  }

  // A card's footer opens Player Stats sorted by its stat, best first, from the top of the page.
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lead-all]');
    if (!b) return;
    var key = b.getAttribute('data-lead-all');
    var col = PREVIEW.columns.filter(function (c) { return c.key === key; })[0];
    TS.set({ tab: 'player' });
    player.sort = key;
    player.dir = col.better === 'low' ? 'asc' : 'desc';
    renderPlayer();
    window.scrollTo({ top: 0, behavior: TS.reducedMotion() ? 'auto' : 'smooth' });
  });

  // ==================================================================
  // Elsewhere: the same component, live in the notes drawer. These
  // demos keep their own state and change nothing on the page.
  // ==================================================================
  function said(el, api, words) {
    if (!el) return;
    var v = api.values();
    el.textContent = words(v);
  }
  var typeWord = function (v) { return v === 'Playoffs' ? 'playoffs' : 'regular season'; };
  var demoSeasons = SEASONS.filter(function (x) { return x.value !== '2027'; });

  function demo(name, filters, words) {
    var root = $('[data-demo="' + name + '"]');
    if (!root) return;
    var out = $('[data-demo-said="' + name + '"]');
    var api = Track({
      root: root,
      label: 'Filters',
      reset: $('[data-demo-reset="' + name + '"]'),
      filters: filters,
      onChange: function (k, v, a) { said(out, a, words); },
      onReset: function (a) { said(out, a, words); },
    });
    said(out, api, words);
  }

  demo('profile', [
    { key: 'season', name: 'Season', options: demoSeasons, value: '2026' },
    { key: 'seasonType', name: 'Season type', options: SEASON_TYPES, value: 'Regular Season' },
  ], function (v) { return 'Box scores, ' + v.season + ' ' + typeWord(v.seasonType) + '.'; });

  demo('club', [
    { key: 'season', name: 'Season', options: SEASONS, value: '2026', def: '2026' },
    { key: 'seasonType', name: 'Season type', options: SEASON_TYPES, value: 'Regular Season' },
    { key: 'perMode', name: 'Per game or totals', options: PER_MODES, value: 'Per Game' },
  ], function (v) { return 'Mist players, ' + v.season + ' ' + typeWord(v.seasonType) + ', ' + (v.perMode === 'Total' ? 'totals' : 'per game') + '.'; });

  demo('player', [
    { key: 'season', name: 'Season', options: SEASONS, value: '2026', def: '2026' },
    { key: 'club', name: 'Club', options: CLUBS.slice(0, 1).concat(Object.keys(TS.data.clubs).map(function (slug) { var c = TS.club(slug); return { value: slug, label: c.name, logo: c.logo }; }).sort(function (a, b) { return a.label.localeCompare(b.label); })), value: 'all', def: 'all' },
    { key: 'seasonType', name: 'Season type', options: SEASON_TYPES, value: 'Regular Season' },
    { key: 'perMode', name: 'Per game or totals', options: PER_MODES, value: 'Per Game' },
  ], function (v) { return (v.club === 'all' ? 'All clubs' : TS.club(v.club).name) + ', ' + v.season + ' ' + typeWord(v.seasonType) + ', ' + (v.perMode === 'Total' ? 'totals' : 'per game') + '.'; });

  var OPPONENTS = [{ value: 'all', label: 'All opponents', league: true }].concat(Object.keys(TS.data.clubs).map(function (slug) {
    var c = TS.club(slug);
    return { value: slug, label: c.name, short: 'vs ' + c.name, logo: c.logo };
  }).sort(function (a, b) { return a.label.localeCompare(b.label); }));

  demo('five', [
    { key: 'season', name: 'Season', options: SEASONS, value: '2026', def: '2026' },
    { key: 'club', name: 'Club', options: CLUBS.slice(0, 1).concat(Object.keys(TS.data.clubs).map(function (slug) { var c = TS.club(slug); return { value: slug, label: c.name, logo: c.logo }; }).sort(function (a, b) { return a.label.localeCompare(b.label); })), value: 'all', def: 'all' },
    { key: 'seasonType', name: 'Season type', options: SEASON_TYPES, value: 'Regular Season' },
    { key: 'perMode', name: 'Per game or totals', options: PER_MODES, value: 'Per Game' },
    { key: 'opponent', name: 'Opponent', options: OPPONENTS, value: 'all', def: 'all' },
  ], function (v) { return (v.club === 'all' ? 'All clubs' : TS.club(v.club).name) + (v.opponent === 'all' ? '' : ' against ' + TS.club(v.opponent).name) + ', ' + v.season + ' ' + typeWord(v.seasonType) + ', ' + (v.perMode === 'Total' ? 'totals' : 'per game') + '.'; });

  // ==================================================================
  // Clicks the table and the empty states own
  // ==================================================================
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-set-season], [data-set-type], [data-sort], [data-pick-stat], [data-flip], .open');
    if (!el) return;
    var v;
    if ((v = el.getAttribute('data-set-season'))) TS.set({ season: v, seasonType: 'Regular Season' });
    else if ((v = el.getAttribute('data-set-type'))) TS.set({ seasonType: v });
    else if ((v = el.getAttribute('data-sort'))) { if (el.getAttribute('data-of') === 'player') sortPlayer(v); else TS.sortBy(v); }
    else if ((v = el.getAttribute('data-pick-stat'))) {
      if (el.closest('[data-pick="player"]')) { if (v !== player.sort) sortPlayer(v); }
      else if (v !== TS.state.sort) TS.set({ sort: v });
    }
    else if ((v = el.getAttribute('data-flip'))) {
      if (v === 'player') sortPlayer(player.sort);
      else TS.set({ dir: TS.state.dir === 'asc' ? 'desc' : 'asc' });
    }
    else if (el.classList.contains('open')) {
      var row = el.closest('tr');
      var line = $('#' + el.getAttribute('aria-controls'));
      var id = row.closest('table').getAttribute('data-table');
      var key = row.getAttribute('data-key');
      var now = el.getAttribute('aria-expanded') !== 'true';
      el.setAttribute('aria-expanded', String(now));
      line.setAttribute('data-open', String(now));
      if (now) line.removeAttribute('inert'); else line.setAttribute('inert', '');
      if (now) opened[id][key] = true; else delete opened[id][key];
    }
  });

  // ---------- Go ----------
  TS.on(renderTeam);
  // Coming back to Player Stats starts it at points again. A filter change on the tab keeps the sort.
  TS.on(function (s, prev) {
    if (s.tab === 'player' && prev.tab !== 'player' && (player.sort !== 'pts' || player.dir !== 'desc')) {
      player.sort = 'pts';
      player.dir = 'desc';
      renderPlayer();
    }
  });
  renderTeam();
  renderPlayer();
  renderLeaders();
})();
