import type { Quote } from '../../../domain/assets/Quote.js';
import type { NewsItem } from '../../../domain/news/NewsItem.js';
import type { EconomicEvent } from '../../../domain/calendar/EconomicEvent.js';
import type {
  EconomicCalendarProvider,
  MarketDataProvider,
  NewsProvider,
  Window,
} from '../../../domain/ports/index.js';

/**
 * Real-provider seam (Step 3 of the build plan). These are the adapters the
 * "one real path" plugs into: Twelve Data (price), Marketaux (news), Trading
 * Economics / FRED (calendar). They are intentionally left as guarded
 * placeholders — per the working agreement we do NOT wire a real/paid tier
 * without the operator's confirmation and keys. Implementing each is additive:
 * fetch → normalize into the domain type, nothing else changes.
 *
 * To implement (per docs/10-tech-stack.md):
 *   - getQuotes: GET Twelve Data /quote for the mapped symbols → Quote[]
 *     (normalize provider symbols, set prevClose from previous_close, compute
 *      realizedVol from a short bar history or the provider's ATR).
 *   - getNews: GET Marketaux /news/all filtered to the window → NewsItem[]
 *     (map entities → canonical assetTags).
 *   - getEvents: GET Trading Economics calendar for `date` → EconomicEvent[].
 */

function notConfigured(provider: string): never {
  throw new Error(
    `Real provider "${provider}" is not implemented yet. Set DATA_SOURCE=mock for the demo, ` +
      `or implement this adapter and supply its API key (see docs/10-tech-stack.md).`,
  );
}

export class RealMarketDataProvider implements MarketDataProvider {
  readonly name = 'twelve-data';
  constructor(private readonly apiKey?: string) {}
  async getQuotes(_symbols: readonly string[], _window: Window): Promise<Quote[]> {
    if (!this.apiKey) notConfigured(this.name);
    notConfigured(this.name);
  }
}

export class RealNewsProvider implements NewsProvider {
  readonly name = 'marketaux';
  constructor(private readonly apiKey?: string) {}
  async getNews(_window: Window): Promise<NewsItem[]> {
    if (!this.apiKey) notConfigured(this.name);
    notConfigured(this.name);
  }
}

export class RealEconomicCalendarProvider implements EconomicCalendarProvider {
  readonly name = 'trading-economics';
  constructor(private readonly apiKey?: string) {}
  async getEvents(_date: string): Promise<EconomicEvent[]> {
    if (!this.apiKey) notConfigured(this.name);
    notConfigured(this.name);
  }
}
