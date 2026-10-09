export function StatsPanels() {
    return (
        <>
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
                            <a className={'seg'} data-tab={'leaders'} href={'/stats'}>
                                {'Leaders'}
                            </a>
                            <a className={'seg'} data-tab={'player'} href={'/stats/player'}>
                                {'Player Stats'}
                            </a>
                            <a className={'seg'} data-tab={'team'} href={'/stats/team'}>
                                {'Team Stats'}
                            </a>
                        </nav>

                        <section data-tab-panel={'team'} className={'panel'}>
                            <header className={'head'}>
                                <div className={'head__title'}>
                                    <h1 className={'title'}>{'Team Stats'}</h1>
                                    <button
                                        type={'button'}
                                        className={'reset'}
                                        data-reset={'team'}
                                        aria-label={'Reset filters'}
                                        data-on={'false'}
                                    >
                                        <svg className={'i'} aria-hidden={'true'}>
                                            <use href={'#i-rotate-ccw'}></use>
                                        </svg>
                                        {'Reset\n          '}
                                    </button>
                                </div>
                                <div className={'filters'} data-filters={'team'}></div>
                            </header>

                            <div className={'pickWrap'}>
                                <div className={'track pickTrack'}>
                                    <div
                                        className={'pick'}
                                        role={'group'}
                                        aria-label={'Stat shown'}
                                        data-pick={'team'}
                                    ></div>
                                </div>
                            </div>

                            <div className={'paper paper--wide'} data-paper={'team'}>
                                <div className={'listHead'}>
                                    <p className={'listHead__name'}>
                                        <b data-list-name=''>{'Points'}</b>
                                        <span data-list-sub=''>{'most first'}</span>
                                    </p>
                                    <button
                                        type={'button'}
                                        className={'flip'}
                                        data-flip={'team'}
                                        aria-label={'Flip the order'}
                                    >
                                        <svg className={'i'} aria-hidden={'true'}>
                                            <use data-flip-icon='' href={'#i-arrow-down'}></use>
                                        </svg>
                                    </button>
                                </div>
                                <div className={'scroll'}>
                                    <table className={'stats'} data-table={'team'}></table>
                                </div>
                                <div className={'pinEdge'} aria-hidden={'true'}></div>
                                <div className={'empty'} hidden></div>
                            </div>

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

                        <section data-tab-panel={'player'} className={'panel'} hidden>
                            <header className={'head'}>
                                <div className={'head__title'}>
                                    <h1 className={'title'}>{'Player Stats'}</h1>
                                    <button
                                        type={'button'}
                                        className={'reset'}
                                        data-reset={'player'}
                                        aria-label={'Reset filters'}
                                        data-on={'false'}
                                    >
                                        <svg className={'i'} aria-hidden={'true'}>
                                            <use href={'#i-rotate-ccw'}></use>
                                        </svg>
                                        {'Reset\n          '}
                                    </button>
                                </div>
                                <div className={'filters'} data-filters={'player'}></div>
                            </header>

                            <div className={'pickWrap'}>
                                <div className={'track pickTrack'}>
                                    <div
                                        className={'pick'}
                                        role={'group'}
                                        aria-label={'Stat shown'}
                                        data-pick={'player'}
                                    ></div>
                                </div>
                            </div>

                            <div className={'paper paper--wide'} data-paper={'player'}>
                                <div className={'listHead'}>
                                    <p className={'listHead__name'}>
                                        <b data-list-name=''>{'Points'}</b>
                                        <span data-list-sub=''>{'most first'}</span>
                                    </p>
                                    <button
                                        type={'button'}
                                        className={'flip'}
                                        data-flip={'player'}
                                        aria-label={'Flip the order'}
                                    >
                                        <svg className={'i'} aria-hidden={'true'}>
                                            <use data-flip-icon='' href={'#i-arrow-down'}></use>
                                        </svg>
                                    </button>
                                </div>
                                <div className={'scroll'}>
                                    <table className={'stats'} data-table={'player'}></table>
                                </div>
                                <div className={'pinEdge'} aria-hidden={'true'}></div>
                            </div>

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

                        <section data-tab-panel={'leaders'} className={'panel'} hidden>
                            <header className={'head'}>
                                <div className={'head__title'}>
                                    <h1 className={'title'}>{'Leaders'}</h1>
                                    <button
                                        type={'button'}
                                        className={'reset'}
                                        data-reset={'leaders'}
                                        aria-label={'Reset filters'}
                                        data-on={'false'}
                                    >
                                        <svg className={'i'} aria-hidden={'true'}>
                                            <use href={'#i-rotate-ccw'}></use>
                                        </svg>
                                        {'Reset\n          '}
                                    </button>
                                </div>
                                <div className={'filters'} data-filters={'leaders'}></div>
                            </header>

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
        </>
    );
}
