import type { Metadata } from 'next';
import { StatsPanels } from '@/components/StatsPanels';

export const metadata: Metadata = { title: 'Team Stats | Unrivaled' };

export default function TeamStatsPage() {
    return <StatsPanels tab='team' />;
}
