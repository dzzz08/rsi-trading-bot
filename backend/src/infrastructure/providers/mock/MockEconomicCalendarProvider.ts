import type { EconomicEvent } from '../../../domain/calendar/EconomicEvent.js';
import type { EconomicCalendarProvider } from '../../../domain/ports/index.js';

/** Deterministic mock calendar for the day, consistent with the example. */
export class MockEconomicCalendarProvider implements EconomicCalendarProvider {
  readonly name = 'mock-calendar';

  async getEvents(date: string): Promise<EconomicEvent[]> {
    return [
      {
        id: 'evt_us_confidence',
        title: 'US Consumer Confidence',
        country: 'US',
        impact: 'high',
        scheduledAt: `${date}T14:00:00Z`,
        forecast: 99.5,
        previous: 100.4,
        actual: null,
        source: 'mock-calendar',
      },
      {
        id: 'evt_ez_cpi',
        title: 'Euro Area Flash CPI (YoY)',
        country: 'EZ',
        impact: 'high',
        scheduledAt: `${date}T10:00:00Z`,
        forecast: 2.5,
        previous: 2.6,
        actual: null,
        source: 'mock-calendar',
      },
      {
        id: 'evt_fed_speaker',
        title: 'FOMC Member Speaks',
        country: 'US',
        impact: 'medium',
        scheduledAt: `${date}T15:00:00Z`,
        forecast: null,
        previous: null,
        actual: null,
        source: 'mock-calendar',
      },
    ];
  }
}
