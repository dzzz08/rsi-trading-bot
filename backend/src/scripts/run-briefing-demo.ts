/**
 * End-to-end mocked pipeline demo (Step 2 deliverable).
 *
 *   npm run briefing:demo
 *
 * Runs ingestion → move detection → context retrieval → risk classification →
 * (mock) LLM analysis → guardrail lint → persist → console delivery, using only
 * mock providers and the deterministic analyst. No API keys required. Prints the
 * full rendered briefing and a guardrail report so the pipeline is reviewable
 * before any real data is wired.
 */
import { loadConfig } from '../config/env.js';
import { buildContainer } from '../config/container.js';
import { OutputGuard } from '../application/analysis/OutputGuard.js';

async function main() {
  // Force the fully-mocked configuration regardless of local env.
  const config = loadConfig({
    DATA_SOURCE: 'mock',
    LLM_PROVIDER: 'mock',
    PERSISTENCE: 'memory',
    DELIVERY_CHANNEL: 'console',
    STRICT_GUARD: 'false',
  });
  const container = buildContainer(config);

  const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
  console.log(`\n>>> Generating mocked morning briefing for ${date}\n`);

  const briefing = await container.generateBriefing.execute({
    userId: container.defaultUserId,
    date,
    kind: 'morning',
  });

  // Re-run the guard explicitly to print a verification report.
  const guard = new OutputGuard().inspect(
    { sections: briefing.sections, scenarios: briefing.scenarios, dataCaveats: briefing.dataCaveats },
    briefing.snapshot,
  );

  console.log('\n' + '#'.repeat(72));
  console.log(`GUARDRAIL REPORT — ${guard.ok ? 'PASS ✅' : 'VIOLATIONS ⚠️'}`);
  if (!guard.ok) for (const v of guard.violations) console.log(`  [${v.rule}] ${v.section}: ${v.detail}`);
  console.log(`Sections produced: ${briefing.sections.length}/13`);
  console.log(`Risk sentiment: ${briefing.riskSentiment.label} (score ${briefing.riskSentiment.breakdown.score})`);
  console.log(`Significant moves: ${briefing.moves.filter((m) => m.significant).length}`);
  console.log('#'.repeat(72) + '\n');
}

main().catch((e) => {
  console.error('demo failed:', e);
  process.exit(1);
});
