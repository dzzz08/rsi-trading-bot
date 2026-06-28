import type { PriceMove } from '../../domain/assets/PriceMove.js';
import {
  SECTION_KEYS,
  SECTION_TITLES,
  type AnalysisSnapshot,
  type AnalystOutput,
  type BriefingSection,
  type Citation,
  type SectionKey,
} from '../../domain/briefing/Briefing.js';
import type { Scenario } from '../../domain/briefing/Scenario.js';
import type { LlmAnalyst } from '../../domain/ports/index.js';

/**
 * Deterministic analyst that composes the 13-section briefing directly from the
 * snapshot — no LLM call. It deliberately mirrors the structure and tone the
 * real prompt (docs/07) targets, so the pipeline is fully reviewable offline and
 * tests are reproducible. It only ever asserts data present in the snapshot and
 * cites real catalyst ids, so it passes the same guardrails as a real run.
 */
export class MockAnalyst implements LlmAnalyst {
  readonly model = 'mock';

  async analyze(snapshot: AnalysisSnapshot): Promise<AnalystOutput> {
    const sections = SECTION_KEYS.map((key, i) => this.section(key, i + 1, snapshot));
    return {
      sections,
      scenarios: this.scenarios(snapshot),
      dataCaveats: this.caveats(snapshot),
    };
  }

  private section(key: SectionKey, no: number, s: AnalysisSnapshot): BriefingSection {
    const base = { sectionNo: no, key, title: SECTION_TITLES[key] };
    switch (key) {
      case 'overnight_summary':
        return { ...base, body: this.overnight(s), citations: this.citeFrom(s, ['news_pce_hot']) };
      case 'why_assets_moved':
        return { ...base, body: this.why(s), citations: this.allCitations(s) };
      case 'macro_drivers':
        return { ...base, body: this.macro(s), citations: this.allCitations(s) };
      case 'fx':
        return { ...base, body: this.classBlock(s, 'fx'), citations: this.classCitations(s, 'fx') };
      case 'commodities':
        return { ...base, body: this.classBlock(s, 'commodity'), citations: this.classCitations(s, 'commodity') };
      case 'indices':
        return { ...base, body: this.classBlock(s, 'index'), citations: this.classCitations(s, 'index') };
      case 'crypto':
        return { ...base, body: this.classBlock(s, 'crypto'), citations: this.classCitations(s, 'crypto') };
      case 'risk_sentiment':
        return { ...base, body: this.risk(s), citations: [] };
      case 'economic_calendar':
        return { ...base, body: this.calendar(s), citations: this.eventCitations(s) };
      case 'key_levels':
        return { ...base, body: this.levels(s), citations: [] };
      case 'scenarios':
        return { ...base, body: this.scenarioProse(s), citations: [] };
      case 'what_matters':
        return { ...base, body: this.matters(s), citations: [] };
      case 'risk_warnings':
        return { ...base, body: this.warnings(s), citations: this.eventCitations(s) };
    }
  }

  // --- section bodies -------------------------------------------------------

  private overnight(s: AnalysisSnapshot): string {
    const sig = s.moves.filter((m) => m.significant);
    const label = labelText(s.riskSentiment.label);
    if (sig.length === 0) {
      return `A quiet overnight session into the ${s.operator.sessionFocus} handover — no statistically meaningful moves across the covered universe. Deterministic risk read: ${label}.`;
    }
    const headline = sig.slice(0, 4).map((m) => `${m.displayName} ${pct(m.changePct)}`).join(', ');
    return `Into the ${s.operator.sessionFocus} handover the tape reads ${label}. The notable moves: ${headline}. Direction is consistent across asset classes rather than a single-headline shock; see the per-asset mechanism below.`;
  }

  private why(s: AnalysisSnapshot): string {
    const sig = s.moves.filter((m) => m.significant);
    if (sig.length === 0) return 'No significant moves to attribute this session.';
    return sig
      .map((m) => {
        const cat = primaryCatalyst(m);
        const mech = mechanism(m);
        if (!cat) {
          return `• ${m.displayName} ${pct(m.changePct)} (z=${m.zscore}): no clear catalyst in window — read as positioning/flow. ${mech}`;
        }
        return `• ${m.displayName} ${pct(m.changePct)} (z=${m.zscore}): ${mech} Catalyst: ${cat.text} (${cat.source}).`;
      })
      .join('\n');
  }

  private macro(s: AnalysisSnapshot): string {
    const news = uniqueNews(s);
    if (news.length === 0) return 'No macro/central-bank catalysts in the ingestion window.';
    const lines = news.map((n) => `• ${n.headline} (${n.source}).`);
    return `The threads driving the session:\n${lines.join('\n')}`;
  }

