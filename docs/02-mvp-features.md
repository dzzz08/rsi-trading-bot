# 02 — MVP Feature List (What Ships First)

Phase 1 scope. Anything not listed here is deferred to `03-advanced-features.md`.

## Backend

### F1 — Data ingestion pipeline
- Pull **prices** for the covered asset universe (FX, commodities, indices,
  crypto) for the window *prior NY close → now*.
- Pull **news** headlines for the same window.
- Pull **economic calendar** events for today.
- Normalize all of the above into typed domain objects (`Quote`, `NewsItem`,
  `EconomicEvent`) independent of any provider's wire format.
- Ships with deterministic **mock providers** (no keys) and a **one real path**
  (one price provider + one calendar source + one news source) behind config.

### F2 — Move detection
- Compute per-asset change (abs + %) over the window.
- Flag **statistically meaningful** moves vs. noise using a per-asset-class
  threshold and a z-score against recent realized volatility (see
  `06-data-flow.md`).
- Output ranked `PriceMove[]` with magnitude and significance, not "vibes."

### F3 — Context retrieval
- For each flagged move, attach matching news items and calendar events in the
  same window (keyword + asset-class mapping).

### F4 — Risk-sentiment classifier (deterministic)
- Rule-based score from equities + crypto direction vs. DXY/JPY/gold direction
  vs. yields → `risk-on | risk-off | mixed` with a transparent breakdown. The
  LLM explains the result; it does not invent it.

### F5 — LLM analysis layer
- Compose the 13-section briefing from the ingested + analyzed payload using the
  prompt architecture in `07-agent-prompt-architecture.md`.
- Anthropic Claude adapter behind an `LlmAnalyst` port, plus a deterministic
  **mock analyst** so the full pipeline runs with no API key.
- Anti-hallucination guardrails + inline source citations enforced by prompt and
  a post-generation lint pass.

### F6 — Persistence
- Store every briefing (sections + the analysis snapshot it was built from) for
  day-over-day comparison and audit.
- Repository port with an **in-memory** adapter (default MVP demo) and a
  **Postgres** adapter (SQL migrations in `backend/migrations`).

### F7 — Scheduler hook
- Generate the briefing every morning before session start.
- In-process `node-cron` for the MVP, plus an authenticated trigger endpoint so
  an external scheduler (GitHub Actions / platform cron) can drive it instead.

### F8 — User preferences
- Priority assets, preferred delivery channel, session focus (Asia/London/NY),
  timezone. Single-user default seeded; model is multi-user-ready.

### F9 — Delivery
- `DeliveryChannel` port. **Console/log** adapter ships and needs no creds.
- Email / Telegram / Discord adapters are **stubs** pending the operator's
  channel choice (do not implement all three blindly).

### F10 — REST API
- Typed endpoints for briefings, assets, calendar, watchlist, notes,
  preferences, auth, and an internal generate trigger (see `05-api-endpoints.md`).

## Frontend

### F11 — Dashboard shell
- Mobile-responsive layout, dark institutional theme.

### F12 — Briefing view
- Renders the 13-section structure with source references and the risk-sentiment
  badge.

### F13 — Asset cards
- Per-asset cards grouped by class (FX / commodities / indices / crypto) showing
  level, change, significance flag, and the one-line "why."

### F14 — Macro calendar view
- Today's events ranked by impact, with risk-window highlighting.

### F15 — Watchlist
- Operator-managed list of symbols to emphasize.

### F16 — Notes
- Free-text personal notes, timestamped, attachable to a briefing date.

### F17 — Scenario cards
- Bull / Bear / Chop cards rendered as conditional statements.

## Cross-cutting

- **Auth:** minimal bearer-token / single-user session, present not absent.
- **Config:** all secrets and provider selection via env (`.env.example`).
- **Docs:** the `/docs` set is part of the deliverable and kept in sync.
- **Run-without-keys:** `npm run briefing:demo` produces a full briefing from
  mock data so the pipeline is reviewable before any key is wired.
