import type { AssetClass } from '../../domain/assets/Asset.js';
import { findAsset } from '../../domain/assets/Asset.js';
import type { Quote } from '../../domain/assets/Quote.js';
import type { MoveDirection, PriceMove } from '../../domain/assets/PriceMove.js';

/**
 * Per-asset-class absolute thresholds (fraction). See docs/06-data-flow.md.
 * A move is significant if it clears its class threshold OR the z threshold.
 */
const CLASS_THRESHOLD: Record<AssetClass, number> = {
  fx: 0.004,
  commodity: 0.008,
  index: 0.006,
  crypto: 0.02,
};

const Z_THRESHOLD = 1.5;
/** Below this absolute % change, treat as flat regardless of class. */
const FLAT_EPSILON = 0.0005;

export class MoveDetector {
  detect(quotes: readonly Quote[]): PriceMove[] {
    const moves = quotes.map((q) => this.toMove(q));
    // Significant first, then by |zscore| desc — gives the analyst a ranked list.
    return moves.sort((a, b) => {
      if (a.significant !== b.significant) return a.significant ? -1 : 1;
      return Math.abs(b.zscore) - Math.abs(a.zscore);
    });
  }

  private toMove(q: Quote): PriceMove {
    const asset = findAsset(q.symbol);
    const changeAbs = q.price - q.prevClose;
    const changePct = q.prevClose !== 0 ? changeAbs / q.prevClose : 0;
    // Guard against a zero/absent vol estimate.
    const vol = q.realizedVol > 0 ? q.realizedVol : CLASS_THRESHOLD[q.assetClass];
    const zscore = round(changePct / vol, 2);

    const threshold = CLASS_THRESHOLD[q.assetClass];
    const significant =
      Math.abs(changePct) >= threshold || Math.abs(zscore) >= Z_THRESHOLD;

    const direction: MoveDirection =
      Math.abs(changePct) < FLAT_EPSILON ? 'flat' : changePct > 0 ? 'up' : 'down';

    return {
      symbol: q.symbol,
      displayName: asset?.displayName ?? q.symbol,
      assetClass: q.assetClass,
      price: q.price,
      prevClose: q.prevClose,
      changeAbs: round(changeAbs, 4),
      changePct: round(changePct, 5),
      zscore,
      direction,
      significant,
      source: q.source,
      catalysts: [], // attached later by ContextRetriever
    };
  }
}

function round(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
