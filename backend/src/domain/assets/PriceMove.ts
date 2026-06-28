import type { AssetClass } from './Asset.js';
import type { NewsItem } from '../news/NewsItem.js';
import type { EconomicEvent } from '../calendar/EconomicEvent.js';

export type MoveDirection = 'up' | 'down' | 'flat';

/** A catalyst candidate attached to a move during context retrieval. */
export type Catalyst =
  | { readonly type: 'news'; readonly item: NewsItem }
  | { readonly type: 'event'; readonly event: EconomicEvent };

/**
 * Output of move detection for a single asset, with its retrieved catalysts.
 *
 * All numeric fields are computed deterministically in code (Stage 3–4 of
 * docs/06-data-flow.md) — the LLM never recomputes these.
 */
export interface PriceMove {
  readonly symbol: string;
  readonly displayName: string;
  readonly assetClass: AssetClass;
  readonly price: number;
  readonly prevClose: number;
  readonly changeAbs: number;
  /** Fractional change, e.g. 0.012 = +1.2%. */
  readonly changePct: number;
  /** Change in units of recent realized vol. */
  readonly zscore: number;
  readonly direction: MoveDirection;
  readonly significant: boolean;
  readonly source: string;
  readonly catalysts: readonly Catalyst[];
}
