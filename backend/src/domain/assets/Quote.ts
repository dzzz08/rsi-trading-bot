import type { AssetClass } from './Asset.js';

/**
 * A normalized price observation for one asset over the briefing window.
 *
 * `prevClose` is the prior-NY-close anchor used by move detection. `realizedVol`
 * is the recent realized volatility (as a fraction, e.g. 0.006 = 0.6%) supplied
 * by the provider in the MVP; Phase 2 computes it from a rolling quote history.
 */
export interface Quote {
  readonly symbol: string;
  readonly assetClass: AssetClass;
  readonly price: number;
  readonly prevClose: number;
  /** Recent realized volatility of the window's % change, as a fraction. */
  readonly realizedVol: number;
  readonly source: string;
  readonly capturedAt: string; // ISO-8601 UTC
}

export type FeedStatus = 'ok' | 'degraded' | 'unavailable';

export interface DataQuality {
  readonly marketData: FeedStatus;
  readonly news: FeedStatus;
  readonly calendar: FeedStatus;
  /** Optional human-readable reason when a feed is degraded/unavailable. */
  readonly notes?: string;
}
