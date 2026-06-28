import type { CalendarEvent } from '@/lib/types';
import { hhmm, impactColor } from './format';

export function CalendarList({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return <div className="card text-sm text-muted">No scheduled events for today.</div>;
  }
  return (
    <div className="flex flex-col gap-2">
      {events.map((e) => (
        <div key={e.id} className="card flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <span className="tabular-nums text-sm text-muted">{hhmm(e.scheduledAt)}</span>
            <div>
              <div className="text-sm font-medium">{e.title}</div>
              <div className="text-xs text-muted">
                {e.country}
                {e.forecast != null && ` · fcst ${e.forecast}`}
                {e.previous != null && ` · prev ${e.previous}`}
              </div>
            </div>
          </div>
          <span className={`pill ${impactColor(e.impact)}`}>{e.impact.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}
