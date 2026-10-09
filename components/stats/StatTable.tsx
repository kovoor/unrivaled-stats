import type { StatsTab } from '@/components/stats/types';

// A fragment, so .pickWrap stays the sibling right before .paper (globals.css: .pickWrap[hidden] + .paper).
export function StatTable({ tab, withEmptyState = false }: { tab: StatsTab; withEmptyState?: boolean }) {
    return (
        <>
            <div className={'pickWrap'}>
                <div className={'track pickTrack'}>
                    <div className={'pick'} role={'group'} aria-label={'Stat shown'} data-pick={tab}></div>
                </div>
            </div>

            <div className={'paper paper--wide'} data-paper={tab}>
                <div className={'listHead'}>
                    <p className={'listHead__name'}>
                        <b data-list-name=''>{'Points'}</b>
                        <span data-list-sub=''>{'most first'}</span>
                    </p>
                    <button type={'button'} className={'flip'} data-flip={tab} aria-label={'Flip the order'}>
                        <svg className={'i'} aria-hidden={'true'}>
                            <use data-flip-icon='' href={'#i-arrow-down'}></use>
                        </svg>
                    </button>
                </div>
                <div className={'scroll'}>
                    <table className={'stats'} data-table={tab}></table>
                </div>
                <div className={'pinEdge'} aria-hidden={'true'}></div>
                {withEmptyState && <div className={'empty'} hidden></div>}
            </div>
        </>
    );
}