  private classBlock(s: AnalysisSnapshot, cls: PriceMove['assetClass']): string {
    const rows = s.moves.filter((m) => m.assetClass === cls);
    if (rows.length === 0) return 'No data available for this class in the snapshot.';
    return rows
      .map((m) => {
        const cat = primaryCatalyst(m);
        const tail = m.significant
          ? cat
            ? ` — ${cat.text} (${cat.source}).`
            : ' — no catalyst in window; positioning/flow.'
          : ' — within noise.';
        return `• ${m.displayName}: ${fmtPrice(m.price)} (${pct(m.changePct)})${tail}`;
      })
      .join('\n');
  }

  private risk(s: AnalysisSnapshot): string {
    const b = s.riskSentiment.breakdown;
    const parts = [
      `equities ${vote(b.equities)}`,
      `crypto ${vote(b.crypto)}`,
      `DXY ${vote(b.dxy)}`,
      `JPY ${vote(b.jpy)}`,
      `gold ${vote(b.gold)}`,
      `yields ${vote(b.yields)}`,
    ].join(', ');
    return `Deterministic read: ${labelText(s.riskSentiment.label).toUpperCase()} (score ${b.score}). Component votes — ${parts}. This is a rule-based classification (see the methodology); the prose explains it and does not overrule it.`;
  }

  private calendar(s: AnalysisSnapshot): string {
    if (s.calendarToday.length === 0) return 'No scheduled events for today in the calendar feed.';
    return s.calendarToday
      .map((e) => `• ${time(e.scheduledAt)} — ${e.title} [${e.impact.toUpperCase()}] (${e.country})${e.forecast != null ? `, fcst ${e.forecast}` : ''}${e.previous != null ? `, prev ${e.previous}` : ''}.`)
      .join('\n');
  }

  private levels(s: AnalysisSnapshot): string {
    const focus = s.moves.filter(
      (m) => s.operator.priorityAssets.includes(m.symbol) || m.significant,
    );
    const lines = focus.map(
      (m) => `• ${m.displayName}: prior close ${fmtPrice(m.prevClose)}, now ${fmtPrice(m.price)}.`,
    );
    return `${lines.join('\n')}\nVWAP / volume-profile / liquidity-zone data is unavailable in this snapshot and is not fabricated (see roadmap Phase 3).`;
  }

  private scenarioProse(s: AnalysisSnapshot): string {
    return this.scenarios(s)
      .map((sc) => `${sc.kind.toUpperCase()} — ${sc.thesis}\n  Conditions: ${sc.conditions.join(' ')}\n  Invalidation: ${sc.invalidation.join(' ')}`)
      .join('\n\n');
  }

  private matters(s: AnalysisSnapshot): string {
    const topEvent = s.calendarToday[0];
    const sig = s.moves.filter((m) => m.significant).slice(0, 2).map((m) => m.displayName);
    return `A ${labelText(s.riskSentiment.label)} tape; the assets in focus are ${sig.join(' and ') || 'none flagged'}. The key swing factor today is ${topEvent ? `${topEvent.title} at ${time(topEvent.scheduledAt)}` : 'a light calendar'}. Trade the reaction, not the prediction.`;
  }

  private warnings(s: AnalysisSnapshot): string {
    const high = s.calendarToday.filter((e) => e.impact === 'high');
    const lines = high.map((e) => `• ${time(e.scheduledAt)} — ${e.title}: high-impact; expect a volatility spike.`);
    const dq = s.dataQuality;
    const degraded = [
      dq.marketData !== 'ok' ? `market-data:${dq.marketData}` : null,
      dq.news !== 'ok' ? `news:${dq.news}` : null,
      dq.calendar !== 'ok' ? `calendar:${dq.calendar}` : null,
    ].filter(Boolean);
    const dqLine = degraded.length ? `\n• Data caveat: ${degraded.join(', ')} — affected sections are flagged.` : '';
    return `${lines.join('\n') || '• No high-impact events scheduled.'}${dqLine}`;
  }

  // --- scenarios ------------------------------------------------------------

