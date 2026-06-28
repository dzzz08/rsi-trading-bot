export type ScenarioKind = 'bull' | 'bear' | 'chop';

/**
 * A conditional day scenario. By contract (docs/01 §2), `conditions` and
 * `invalidation` are conditional statements ("if X holds/breaks, then …") and
 * never imperatives — enforced by the output guardrail lint.
 */
export interface Scenario {
  readonly kind: ScenarioKind;
  readonly thesis: string;
  readonly conditions: readonly string[];
  readonly invalidation: readonly string[];
}
