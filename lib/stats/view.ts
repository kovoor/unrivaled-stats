// The interactive panels: Team Stats, Player Stats, Leaders, and the filter demos in the design notes drawer.
// StatsPanels renders the empty containers; everything inside them is drawn here.
import { $, $$, esc, icon, target } from '@/lib/stats/dom';
import type { StatsEngine } from '@/lib/stats/engine';
import { createTrack, type TrackFilter, type TrackOption, type TrackValues, type TrackApi } from '@/lib/stats/track';
import type { Better, Club, Dir, PlayerRow, PlayerStatKey, Rank, StatKey } from '@/lib/stats/types';

const MIN_ATTEMPTS = 10;

/** A team or player column, as the shared table draws it. */
type TableColumn = { key: string; label: string; name: string; better: Better; kind?: 'count' | 'percent' };

type TableId = 'team' | 'player';

type TableRow = {
    key: string;
    name: string;
    gp: number;
    d: Record<string, string>;
    v: Record<string, number | null>;
    rank: Partial<Record<string, Rank | null>>;
    url: string;
    who: string;
    club?: Club;
};

type TableOptions = {
    id: TableId;
    who: string;
    cols: TableColumn[];
    sort: string;
    dir: Dir;
    showGp: boolean;
    caption: string;
    rows: TableRow[];
    isLead(r: TableRow, c: TableColumn): boolean;
    isDim(r: TableRow, c: TableColumn): boolean;
    avg: Record<string, string> | null;
    lineFoot(r: TableRow): string;
};

type LeaderCard = { key: PlayerStatKey | 'gw'; name: string; label: string };
type LeaderRow = { r: PlayerRow; value: number; display: string; rank?: Rank };

