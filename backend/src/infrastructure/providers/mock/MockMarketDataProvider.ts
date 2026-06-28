import { findAsset } from '../../../domain/assets/Asset.js';
import type { Quote } from '../../../domain/assets/Quote.js';
import type { MarketDataProvider, Window } from '../../../domain/ports/index.js';

/**
 * Deterministic mock prices describing a coherent "risk-off, yields-up" tape
 * (mirrors docs/08-example-briefing.md). Lets the full pipeline run with no API
 * keys and keeps tests reproducible. `realizedVol` is plausible per asset.
 */
interface MockRow {
  price: number;
  prevClose: number;
  realizedVol: number;
}

const ROWS: Record<string, MockRow> = {
  EURUSD: { price: 1.071, prevClose: 1.0737, realizedVol: 0.003 },
  GBPUSD: { price: 1.264, prevClose: 1.2678, realizedVol: 0.0035 },
  USDJPY: { price: 159.4, prevClose: 158.6, realizedVol: 0.0035 },
  DXY: { price: 104.2, prevClose: 103.84, realizedVol: 0.003 },
  XAUUSD: { price: 2418, prevClose: 2389.3, realizedVol: 0.006 },
  WTI: { price: 81.1, prevClose: 81.59, realizedVol: 0.012 },
  NAS100: { price: 18917, prevClose: 19050, realizedVol: 0.008 },
  SPX: { price: 5447, prevClose: 5474, realizedVol: 0.006 },
  DJI: { price: 39050, prevClose: 39167, realizedVol: 0.005 },
  DAX: { price: 18160, prevClose: 18233, realizedVol: 0.007 },
  BTCUSD: { price: 60150, prevClose: 61630, realizedVol: 0.025 },
  ETHUSD: { price: 3310, prevClose: 3416, realizedVol: 0.03 },
};

export class MockMarketDataProvider implements MarketDataProvider {
  readonly name = 'mock-market-data';

  async getQuotes(symbols: readonly string[], window: Window): Promise<Quote[]> {
    return symbols
      .map((symbol): Quote | null => {
        const row = ROWS[symbol];
        const asset = findAsset(symbol);
        if (!row || !asset) return null;
        return {
          symbol,
          assetClass: asset.assetClass,
          price: row.price,
          prevClose: row.prevClose,
          realizedVol: row.realizedVol,
          source: this.name,
          capturedAt: window.to,
        };
      })
      .filter((q): q is Quote => q !== null);
  }
}
