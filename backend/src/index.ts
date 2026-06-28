import { loadConfig } from './config/env.js';
import { buildContainer } from './config/container.js';
import { buildServer } from './interfaces/http/server.js';
import { CronScheduler } from './infrastructure/scheduler/CronScheduler.js';

/** Application entrypoint: load config → wire container → start API (+ cron). */
function main(): void {
  const config = loadConfig();
  const container = buildContainer(config);
  const app = buildServer(container);

  const server = app.listen(config.PORT, () => {
    console.log(`[api] listening on :${config.PORT}`);
    console.log('[api] wiring:', container.wiring);
  });

  let scheduler: CronScheduler | undefined;
  if (config.ENABLE_CRON) {
    scheduler = new CronScheduler(container.generateBriefing, {
      expression: config.BRIEFING_CRON,
      timezone: config.CRON_TIMEZONE,
      userId: container.defaultUserId,
    });
    scheduler.start();
  }

  const shutdown = () => {
    console.log('[api] shutting down');
    scheduler?.stop();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
