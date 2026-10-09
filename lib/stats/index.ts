import { STATS } from '@/lib/stats/data';
import { createEngine } from '@/lib/stats/engine';
import { startView } from '@/lib/stats/view';

/** Starts the stats behavior on the rendered panels. The returned function removes every listener it added. */
export function startStats(): () => void {
    const controller = new AbortController();
    const engine = createEngine(STATS, controller.signal);
    startView(engine, controller.signal);
    return () => controller.abort();
}
