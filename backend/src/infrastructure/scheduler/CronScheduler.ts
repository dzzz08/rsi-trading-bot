import cron, { type ScheduledTask } from 'node-cron';
import type { GenerateBriefingUseCase } from '../../application/briefing/GenerateBriefingUseCase.js';

export interface CronSchedulerOptions {
  readonly expression: string;
  readonly timezone: string;
  readonly userId: string;
}

/**
 * In-process morning scheduler (MVP). For production the same use case is driven
 * by an external cron hitting POST /internal/briefings/generate — this class is
 * the simple default, not a hard dependency (docs/10 trade-offs).
 */
export class CronScheduler {
  private task?: ScheduledTask;

  constructor(
    private readonly generate: GenerateBriefingUseCase,
    private readonly opts: CronSchedulerOptions,
  ) {}

  start(): void {
    if (!cron.validate(this.opts.expression)) {
      throw new Error(`Invalid cron expression: ${this.opts.expression}`);
    }
    this.task = cron.schedule(
      this.opts.expression,
      () => {
        const date = new Date().toISOString().slice(0, 10);
        this.generate
          .execute({ userId: this.opts.userId, date, kind: 'morning' })
          .then((b) => console.log(`[cron] morning briefing generated for ${b.briefingDate}`))
          .catch((e) => console.error('[cron] briefing generation failed', e));
      },
      { timezone: this.opts.timezone },
    );
    console.log(`[cron] scheduled "${this.opts.expression}" (${this.opts.timezone})`);
  }

  stop(): void {
    this.task?.stop();
  }
}
