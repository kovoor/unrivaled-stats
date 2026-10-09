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
import type {
    Club,
    Column,
    Dir,
    EmptyState,
    PerMode,
    PlayerColumn,
    PlayerColumnStats,
    PlayerRow,
    PlayerStatKey,
    PlayerTable,
    Rank,
    StatKey,
    StatsData,
    StatsInput,
    StatsListener,
    StatsState,
    Tab,
    TeamColumnStats,
    TeamRow,
    TeamTable,
} from '@/lib/stats/types';

export type StatsEngine = {
    data: StatsData;
    columns: Column[];
    col(key: StatKey): Column;
    club(slug: string): Club;
    readonly state: StatsState;
    set(patch: StatsInput): void;
    sortBy(key: StatKey): void;
    defaultDir(key: string): Dir;
    on(fn: StatsListener): () => void;
    table(s?: StatsInput): TeamTable | null;
    playerTable(opts?: { sort?: string; dir?: string }): PlayerTable;
    emptyState(s?: StatsInput): EmptyState | null;
    fmt(value: number | null | undefined, perMode?: PerMode): string;
    ordinal(n: number): string;
    rankLabel(r: Rank): string;
    seasonLabel(year: string): string;
    isTotal(perMode?: PerMode): boolean;
    params: URLSearchParams;
    /** True when ?static=1 asked for no entrance animations (screenshots). */
    readonly isStatic: boolean;
    reducedMotion(): boolean;
};

const TABS: readonly Tab[] = ['leaders', 'player', 'team'];

function oneOf<T extends string>(list: readonly T[], value: string | null | undefined): value is T {
    return list.indexOf(value as T) >= 0;
}

