import type { PriceMove } from '../../domain/assets/PriceMove.js';
import type {
  RiskBreakdown,
  RiskSentiment,
} from '../../domain/briefing/RiskSentiment.js';

/**
 * Deterministic risk-sentiment classification (docs/06-data-flow.md §Risk rules).
 *
 * Each component votes +1 (risk-on) / -1 (risk-off) / 0 (flat). The label is a
 * pure function of the summed score. The LLM later explains — never overrules —
 * this result.
 *
 * Yields are not in the MVP price universe directly, so we proxy them from
 * USD/JPY and DXY co-movement (a firmer dollar + stronger USDJPY in this regime
 * typically tracks higher yields). When that proxy is ambiguous, yields vote 0.
 */
export class RiskSentimentClassifier {
  classify(moves: readonly PriceMove[]): RiskSentiment {
    const bySymbol = new Map(moves.map((m) => [m.symbol, m]));
    const pct = (s: string) => bySymbol.get(s)?.changePct ?? 0;

    const equities = sign(avg([pct('NAS100'), pct('SPX'), pct('DJI'), pct('DAX')]));
    const crypto = sign(avg([pct('BTCUSD'), pct('ETHUSD')]));
    // DXY up = risk-off, so invert.
    const dxy = sign(pct('DXY')) * -1;
    // USD/JPY up = carry-on = risk-on.
    const jpy = sign(pct('USDJPY'));
    // Gold up = risk-off, so invert.
    const gold = sign(pct('XAUUSD')) * -1;
    const yields = this.proxyYieldsVote(pct('DXY'), pct('USDJPY'));

    const score = equities + crypto + dxy + jpy + gold + yields;
    const breakdown: RiskBreakdown = { equities, crypto, dxy, jpy, gold, yields, score };

    const label: RiskSentiment['label'] =
      score >= 2 ? 'risk_on' : score <= -2 ? 'risk_off' : 'mixed';

    return { label, breakdown };
  }

  /**
   * Higher yields → risk-on growth read (+1). We infer "yields up" when both DXY
   * and USD/JPY firm together; "yields down" when both soften. Mixed → 0.
   */
  private proxyYieldsVote(dxyPct: number, usdjpyPct: number): number {
    const dxyUp = dxyPct > 0;
    const jpyUp = usdjpyPct > 0;
    if (dxyUp && jpyUp) return 1;
    if (!dxyUp && !jpyUp) return -1;
    return 0;
  }
}

function avg(xs: number[]): number {
  const vals = xs.filter((x) => Number.isFinite(x));
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** -1 / 0 / +1 with a small flat band to avoid noise votes. */
function sign(x: number): number {
  const EPS = 0.0005;
  if (x > EPS) return 1;
  if (x < -EPS) return -1;
  return 0;
}
