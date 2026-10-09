import type { Metadata } from 'next';
import { StatsPanels } from '@/components/StatsPanels';

export const metadata: Metadata = { title: 'Player Stats | Unrivaled' };

export default function PlayerStatsPage() {
    return <StatsPanels tab='player' />;
}
