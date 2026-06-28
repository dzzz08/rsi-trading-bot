/**
 * Ports — the seams of the clean architecture.
 *
 * The application layer depends only on these interfaces. Infrastructure
 * provides adapters (mock or real). Swapping mock↔real, in-memory↔Postgres, or
 * Claude↔a tool-using agent is a composition-root change, never a caller change.
 */
import type { Quote, DataQuality } from '../assets/Quote.js';
import type { NewsItem } from '../news/NewsItem.js';
import type { EconomicEvent } from '../calendar/EconomicEvent.js';
import type { AnalysisSnapshot, AnalystOutput, Briefing } from '../briefing/Briefing.js';
import type {
  User,
  UserPreferences,
  WatchlistItem,
  Note,
} from '../briefing/User.js';

/** A time window [from, to] in ISO-8601 UTC for ingestion. */
export interface Window {
  readonly from: string;
  readonly to: string;
  readonly label: string;
}

/** Provides normalized price quotes for the requested symbols. */
export interface MarketDataProvider {
  readonly name: string;
  getQuotes(symbols: readonly string[], window: Window): Promise<Quote[]>;
}

/** Provides normalized news headlines for the window. */
export interface NewsProvider {
  readonly name: string;
  getNews(window: Window): Promise<NewsItem[]>;
}

/** Provides today's normalized economic-calendar events. */
export interface EconomicCalendarProvider {
  readonly name: string;
  getEvents(date: string): Promise<EconomicEvent[]>;
}

/**
 * The analyst LLM layer. Turns a computed AnalysisSnapshot into the prose
 * 13-section briefing + scenarios. See docs/07-agent-prompt-architecture.md.
 */
export interface LlmAnalyst {
  /** Model identifier recorded on the briefing ("mock" for the offline analyst). */
  readonly model: string;
  analyze(snapshot: AnalysisSnapshot): Promise<AnalystOutput>;
}

/** Persists and queries briefings. */
export interface BriefingRepository {
  save(briefing: Briefing): Promise<void>;
  findById(id: string): Promise<Briefing | null>;
  findLatest(userId: string): Promise<Briefing | null>;
  list(
    userId: string,
    filter?: { date?: string; kind?: string; limit?: number; offset?: number },
  ): Promise<Briefing[]>;
}

/** Delivers a briefing to a channel; records the attempt outcome. */
export interface DeliveryChannel {
  readonly name: string;
  deliver(briefing: Briefing): Promise<{ ok: boolean; error?: string }>;
}

/** Read/write store for user, preferences, watchlist, and notes. */
export interface UserRepository {
  getUser(userId: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  getPreferences(userId: string): Promise<UserPreferences | null>;
  savePreferences(prefs: UserPreferences): Promise<void>;
  listWatchlist(userId: string): Promise<WatchlistItem[]>;
  addWatchlistItem(item: WatchlistItem): Promise<void>;
  updateWatchlistItem(id: string, sortOrder: number): Promise<void>;
  removeWatchlistItem(id: string): Promise<void>;
  listNotes(userId: string, briefingId?: string): Promise<Note[]>;
  addNote(note: Note): Promise<void>;
  updateNote(id: string, body: string): Promise<void>;
  removeNote(id: string): Promise<void>;
}

/** Injectable clock so generation is deterministic in tests. */
export interface Clock {
  now(): Date;
}

export type { DataQuality };
