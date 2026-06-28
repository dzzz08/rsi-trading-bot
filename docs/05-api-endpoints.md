# 05 — API Endpoints

**Style:** REST, JSON, versioned under `/api/v1`. All responses are typed
(shared DTOs live in `backend/src/interfaces/http` and are mirrored by the
frontend client). Auth is a bearer token (single-user MVP); every route except
`/health` and `/auth/*` requires it.

Conventions:
- Success: `200/201` with `{ data: ... }`.
- Error: `{ error: { code, message, details? } }` with the matching HTTP status.
- Timestamps ISO-8601 UTC. Dates `YYYY-MM-DD`.

## Health & auth
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness + which adapters are wired (mock vs real). |
| POST | `/api/v1/auth/login` | Exchange operator credentials for a bearer token. |
| GET | `/api/v1/auth/me` | Current user + preferences. |

## Briefings
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/briefings` | List briefings (paginated; filter `?date`, `?kind`). |
| GET | `/api/v1/briefings/latest` | Most recent ready briefing (dashboard default). |
| GET | `/api/v1/briefings/:id` | Full briefing: 13 sections, scenarios, moves, citations. |
| GET | `/api/v1/briefings/:id/compare?to=:otherId` | Day-over-day diff (sentiment, moves, scenario carry-over). |
| POST | `/api/v1/internal/briefings/generate` | **Internal/scheduler trigger.** Runs the pipeline now. Guarded by a separate scheduler token. Body: `{ kind?: "morning", date?: "YYYY-MM-DD", dryRun?: boolean }`. |

> The generate endpoint is what an external cron (GitHub Actions / platform
> scheduler) calls. In-process `node-cron` calls the same use case directly.

## Assets & market data
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/assets` | Covered universe (filter `?class=fx\|commodity\|index\|crypto`). |
| GET | `/api/v1/assets/:symbol/quote` | Latest captured quote + last move. |
| GET | `/api/v1/briefings/:id/moves` | Ranked price moves for that briefing. |

## Economic calendar
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/calendar?date=YYYY-MM-DD` | Events for a day, ranked by impact. |
| GET | `/api/v1/calendar/today` | Convenience for today's high-impact events. |

## Watchlist
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/watchlist` | Operator's watchlist (ordered). |
| POST | `/api/v1/watchlist` | Add `{ symbol }`. |
| PATCH | `/api/v1/watchlist/:id` | Reorder `{ sortOrder }`. |
| DELETE | `/api/v1/watchlist/:id` | Remove. |

## Notes
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/notes?briefingId=` | Notes, optionally scoped to a briefing. |
| POST | `/api/v1/notes` | Create `{ body, briefingId? }`. |
| PATCH | `/api/v1/notes/:id` | Edit `{ body }`. |
| DELETE | `/api/v1/notes/:id` | Remove. |

## Preferences
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/preferences` | Get preferences. |
| PUT | `/api/v1/preferences` | Update `{ timezone, sessionFocus, deliveryChannel, priorityAssets }`. |

## Example payloads

### `GET /api/v1/briefings/latest`
```json
{
  "data": {
    "id": "b_2026-06-28",
    "briefingDate": "2026-06-28",
    "kind": "morning",
    "status": "ready",
    "riskSentiment": "risk_off",
    "riskBreakdown": { "equities": -1, "crypto": -1, "dxy": 1, "jpy": 1, "gold": 1, "yields": 1, "score": -4 },
    "model": "mock",
    "generatedAt": "2026-06-28T05:30:00Z",
    "sections": [
      { "sectionNo": 1, "key": "overnight_summary", "title": "Overnight Summary",
        "body": "…", "citations": [{ "type": "news", "source": "Marketaux", "url": "…" }] }
    ],
    "scenarios": [
      { "kind": "bull", "thesis": "…", "conditions": ["if S&P reclaims 5500 …"], "invalidation": ["…"] }
    ],
    "moves": [
      { "symbol": "XAUUSD", "changePct": 1.2, "zscore": 2.4, "significant": true, "direction": "up" }
    ]
  }
}
```

### Error shape
```json
{ "error": { "code": "not_found", "message": "Briefing not found" } }
```

## Future endpoints (placeholders, not implemented in MVP)
- `GET /api/v1/briefings/search?q=` — archive search (Phase 2/3).
- `POST /api/v1/qa` — AI market Q&A over history (Phase 3).
- `GET /api/v1/briefings/:id/intraday` — intraday updates (Phase 2).
