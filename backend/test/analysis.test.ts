import { describe, it, expect } from 'vitest';
import { MoveDetector } from '../src/application/analysis/MoveDetector.js';
import { RiskSentimentClassifier } from '../src/application/analysis/RiskSentimentClassifier.js';
import { OutputGuard } from '../src/application/analysis/OutputGuard.js';
import type { Quote } from '../src/domain/assets/Quote.js';
import type { AnalysisSnapshot, AnalystOutput } from '../src/domain/briefing/Briefing.js';

const q = (symbol: string, assetClass: Quote['assetClass'], price: number, prevClose: number, realizedVol: number): Quote => ({
  symbol, assetClass, price, prevClose, realizedVol, source: 'test', capturedAt: '2026-06-29T05:30:00Z',
});

describe('MoveDetector', () => {
  it('flags a move above the class threshold as significant', () => {
    const moves = new MoveDetector().detect([q('XAUUSD', 'commodity', 2418, 2389.3, 0.006)]);
    expect(moves[0]!.significant).toBe(true);
    expect(moves[0]!.direction).toBe('up');
    expect(moves[0]!.changePct).toBeGreaterThan(0.008);
  });

  it('treats a sub-threshold, low-z move as not significant', () => {
    const moves = new MoveDetector().detect([q('EURUSD', 'fx', 1.0735, 1.0737, 0.003)]);
    expect(moves[0]!.significant).toBe(false);
  });

  it('flags an unusual move via z-score even below the absolute threshold', () => {
    // 0.3% on a normally 0.1%-vol asset → z=3 → significant despite < 0.4% fx threshold.
    const moves = new MoveDetector().detect([q('EURUSD', 'fx', 1.0769, 1.0737, 0.001)]);
    expect(moves[0]!.significant).toBe(true);
  });

  it('ranks significant moves before noise, by |zscore|', () => {
    const moves = new MoveDetector().detect([
      q('EURUSD', 'fx', 1.0736, 1.0737, 0.003), // noise
      q('BTCUSD', 'crypto', 60150, 61630, 0.025), // significant
    ]);
    expect(moves[0]!.symbol).toBe('BTCUSD');
  });
});

describe('RiskSentimentClassifier', () => {
  it('classifies the risk-off mock tape as risk_off', () => {
    const moves = new MoveDetector().detect([
      q('NAS100', 'index', 18917, 19050, 0.008),
      q('SPX', 'index', 5447, 5474, 0.006),
      q('BTCUSD', 'crypto', 60150, 61630, 0.025),
      q('DXY', 'fx', 104.2, 103.84, 0.003),
      q('USDJPY', 'fx', 159.4, 158.6, 0.0035),
      q('XAUUSD', 'commodity', 2418, 2389.3, 0.006),
    ]);
    const sentiment = new RiskSentimentClassifier().classify(moves);
    expect(sentiment.label).toBe('risk_off');
    expect(sentiment.breakdown.score).toBeLessThanOrEqual(-2);
  });

  it('classifies a clean risk-on tape as risk_on', () => {
    const moves = new MoveDetector().detect([
      q('NAS100', 'index', 19250, 19050, 0.008),
      q('SPX', 'index', 5510, 5474, 0.006),
      q('BTCUSD', 'crypto', 63000, 61630, 0.025),
      q('DXY', 'fx', 103.4, 103.84, 0.003),
      q('USDJPY', 'fx', 159.4, 158.6, 0.0035),
      q('XAUUSD', 'commodity', 2360, 2389.3, 0.006),
    ]);
    const sentiment = new RiskSentimentClassifier().classify(moves);
    expect(sentiment.label).toBe('risk_on');
  });
});

describe('OutputGuard', () => {
  const snapshot = {
    moves: [], calendarToday: [], riskSentiment: { label: 'risk_off', breakdown: { score: -4 } },
  } as unknown as AnalysisSnapshot;

  it('flags imperative buy/sell language', () => {
    const output: AnalystOutput = {
      sections: [{ sectionNo: 12, key: 'what_matters', title: 'x', body: 'You should buy gold here.', citations: [] }],
      scenarios: [], dataCaveats: [],
    };
    const result = new OutputGuard().inspect(output, snapshot);
    expect(result.ok).toBe(false);
    expect(result.violations[0]!.rule).toBe('buy_sell');
  });

  it('flags a citation refId not present in the snapshot', () => {
    const output: AnalystOutput = {
      sections: [{ sectionNo: 1, key: 'overnight_summary', title: 'x', body: 'ok', citations: [{ type: 'news', refId: 'ghost', source: 's' }] }],
      scenarios: [], dataCaveats: [],
    };
    const result = new OutputGuard().inspect(output, snapshot);
    expect(result.violations.some((v) => v.rule === 'dangling_citation')).toBe(true);
  });

  it('passes clean, conditional output', () => {
    const output: AnalystOutput = {
      sections: [{ sectionNo: 11, key: 'scenarios', title: 'x', body: 'If S&P reclaims its prior close, then risk stabilises.', citations: [] }],
      scenarios: [], dataCaveats: [],
    };
    expect(new OutputGuard().inspect(output, snapshot).ok).toBe(true);
  });
});
