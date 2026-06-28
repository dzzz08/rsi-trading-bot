import Anthropic from '@anthropic-ai/sdk';
import {
  SECTION_KEYS,
  SECTION_TITLES,
  type AnalysisSnapshot,
  type AnalystOutput,
  type BriefingSection,
  type Citation,
  type SectionKey,
} from '../../domain/briefing/Briefing.js';
import type { Scenario, ScenarioKind } from '../../domain/briefing/Scenario.js';
import type { LlmAnalyst } from '../../domain/ports/index.js';

export interface AnthropicAnalystOptions {
  readonly apiKey: string;
  readonly model: string; // e.g. "claude-sonnet-4-6"
  readonly maxTokens?: number;
  readonly temperature?: number;
}

/**
 * The production analyst. Implements the prompt architecture in
 * docs/07-agent-prompt-architecture.md: one structured call over a computed
 * snapshot, with the model reasoning/writing only (never recomputing numbers).
 *
 * Output is requested as strict JSON and validated against the 13-section
 * contract before it leaves this adapter; the deterministic OutputGuard then
 * applies the anti-hallucination lint downstream.
 */
export class AnthropicAnalyst implements LlmAnalyst {
  readonly model: string;
  private readonly client: Anthropic;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(opts: AnthropicAnalystOptions) {
    this.client = new Anthropic({ apiKey: opts.apiKey });
    this.model = opts.model;
    this.maxTokens = opts.maxTokens ?? 4096;
    this.temperature = opts.temperature ?? 0.3;
  }

  async analyze(snapshot: AnalysisSnapshot): Promise<AnalystOutput> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: this.taskPrompt(snapshot) },
        // Prefill forces JSON-only output.
        { role: 'assistant', content: '{' },
      ],
    });

    const text = '{' + response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return this.parse(text);
  }

  private taskPrompt(s: AnalysisSnapshot): string {
    const moveRows = s.moves
      .map((m) => {
        const cats = m.catalysts
          .map((c) => (c.type === 'news' ? `news:${c.item.id}` : `event:${c.event.id}`))
          .join(',');
        return `  ${m.symbol} (${m.assetClass}) px=${m.price} prev=${m.prevClose} chg=${(m.changePct * 100).toFixed(2)}% z=${m.zscore} sig=${m.significant} catalysts=[${cats}]`;
      })
      .join('\n');

    const catalystDetail = s.moves
      .flatMap((m) => m.catalysts)
      .map((c) =>
        c.type === 'news'
          ? `  news:${c.item.id} "${c.item.headline}" (${c.item.source})`
          : `  event:${c.event.id} "${c.event.title}" ${c.event.country} ${c.event.impact} (${c.event.source})`,
      );
    const uniqueCatalysts = [...new Set(catalystDetail)].join('\n');

    const calendar = s.calendarToday
      .map((e) => `  ${e.id} ${e.scheduledAt} ${e.title} [${e.impact}] ${e.country} fcst=${e.forecast ?? '-'} prev=${e.previous ?? '-'}`)
      .join('\n');

    const b = s.riskSentiment.breakdown;

    return [
      `WINDOW: ${s.window.label} (${s.window.from} → ${s.window.to})`,
      `OPERATOR FOCUS: session=${s.operator.sessionFocus}, priority=${s.operator.priorityAssets.join(',')}`,
      `DATA QUALITY: marketData=${s.dataQuality.marketData}, news=${s.dataQuality.news}, calendar=${s.dataQuality.calendar}`,
      '',
      `RISK SENTIMENT (computed ground truth — explain, do not overrule):`,
      `  label=${s.riskSentiment.label} score=${b.score} breakdown={equities:${b.equities},crypto:${b.crypto},dxy:${b.dxy},jpy:${b.jpy},gold:${b.gold},yields:${b.yields}}`,
      '',
      `MOVES (computed ground truth — significant flagged):`,
      moveRows || '  (none)',
      '',
      `CATALYSTS (only reference these ids in citations):`,
      uniqueCatalysts || '  (none)',
      '',
      `TODAY'S CALENDAR (ranked by impact):`,
      calendar || '  (none)',
      s.priorBriefing ? `\nPRIOR BRIEFING: ${s.priorBriefing.date} sentiment=${s.priorBriefing.riskSentiment}` : '',
      '',
      OUTPUT_INSTRUCTIONS,
    ].join('\n');
  }

  /** Validate + coerce the model's JSON into the typed AnalystOutput. */
  private parse(text: string): AnalystOutput {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error('AnthropicAnalyst: model did not return valid JSON');
    }
    const obj = raw as Record<string, unknown>;
    const rawSections = Array.isArray(obj.sections) ? (obj.sections as Record<string, unknown>[]) : [];
    const byKey = new Map(rawSections.map((s) => [String(s.key), s]));

    const sections: BriefingSection[] = SECTION_KEYS.map((key, i) => {
      const s = byKey.get(key);
      return {
        sectionNo: i + 1,
        key: key as SectionKey,
        title: SECTION_TITLES[key],
        body: typeof s?.body === 'string' ? s.body : 'Insufficient data — section not produced.',
        citations: this.coerceCitations(s?.citations),
      };
    });

    const rawScenarios = Array.isArray(obj.scenarios) ? (obj.scenarios as Record<string, unknown>[]) : [];
    const scenarios: Scenario[] = (['bull', 'bear', 'chop'] as ScenarioKind[]).map((kind) => {
      const sc = rawScenarios.find((x) => x.kind === kind);
      return {
        kind,
        thesis: typeof sc?.thesis === 'string' ? sc.thesis : 'Not produced.',
        conditions: toStringArray(sc?.conditions),
        invalidation: toStringArray(sc?.invalidation),
      };
    });

    const notes = obj.notes as Record<string, unknown> | undefined;
    return { sections, scenarios, dataCaveats: toStringArray(notes?.dataCaveats) };
  }

  private coerceCitations(raw: unknown): Citation[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((c): Citation | null => {
        const o = c as Record<string, unknown>;
        const type = o.type === 'event' ? 'event' : 'news';
        if (typeof o.refId !== 'string' || typeof o.source !== 'string') return null;
        return { type, refId: o.refId, source: o.source, url: typeof o.url === 'string' ? o.url : undefined };
      })
      .filter((c): c is Citation => c !== null);
  }
}

