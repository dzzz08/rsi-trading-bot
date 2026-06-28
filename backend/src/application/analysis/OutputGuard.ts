import type { AnalysisSnapshot, AnalystOutput } from '../../domain/briefing/Briefing.js';

export interface GuardViolation {
  readonly rule: 'buy_sell' | 'dangling_citation' | 'sentiment_conflict';
  readonly section: string;
  readonly detail: string;
}

export interface GuardResult {
  readonly ok: boolean;
  readonly violations: readonly GuardViolation[];
}

/**
 * Deterministic post-generation guardrails (Stage 7 of docs/06-data-flow.md and
 * docs/07-agent-prompt-architecture.md §Anti-hallucination layer 3).
 *
 * This is the safety net behind the prompt rules. It does NOT rewrite output; it
 * reports violations so the caller can reject (real provider) or surface them.
 */
export class OutputGuard {
  // Imperative trade-instruction language. Word-boundary matched, case-insensitive.
  private static readonly BUY_SELL = [
    /\bbuy now\b/i,
    /\bsell now\b/i,
    /\bgo long\b/i,
    /\bgo short\b/i,
    /\btake profit\b/i,
    /\bclose your position\b/i,
    /\byou should (buy|sell|long|short)\b/i,
    /\bi recommend (buying|selling|going)\b/i,
  ];

  inspect(output: AnalystOutput, snapshot: AnalysisSnapshot): GuardResult {
    const violations: GuardViolation[] = [];
    const knownRefIds = new Set<string>();
    for (const m of snapshot.moves) {
      for (const c of m.catalysts) {
        knownRefIds.add(c.type === 'news' ? c.item.id : c.event.id);
      }
    }
    for (const e of snapshot.calendarToday) knownRefIds.add(e.id);

    for (const section of output.sections) {
      // Rule 1 — no imperative buy/sell language.
      for (const re of OutputGuard.BUY_SELL) {
        const match = section.body.match(re);
        if (match) {
          violations.push({
            rule: 'buy_sell',
            section: section.key,
            detail: `imperative trade language: "${match[0]}"`,
          });
        }
      }

      // Rule 2 — citations must reference ids present in the snapshot.
      for (const cite of section.citations) {
        if (!knownRefIds.has(cite.refId)) {
          violations.push({
            rule: 'dangling_citation',
            section: section.key,
            detail: `citation refId "${cite.refId}" not in snapshot`,
          });
        }
      }
    }

    // Rule 3 — the risk_sentiment section must not assert the opposite label.
    const riskSection = output.sections.find((s) => s.key === 'risk_sentiment');
    if (riskSection) {
      const computed = snapshot.riskSentiment.label;
      const opposite = computed === 'risk_on' ? 'risk-off' : computed === 'risk_off' ? 'risk-on' : null;
      if (opposite && new RegExp(`\\b${opposite}\\b`, 'i').test(riskSection.body) &&
          !new RegExp(`\\b${computed.replace('_', '-')}\\b`, 'i').test(riskSection.body)) {
        violations.push({
          rule: 'sentiment_conflict',
          section: 'risk_sentiment',
          detail: `prose asserts "${opposite}" but computed label is "${computed}"`,
        });
      }
    }

    return { ok: violations.length === 0, violations };
  }
}
