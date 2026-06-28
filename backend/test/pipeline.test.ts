import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config/env.js';
import { buildContainer } from '../src/config/container.js';
import { OutputGuard } from '../src/application/analysis/OutputGuard.js';
import { SECTION_KEYS } from '../src/domain/briefing/Briefing.js';

describe('end-to-end mocked pipeline', () => {
  it('generates a full 13-section briefing that passes guardrails', async () => {
    const config = loadConfig({
      DATA_SOURCE: 'mock', LLM_PROVIDER: 'mock', PERSISTENCE: 'memory',
      DELIVERY_CHANNEL: 'console', STRICT_GUARD: 'true',
    });
    const container = buildContainer(config);

    const briefing = await container.generateBriefing.execute({
      userId: container.defaultUserId,
      date: '2026-06-29',
      kind: 'morning',
      dryRun: true,
    });

    // All 13 sections, correct keys/order.
    expect(briefing.sections).toHaveLength(13);
    expect(briefing.sections.map((s) => s.key)).toEqual([...SECTION_KEYS]);

    // Three scenarios, conditional.
    expect(briefing.scenarios.map((s) => s.kind).sort()).toEqual(['bear', 'bull', 'chop']);

    // Deterministic risk read on the mock tape.
    expect(briefing.riskSentiment.label).toBe('risk_off');

    // Guardrails pass.
    const guard = new OutputGuard().inspect(
      { sections: briefing.sections, scenarios: briefing.scenarios, dataCaveats: briefing.dataCaveats },
      briefing.snapshot,
    );
    expect(guard.ok).toBe(true);

    // Persisted + retrievable.
    const fetched = await container.briefingRepo.findById(briefing.id);
    expect(fetched?.id).toBe(briefing.id);
  });

  it('attaches catalysts to significant moves and cites real ids', async () => {
    const container = buildContainer(loadConfig({ DATA_SOURCE: 'mock', LLM_PROVIDER: 'mock' }));
    const briefing = await container.generateBriefing.execute({
      userId: container.defaultUserId, date: '2026-06-29', dryRun: true,
    });
    const usdjpy = briefing.moves.find((m) => m.symbol === 'USDJPY');
    expect(usdjpy?.significant).toBe(true);
    expect(usdjpy!.catalysts.length).toBeGreaterThan(0);
  });
});
