export function DesignNotes() {
    return (
        <>
            <div className={'rv'} data-min={'false'}>
                <div className={'rv__bar'}>
                    <span className={'rv__tag'}>{'Filters 1e · One Track, container'}</span>
                    <button className={'rv__btn'} type={'button'} data-rv-notes=''>
                        {'Design notes'}
                    </button>
                    <button
                        className={'rv__min'}
                        type={'button'}
                        data-rv-min=''
                        aria-label={'Collapse or expand the mock controls'}
                    >
                        {'◐'}
                    </button>
                </div>
            </div>
            <aside className={'rv-notes'} data-open={'false'} aria-label={'Design notes'}>
                <div className={'rv-notes__head'}>
                    <span className={'rv-notes__kicker'}>{'Design notes · filters 1e'}</span>
                    <button className={'rv-notes__close'} type={'button'} data-rv-close=''>
                        {'Close'}
                    </button>
                </div>
                <h2>{'One Track'}</h2>
                <p>
                    {
                        "Every filter lives in one glass capsule, the same material as the paper and the tabs. Each filter is a menu segment of it, its value and a chevron, hairlines sit between segments, and there is one selected look: a glass thumb under white text. When a row does not fit its container, the capsule folds by segment and keeps its radius. Solid white is left to the table's answer."
                    }
                </p>

                <h3>{'One table, padding from the room'}</h3>
                <p>
                    {
                        'This copy runs both tables on one set of rules and lets the side padding follow the room a column has. The scroller is a size container; the table knows its stat column count and the width of its fixed columns ('
                    }
                    <code>{'--cols'}</code>
                    {', '}
                    <code>{'--fixed'}</code>
                    {
                        "), and from those the stylesheet works out each column's share of the width and sets the padding with one "
                    }
                    <code>{'clamp()'}</code>
                    {
                        ": 6px when a column is at its 47px minimum, up to 16px as columns widen. Stat columns share the width equally, so the name column stays 188px in both tables, and the table's minimum width comes from the same count, so twenty columns scroll with the rank and name pinned while nine fill the paper. No breakpoint and no team or player rule decides any of it. The head and the League average footer are 46px each, the same beat as the rows, and the sorted column's band stops at the footer's hairline, where the footer shows a brighter value instead."
                    }
                </p>

                <h3>{'Leaders'}</h3>
                <p>
                    {
                        "The Leaders tab is the live page's content in this language: Offense (points, assists, 3-pointers made, game winners) and Defense (rebounds, blocks, steals, minutes), each stat a top five on a glass card, four across from 1200px, two on a tablet, one on a phone. A row is rank, the player's initials on a disc ringed in her club's color where the headshot will go, name over club, and the value, the leader's as the white pill. \"Complete leaders\" at a card's foot opens Player Stats sorted by that stat. Per game leaders need five games, as on the live page. Game winners are placeholder counts, since the preview has none. A tied rank, everywhere one appears, is the number with a small raised T (\"3"
                    }
                    <sup>{'T'}</sup>
                    {'", "3rd'}
                    <sup>{'T'}</sup>
                    {'") rather than "T-3", so the digits sit where they always do and a tie never widens a column.'}
                </p>

                <h3>{'Pick list'}</h3>
                <ol>
                    <li>
                        <b>{'One capsule for every filter'}</b>
                        {
                            ': season, season type, and per game or totals share one 44px glass track, each a menu segment of it, so the three read as one control.'
                        }
                    </li>
                    <li>
                        <b>{'Every filter is a menu'}</b>
                        {
                            ": a value and a chevron, whether it has two options or twenty, so the track reads the same on every page and a new option never changes a control's shape. A segment keeps the width of its widest option, so picking a shorter value moves nothing."
                        }
                    </li>
                    <li>
                        <b>{'The glass thumb is the one selected look'}</b>
                        {
                            ": the current tab, an open menu, a menu's checked item, and the phone's pressed stat all sit on the same raised glass lozenge with white text, never on solid white."
                        }
                    </li>
                    <li>
                        <b>{'Solid white is spent once'}</b>
                        {
                            ': it marks the league best in the sorted stat and nothing in the head, so the eye goes title, then the white number, and the filters stay calm.'
                        }
                    </li>
                    <li>
                        <b>{'Hairlines between segments'}</b>
                        {
                            ': short 18px rules inside the track; the rule that would lead a row is clipped, so a divider only ever sits between two segments. A folded track draws one inset hairline between its rows.'
                        }
                    </li>
                    <li>
                        <b>{'The order narrows'}</b>
                        {': season, then club, then season type, then per game or totals, the same on every page.'}
                    </li>
                    <li>
                        <b>{'The title shares the row'}</b>
                        {
                            ": \"Team Stats\" at 40px, centered on the track's axis, the title's left edge on the paper's and the track's right edge on the paper's. Tabs, then one row, then the paper: the paper's top edge moves from 243px up to 222px at 1440."
                        }
                    </li>
                    <li>
                        <b>{'The track folds, it never scrolls or hides'}</b>
                        {
                            ': a row that does not fit wraps by whole segments, a hairline between the rows, the same 23px radius (concentric with the 36px thumbs) in both shapes.'
                        }
                    </li>
                    <li>
                        <b>{'Whole-cell sort targets'}</b>
                        {
                            ': a column head sorts wherever it is clicked, the full width and height of the cell, not only on its label.'
                        }
                    </li>
                    <li>
                        <b>{'A phone row is one target'}</b>
                        {
                            ': a tap anywhere on it, the rank, the crest, the name, the value, or the chevron, opens its line; the club page link waits in the line.'
                        }
                    </li>
                    <li>
                        <b>{'Whole-row tap targets'}</b>
                        {
                            ': every segment is as tall as its row, 44px, with the thumb drawn 4px inside, so the phone gets 44px targets without a fatter capsule.'
                        }
                    </li>
                    <li>
                        <b>{'A menu with one live choice is still a menu'}</b>
                        {
                            ': Player Stats lists every season, both season types, and both per modes, with the ones this preview cannot show greyed out under a note, so the track looks the way it will when the data is there.'
                        }
                    </li>
                    <li>
                        <b>{'A More segment for the fifth filter'}</b>
                        {
                            ': it closes the menus and opens a glass menu of the folded filters under their names; once a folded filter is changed, More shows its value ("vs Rose"), so every choice stays readable at rest.'
                        }
                    </li>
                    <li>
                        <b>{'Reset appears when you leave the default'}</b>
                        {
                            ': a quiet "Reset" at the end of the title\'s line, beside the track. It keeps its space while hidden, so appearing moves nothing. For heads with three or more filters; with two, each is one tap from its default anyway.'
                        }
                    </li>
                    <li>
                        <b>{'One toolbar, one tab stop'}</b>
                        {
                            ': Tab enters the track once, Left and Right move along it, Home and End jump to its ends, Down or Up opens a menu. A menu takes arrows, Home, End, Enter, and Escape, closes on an outside press, and hands focus back to its segment.'
                        }
                    </li>
                    <li>
                        <b>{'The menu is a glass sheet under its segment'}</b>
                        {
                            ': centered on it, 20px corners concentric with 14px items, the checked item on the thumb with a check. Clubs carry their crests; "All clubs" carries the league mark.'
                        }
                    </li>
                    <li>
                        <b>{'The tabs are the same track'}</b>
                        {
                            ': same height, material, and thumb. Full width on the phone, hugging their labels from 768px.'
                        }
                    </li>
                    <li>
                        <b>{'The phone stat picker loses its capsule'}</b>
                        {
                            ": its segments sit straight on the sticky band, so the first screen holds two capsules instead of four, and the picker reads as the table's control, not a fourth filter."
                        }
                    </li>
                    <li>
                        <b>{'Empty states keep every filter live'}</b>
                        {
                            ': the paper says why and offers one glass button to the nearest table, glass rather than white, since white belongs to the table.'
                        }
                    </li>
                    <li>
                        <b>{'Motion'}</b>
                        {
                            ': thumbs crossfade in 200ms, the chevron turns, a menu drops in over 160ms, Reset fades. None of it in static mode or under reduced motion.'
                        }
                    </li>
                </ol>

                <h3>{'The rules'}</h3>
                <ul>
                    <li>
                        <b>{'Which control'}</b>
                        {
                            ': a menu, always. A filter is its options; a page never picks a control. An option a page cannot serve is listed and greyed out, never dropped, with a note that says why.'
                        }
                    </li>
                    <li>
                        <b>{'Where a new filter goes'}</b>
                        {
                            ': in the order it narrows (season, then club, then season type, then per game or totals). The track holds four filters; the fifth and later fold into More at the end, in the order given.'
                        }
                    </li>
                    <li>
                        <b>{'Selected-state hierarchy'}</b>
                        {
                            ': solid white is the answer, the league best in the sorted stat, and it leads. The glass thumb is "chosen": the current tab, each filter\'s value, a checked menu item. A flat white-10 pill is the league best in the other columns. A menu\'s value is plain white text, since it is always the current one.'
                        }
                    </li>
                    <li>
                        <b>{'How it adapts'}</b>
                        {
                            ': to its container, never only to the viewport. The head is a wrapping row: the title and the track share it while they fit, the track takes its own row when they do not, and the track folds by segment when it does not fit that row either. A container query under 344px tightens the segments so two menus still share a row. No breakpoint knows how many filters there are.'
                        }
                    </li>
                </ul>

                <h3>{'Elsewhere'}</h3>
                <p>
                    {
                        'The same component, live. Each card keeps its own state and changes nothing on the page; the line under it says what the card would show. At this width the cards with three or more filters fold, which is the phone layout seen from a desktop.'
                    }
                </p>
                <div className={'demo'}>
                    <p className={'demo__ctx'}>{'Player profile, under the player header: season and season type.'}</p>
                    <div className={'demo__frame'}>
                        <div className={'head'}>
                            <div className={'head__title'}>
                                <h4 className={'demo__h'}>{'Stats'}</h4>
                            </div>
                            <div className={'filters'} data-demo={'profile'}></div>
                        </div>
                        <p className={'demo__said'} data-demo-said={'profile'}></p>
                    </div>
                </div>
                <div className={'demo'}>
                    <p className={'demo__ctx'}>{'Club page, Stats tab: season, season type, per game or totals.'}</p>
                    <div className={'demo__frame'}>
                        <div className={'head'}>
                            <div className={'head__title'}>
                                <h4 className={'demo__h'}>{'Player Stats'}</h4>
                                <button
                                    type={'button'}
                                    className={'reset'}
                                    data-demo-reset={'club'}
                                    aria-label={'Reset filters'}
                                    data-on={'false'}
                                >
                                    <svg className={'i'} aria-hidden={'true'}>
                                        <use href={'#i-rotate-ccw'}></use>
                                    </svg>
                                    {'Reset'}
                                </button>
                            </div>
                            <div className={'filters'} data-demo={'club'}></div>
                        </div>
                        <p className={'demo__said'} data-demo-said={'club'}></p>
                    </div>
                </div>
                <div className={'demo'}>
                    <p className={'demo__ctx'}>
                        {'Player Stats with the club filter as the fourth, every filter live.'}
                    </p>
                    <div className={'demo__frame'}>
                        <div className={'head'}>
                            <div className={'head__title'}>
                                <h4 className={'demo__title'}>{'Player Stats'}</h4>
                                <button
                                    type={'button'}
                                    className={'reset'}
                                    data-demo-reset={'player'}
                                    aria-label={'Reset filters'}
                                    data-on={'false'}
                                >
                                    <svg className={'i'} aria-hidden={'true'}>
                                        <use href={'#i-rotate-ccw'}></use>
                                    </svg>
                                    {'Reset'}
                                </button>
                            </div>
                            <div className={'filters'} data-demo={'player'}></div>
                        </div>
                        <p className={'demo__said'} data-demo-said={'player'}></p>
                    </div>
                </div>
                <div className={'demo'}>
                    <p className={'demo__ctx'}>
                        {'A fifth filter, Opponent, folds into More. Pick an opponent and More shows it.'}
                    </p>
                    <div className={'demo__frame'}>
                        <div className={'head'}>
                            <div className={'head__title'}>
                                <h4 className={'demo__title'}>{'Player Stats'}</h4>
                                <button
                                    type={'button'}
                                    className={'reset'}
                                    data-demo-reset={'five'}
                                    aria-label={'Reset filters'}
                                    data-on={'false'}
                                >
                                    <svg className={'i'} aria-hidden={'true'}>
                                        <use href={'#i-rotate-ccw'}></use>
                                    </svg>
                                    {'Reset'}
                                </button>
                            </div>
                            <div className={'filters'} data-demo={'five'}></div>
                        </div>
                        <p className={'demo__said'} data-demo-said={'five'}></p>
                    </div>
                </div>

                <h3>{'On the phone'}</h3>
                <p>
                    {
                        "The head is the tabs at full width, the title with Reset on its right when something has changed, and the track folded in two: the season and season type menus across the top, per game or totals below, each row 44px. Per game or totals stays in the track at every width, so the list head is only the stat's name, its order, and the round flip. The stat picker keeps its sticky band (the same height as today, padded so the shield never covers a segment) but drops its capsule, which leaves two capsules on the first screen. A menu opens as a sheet centered under its segment with 44px items. On a 360 phone the container query tightens the segments to 12.5px type. Player Stats folds the same way: season and club on top, season type and per mode below. A tapped row presses, it never keeps a hover, and the rank column holds a tie without moving the crest."
                    }
                </p>

                <h3>{'Building it'}</h3>
                <ul>
                    <li>
                        <b>
                            {'It replaces '}
                            <code>{'SelectStatsFilter'}</code>
                        </b>
                        {' with a '}
                        <code>{'FilterTrack'}</code>
                        {
                            ' and the head that holds it. The kind of control comes from the options, so pages pass data, never controls:\n    '
                        }
                        <code>
                            {
                                "<FilterTrack label=\"Team stats filters\" reset filters={[{ key: 'season', name: 'Season', list: true, options: seasons.map((s) => ({ value: s.year, label: `${s.year} · ${s.label}`, sub: s.label })), value: season, defaultValue: currentSeason }, { key: 'seasonType', name: 'Season type', options: SEASON_TYPES, value: seasonType }, { key: 'perMode', name: 'Per game or totals', options: PER_MODES, value: perMode }]} />"
                            }
                        </code>
                        {'.\n    An option is '}
                        <code>{'{ value, label, sub?, logo?, short? }'}</code>
                        {'. Each change writes its search param the way '}
                        <code>{'SelectSeason'}</code>
                        {' does today; a filter with local state (the club filter here) passes '}
                        <code>{'onChange'}</code>
                        {' instead.'}
                    </li>
                    <li>
                        <b>{'The head'}</b>
                        {' is a flex row that wraps: '}
                        <code>{'<StatsHead title="Team Stats" filters={...} />'}</code>
                        {
                            ' renders the title, Reset, and the track. The player profile and the club page use the same head with a small heading.'
                        }
                    </li>
                    <li>
                        <b>{'State lives in attributes'}</b>
                        {': '}
                        <code>{'aria-pressed'}</code>
                        {', '}
                        <code>{'aria-current'}</code>
                        {', '}
                        <code>{'aria-expanded'}</code>
                        {', and '}
                        <code>{'aria-checked'}</code>
                        {' drive every thumb in CSS; Reset uses '}
                        <code>{'data-on'}</code>
                        {'. The track renders once and updates attributes, so the roving tab stop survives a change.'}
                    </li>
                    <li>
                        <b>{'The table'}</b>
                        {
                            " is Box Office as it was, with these changes: per game or totals leaves the phone list head, the phone picker and the empty-state button take the glass look instead of white, the flip grows to 44px, nothing in the head sticks, either table scrolls inside its paper when it is wider than the paper, with the rank and name pinned (plain until the stats slide under them, then the paper's own color with one soft edge), which the player table always is below the page's widest and the team table only is on a narrow tablet in totals, every league-best pill is the same rounded square, its corner scaled to its height, with no ring, in both tables, the phone row, and the line's rank tags, and it stays inside the cell's padding, rows light up under a pointer only and press on touch, the phone rank column is wide enough for a tie, and in a phone row's full line the values stay plain and the rank carries the league-best tag, since a value pill ran over the rank beside it. Coming back to Player Stats from another tab starts it at points again, while changing the club on the tab keeps whatever stat is sorted. A player's line leaves games played out of the ranked grid and states it in the foot with a Player page link, the way a club's line does."
                        }
                    </li>
                    <li>
                        <b>{'Risky'}</b>
                        {': the track clips with '}
                        <code>{'overflow: clip'}</code>
                        {
                            ' to hide leading dividers, so its menus are siblings of the track, never inside it. The container query sits on the block that holds the head (the panel, the card), not the head, because a container is its own stacking context and would put the menus under the paper. Reduced motion uses '
                        }
                        <code>{'transition: none'}</code>
                        {
                            ', not a tiny duration: a near-zero transition still delays what a script reads back, which first placed the phone menu off center.'
                        }
                    </li>
                </ul>
            </aside>
        </>
    );
}
