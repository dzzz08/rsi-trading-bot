import type { Briefing } from '../../domain/briefing/Briefing.js';
import type { DeliveryChannel } from '../../domain/ports/index.js';
import { renderBriefingText } from './renderBriefingText.js';

/**
 * Default delivery channel — prints the rendered briefing. Requires no
 * credentials, so the full pipeline (including delivery) runs out of the box.
 */
export class ConsoleDeliveryChannel implements DeliveryChannel {
  readonly name = 'console';

  constructor(private readonly out: (msg: string) => void = console.log) {}

  async deliver(briefing: Briefing): Promise<{ ok: boolean; error?: string }> {
    try {
      this.out(renderBriefingText(briefing));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
