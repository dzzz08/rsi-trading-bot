// Typed contract mirroring the backend DTOs (backend/src/interfaces/http/dto.ts).
// In a later ZardoshtiOS phase these move into a shared package consumed by both.

export type AssetClass = 'fx' | 'commodity' | 'index' | 'crypto';
export type RiskLabel = 'risk_on' | 'risk_off' | 'mixed';
export type MoveDirection = 'up' | 'down' | 'flat';
export type ScenarioKind = 'bull' | 'bear' | 'chop';

export interface Catalyst {
  type: 'news' | 'event';
  id: string;
  headline?: string;
  title?: string;
  source: string;
  url?: string;
  impact?: string;
}

export interface Move {
  symbol: string;
  displayName: string;
  assetClass: AssetClass;
  price: number;
  prevClose: number;
  changeAbs: number;
  changePct: number;
  zscore: number;
  direction: MoveDirection;
  significant: boolean;
  source: string;
  catalysts: Catalyst[];
}

export interface Citation {
  type: 'news' | 'event';
  refId: string;
  source: string;
  url?: string;
}

export interface Section {
  sectionNo: number;
  key: string;
  title: string;
  body: string;
  citations: Citation[];
}

export interface Scenario {
  kind: ScenarioKind;
  thesis: string;
  conditions: string[];
  invalidation: string[];
}

export interface RiskBreakdown {
  equities: number;
  crypto: number;
  dxy: number;
  jpy: number;
  gold: number;
  yields: number;
  score: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  country: string;
  impact: 'high' | 'medium' | 'low';
  scheduledAt: string;
  forecast?: number | null;
  previous?: number | null;
  actual?: number | null;
  source?: string;
}

export interface Briefing {
  id: string;
  briefingDate: string;
  kind: string;
  status: string;
  model: string;
  generatedAt: string;
  riskSentiment: RiskLabel;
  riskBreakdown: RiskBreakdown;
  sections: Section[];
  scenarios: Scenario[];
  moves: Move[];
  dataCaveats: string[];
  dataQuality: { marketData: string; news: string; calendar: string };
  calendarToday: CalendarEvent[];
  window: { from: string; to: string; label: string };
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  sortOrder: number;
}
