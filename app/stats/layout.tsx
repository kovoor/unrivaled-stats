import { IconSprite } from '@/components/IconSprite';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { DesignNotes } from '@/components/DesignNotes';
import { StatsRuntime } from '@/components/StatsRuntime';

export default function StatsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <IconSprite />
            <SiteHeader />
            {children}
            <SiteFooter />
            <DesignNotes />
            <noscript>
                <p style={{ padding: 24 }}>Enable JavaScript to load stats and use filters.</p>
            </noscript>
            <StatsRuntime />
        </>
    );
}
