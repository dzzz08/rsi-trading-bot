export type EventImpact = 'high' | 'medium' | 'low';

/**
 * A normalized economic-calendar event.
 *
 * `country` (ISO-ish, e.g. "US", "EZ", "UK", "JP") is mapped to affected assets
 * by context retrieval (e.g. US → DXY/indices, EZ → EUR/DAX).
 */
export interface EconomicEvent {
  readonly id: string;
  readonly title: string;
  readonly country: string;
  readonly impact: EventImpact;
  readonly scheduledAt: string; // ISO-8601 UTC
  readonly forecast?: number | null;
  readonly previous?: number | null;
  readonly actual?: number | null;
  readonly source: string;
}

const IMPACT_RANK: Record<EventImpact, number> = { high: 3, medium: 2, low: 1 };

/** Rank events by impact (desc), then by time (asc). */
export function rankEvents(events: readonly EconomicEvent[]): EconomicEvent[] {
  return [...events].sort((a, b) => {
    const byImpact = IMPACT_RANK[b.impact] - IMPACT_RANK[a.impact];
    if (byImpact !== 0) return byImpact;
    return a.scheduledAt.localeCompare(b.scheduledAt);
  });
}
