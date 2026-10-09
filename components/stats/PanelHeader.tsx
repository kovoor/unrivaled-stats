import type { StatsTab } from '@/components/stats/types';

export function PanelHeader({ tab, title }: { tab: StatsTab; title: string }) {
    return (
        <header className={'head'}>
            <div className={'head__title'}>
                <h1 className={'title'}>{title}</h1>
                <button
                    type={'button'}
                    className={'reset'}
                    data-reset={tab}
                    aria-label={'Reset filters'}
                    data-on={'false'}
                >
                    <svg className={'i'} aria-hidden={'true'}>
                        <use href={'#i-rotate-ccw'}></use>
                    </svg>
                    {'Reset'}
                </button>
            </div>
            <div className={'filters'} data-filters={tab}></div>
        </header>
    );
}
