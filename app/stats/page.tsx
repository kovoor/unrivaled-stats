import type { Metadata } from 'next';
import { StatsPanels } from '@/components/StatsPanels';

export const metadata: Metadata = { title: 'Leaders | Unrivaled' };

export default function LeadersPage() {
    return <StatsPanels tab='leaders' />;
}
