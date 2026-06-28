import type { Briefing, WatchlistItem } from './types';
import { SAMPLE_BRIEFING } from './sample';

/**
 * Tiny typed API client. When the backend is configured and reachable it uses
 * it; otherwise it falls back to a bundled sample briefing so the dashboard
 * renders standalone (matching the backend's "runs without keys" posture).
 *
 * Configure via NEXT_PUBLIC_API_URL + NEXT_PUBLIC_API_TOKEN.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
const TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? 'dev-operator-token';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { authorization: `Bearer ${TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  const json = (await res.json()) as { data: T };
  return json.data;
}

export interface ApiResult<T> {
  data: T;
  /** True when served from the bundled sample (backend not reached). */
  sample: boolean;
}

export async function getLatestBriefing(): Promise<ApiResult<Briefing>> {
  if (!BASE) return { data: SAMPLE_BRIEFING, sample: true };
  try {
    return { data: await get<Briefing>('/api/v1/briefings/latest'), sample: false };
  } catch {
    return { data: SAMPLE_BRIEFING, sample: true };
  }
}

export async function getWatchlist(): Promise<ApiResult<WatchlistItem[]>> {
  if (!BASE) return { data: sampleWatchlist(), sample: true };
  try {
    return { data: await get<WatchlistItem[]>('/api/v1/watchlist'), sample: false };
  } catch {
    return { data: sampleWatchlist(), sample: true };
  }
}

function sampleWatchlist(): WatchlistItem[] {
  return ['XAUUSD', 'NAS100', 'USDJPY', 'BTCUSD'].map((symbol, i) => ({
    id: `sample-${i}`,
    symbol,
    sortOrder: i,
  }));
}
