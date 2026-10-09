// The supplied snapshot (data.ts) and the shapes the engine builds from it.

export type Tab = 'leaders' | 'player' | 'team';
export type Dir = 'asc' | 'desc';
export type Better = 'high' | 'low';
export type SeasonType = 'Regular Season' | 'Playoffs';
export type PerMode = 'Per Game' | 'Total';

/** The team table's stats. */
export type StatKey = 'pts' | 'or' | 'dr' | 'reb' | 'ast' | 'stl' | 'blk' | 'to' | 'pf';
/** Shooting percentages: null when a player has no attempts. */
export type PercentKey = 'fgPct' | 'tpPct' | 'ftPct';
/** The player preview's stats. */
export type PlayerStatKey =
    | 'gp'
    | 'min'
    | 'pts'
    | 'fgm'
    | 'fga'
    | PercentKey
    | 'tpm'
    | 'tpa'
    | 'ftm'
    | 'fta'
    | 'or'
    | 'dr'
    | 'reb'
    | 'ast'
    | 'stl'
    | 'blk'
    | 'to'
    | 'pf';

export type Season = { year: string; label: string };

export type Column = { key: StatKey; label: string; name: string; group: string; better: Better };

export type PlayerColumn = {
    key: PlayerStatKey;
    label: string;
    name: string;
    better: Better;
    kind?: 'count' | 'percent';
};

export type Club = { slug: string; name: string; primary: string; secondary: string; logo: string; url: string };

export type StatLine = Record<StatKey, number>;

export type TeamRecord = { club: string; gp: number; perGame: StatLine; total: StatLine };

export type PlayerLine = Record<Exclude<PlayerStatKey, PercentKey>, number> & Record<PercentKey, number | null>;

export type PlayerRecord = { name: string; club: string } & PlayerLine;

export type PlayerPreview = {
    season: string;
    seasonType: SeasonType;
    perMode: PerMode;
    columns: PlayerColumn[];
    rows: PlayerRecord[];
};

export type StatsData = {
    seasons: Season[];
    defaultSeason: string;
    seasonTypes: SeasonType[];
    perModes: PerMode[];
    columns: Column[];
    clubs: Record<string, Club>;
    /** Keyed "<season>|<season type>", e.g. "2025|Playoffs". A missing key means no games yet. */
    tables: Partial<Record<string, TeamRecord[]>>;
    playerPreview: PlayerPreview;
};

// ---------- Page state ----------

export type StatsState = {
    season: string;
    seasonType: SeasonType;
    perMode: PerMode;
    sort: StatKey;
    dir: Dir;
    tab: Tab;
};

/** Anything a URL or a filter hands over; clean() keeps the valid values and defaults the rest. */
export type StatsInput = Partial<Record<keyof StatsState, string | null | undefined>>;

export type StatsListener = (state: StatsState, prev: StatsState) => void;

// ---------- Built tables ----------

/** A rank with ties: { n: 2, tied: true } reads "T-2". */
export type Rank = { n: number; tied: boolean };

export type TeamRow = {
    slug: string;
    name: string;
    logo: string;
    url: string;
    club: Club;
    gp: number;
    v: StatLine;
    d: Record<StatKey, string>;
    rank: Partial<Record<StatKey, Rank>>;
};

export type TeamColumnStats = {
    min: number;
    max: number;
    avg: number;
    avgDisplay: string;
    best: number;
    worst: number;
    spread: number;
    leaders: string[];
};

export type TeamTable = { rows: TeamRow[]; stats: Record<StatKey, TeamColumnStats>; state: StatsState };

export type PlayerRow = {
    name: string;
    slug: string;
    club: Club;
    logo: string | undefined;
    v: PlayerLine;
    d: Record<PlayerStatKey, string>;
    rank: Partial<Record<PlayerStatKey, Rank | null>>;
};

export type PlayerColumnStats = { min: number; max: number; avg: number; best: number; worst: number };

export type PlayerTable = {
    columns: PlayerColumn[];
    rows: PlayerRow[];
    stats: Record<PlayerStatKey, PlayerColumnStats>;
    sort: PlayerStatKey;
    dir: Dir;
    season: string;
    seasonType: SeasonType;
    perMode: PerMode;
};

export type EmptyState = { kind: 'future-season' | 'no-games'; title: string; body: string };
