import { PanelHeader } from '@/components/stats/PanelHeader';
import { StatTable } from '@/components/stats/StatTable';
import type { StatsTab } from '@/components/stats/types';

const TAB_LINKS: { tab: StatsTab; href: string; label: string }[] = [
    { tab: 'leaders', href: '/stats', label: 'Leaders' },
    { tab: 'player', href: '/stats/player', label: 'Player Stats' },
    { tab: 'team', href: '/stats/team', label: 'Team Stats' },
];

// Every panel stays in the DOM: stats.js switches tabs on the client. `tab` only picks the first paint.
export function StatsPanels({ tab }: { tab: StatsTab }) {
    return (
        <main>
            <svg
                xmlns={'http://www.w3.org/2000/svg'}
                width={'0'}
                height={'0'}
                style={{ position: 'absolute' }}
                aria-hidden={'true'}
                focusable={'false'}
            >
                <symbol id={'i-rotate-ccw'} viewBox={'0 0 24 24'}>
                    <path d={'M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5'}></path>
                    <path d={'M3.5 4v4.5H8'}></path>
                </symbol>
            </svg>
            <div className={'bo'}>
                <div className={'wrap'}>
                    <nav className={'track tabs'} aria-label={'Stats'}>
                        {TAB_LINKS.map(link => (
                            <a
                                key={link.tab}
                                className={'seg'}
                                data-tab={link.tab}
                                href={link.href}
                                aria-current={link.tab === tab ? 'page' : undefined}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <section data-tab-panel={'team'} className={'panel'} hidden={tab !== 'team'}>
                        <PanelHeader tab={'team'} title={'Team Stats'} />
                        <StatTable tab={'team'} withEmptyState />
                        <div className={'foot'} data-foot={'team'}>
                            <p className={'foot__note'}>
                                {
                                    'Rank is the league rank in the sorted stat. Fewest is best for turnovers and fouls.'
                                }
                            </p>
                            <p className={'foot__note'}>
                                {'A pill marks the league best in each column, a white one in the sorted stat.'}
                            </p>
                            <dl className={'abbr'} data-abbr={'team'}></dl>
                        </div>
                    </section>

                    <section data-tab-panel={'player'} className={'panel'} hidden={tab !== 'player'}>
                        <PanelHeader tab={'player'} title={'Player Stats'} />
                        <StatTable tab={'player'} />
                        <div className={'foot'}>
                            <p className={'foot__note'}>
                                {
                                    'A preview of Season 1 player stats: the 2025 regular season, per game, is the only data in it, so the other seasons, the playoffs, and totals are greyed out in their menus.'
                                }
                            </p>
                            <p className={'foot__note'}>
                                {
                                    'Rank is the league rank in the sorted stat, also when the list shows one club. Fewest is best for turnovers and fouls.'
                                }
                            </p>
                            <p className={'foot__note'}>
                                {
                                    'A pill marks the league best in each column, a white one in the sorted stat. A dimmed percentage is on fewer than 10 attempts and sorts last.'
                                }
                            </p>
                            <dl className={'abbr'} data-abbr={'player'}></dl>
                        </div>
                    </section>

                    <section data-tab-panel={'leaders'} className={'panel'} hidden={tab !== 'leaders'}>
                        <PanelHeader tab={'leaders'} title={'Leaders'} />
                        <div className={'leaders'} data-leaders=''></div>
                        <div className={'foot'}>
                            <p className={'foot__note'}>
                                {
                                    'Per game leaders need at least 5 games played. The white number is the league leader in each stat. Game-winner counts are placeholders in this preview.'
                                }
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
