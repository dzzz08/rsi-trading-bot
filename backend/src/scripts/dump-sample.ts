/**
 * Dev utility: print the mocked briefing as the API DTO JSON. Used to regenerate
 * the frontend's bundled sample (frontend/lib/sample.ts):
 *
 *   npx tsx src/scripts/dump-sample.ts > ../frontend/lib/sample.raw.json
 *
 * (stabilise `id`/`generatedAt`/`model` before committing).
 */
import { loadConfig } from '../config/env.js';
import { buildContainer } from '../config/container.js';
import { toBriefingDto } from '../interfaces/http/dto.js';

const c = buildContainer(loadConfig({ DATA_SOURCE: 'mock', LLM_PROVIDER: 'mock' }));
const b = await c.generateBriefing.execute({
  userId: c.defaultUserId,
  date: '2026-06-29',
  dryRun: true,
});
process.stdout.write(JSON.stringify(toBriefingDto(b), null, 2));
