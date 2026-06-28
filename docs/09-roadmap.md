# 09 — Roadmap

Four phases from MVP to ZardoshtiOS integration. Each phase keeps the same
domain seams (ports), so later phases add adapters/modules rather than rewriting.

## Phase 1 — MVP (this build)
**Goal:** a real morning briefing, generated end-to-end, readable on a dashboard.

- Clean-architecture backend: ingestion ports, move detection, deterministic
  risk classifier, `LlmAnalyst` layer, briefing repository, delivery port.
- Mock providers + mock analyst → full pipeline runs with **no keys**
  (`npm run briefing:demo`).
- One **real path**: one price provider + one calendar source + one news source
  + a real Claude call (wired behind env once a key exists).
- REST API + responsive Next.js dashboard (briefing, asset cards, calendar,
  watchlist, notes, scenarios).
- Persistence (in-memory default; Postgres adapter + migrations ready).
- Delivery: console adapter ships; one real channel after the operator chooses.

**Exit criteria:** a single real morning briefing generates and is read on the
dashboard; mocked E2E is reviewable; docs reviewed.

## Phase 2 — Better data + memory
**Goal:** trustworthy data and day-over-day intelligence.

- Postgres as the default store; rolling quote history → real realized-vol for
  move detection.
- Provider failover + data-quality scoring across ≥2 price feeds.
- Day-over-day comparison surfaced in UI (scenario carry-over, sentiment shift).
- Job queue (BullMQ) replacing in-process cron; retries/backfill.
- First future cadence: **intraday update** template on the existing pipeline.
- Begin persisting embeddings of briefings/catalysts (vector store groundwork).

## Phase 3 — Dashboard + intelligence
**Goal:** the product feels like a desk, not a report.

- **End-of-day recap** that scores the morning's scenarios.
- **Searchable archive** (full-text + filters) over all briefings.
- **AI market Q&A** over history + live snapshot (reuses `LlmAnalyst` + vector
  memory, same guardrails).
- Richer microstructure: VWAP/volume-profile/liquidity zones from intraday bars.
- Delivery to the operator's chosen channel(s) with formatting per channel.

## Phase 4 — ZardoshtiOS integration
**Goal:** absorb this module as the **Market Intelligence** layer.

- Expose the module behind the ZardoshtiOS module contract (shared identity +
  event bus); multi-tenant auth (schema already `user_id`-scoped).
- Contribute market context to cross-module workflows (e.g. agenda/calendar
  module surfaces today's high-impact risk windows).
- Shared design system; the dashboard becomes a ZardoshtiOS surface.
- Promote typed domain contracts into the shared ZardoshtiOS package so other
  modules consume types, not JSON.

## Guiding rule
Each phase is **additive at the seams**: new adapters (data, storage, delivery,
LLM strategy) and new composition templates (cadences) — not rewrites of the
core. If a phase forces a core rewrite, the Phase 1 boundaries were drawn wrong.