/** Draws the panels and wires their controls. `signal` removes every listener added here. */
export function startView(TS: StatsEngine, signal: AbortSignal): void {
    const Track = createTrack(signal);

    // ---------- The shared option lists ----------
    const SEASONS: TrackOption[] = TS.data.seasons.map(x => ({
        value: x.year,
        label: x.year + ' · ' + x.label,
        main: x.year,
        sub: x.label,
    }));
    const SEASON_TYPES: TrackOption[] = [
        { value: 'Regular Season', label: 'Regular season' },
        { value: 'Playoffs', label: 'Playoffs' },
    ];
    const PER_MODES: TrackOption[] = [
        { value: 'Per Game', label: 'Per game' },
        { value: 'Total', label: 'Totals' },
    ];
    const DEFAULTS = { season: TS.data.defaultSeason, seasonType: 'Regular Season', perMode: 'Per Game' };

    // ==================================================================
    // The table (Box Office, unchanged)
    // ==================================================================
    const player: { sort: PlayerStatKey; dir: Dir; club: string } = { sort: 'pts', dir: 'desc', club: 'all' };
    const opened: Record<TableId, Record<string, boolean>> = { team: {}, player: {} };

    // A tied rank is the number with a small raised T, so the digits sit where they always do: "3" and "3T", "3rd" and "3rdT".
    function tieMark(text: string, r: Rank) {
        return r.tied
            ? '<span class="rankTied">' + text + '<sup class="tie" aria-hidden="true">T</sup><span class="sr-only">, tied</span></span>'
            : text;
    }
    function rankHtml(r: Rank) {
        return tieMark(String(r.n), r);
    }
    function ordinalRank(r: Rank) {
        return tieMark(TS.ordinal(r.n), r);
    }
    function valueCell(d: string) {
        return d === '' ? '<span class="none" aria-hidden="true"></span><span class="sr-only">No attempts</span>' : d;
    }
    function dirWord(col: TableColumn, dir: Dir) {
        return dir === 'asc' ? 'Fewest first' : 'Most first';
    }

    // The phone picker: one segment per stat in a scrolling track, the pressed one brought to the middle.
    function syncPick(name: TableId, cols: TableColumn[], sort: string) {
        const pick = $('[data-pick="' + name + '"]')!;
        if (!pick.children.length) {
            pick.innerHTML = cols
                .map(
                    c =>
                        '<button type="button" class="seg" data-pick-stat="' + c.key + '" aria-pressed="false" title="' +
                        esc(c.name) + '">' + c.label + '</button>',
                )
                .join('');
        }
        let pressed: HTMLElement | null = null;
        for (const b of $$('[data-pick-stat]', pick)) {
            const on = b.getAttribute('data-pick-stat') === sort;
            b.setAttribute('aria-pressed', String(on));
            if (on) pressed = b;
        }
        if (pressed && pick.scrollWidth > pick.clientWidth) {
            const box = pick.getBoundingClientRect(),
                it = pressed.getBoundingClientRect();
            const left = pick.scrollLeft + (it.left - box.left) - (box.width - it.width) / 2;
            pick.scrollTo({ left: Math.max(0, left), behavior: TS.reducedMotion() ? 'auto' : 'smooth' });
        }
        fadePick(pick);
    }
    function fadePick(pick: HTMLElement) {
        const max = pick.scrollWidth - pick.clientWidth;
        const x = pick.scrollLeft;
        pick.setAttribute('data-fade', max <= 1 ? 'none' : x <= 1 ? 'end' : x >= max - 1 ? 'start' : 'both');
    }
    $$('.pick').forEach(pick => {
        pick.addEventListener('scroll', () => fadePick(pick), { passive: true, signal });
    });
    window.addEventListener('resize', () => $$('.pick').forEach(fadePick), { signal });

    function syncListHead(paper: HTMLElement, col: TableColumn, dir: Dir) {
        $('[data-list-name]', paper)!.textContent = col.name;
        $('[data-list-sub]', paper)!.textContent = dirWord(col, dir).toLowerCase();
        $('[data-flip-icon]', paper)!.setAttribute('href', dir === 'asc' ? '#i-arrow-up' : '#i-arrow-down');
    }

    // The pinned columns dress up only once the stats have scrolled under them.
    $$('.paper--wide .scroll').forEach(sc => {
        const paper = sc.closest('.paper')!;
        const sync = () => paper.setAttribute('data-scrolled', String(sc.scrollLeft > 0));
        sc.addEventListener('scroll', sync, { passive: true, signal });
        window.addEventListener('resize', sync, { signal });
        sync();
    });

    function syncAbbr(name: TableId, cols: TableColumn[]) {
        const dl = $('[data-abbr="' + name + '"]')!;
        if (dl.children.length) return;
        dl.innerHTML = cols.map(c => '<div><dt>' + c.label + '</dt><dd>' + esc(c.name) + '</dd></div>').join('');
    }

    function tableHtml(o: TableOptions) {
        const head =
            '<tr>' +
            '<th scope="col" class="rk" title="League rank in the sorted stat">RK</th>' +
            '<th scope="col" class="who">' + o.who + '</th>' +
            (o.showGp ? '<th scope="col" class="gp" title="Games played">GP</th>' : '') +
            o.cols
                .map(c => {
                    const sorted = c.key === o.sort;
                    const dir = sorted ? o.dir : c.better === 'low' ? 'asc' : 'desc';
                    const tip = c.name + (c.better === 'low' ? ', fewest is best' : '');
                    return (
                        '<th scope="col" data-col="' + c.key + '"' + (sorted ? ' data-sorted="true"' : '') +
                        ' aria-sort="' + (sorted ? (o.dir === 'asc' ? 'ascending' : 'descending') : 'none') + '">' +
                        '<button type="button" class="sortBtn" data-sort="' + c.key + '" data-of="' + o.id + '" title="' + esc(tip) + '">' +
                        icon(dir === 'asc' ? 'arrow-up' : 'arrow-down') + '<span>' + c.label + '</span><span class="sr-only">, ' +
                        esc(c.name) + '</span></button></th>'
                    );
                })
                .join('') +
            '<th scope="col" class="more"><span class="sr-only">Full line</span></th></tr>';

        const body = o.rows
            .map((r, i) => {
                const rk = r.rank[o.sort];
                const lineId = o.id + '-line-' + i;
                const isOpen = !!opened[o.id][r.key];
                return (
                    '<tr class="row" data-key="' + esc(r.key) + '">' +
                    '<td class="rk">' + (rk ? rankHtml(rk) : '') + '</td>' +
                    '<th scope="row" class="who">' + r.who + '</th>' +
                    (o.showGp ? '<td class="gp">' + r.gp + '</td>' : '') +
                    o.cols
                        .map(c => {
                            const sorted = c.key === o.sort;
                            const lead = o.isLead(r, c);
                            const cls = 'v' + (lead ? (sorted ? ' v--top' : ' v--lead') : '') + (o.isDim(r, c) ? ' v--dim' : '');
                            return (
                                '<td data-col="' + c.key + '"' + (sorted ? ' data-sorted="true"' : '') + '><span class="' + cls + '">' +
                                valueCell(r.d[c.key]) + '</span></td>'
                            );
                        })
                        .join('') +
                    '<td class="more"><button type="button" class="open" aria-expanded="' + isOpen + '" aria-controls="' + lineId +
                    '" aria-label="All stats for ' + esc(r.name) + '">' + icon('chevron-down') + '</button></td>' +
                    '</tr>' +
                    '<tr class="line" id="' + lineId + '" data-open="' + isOpen + '"' + (isOpen ? '' : ' inert') + '><td colspan="' +
                    (o.cols.length + 4) + '">' + lineHtml(o, r) + '</td></tr>'
                );
            })
            .join('');

        // The footer's label and values take the body's value box, so the row sits on the rows' height with its text centered.
        const avg = o.avg;
        const foot = avg
            ? '<tr><td class="rk"></td><th scope="row" class="who"><span class="v">League average</span></th>' +
              (o.showGp ? '<td class="gp"></td>' : '') +
              o.cols
                  .map(
                      c =>
                          '<td data-col="' + c.key + '"' + (c.key === o.sort ? ' data-sorted="true"' : '') + '><span class="v">' +
                          avg[c.key] + '</span></td>',
                  )
                  .join('') +
              '<td class="more"></td></tr>'
            : '';

        return (
            '<caption>' + esc(o.caption) + '</caption><thead>' + head + '</thead><tbody>' + body + '</tbody>' +
            (foot ? '<tfoot>' + foot + '</tfoot>' : '')
        );
    }

    // The full line on a phone. Values stay plain so they line up; the rank carries the league-best mark instead.
    // Games played is a fact for the line's foot, not a ranked stat.
    function lineHtml(o: TableOptions, r: TableRow) {
        return (
            '<div class="lineBox"><dl class="lineGrid">' +
            o.cols
                .filter(c => c.key !== 'gp')
                .map(c => {
                    const rk = r.rank[c.key];
                    const sorted = c.key === o.sort;
                    const lead = o.isLead(r, c);
                    return (
                        '<div' + (sorted ? ' data-sorted="true"' : '') + '><dt title="' + esc(c.name) + '">' + c.label + '</dt>' +
                        '<dd><span class="lineVal' + (o.isDim(r, c) ? ' lineVal--dim' : '') + '">' + valueCell(r.d[c.key]) + '</span>' +
                        (rk
                            ? '<small class="lineRank' + (lead ? (sorted ? ' lineRank--top' : ' lineRank--lead') : '') + '">' +
                              ordinalRank(rk) + '</small>'
                            : '') +
                        '</dd></div>'
                    );
                })
                .join('') +
            '</dl>' + o.lineFoot(r) + '</div>'
        );
    }

    // The table learns its stat column count and the width of its fixed columns (rank, name, and GP when shown),
    // which its stylesheet turns into each column's room and padding.
    function renderInto(table: HTMLElement, html: string, cols: number, showGp: boolean) {
        const a = document.activeElement;
        const want = a && a.getAttribute && a.getAttribute('data-sort');
        const of = a && a.getAttribute && a.getAttribute('data-of');
        table.style.setProperty('--cols', String(cols));
        table.style.setProperty('--fixed', 236 + (showGp ? 44 : 0) + 'px');
        table.innerHTML = html;
        if (want && of) {
            const again = $('[data-sort="' + want + '"][data-of="' + of + '"]', table);
            if (again) again.focus({ preventScroll: true });
        }
    }

    // ==================================================================
    // Team Stats
    // ==================================================================
    const teamTrack = Track({
        root: $('[data-filters="team"]')!,
        label: 'Team stats filters',
        reset: $('[data-reset="team"]'),
        filters: [
            { key: 'season', id: 'seasonBtn', name: 'Season', options: SEASONS, value: TS.state.season, def: DEFAULTS.season },
            { key: 'seasonType', name: 'Season type', options: SEASON_TYPES, value: TS.state.seasonType, def: DEFAULTS.seasonType },
            { key: 'perMode', name: 'Per game or totals', options: PER_MODES, value: TS.state.perMode, def: DEFAULTS.perMode },
        ],
        onChange: (key, value) => TS.set({ [key]: value }),
        onReset: () => TS.set(DEFAULTS),
    });

    function renderTeam() {
        const s = TS.state;
        const t = TS.table();
        const paper = $('[data-paper="team"]')!;
        const table = $('[data-table="team"]')!;
        const empty = $('.empty', paper)!;
        const col = TS.col(s.sort);
        const modeWord = s.perMode === 'Total' ? 'totals' : 'per game';
        const typeWord = s.seasonType === 'Playoffs' ? 'playoffs' : 'regular season';

        teamTrack.set('season', s.season);
        teamTrack.set('seasonType', s.seasonType);
        teamTrack.set('perMode', s.perMode);
        syncPick('team', TS.columns, s.sort);
        syncAbbr('team', TS.columns);
        syncListHead(paper, col, s.dir);
        $('[data-foot="team"]')!.hidden = !t;
        $('[data-pick="team"]')!.closest<HTMLElement>('.pickWrap')!.hidden = !t;

        if (!t) {
            const e = TS.emptyState()!;
            const latest = TS.data.seasons.filter(x => TS.data.tables[x.year + '|Regular Season'])[0];
            const action =
                e.kind === 'future-season'
                    ? '<button type="button" class="action" data-set-season="' + latest.year + '">See ' + esc(latest.label) + '</button>'
                    : '<button type="button" class="action" data-set-type="Regular Season">See the regular season</button>';
            empty.innerHTML = '<p class="empty__title">' + esc(e.title) + '</p><p class="empty__body">' + esc(e.body) + '</p>' + action;
            empty.hidden = false;
            $('.listHead', paper)!.hidden = true;
            table.hidden = true;
            table.innerHTML = '';
            return;
        }

        empty.hidden = true;
        $('.listHead', paper)!.hidden = false;
        table.hidden = false;
        renderInto(
            table,
            tableHtml({
                id: 'team',
                who: 'Team',
                cols: TS.columns,
                sort: s.sort,
                dir: s.dir,
                showGp: s.perMode === 'Total',
                caption:
                    'Team stats, ' + s.season + ' ' + typeWord + ' (' + TS.seasonLabel(s.season) + '), ' + modeWord +
                    ', sorted by ' + col.name.toLowerCase() + ', ' + dirWord(col, s.dir).toLowerCase() + '.',
                rows: t.rows.map(r => ({
                    key: r.slug,
                    name: r.name,
                    gp: r.gp,
                    d: r.d,
                    v: r.v,
                    rank: r.rank,
                    url: r.url,
                    who:
                        '<a class="club" href="' + esc(r.url) + '"><img src="' + r.logo + '" alt="" width="28" height="28">' +
                        '<span class="club__name">' + esc(r.name) + '</span></a>',
                })),
                isLead: (r, c) => r.v[c.key] === t.stats[c.key as StatKey].best,
                isDim: () => false,
                avg: (Object.keys(t.stats) as StatKey[]).reduce<Record<string, string>>((m, k) => {
                    m[k] = t.stats[k].avgDisplay;
                    return m;
                }, {}),
                lineFoot: r =>
                    '<p class="lineFoot"><span>' + r.gp + ' game' + (r.gp === 1 ? '' : 's') + ' played</span><a href="' +
                    esc(r.url) + '">Club page ' + icon('arrow-up-right') + '</a></p>',
            }),
            TS.columns.length,
            s.perMode === 'Total',
        );
    }

    // ==================================================================
    // Player Stats: the scale test, with the club filter as the fourth
    // ==================================================================
    function attempts(r: { v: Record<string, number | null> }, key: string) {
        const per = key === 'fgPct' ? r.v.fga : key === 'tpPct' ? r.v.tpa : key === 'ftPct' ? r.v.fta : null;
        return per === null || per === undefined ? null : Math.round(per * (r.v.gp as number));
    }
    function qualifies(r: { v: Record<string, number | null> }, c: TableColumn) {
        if (c.kind !== 'percent') return r.v[c.key] !== null;
        const a = attempts(r, c.key);
        return r.v[c.key] !== null && a !== null && a >= MIN_ATTEMPTS;
    }

    const PREVIEW = TS.playerTable();
    // The preview has no player ids, so a player's page is addressed by name.
    function playerUrl(name: string) {
        return (
            'https://www.unrivaled.basketball/player/' +
            name
                .normalize('NFD')
                .replace(/[̀-ͯ]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
        );
    }
    const playerClubs: string[] = [];
    PREVIEW.rows.forEach(r => {
        if (playerClubs.indexOf(r.slug) < 0) playerClubs.push(r.slug);
    });
    const CLUBS: TrackOption[] = [{ value: 'all', label: 'All clubs', league: true } as TrackOption].concat(
        playerClubs
            .map(slug => {
                const c = TS.club(slug);
                return { value: slug, label: c.name, logo: c.logo };
            })
            .sort((a, b) => a.label.localeCompare(b.label)),
    );
    // The preview has one season, season type, and per mode: the rest stay listed, greyed out, under a note.
    const previewNote = 'This preview holds the 2025 regular season, per game, only.';
    function only(options: TrackOption[], value: string) {
        return options.map(x => Object.assign({}, x, { disabled: x.value !== value }));
    }

    const playerTrack = Track({
        root: $('[data-filters="player"]')!,
        label: 'Player stats filters',
        reset: $('[data-reset="player"]'),
        filters: [
            { key: 'season', name: 'Season', options: only(SEASONS, PREVIEW.season), value: PREVIEW.season, def: PREVIEW.season, note: previewNote },
            { key: 'club', name: 'Club', options: CLUBS, value: 'all', def: 'all' },
            { key: 'seasonType', name: 'Season type', options: only(SEASON_TYPES, PREVIEW.seasonType), value: PREVIEW.seasonType, def: PREVIEW.seasonType, note: previewNote },
            { key: 'perMode', name: 'Per game or totals', options: only(PER_MODES, PREVIEW.perMode), value: PREVIEW.perMode, def: PREVIEW.perMode, note: previewNote },
        ],
        onChange: (key, value) => {
            if (key === 'club') {
                player.club = value;
                renderPlayer();
            }
        },
        onReset: () => {
            player.club = 'all';
            renderPlayer();
        },
    });

    function renderPlayer() {
        const p = TS.playerTable({ sort: player.sort, dir: player.dir });
        const paper = $('[data-paper="player"]')!;
        const table = $('[data-table="player"]')!;
        const cols = p.columns;
        const col = cols.filter(c => c.key === p.sort)[0];

        // A percentage on a handful of attempts says little: it ranks among the qualified only, and sorts last.
        const best: Partial<Record<PlayerStatKey, number | null>> = {};
        cols.forEach(c => {
            if (c.kind !== 'percent') {
                best[c.key] = p.stats[c.key].best;
                return;
            }
            const vals = p.rows.filter(r => qualifies(r, c)).map(r => r.v[c.key] as number);
            best[c.key] = vals.length ? Math.max(...vals) : null;
            p.rows.forEach(r => {
                if (!qualifies(r, c)) {
                    r.rank[c.key] = null;
                    return;
                }
                const x = r.v[c.key];
                r.rank[c.key] = { n: vals.filter(y => y > (x as number)).length + 1, tied: vals.filter(y => y === x).length > 1 };
            });
        });
        let rows =
            col.kind === 'percent'
                ? p.rows.filter(r => qualifies(r, col)).concat(p.rows.filter(r => !qualifies(r, col)))
                : p.rows;
        // The club filter narrows the list after ranking, so every player keeps her league rank.
        if (player.club !== 'all') rows = rows.filter(r => r.slug === player.club);
        const clubName = player.club === 'all' ? '' : TS.club(player.club).name + ' players, ';

        playerTrack.set('club', player.club);
        syncPick('player', cols, p.sort);
        syncAbbr('player', cols);
        syncListHead(paper, col, p.dir);

        renderInto(
            table,
            tableHtml({
                id: 'player',
                who: 'Player',
                cols,
                sort: p.sort,
                dir: p.dir,
                showGp: false,
                caption:
                    'Player stats preview, ' + clubName + p.season + ' regular season (Season 1), per game, sorted by ' +
                    col.name.toLowerCase() + ', ' + dirWord(col, p.dir).toLowerCase() + '. Ranks are league ranks.',
                rows: rows.map(r => ({
                    key: r.name,
                    name: r.name,
                    gp: r.v.gp,
                    d: r.d,
                    v: r.v,
                    rank: r.rank,
                    club: r.club,
                    url: playerUrl(r.name),
                    who:
                        '<span class="club club--still"><img src="' + r.logo + '" alt="' + esc(r.club.name) +
                        '" width="24" height="24"><span class="club__name">' + esc(r.name) + '</span></span>',
                })),
                isLead: (r, c) =>
                    c.kind !== 'count' &&
                    best[c.key as PlayerStatKey] !== null &&
                    r.v[c.key] === best[c.key as PlayerStatKey] &&
                    qualifies(r, c),
                isDim: (r, c) => c.kind === 'percent' && r.v[c.key] !== null && !qualifies(r, c),
                avg: null,
                lineFoot: r =>
                    '<p class="lineFoot"><span>' + r.gp + ' game' + (r.gp === 1 ? '' : 's') + ' played</span><a href="' +
                    esc(r.url) + '">Player page ' + icon('arrow-up-right') + '</a></p>',
            }),
            cols.length,
            false,
        );
    }

    function sortPlayer(key: string) {
        const col = PREVIEW.columns.filter(c => c.key === key)[0];
        if (!col) return;
        if (col.key === player.sort) player.dir = player.dir === 'desc' ? 'asc' : 'desc';
        else {
            player.sort = col.key;
            player.dir = col.better === 'low' ? 'asc' : 'desc';
        }
        renderPlayer();
    }

    // ==================================================================
    // Leaders: the top five in each stat, on cards in two groups, from
    // the same preview as Player Stats. A card's footer jumps to Player
    // Stats sorted by its stat.
    // ==================================================================
    const MIN_GAMES = 5;
    const LEADERS: { name: string; cards: LeaderCard[] }[] = [
        {
            name: 'Offense',
            cards: [
                { key: 'pts', name: 'Points', label: 'PTS' },
                { key: 'ast', name: 'Assists', label: 'AST' },
                { key: 'tpm', name: '3-Pointers Made', label: '3PM' },
                { key: 'gw', name: 'Game Winners', label: 'GW' },
            ],
        },
        {
            name: 'Defense',
            cards: [
                { key: 'reb', name: 'Rebounds', label: 'REB' },
                { key: 'blk', name: 'Blocks', label: 'BLK' },
                { key: 'stl', name: 'Steals', label: 'STL' },
                { key: 'min', name: 'Minutes', label: 'MIN' },
            ],
        },
    ];
    // The preview has no game winners, so the top scorers carry placeholder counts and the card shows its shape.
    const GW_PLACEHOLDER = [2, 2, 1, 1, 1];

    Track({
        root: $('[data-filters="leaders"]')!,
        label: 'Leaders filters',
        reset: $('[data-reset="leaders"]'),
        filters: [
            { key: 'season', name: 'Season', options: only(SEASONS, PREVIEW.season), value: PREVIEW.season, def: PREVIEW.season, note: previewNote },
            { key: 'seasonType', name: 'Season type', options: only(SEASON_TYPES, PREVIEW.seasonType), value: PREVIEW.seasonType, def: PREVIEW.seasonType, note: previewNote },
            { key: 'perMode', name: 'Per game or totals', options: only(PER_MODES, PREVIEW.perMode), value: PREVIEW.perMode, def: PREVIEW.perMode, note: previewNote },
        ],
    });

    function initials(name: string) {
        return name
            .split(/[\s-]+/)
            .filter(Boolean)
            .map(w => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }
    // The club's color rings the disc, or its second color when the first is near black, or a plain ring when both are.
    function clubRing(club: Club) {
        const light = (hex: string) => {
            const n = parseInt(hex.slice(1), 16);
            return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
        };
        if (club.primary && light(club.primary) > 0.08) return club.primary;
        if (club.secondary && light(club.secondary) > 0.08) return club.secondary;
        return '';
    }

    function leaderRows(card: LeaderCard, pool: PlayerRow[]) {
        const key = card.key;
        let rows: LeaderRow[];
        if (key === 'gw') {
            rows = pool
                .slice()
                .sort((a, b) => b.v.pts - a.v.pts)
                .slice(0, GW_PLACEHOLDER.length)
                .map((r, i) => ({ r, value: GW_PLACEHOLDER[i], display: String(GW_PLACEHOLDER[i]) }));
        } else {
            rows = pool
                .filter(r => r.v[key] !== null && (r.v[key] as number) > 0)
                .map(r => ({ r, value: r.v[key] as number, display: r.d[key] }));
        }
        rows.sort((a, b) => b.value - a.value);
        const top = rows.slice(0, 5);
        top.forEach(x => {
            x.rank = {
                n: rows.filter(y => y.value > x.value).length + 1,
                tied: rows.filter(y => y.value === x.value).length > 1,
            };
        });
        return top;
    }

    function cardHtml(card: LeaderCard, pool: PlayerRow[]) {
        const rows = leaderRows(card, pool);
        const sortable = PREVIEW.columns.some(c => c.key === card.key);
        return (
            '<article class="lead" aria-labelledby="lead-' + card.key + '">' +
            '<header class="lead__head"><h3 class="lead__name" id="lead-' + card.key + '">' + esc(card.name) +
            '</h3><span class="lead__abbr">' + esc(card.label) + '</span></header>' +
            (rows.length
                ? '<ol class="lead__list">' +
                  rows
                      .map((x, i) => {
                          const club = TS.club(x.r.slug);
                          const ring = clubRing(club);
                          return (
                              '<li class="lead__row">' +
                              '<span class="lead__rank">' + rankHtml(x.rank!) + '</span>' +
                              '<span class="lead__avatar" aria-hidden="true"' + (ring ? ' style="--club: ' + ring + '"' : '') + '>' +
                              esc(initials(x.r.name)) + '</span>' +
                              '<a class="lead__who" href="' + esc(playerUrl(x.r.name)) + '"><span class="lead__player">' +
                              esc(x.r.name) + '</span><span class="lead__club">' + esc(club.name) + '</span></a>' +
                              '<span class="lead__value"><span class="v' + (i === 0 ? ' v--top' : '') + '">' + esc(x.display) +
                              '</span></span>' +
                              '</li>'
                          );
                      })
                      .join('') +
                  '</ol>'
                : '<p class="lead__empty">No ' + esc(card.name.toLowerCase()) + ' yet this season.</p>') +
            (sortable
                ? '<div class="lead__foot"><button type="button" class="lead__all" data-lead-all="' + card.key + '">Complete leaders' +
                  icon('chevron-right') + '</button></div>'
                : '') +
            '</article>'
        );
    }

    function renderLeaders() {
        const pool = PREVIEW.rows.filter(r => r.v.gp >= MIN_GAMES);
        $('[data-leaders]')!.innerHTML = LEADERS.map(
            g =>
                '<section class="group"><h2 class="group__name">' + esc(g.name) + '</h2><div class="group__grid">' +
                g.cards.map(c => cardHtml(c, pool)).join('') + '</div></section>',
        ).join('');
    }

    // A card's footer opens Player Stats sorted by its stat, best first, from the top of the page.
    document.addEventListener(
        'click',
        e => {
            const b = target(e).closest('[data-lead-all]');
            if (!b) return;
            const key = b.getAttribute('data-lead-all');
            const col = PREVIEW.columns.filter(c => c.key === key)[0];
            TS.set({ tab: 'player' });
            player.sort = col.key;
            player.dir = col.better === 'low' ? 'asc' : 'desc';
            renderPlayer();
            window.scrollTo({ top: 0, behavior: TS.reducedMotion() ? 'auto' : 'smooth' });
        },
        { signal },
    );

    // ==================================================================
    // Elsewhere: the same component, live in the notes drawer. These
    // demos keep their own state and change nothing on the page.
    // ==================================================================
    type Words = (v: TrackValues) => string;

    function said(el: HTMLElement | null, api: TrackApi, words: Words) {
        if (!el) return;
        const v = api.values();
        el.textContent = words(v);
    }
    const typeWord = (v: string) => (v === 'Playoffs' ? 'playoffs' : 'regular season');
    const demoSeasons = SEASONS.filter(x => x.value !== '2027');

    function demo(name: string, filters: TrackFilter[], words: Words) {
        const root = $('[data-demo="' + name + '"]');
        if (!root) return;
        const out = $('[data-demo-said="' + name + '"]');
        const api = Track({
            root,
            label: 'Filters',
            reset: $('[data-demo-reset="' + name + '"]'),
            filters,
            onChange: (k, v, a) => said(out, a, words),
            onReset: a => said(out, a, words),
        });
        said(out, api, words);
    }

    // Every club, A to Z, after "All clubs".
    function allClubs(): TrackOption[] {
        return CLUBS.slice(0, 1).concat(
            Object.keys(TS.data.clubs)
                .map(slug => {
                    const c = TS.club(slug);
                    return { value: slug, label: c.name, logo: c.logo };
                })
                .sort((a, b) => a.label.localeCompare(b.label)),
        );
    }

    demo(
        'profile',
        [
            { key: 'season', name: 'Season', options: demoSeasons, value: '2026' },
            { key: 'seasonType', name: 'Season type', options: SEASON_TYPES, value: 'Regular Season' },
        ],
        v => 'Box scores, ' + v.season + ' ' + typeWord(v.seasonType) + '.',
    );

    demo(
        'club',
        [
            { key: 'season', name: 'Season', options: SEASONS, value: '2026', def: '2026' },
            { key: 'seasonType', name: 'Season type', options: SEASON_TYPES, value: 'Regular Season' },
            { key: 'perMode', name: 'Per game or totals', options: PER_MODES, value: 'Per Game' },
        ],
        v =>
            'Mist players, ' + v.season + ' ' + typeWord(v.seasonType) + ', ' + (v.perMode === 'Total' ? 'totals' : 'per game') + '.',
    );

    demo(
        'player',
        [
            { key: 'season', name: 'Season', options: SEASONS, value: '2026', def: '2026' },
            { key: 'club', name: 'Club', options: allClubs(), value: 'all', def: 'all' },
            { key: 'seasonType', name: 'Season type', options: SEASON_TYPES, value: 'Regular Season' },
            { key: 'perMode', name: 'Per game or totals', options: PER_MODES, value: 'Per Game' },
        ],
        v =>
            (v.club === 'all' ? 'All clubs' : TS.club(v.club).name) + ', ' + v.season + ' ' + typeWord(v.seasonType) + ', ' +
            (v.perMode === 'Total' ? 'totals' : 'per game') + '.',
    );

    const OPPONENTS: TrackOption[] = [{ value: 'all', label: 'All opponents', league: true } as TrackOption].concat(
        Object.keys(TS.data.clubs)
            .map(slug => {
                const c = TS.club(slug);
                return { value: slug, label: c.name, short: 'vs ' + c.name, logo: c.logo };
            })
            .sort((a, b) => a.label.localeCompare(b.label)),
    );

    demo(
        'five',
        [
            { key: 'season', name: 'Season', options: SEASONS, value: '2026', def: '2026' },
            { key: 'club', name: 'Club', options: allClubs(), value: 'all', def: 'all' },
            { key: 'seasonType', name: 'Season type', options: SEASON_TYPES, value: 'Regular Season' },
            { key: 'perMode', name: 'Per game or totals', options: PER_MODES, value: 'Per Game' },
            { key: 'opponent', name: 'Opponent', options: OPPONENTS, value: 'all', def: 'all' },
        ],
        v =>
            (v.club === 'all' ? 'All clubs' : TS.club(v.club).name) +
            (v.opponent === 'all' ? '' : ' against ' + TS.club(v.opponent).name) + ', ' + v.season + ' ' +
            typeWord(v.seasonType) + ', ' + (v.perMode === 'Total' ? 'totals' : 'per game') + '.',
    );

    // ==================================================================
    // Clicks the table and the empty states own
    // ==================================================================
    document.addEventListener(
        'click',
        e => {
            const el = target(e).closest('[data-set-season], [data-set-type], [data-sort], [data-pick-stat], [data-flip], .open');
            if (!el) return;
            let v: string | null;
            if ((v = el.getAttribute('data-set-season'))) TS.set({ season: v, seasonType: 'Regular Season' });
            else if ((v = el.getAttribute('data-set-type'))) TS.set({ seasonType: v });
            else if ((v = el.getAttribute('data-sort'))) {
                if (el.getAttribute('data-of') === 'player') sortPlayer(v);
                else TS.sortBy(v as StatKey);
            } else if ((v = el.getAttribute('data-pick-stat'))) {
                if (el.closest('[data-pick="player"]')) {
                    if (v !== player.sort) sortPlayer(v);
                } else if (v !== TS.state.sort) TS.set({ sort: v });
            } else if ((v = el.getAttribute('data-flip'))) {
                if (v === 'player') sortPlayer(player.sort);
                else TS.set({ dir: TS.state.dir === 'asc' ? 'desc' : 'asc' });
            } else if (el.classList.contains('open')) {
                const row = el.closest('tr')!;
                const line = $('#' + el.getAttribute('aria-controls'))!;
                const id = row.closest('table')!.getAttribute('data-table') as TableId;
                const key = row.getAttribute('data-key')!;
                const now = el.getAttribute('aria-expanded') !== 'true';
                el.setAttribute('aria-expanded', String(now));
                line.setAttribute('data-open', String(now));
                if (now) line.removeAttribute('inert');
                else line.setAttribute('inert', '');
                if (now) opened[id][key] = true;
                else delete opened[id][key];
            }
        },
        { signal },
    );

    // ---------- Go ----------
    TS.on(renderTeam);
    // Coming back to Player Stats starts it at points again. A filter change on the tab keeps the sort.
    TS.on((s, prev) => {
        if (s.tab === 'player' && prev.tab !== 'player' && (player.sort !== 'pts' || player.dir !== 'desc')) {
            player.sort = 'pts';
            player.dir = 'desc';
            renderPlayer();
        }
    });
    renderTeam();
    renderPlayer();
    renderLeaders();
}
