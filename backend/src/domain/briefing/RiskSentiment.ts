export type RiskSentimentLabel = 'risk_on' | 'risk_off' | 'mixed';

/**
 * Deterministic risk-sentiment read (see docs/06-data-flow.md §Risk rules).
 * Each component votes +1 (risk-on) / -1 (risk-off) / 0 (flat). The label is a
 * function of the summed score; the breakdown makes the call auditable.
 */
export interface RiskBreakdown {
  readonly equities: number;
  readonly crypto: number;
  readonly dxy: number;
  readonly jpy: number;
  readonly gold: number;
  readonly yields: number;
  readonly score: number;
}

export interface RiskSentiment {
  readonly label: RiskSentimentLabel;
  readonly breakdown: RiskBreakdown;
}
