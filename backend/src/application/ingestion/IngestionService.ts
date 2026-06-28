import type { Asset } from '../../domain/assets/Asset.js';
import { ASSET_UNIVERSE } from '../../domain/assets/Asset.js';
import type { Quote, DataQuality, FeedStatus } from '../../domain/assets/Quote.js';
import type { NewsItem } from '../../domain/news/NewsItem.js';
import type { EconomicEvent } from '../../domain/calendar/EconomicEvent.js';
import type {
  EconomicCalendarProvider,
  MarketDataProvider,
  NewsProvider,
  Window,
} from '../../domain/ports/index.js';

export interface RawIngestion {
  readonly window: Window;
  readonly quotes: Quote[];
  readonly news: NewsItem[];
  readonly events: EconomicEvent[];
  readonly dataQuality: DataQuality;
}

/**
 * Stage 1–2 of the pipeline: pull every feed in parallel and degrade
 * gracefully. A failing provider marks its feed `unavailable` and the run still
 * completes — anti-hallucination favours an explicit gap over a fabricated fill.
 */
export class IngestionService {
  constructor(
    private readonly market: MarketDataProvider,
    private readonly news: NewsProvider,
    private readonly calendar: EconomicCalendarProvider,
    private readonly logger: (msg: string, err?: unknown) => void = console.error,
  ) {}

  async ingest(window: Window, date: string, universe: readonly Asset[] = ASSET_UNIVERSE): Promise<RawIngestion> {
    const symbols = universe.map((a) => a.symbol);

    const [quotesR, newsR, eventsR] = await Promise.allSettled([
      this.market.getQuotes(symbols, window),
      this.news.getNews(window),
      this.calendar.getEvents(date),
    ]);

    const quotes = this.unwrap(quotesR, 'market-data', []);
    const news = this.unwrap(newsR, 'news', []);
    const events = this.unwrap(eventsR, 'calendar', []);

    const dataQuality: DataQuality = {
      marketData: this.statusOf(quotesR, quotes.length),
      news: this.statusOf(newsR, news.length),
      calendar: this.statusOf(eventsR, events.length),
    };

    return { window, quotes, news, events, dataQuality };
  }

  private unwrap<T>(r: PromiseSettledResult<T[]>, feed: string, fallback: T[]): T[] {
    if (r.status === 'fulfilled') return r.value;
    this.logger(`[ingestion] ${feed} feed failed`, r.reason);
    return fallback;
  }

  private statusOf(r: PromiseSettledResult<unknown[]>, count: number): FeedStatus {
    if (r.status === 'rejected') return 'unavailable';
    return count > 0 ? 'ok' : 'degraded';
  }
}
