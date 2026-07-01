import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

/**
 * Fail-fast, typed configuration. Every switch is documented in `.env.example`.
 * Provider/adapter selection is config, so mock↔real is an env change.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  // Adapter selection
  DATA_SOURCE: z.enum(['mock', 'real']).default('mock'),
  LLM_PROVIDER: z.enum(['mock', 'anthropic']).default('mock'),
  PERSISTENCE: z.enum(['memory', 'postgres']).default('memory'),
  // Primary delivery is the app itself (dashboard/API). Messaging channels are
  // optional additive adapters, not the default.
  DELIVERY_CHANNEL: z.enum(['in_app', 'console', 'email', 'telegram', 'discord']).default('in_app'),

  // LLM
  ANTHROPIC_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('claude-sonnet-4-6'),

  // Real data providers (only required when DATA_SOURCE=real)
  TWELVE_DATA_API_KEY: z.string().optional(),
  MARKETAUX_API_KEY: z.string().optional(),
  TRADING_ECONOMICS_API_KEY: z.string().optional(),

  // Persistence
  DATABASE_URL: z.string().optional(),

  // Auth / scheduling
  API_BEARER_TOKEN: z.string().default('dev-operator-token'),
  SCHEDULER_TOKEN: z.string().default('dev-scheduler-token'),
  ENABLE_CRON: z.coerce.boolean().default(false),
  BRIEFING_CRON: z.string().default('30 5 * * *'), // 05:30 daily
  CRON_TIMEZONE: z.string().default('Europe/London'),

  // Guardrails: throw on violations (recommended true with a real LLM)
  STRICT_GUARD: z.coerce.boolean().default(false),
});

export type AppConfig = z.infer<typeof schema>;

export function loadConfig(overrides: Partial<NodeJS.ProcessEnv> = {}): AppConfig {
  const parsed = schema.safeParse({ ...process.env, ...overrides });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid configuration:\n${issues}`);
  }
  const cfg = parsed.data;

  // Cross-field validation: real adapters need their keys.
  if (cfg.LLM_PROVIDER === 'anthropic' && !cfg.ANTHROPIC_API_KEY) {
    throw new Error('LLM_PROVIDER=anthropic requires ANTHROPIC_API_KEY');
  }
  if (cfg.PERSISTENCE === 'postgres' && !cfg.DATABASE_URL) {
    throw new Error('PERSISTENCE=postgres requires DATABASE_URL');
  }
  return cfg;
}
