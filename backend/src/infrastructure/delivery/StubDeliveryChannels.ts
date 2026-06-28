import type { Briefing } from '../../domain/briefing/Briefing.js';
import type { DeliveryChannel } from '../../domain/ports/index.js';

/**
 * Placeholders for real delivery channels. Per the working agreement, the
 * operator picks ONE channel before a real integration is built — so these are
 * intentionally unimplemented and fail loudly rather than silently no-op.
 *
 * Each is a single adapter behind the DeliveryChannel port; implementing one is
 * additive (provider client + format) and changes no callers.
 */
abstract class UnimplementedChannel implements DeliveryChannel {
  abstract readonly name: string;
  async deliver(_briefing: Briefing): Promise<{ ok: boolean; error?: string }> {
    return {
      ok: false,
      error: `Delivery channel "${this.name}" is a placeholder. Confirm channel choice, then implement this adapter (see docs/03-advanced-features.md §F).`,
    };
  }
}

export class EmailDeliveryChannel extends UnimplementedChannel {
  readonly name = 'email';
  // Phase 2+: Resend/Postmark client + HTML rendering of renderBriefingText().
}

export class TelegramDeliveryChannel extends UnimplementedChannel {
  readonly name = 'telegram';
  // Phase 2+: Bot API sendMessage with Telegram-markdown formatting.
}

export class DiscordDeliveryChannel extends UnimplementedChannel {
  readonly name = 'discord';
  // Phase 2+: webhook POST with embed formatting.
}
