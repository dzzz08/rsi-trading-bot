/**
 * Single-user for the MVP, but every owned entity carries `userId` so
 * multi-user is a config change, not a refactor (docs/04-database-schema.md).
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
}

export type SessionFocus = 'Asia' | 'London' | 'NewYork';
export type DeliveryChannelName = 'console' | 'email' | 'telegram' | 'discord';

export interface UserPreferences {
  readonly userId: string;
  readonly timezone: string;
  readonly sessionFocus: SessionFocus;
  readonly deliveryChannel: DeliveryChannelName;
  /** Canonical asset symbols to emphasize in the briefing. */
  readonly priorityAssets: readonly string[];
  readonly updatedAt: string;
}

export interface WatchlistItem {
  readonly id: string;
  readonly userId: string;
  readonly symbol: string;
  readonly sortOrder: number;
  readonly createdAt: string;
}

export interface Note {
  readonly id: string;
  readonly userId: string;
  readonly briefingId?: string;
  readonly body: string;
  readonly createdAt: string;
}
