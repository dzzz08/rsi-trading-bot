import { randomUUID } from 'node:crypto';
import type {
  AnalysisSnapshot,
  Briefing,
  BriefingKind,
} from '../../domain/briefing/Briefing.js';
import type {
  BriefingRepository,
  Clock,
  DeliveryChannel,
  LlmAnalyst,
  UserRepository,
  Window,
} from '../../domain/ports/index.js';
import { IngestionService } from '../ingestion/IngestionService.js';
import { MoveDetector } from '../analysis/MoveDetector.js';
import { RiskSentimentClassifier } from '../analysis/RiskSentimentClassifier.js';
import { ContextRetriever } from '../analysis/ContextRetriever.js';
import { OutputGuard } from '../analysis/OutputGuard.js';
import { rankEvents } from '../../domain/calendar/EconomicEvent.js';

export interface GenerateBriefingInput {
  readonly userId: string;
  readonly date: string; // YYYY-MM-DD
  readonly kind?: BriefingKind;
  /** When true, the briefing is not delivered (used for previews/tests). */
  readonly dryRun?: boolean;
}

export interface GenerateBriefingDeps {
  readonly ingestion: IngestionService;
  readonly moveDetector: MoveDetector;
  readonly riskClassifier: RiskSentimentClassifier;
  readonly contextRetriever: ContextRetriever;
  readonly guard: OutputGuard;
  readonly analyst: LlmAnalyst;
  readonly briefingRepo: BriefingRepository;
  readonly userRepo: UserRepository;
  readonly delivery: DeliveryChannel;
  readonly clock: Clock;
  /** Throw on guardrail violations (true for real LLM, false for mock demo). */
  readonly strictGuard: boolean;
  readonly logger?: (msg: string, meta?: unknown) => void;
}

/**
 * The full Morning Briefing pipeline (Stages 1–9 of docs/06-data-flow.md),
 * wired only against ports. This use case is the heart of the module and is
 * cadence-agnostic — future intraday/EOD reuse it with a different window/kind.
 */
export class GenerateBriefingUseCase {
  constructor(private readonly d: GenerateBriefingDeps) {}

  async execute(input: GenerateBriefingInput): Promise<Briefing> {
    const log = this.d.logger ?? (() => {});
    const kind = input.kind ?? 'morning';
    const window = this.morningWindow(input.date);

    const prefs = await this.d.userRepo.getPreferences(input.userId);
    const sessionFocus = prefs?.sessionFocus ?? 'London';
    const priorityAssets = prefs?.priorityAssets ?? ['XAUUSD', 'NAS100'];

    // Stage 1–2: ingest + normalize.
    log('ingest:start', { window });
    const raw = await this.d.ingestion.ingest(window, input.date);

    // Stage 3: move detection.
    const baseMoves = this.d.moveDetector.detect(raw.quotes);
    // Stage 4: context retrieval (catalysts attached to significant moves).
    const moves = this.d.contextRetriever.attach(baseMoves, raw.news, raw.events);
    // Stage 5: deterministic risk classification.
    const riskSentiment = this.d.riskClassifier.classify(moves);

    const prior = await this.d.briefingRepo.findLatest(input.userId);
    const snapshot: AnalysisSnapshot = {
      window,
      operator: { sessionFocus, priorityAssets },
      moves,
      riskSentiment,
      calendarToday: rankEvents(raw.events),
      dataQuality: raw.dataQuality,
      priorBriefing: prior
        ? { date: prior.briefingDate, riskSentiment: prior.riskSentiment.label }
        : undefined,
    };

    // Stage 6: LLM analysis.
    log('analyze:start', { model: this.d.analyst.model, moves: moves.length });
    const output = await this.d.analyst.analyze(snapshot);

    // Stage 7: guardrail lint.
    const guard = this.d.guard.inspect(output, snapshot);
    if (!guard.ok) {
      log('guard:violations', guard.violations);
      if (this.d.strictGuard) {
        throw new GuardrailError(guard.violations.map((v) => `${v.section}: ${v.detail}`));
      }
    }

    const briefing: Briefing = {
      id: randomUUID(),
      userId: input.userId,
      briefingDate: input.date,
      kind,
      status: 'ready',
      riskSentiment,
      sections: output.sections,
      scenarios: output.scenarios,
      moves,
      dataCaveats: output.dataCaveats,
      snapshot,
      model: this.d.analyst.model,
      generatedAt: this.d.clock.now().toISOString(),
    };

    // Stage 8: persist.
    await this.d.briefingRepo.save(briefing);

    // Stage 9: deliver.
    if (!input.dryRun) {
      const result = await this.d.delivery.deliver(briefing);
      log('deliver', { channel: this.d.delivery.name, ok: result.ok, error: result.error });
    }

    return briefing;
  }

  /** Prior NY close (≈21:00 UTC previous day) → the run time for `date`. */
  private morningWindow(date: string): Window {
    const to = `${date}T05:30:00Z`;
    const toDate = new Date(to);
    const from = new Date(toDate.getTime() - 8.5 * 60 * 60 * 1000); // ~prior NY close
    return {
      from: from.toISOString(),
      to,
      label: 'prior NY close → 05:30 London',
    };
  }
}

export class GuardrailError extends Error {
  constructor(public readonly violations: string[]) {
    super(`Briefing failed guardrails: ${violations.join('; ')}`);
    this.name = 'GuardrailError';
  }
}
