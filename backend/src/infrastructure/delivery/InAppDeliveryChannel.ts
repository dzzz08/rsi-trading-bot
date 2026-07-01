import type { Briefing } from '../../domain/briefing/Briefing.js';
import type { DeliveryChannel } from '../../domain/ports/index.js';

/**
 * Default "delivery" = the briefing is made available in the app. There is no
 * push/message: the pipeline has already persisted the briefing, and the
 * dashboard/API is the surface the operator reads it on. This adapter simply
 * records that the briefing is ready to be consumed in-app.
 *
 * Messaging channels (email/Telegram/Discord) are optional additive adapters
 * behind the same port — the interface, not a notification, is the product.
 */
export class InAppDeliveryChannel implements DeliveryChannel {
  readonly name = 'in_app';

  constructor(private readonly log: (msg: string) => void = () => {}) {}

  async deliver(briefing: Briefing): Promise<{ ok: boolean; error?: string }> {
    this.log(`[in_app] briefing ${briefing.briefingDate} available in dashboard`);
    return { ok: true };
  }
}
