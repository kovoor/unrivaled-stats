'use client';

import { useEffect } from 'react';
import { startStats } from '@/lib/stats';

// Starts the stats behavior once the server-rendered panels hydrate. The cleanup lets React's
// development double-mount (and Fast Refresh) start it again without doubled listeners.
export function StatsRuntime() {
    useEffect(() => startStats(), []);
    return null;
}
