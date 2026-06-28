import { randomUUID } from 'node:crypto';
import type {
  Note,
  User,
  UserPreferences,
  WatchlistItem,
} from '../../domain/briefing/User.js';
import type { UserRepository } from '../../domain/ports/index.js';

export const DEFAULT_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'operator@zardoshtios.local',
  displayName: 'Operator',
};

/** In-memory user/preferences/watchlist/notes store, seeded single-user. */
export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();
  private readonly prefs = new Map<string, UserPreferences>();
  private watchlist: WatchlistItem[] = [];
  private notes: Note[] = [];

  constructor(user: User = DEFAULT_USER) {
    this.users.set(user.id, user);
    this.prefs.set(user.id, {
      userId: user.id,
      timezone: 'Europe/London',
      sessionFocus: 'London',
      deliveryChannel: 'console',
      priorityAssets: ['XAUUSD', 'NAS100'],
      updatedAt: new Date().toISOString(),
    });
    this.watchlist = ['XAUUSD', 'NAS100', 'USDJPY', 'BTCUSD'].map((symbol, i) => ({
      id: randomUUID(),
      userId: user.id,
      symbol,
      sortOrder: i,
      createdAt: new Date().toISOString(),
    }));
  }

  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) ?? null;
  }
  async getByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    return this.prefs.get(userId) ?? null;
  }
  async savePreferences(prefs: UserPreferences): Promise<void> {
    this.prefs.set(prefs.userId, prefs);
  }
  async listWatchlist(userId: string): Promise<WatchlistItem[]> {
    return this.watchlist.filter((w) => w.userId === userId).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  async addWatchlistItem(item: WatchlistItem): Promise<void> {
    this.watchlist.push(item);
  }
  async updateWatchlistItem(id: string, sortOrder: number): Promise<void> {
    const item = this.watchlist.find((w) => w.id === id);
    if (item) this.watchlist = this.watchlist.map((w) => (w.id === id ? { ...w, sortOrder } : w));
  }
  async removeWatchlistItem(id: string): Promise<void> {
    this.watchlist = this.watchlist.filter((w) => w.id !== id);
  }
  async listNotes(userId: string, briefingId?: string): Promise<Note[]> {
    return this.notes
      .filter((n) => n.userId === userId && (briefingId ? n.briefingId === briefingId : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async addNote(note: Note): Promise<void> {
    this.notes.push(note);
  }
  async updateNote(id: string, body: string): Promise<void> {
    this.notes = this.notes.map((n) => (n.id === id ? { ...n, body } : n));
  }
  async removeNote(id: string): Promise<void> {
    this.notes = this.notes.filter((n) => n.id !== id);
  }
}
