import type { AssetClass } from '../../domain/assets/Asset.js';
import type { Catalyst, PriceMove } from '../../domain/assets/PriceMove.js';
import type { NewsItem } from '../../domain/news/NewsItem.js';
import type { EconomicEvent } from '../../domain/calendar/EconomicEvent.js';

/** Country → affected asset symbols, for mapping calendar events to moves. */
const COUNTRY_ASSETS: Record<string, string[]> = {
  US: ['DXY', 'NAS100', 'SPX', 'DJI', 'XAUUSD', 'WTI', 'EURUSD', 'GBPUSD', 'USDJPY'],
  EZ: ['EURUSD', 'DAX'],
  EU: ['EURUSD', 'DAX'],
  DE: ['DAX', 'EURUSD'],
  UK: ['GBPUSD'],
  GB: ['GBPUSD'],
  JP: ['USDJPY'],
};

/**
 * Attaches candidate catalysts (news + calendar events) to each price move.
 *
 * Matching is deliberately explicit and conservative: news by asset tag,
 * events by country→asset mapping. Only significant moves get catalysts
 * retrieved (noise moves don't need an explanation). The LLM decides which
 * candidate actually explains the move — and must say "no clear catalyst" when
 * the list is empty rather than inventing one.
 */
export class ContextRetriever {
  attach(
    moves: readonly PriceMove[],
    news: readonly NewsItem[],
    events: readonly EconomicEvent[],
  ): PriceMove[] {
    return moves.map((move) => {
      if (!move.significant) return move;
      const catalysts: Catalyst[] = [
        ...this.matchNews(move.symbol, news),
        ...this.matchEvents(move.symbol, move.assetClass, events),
      ];
      return { ...move, catalysts };
    });
  }

  private matchNews(symbol: string, news: readonly NewsItem[]): Catalyst[] {
    return news
      .filter((n) => n.assetTags.includes(symbol))
      .map((item) => ({ type: 'news', item }));
  }

  private matchEvents(
    symbol: string,
    _assetClass: AssetClass,
    events: readonly EconomicEvent[],
  ): Catalyst[] {
    return events
      .filter((e) => (COUNTRY_ASSETS[e.country] ?? []).includes(symbol))
      .map((event) => ({ type: 'event', event }));
  }
}
