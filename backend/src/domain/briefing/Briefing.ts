import type { PriceMove } from '../assets/PriceMove.js';
import type { DataQuality } from '../assets/Quote.js';
import type { EconomicEvent } from '../calendar/EconomicEvent.js';
import type { RiskSentiment } from './RiskSentiment.js';
import type { Scenario } from './Scenario.js';

/** Future cadences exist in the type now so storage/queries don't change later. */
export type BriefingKind = 'morning' | 'intraday' | 'eod';

export type BriefingStatus = 'pending' | 'generating' | 'ready' | 'failed' | 'delivered';

/**
 * The fixed 13-section contract (docs/01-product-spec.md §5). Keys are stable
 * machine identifiers; the order is the section number.
 */
export const SECTION_KEYS = [
  'overnight_summary',
  'why_assets_moved',
  'macro_drivers',
  'fx',
  'commodities',
  'indices',
  'crypto',
  'risk_sentiment',
  'economic_calendar',
  'key_levels',
  'scenarios',
  'what_matters',
  'risk_warnings',
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_TITLES: Record<SectionKey, string> = {
  overnight_summary: 'Overnight Summary',
  why_assets_moved: 'Why Assets Moved',
  macro_drivers: 'Macro Drivers & Catalysts',
  fx: 'FX',
  commodities: 'Commodities',
  indices: 'Indices',
  crypto: 'Crypto',
  risk_sentiment: 'Risk Sentiment',
  economic_calendar: 'Economic Calendar',
  key_levels: 'Key Levels & Liquidity',
  scenarios: 'Scenarios',
  what_matters: 'What Actually Matters Today',
  risk_warnings: 'Risk Warnings',
};

export interface Citation {
  readonly type: 'news' | 'event';
  readonly refId: string;
  readonly source: string;
  readonly url?: string;
}

export interface BriefingSection {
  readonly sectionNo: number; // 1..13
  readonly key: SectionKey;
  readonly title: string;
  readonly body: string;
  readonly citations: readonly Citation[];
}

/**
 * The full normalized input the analyst layer reasons over. Persisted with the
 * briefing as the audit trail and the seed for future archive/vector indexing.
 */
export interface AnalysisSnapshot {
  readonly window: { from: string; to: string; label: string };
  readonly operator: { sessionFocus: string; priorityAssets: readonly string[] };
  readonly moves: readonly PriceMove[];
  readonly riskSentiment: RiskSentiment;
  readonly calendarToday: readonly EconomicEvent[];
  readonly dataQuality: DataQuality;
  readonly priorBriefing?: {
    readonly date: string;
    readonly riskSentiment: RiskSentiment['label'];
  };
}

/** What the `LlmAnalyst` produces — the prose layer over the snapshot. */
export interface AnalystOutput {
  readonly sections: readonly BriefingSection[];
  readonly scenarios: readonly Scenario[];
  readonly dataCaveats: readonly string[];
}

export interface Briefing {
  readonly id: string;
  readonly userId: string;
  readonly briefingDate: string; // YYYY-MM-DD
  readonly kind: BriefingKind;
  readonly status: BriefingStatus;
  readonly riskSentiment: RiskSentiment;
  readonly sections: readonly BriefingSection[];
  readonly scenarios: readonly Scenario[];
  readonly moves: readonly PriceMove[];
  readonly dataCaveats: readonly string[];
  readonly snapshot: AnalysisSnapshot;
  /** Which LLM produced it ("mock" for the deterministic analyst). */
  readonly model: string;
  readonly generatedAt: string; // ISO-8601 UTC
}