function toStringArray(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
}

const SYSTEM_PROMPT = `You are the Market Intelligence analyst for ZardoshtiOS — an institutional macro/markets desk analyst writing a morning note for one experienced macro/orderflow trader. Tone: JPM/GS morning-desk. Precise, mechanism-driven, no filler. If a sentence could appear unchanged in a retail newsletter, it is wrong — add the specific level, catalyst, or mechanism.

ABSOLUTE RULES:
1. You are NOT a signal service. Never instruct the user to buy or sell, never frame a directional call as an instruction, never imply certainty you lack. Frame everything as "here is what happened and here are the scenarios."
2. Ground every factual and causal claim in the provided snapshot ONLY. You may reason about mechanism (e.g. higher yields -> stronger DXY -> headwind for gold), but the underlying facts (the move, the catalyst) must exist in the snapshot. Never introduce a number, level, headline, or event not present.
3. When data is thin, ambiguous, or conflicting, say so explicitly. "Insufficient data to attribute this move" is a valid and preferred answer over a guess.
4. The risk-sentiment label is computed deterministically and given to you. Explain it using the component breakdown. You may add nuance, but you may not silently contradict the label.
5. Cite sources inline using the catalyst source, and in the citations array reference ONLY catalyst ids present in the snapshot.
6. Scenarios are CONDITIONAL ("if X holds/breaks, then ..."), never directives.

You output ONLY valid JSON matching the requested schema. No prose outside JSON.`;

const OUTPUT_INSTRUCTIONS = `Produce the morning briefing as a JSON object with this exact shape:
{
  "sections": [ { "key": <one of overnight_summary|why_assets_moved|macro_drivers|fx|commodities|indices|crypto|risk_sentiment|economic_calendar|key_levels|scenarios|what_matters|risk_warnings>, "body": string, "citations": [ { "type": "news"|"event", "refId": <catalyst id from snapshot>, "source": string, "url"?: string } ] } ],
  "scenarios": [ { "kind": "bull"|"bear"|"chop", "thesis": string, "conditions": string[], "invalidation": string[] } ],
  "notes": { "dataCaveats": string[] }
}
Include ALL 13 section keys exactly once. For why_assets_moved, explain each SIGNIFICANT move's mechanism; if a significant move has no catalyst, say "no clear catalyst in window — likely positioning/flow". For key_levels, only cite levels derivable from the snapshot; if VWAP/volume data is absent, say it is unavailable. Output JSON only.`;