  private scenarios(s: AnalysisSnapshot): Scenario[] {
    const equities = s.riskSentiment.breakdown.equities;
    const topEvent = s.calendarToday[0]?.title ?? "today's data";
    return [
      {
        kind: 'bull',
        thesis: 'Risk stabilises and the overnight move unwinds intraday.',
        conditions: [`If ${topEvent} comes in supportive and yields ease, then the dollar rolls over and equities/crypto recover.`],
        invalidation: ['A fresh hawkish catalyst or another hot data print that re-accelerates yields.'],
      },
      {
        kind: 'bear',
        thesis: 'The prevailing regime extends through the session.',
        conditions: [`If ${topEvent} disappoints and yields stay bid, then the dollar firms further and risk stays offered.`],
        invalidation: ['A dovish surprise or a sharp reversal lower in yields/DXY.'],
      },
      {
        kind: 'chop',
        thesis: 'Consolidation of the overnight move with no clean trend.',
        conditions: [`If ${topEvent} lands near consensus, then expect range-trading${equities < 0 ? ' as the risk-off move digests' : ''} until the US cash session.`],
        invalidation: ['A decisive break of the overnight range in either direction on volume.'],
      },
    ];
  }

  private caveats(s: AnalysisSnapshot): string[] {
    const out: string[] = [];
    if (s.dataQuality.marketData !== 'ok') out.push(`Market-data feed ${s.dataQuality.marketData}.`);
    if (s.dataQuality.news !== 'ok') out.push(`News feed ${s.dataQuality.news}.`);
    if (s.dataQuality.calendar !== 'ok') out.push(`Calendar feed ${s.dataQuality.calendar}.`);
    out.push('VWAP/volume-profile/liquidity data not available in this snapshot.');
    return out;
  }

  // --- citation helpers -----------------------------------------------------

  private citeFrom(s: AnalysisSnapshot, ids: string[]): Citation[] {
    const out: Citation[] = [];
    for (const m of s.moves) {
      for (const c of m.catalysts) {
        const id = c.type === 'news' ? c.item.id : c.event.id;
        if (ids.includes(id)) out.push(toCitation(c));
      }
    }
    return dedupe(out);
  }

  private allCitations(s: AnalysisSnapshot): Citation[] {
    const out: Citation[] = [];
    for (const m of s.moves) for (const c of m.catalysts) out.push(toCitation(c));
    return dedupe(out);
  }

  private classCitations(s: AnalysisSnapshot, cls: PriceMove['assetClass']): Citation[] {
    const out: Citation[] = [];
    for (const m of s.moves) if (m.assetClass === cls) for (const c of m.catalysts) out.push(toCitation(c));
    return dedupe(out);
  }

  private eventCitations(s: AnalysisSnapshot): Citation[] {
    return s.calendarToday.map((e) => ({ type: 'event' as const, refId: e.id, source: e.source }));
  }
}

// --- module-local formatting --------------------------------------------------

function toCitation(c: PriceMove['catalysts'][number]): Citation {
  return c.type === 'news'
    ? { type: 'news', refId: c.item.id, source: c.item.source, url: c.item.url }
    : { type: 'event', refId: c.event.id, source: c.event.source };
}

function dedupe(cs: Citation[]): Citation[] {
  const seen = new Set<string>();
  return cs.filter((c) => (seen.has(c.refId) ? false : (seen.add(c.refId), true)));
}

function primaryCatalyst(m: PriceMove): { text: string; source: string } | null {
  const c = m.catalysts[0];
  if (!c) return null;
  return c.type === 'news'
    ? { text: c.item.headline, source: c.item.source }
    : { text: c.event.title, source: c.event.source };
}

function uniqueNews(s: AnalysisSnapshot) {
  const seen = new Set<string>();
  const out: { headline: string; source: string }[] = [];
  for (const m of s.moves) {
    for (const c of m.catalysts) {
      if (c.type === 'news' && !seen.has(c.item.id)) {
        seen.add(c.item.id);
        out.push({ headline: c.item.headline, source: c.item.source });
      }
    }
  }
  return out;
}

/** Mechanism hints, kept generic and non-directional. */
function mechanism(m: PriceMove): string {
  switch (m.symbol) {
    case 'XAUUSD':
      return 'Gold’s move reflects haven demand and rate expectations.';
    case 'USDJPY':
      return 'Driven by the US–JP rate differential and carry positioning.';
    case 'NAS100':
    case 'SPX':
      return 'Long-duration equities are sensitive to the discount rate.';
    case 'DXY':
      return 'The dollar is the session’s organizing variable via rates.';
    case 'BTCUSD':
    case 'ETHUSD':
      return 'Crypto is trading as high-beta risk.';
    default:
      return 'Mechanism tied to the broad risk regime.';
  }
}

function labelText(l: string): string {
  return l === 'risk_on' ? 'risk-on' : l === 'risk_off' ? 'risk-off' : 'mixed';
}
function vote(v: number): string {
  return v > 0 ? '+1' : v < 0 ? '-1' : '0';
}
function pct(p: number): string {
  const v = p * 100;
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 100) return p.toFixed(2);
  return p.toFixed(4);
}
function time(iso: string): string {
  return new Date(iso).toISOString().slice(11, 16);
}
