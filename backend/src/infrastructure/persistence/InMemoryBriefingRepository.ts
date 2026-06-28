import type { Briefing } from '../../domain/briefing/Briefing.js';
import type { BriefingRepository } from '../../domain/ports/index.js';

/**
 * In-memory briefing store. Default adapter for the MVP demo so the pipeline
 * runs with zero external services. Mirrors the logical model of the Postgres
 * adapter exactly (docs/04-database-schema.md), so swapping is a container
 * change. Optionally seeds from a provided list (e.g. a persisted JSON fixture).
 */
export class InMemoryBriefingRepository implements BriefingRepository {
  private readonly byId = new Map<string, Briefing>();

  constructor(seed: readonly Briefing[] = []) {
    for (const b of seed) this.byId.set(b.id, b);
  }

  async save(briefing: Briefing): Promise<void> {
    this.byId.set(briefing.id, briefing);
  }

  async findById(id: string): Promise<Briefing | null> {
    return this.byId.get(id) ?? null;
  }

  async findLatest(userId: string): Promise<Briefing | null> {
    const sorted = this.forUser(userId);
    return sorted[0] ?? null;
  }

  async list(
    userId: string,
    filter?: { date?: string; kind?: string; limit?: number; offset?: number },
  ): Promise<Briefing[]> {
    let rows = this.forUser(userId);
    if (filter?.date) rows = rows.filter((b) => b.briefingDate === filter.date);
    if (filter?.kind) rows = rows.filter((b) => b.kind === filter.kind);
    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? 50;
    return rows.slice(offset, offset + limit);
  }

  /** Newest first by generatedAt. */
  private forUser(userId: string): Briefing[] {
    return [...this.byId.values()]
      .filter((b) => b.userId === userId)
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  }
}