/** Builds the page state from the URL and wires the tabs and review chrome. `signal` removes its listeners. */
export function createEngine(D: StatsData, signal: AbortSignal): StatsEngine {
    const root = document.documentElement;
    const qs = new URLSearchParams(location.search);
    const KEYS = D.columns.map(c => c.key);
    const COLS = {} as Record<StatKey, Column>;
    D.columns.forEach(c => {
        COLS[c.key] = c;
    });

    function defaultDir(key: string): Dir {
        return oneOf(KEYS, key) && COLS[key].better === 'low' ? 'asc' : 'desc';
    }

    function clean(s: StatsInput): StatsState {
        const sort = oneOf(KEYS, s.sort) ? s.sort : 'pts';
        return {
            season: D.seasons.some(x => x.year === s.season) ? (s.season as string) : D.defaultSeason,
            seasonType: oneOf(D.seasonTypes, s.seasonType) ? s.seasonType : D.seasonTypes[0],
            perMode: oneOf(D.perModes, s.perMode) ? s.perMode : D.perModes[0],
            sort,
            dir: s.dir === 'asc' || s.dir === 'desc' ? s.dir : defaultDir(sort),
            tab: oneOf(TABS, s.tab) ? s.tab : 'team',
        };
    }

    const PATH_TABS: Record<string, Tab> = { '/stats': 'leaders', '/stats/player': 'player', '/stats/team': 'team' };
    let state = clean({
        season: qs.get('season'),
        seasonType: qs.get('seasonType'),
        perMode: qs.get('perMode'),
        sort: qs.get('sort'),
        dir: qs.get('dir'),
        tab: qs.get('tab') || PATH_TABS[location.pathname],
    });
    let listeners: StatsListener[] = [];

    function writeUrl() {
        const p = new URLSearchParams(location.search);
        const defaults = clean({});
        (['season', 'seasonType', 'perMode', 'sort', 'tab'] as const).forEach(k => {
            if (state[k] === defaults[k]) p.delete(k);
            else p.set(k, state[k]);
        });
        if (state.dir === defaultDir(state.sort)) p.delete('dir');
        else p.set('dir', state.dir);
        const q = p.toString();
        try {
            history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
        } catch {
            /* file:// in some browsers */
        }
    }

    function set(patch: StatsInput) {
        const prev = state;
        const next: StatsInput = Object.assign({}, state, patch);
        // A new sort column starts best first unless a direction was given with it.
        if (patch.sort && patch.sort !== prev.sort && !patch.dir) next.dir = defaultDir(patch.sort);
        state = clean(next);
        writeUrl();
        syncTabs();
        listeners.forEach(fn => fn(state, prev));
        document.dispatchEvent(new CustomEvent('stats:change', { detail: { state, prev } }));
    }

    /** Clicking a column: a new column sorts best first; the same column again flips the direction. */
    function sortBy(key: StatKey) {
        if (key === state.sort) set({ dir: state.dir === 'desc' ? 'asc' : 'desc' });
        else set({ sort: key, dir: defaultDir(key) });
    }

    // ---------- Numbers ----------

    function isTotal(perMode?: PerMode) {
        return (perMode || state.perMode) === 'Total';
    }

    /** 77.7 per game, 1,088 in totals. */
    function fmt(value: number | null | undefined, perMode?: PerMode) {
        if (value === null || value === undefined || isNaN(value)) return '';
        return isTotal(perMode) ? Math.round(value).toLocaleString('en-US') : value.toFixed(1);
    }

    function ordinal(n: number) {
        const s = ['th', 'st', 'nd', 'rd'],
            v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    function rankLabel(r: Rank) {
        return (r.tied ? 'T-' : '') + r.n;
    }

    function seasonLabel(year: string) {
        const s = D.seasons.filter(x => x.year === year)[0];
        return s ? s.label : year;
    }

    function rawRows(s: StatsState) {
        return D.tables[s.season + '|' + s.seasonType] || null;
    }

    /**
     * The table for the current state (or another state passed in):
     *   null when there are no games yet (the page's empty state), otherwise
     *   { rows, stats, state }, rows sorted.
     * Rank 1 is the league best: most for most columns, fewest for TO and PF.
     */
    function table(input?: StatsInput): TeamTable | null {
        const s = input ? clean(Object.assign({}, state, input)) : state;
        const src = rawRows(s);
        if (!src || !src.length) return null;
        const total = isTotal(s.perMode);
        const rows: TeamRow[] = src.map(r => {
            const club = D.clubs[r.club];
            const v = {} as TeamRow['v'];
            KEYS.forEach(k => {
                v[k] = total ? r.total[k] : r.perGame[k];
            });
            const d = {} as TeamRow['d'];
            KEYS.forEach(k => {
                d[k] = fmt(v[k], s.perMode);
            });
            return { slug: r.club, name: club.name, logo: club.logo, url: club.url, club, gp: r.gp, v, d, rank: {} };
        });
        const stats = {} as TeamTable['stats'];
        KEYS.forEach(k => {
            const low = COLS[k].better === 'low';
            const vals = rows.map(r => r.v[k]);
            const min = Math.min(...vals),
                max = Math.max(...vals);
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            rows.forEach(r => {
                const better = vals.filter(x => (low ? x < r.v[k] : x > r.v[k])).length;
                const same = vals.filter(x => x === r.v[k]).length;
                r.rank[k] = { n: better + 1, tied: same > 1 };
            });
            const best = low ? min : max,
                worst = low ? max : min;
            const col: TeamColumnStats = {
                min,
                max,
                avg,
                avgDisplay: total ? Math.round(avg).toLocaleString('en-US') : avg.toFixed(1),
                best,
                worst,
                spread: max - min,
                leaders: rows.filter(r => r.v[k] === best).map(r => r.slug),
            };
            stats[k] = col;
        });
        const dir = s.dir === 'asc' ? 1 : -1;
        rows.sort((a, b) => {
            const diff = (a.v[s.sort] - b.v[s.sort]) * dir;
            return diff !== 0 ? diff : a.name.localeCompare(b.name);
        });
        return { rows, stats, state: s };
    }

    /**
     * The Player Stats tab's scale test (2025 regular season, per game, every player who played),
     * rows sorted by `sort` (default pts) in `dir` (default best first).
     * Percentages with no attempts are null, show as '' and sort last.
     */
    function playerTable(opts: { sort?: string; dir?: string } = {}): PlayerTable {
        const P = D.playerPreview;
        const pcols = {} as Record<PlayerStatKey, PlayerColumn>;
        P.columns.forEach(c => {
            pcols[c.key] = c;
        });
        const sort: PlayerStatKey = pcols[opts.sort as PlayerStatKey] ? (opts.sort as PlayerStatKey) : 'pts';
        const dir: Dir =
            opts.dir === 'asc' || opts.dir === 'desc' ? opts.dir : pcols[sort].better === 'low' ? 'asc' : 'desc';
        const rows: PlayerRow[] = P.rows.map(r => {
            const club: Club | undefined = D.clubs[r.club];
            const v = {} as PlayerRow['v'];
            const d = {} as PlayerRow['d'];
            P.columns.forEach(c => {
                const x = r[c.key];
                (v as Record<PlayerStatKey, number | null>)[c.key] = x;
                d[c.key] = x === null ? '' : c.kind === 'count' ? String(x) : x.toFixed(1);
            });
            return { name: r.name, slug: r.club, club: club as Club, logo: club?.logo, v, d, rank: {} };
        });
        const stats = {} as PlayerTable['stats'];
        P.columns.forEach(c => {
            const low = c.better === 'low';
            const vals = rows.map(r => r.v[c.key]).filter((x): x is number => x !== null);
            const min = Math.min(...vals),
                max = Math.max(...vals);
            rows.forEach(r => {
                const x = r.v[c.key];
                if (x === null) {
                    r.rank[c.key] = null;
                    return;
                }
                const better = vals.filter(y => (low ? y < x : y > x)).length;
                const same = vals.filter(y => y === x).length;
                r.rank[c.key] = { n: better + 1, tied: same > 1 };
            });
            const col: PlayerColumnStats = {
                min,
                max,
                avg: vals.reduce((a, b) => a + b, 0) / vals.length,
                best: low ? min : max,
                worst: low ? max : min,
            };
            stats[c.key] = col;
        });
        const sign = dir === 'asc' ? 1 : -1;
        rows.sort((a, b) => {
            const x = a.v[sort],
                y = b.v[sort];
            if (x === null && y === null) return a.name.localeCompare(b.name);
            if (x === null) return 1;
            if (y === null) return -1;
            return (x - y) * sign || a.name.localeCompare(b.name);
        });
        return {
            columns: P.columns,
            rows,
            stats,
            sort,
            dir,
            season: P.season,
            seasonType: P.seasonType,
            perMode: P.perMode,
        };
    }

    /** What the page says when a table is empty, by cause. Options may restyle or reword. */
    function emptyState(input?: StatsInput): EmptyState | null {
        const s = input ? clean(Object.assign({}, state, input)) : state;
        if (rawRows(s)) return null;
        const label = seasonLabel(s.season);
        const hasAnyGames = D.seasonTypes.some(t => !!D.tables[s.season + '|' + t]);
        if (!hasAnyGames) {
            return {
                kind: 'future-season',
                title: label + ' has not tipped off',
                body: 'Team stats fill in after the first game of ' + label + '.',
            };
        }
        const kind = s.seasonType === 'Playoffs' ? 'playoff' : 'regular season';
        return {
            kind: 'no-games',
            title: 'No ' + kind + ' games yet',
            body:
                'Team stats for the ' +
                s.season +
                ' ' +
                (s.seasonType === 'Playoffs' ? 'playoffs' : 'regular season') +
                ' fill in after the first game.',
        };
    }

    // ---------- Tabs ----------
    // Any [data-tab="leaders|player|team"] link is a stats tab; any [data-tab-panel="..."] is its panel.
    // The shell keeps aria-current="page" on the active links and `hidden` on the other panels.

    function syncTabs() {
        document.querySelectorAll('[data-tab]').forEach(a => {
            if (a.getAttribute('data-tab') === state.tab) a.setAttribute('aria-current', 'page');
            else a.removeAttribute('aria-current');
        });
        document.querySelectorAll<HTMLElement>('[data-tab-panel]').forEach(p => {
            p.hidden = p.getAttribute('data-tab-panel') !== state.tab;
        });
        root.dataset.tab = state.tab;
    }

    document.addEventListener(
        'click',
        e => {
            const a = e.target instanceof Element && e.target.closest('[data-tab]');
            if (!a) return;
            e.preventDefault();
            const tab = a.getAttribute('data-tab');
            if (tab !== state.tab) set({ tab });
        },
        { signal },
    );

    // ---------- Review chrome ----------

    function review() {
        const rv = document.querySelector('.rv');
        const notes = document.querySelector('.rv-notes');
        if (!rv) return;
        rv.addEventListener(
            'click',
            e => {
                const target = e.target as Element;
                if (target.closest('[data-rv-notes]') && notes) {
                    notes.setAttribute('data-open', String(notes.getAttribute('data-open') !== 'true'));
                    return;
                }
                if (target.closest('[data-rv-min]')) rv.setAttribute('data-min', String(rv.getAttribute('data-min') !== 'true'));
            },
            { signal },
        );
        if (notes) {
            notes.addEventListener(
                'click',
                e => {
                    if ((e.target as Element).closest('[data-rv-close]')) notes.setAttribute('data-open', 'false');
                },
                { signal },
            );
            document.addEventListener(
                'keydown',
                e => {
                    if (e.key === 'Escape') notes.setAttribute('data-open', 'false');
                },
                { signal },
            );
        }
        if (window.matchMedia('(max-width: 720px)').matches) rv.setAttribute('data-min', 'true');
    }

    if (qs.get('static') === '1') root.classList.add('is-static');
    if (qs.get('rv') === '0') root.dataset.rv = '0';
    root.dataset.tab = state.tab;

    const engine: StatsEngine = {
        data: D,
        columns: D.columns,
        col: key => COLS[key],
        club: slug => D.clubs[slug],
        get state() {
            return state;
        },
        set,
        sortBy,
        defaultDir,
        on(fn) {
            listeners.push(fn);
            return () => {
                listeners = listeners.filter(f => f !== fn);
            };
        },
        table,
        playerTable,
        emptyState,
        fmt,
        ordinal,
        rankLabel,
        seasonLabel,
        isTotal,
        params: qs,
        get isStatic() {
            return root.classList.contains('is-static');
        },
        reducedMotion: () =>
            root.classList.contains('is-static') || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };

    review();
    syncTabs();
    return engine;
}
