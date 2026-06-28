# 10 — Tech Stack

Two tiers: the **MVP stack** (ship fast, runnable without keys) and the
**advanced stack** (production-grade, ZardoshtiOS-ready). The architecture is
identical across both — the advanced tier swaps adapters behind the same ports.

## MVP stack (Phase 1 — this build)

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript** (Node 22) end-to-end | One language across API + web → shared domain types, no serialization-contract drift. Excellent async I/O for fan-out ingestion. First-class Anthropic SDK. |
| Backend framework | **Express + zod** | Ubiquitous, trivially runnable/reviewable; clean architecture keeps Express at the edge so the choice is swappable. zod gives runtime-validated, typed DTOs. |
| Architecture | **Clean architecture + DI** | `domain` (entities + ports) ← `application` (use cases) ← `infrastructure` (adapters) ← `interfaces/http`. Composition root wires adapters. Swapping mock↔real is a container change. |
| Database | **Postgres** via `pg` + SQL migrations; **in-memory adapter** default for the demo | Repository port means the MVP demo runs with zero external services, while the Postgres adapter + `001_init.sql` are production-ready. |
| LLM | **Anthropic Claude** (`claude-sonnet-4-6` default, `claude-opus-4-8` optional) behind `LlmAnalyst`; deterministic `MockAnalyst` for no-key runs | Strong reasoning/writing for the analyst note; mock keeps the pipeline reviewable and testable offline. |
| Scheduling | **node-cron** in-process + an authenticated generate endpoint | No heavy queue at MVP; external cron (GitHub Actions / platform) can drive the same endpoint. |
| Frontend | **Next.js (App Router) + Tailwind** | Fast, responsive, server components for the read path; ships with a sample fallback so it renders without the backend. |
| Auth | **Bearer token, single-user** | Minimal but present; schema is `user_id`-scoped so multi-user is additive. |
| Config | **dotenv + zod-validated env** | Fail-fast on misconfig; one `.env.example` documents every switch. |
| Tests | **Vitest** | Fast unit tests for move detection, risk classifier, guardrail lint, and the mock E2E pipeline. |

### Data sources (MVP — verify pricing/limits before locking in)
Chosen for workable free/cheap tiers. Behind provider ports, so each is one
adapter:

| Category | MVP candidate | Note |
|---|---|---|
| FX / indices / commodities price | **Twelve Data** (free tier) | Single provider covers FX, indices, gold/oil proxies → simplest one-real-path. |
| Crypto price | **CoinGecko** (generous free tier) | No key for basic; BTC/ETH spot. |
| Economic calendar | **Trading Economics** (trial) or **FRED** for series | FRED is free for underlying macro series; full calendar may need a paid tier — flagged. |
| Macro news | **Marketaux** or **Finnhub** news endpoint | Free tiers with asset tagging that feeds context retrieval. |
| Central bank | **Fed/ECB/BoE/BoJ RSS** | Free; parsed into `news_items`. |

> Per the working agreement: **do not** subscribe to any paid tier without
> operator confirmation. The MVP demo path uses mock providers; the one real
> path uses only free/trial tiers.

## Advanced stack (Phase 2–4 — ZardoshtiOS-ready)

| Layer | Upgrade | Why |
|---|---|---|
| Job orchestration | **BullMQ (Redis)** or **Temporal** | Retries, backfill, scheduled fan-out, dead-letter — replaces in-process cron. |
| Storage | **Postgres (managed: Neon/Supabase)** + read replicas | Durable history for day-over-day + archive. |
| Vector memory | **pgvector** (or Pinecone/Weaviate) | Semantic recall over briefings/catalysts → comparison + Q&A. |
| Data reliability | **≥2 price providers** (e.g. Polygon.io + Twelve Data) with failover + quality scoring; **EIA** for oil fundamentals | Production-grade data trust. |
| Microstructure | Intraday bars → computed **VWAP / volume profile / liquidity zones** | Real "key levels" instead of round numbers. |
| Auth | **Auth.js / Supabase Auth**, multi-tenant | ZardoshtiOS shared identity. |
| Delivery | Email (Resend/Postmark) + Telegram + Discord adapters | Operator-chosen channels with per-channel formatting. |
| Observability | **OpenTelemetry** + structured logs + run audit | Every generation traceable end-to-end. |
| Hosting | **Vercel** (web) + **Railway/Render/Fly** (API + worker) + managed Postgres/Redis | Simple, scalable MVP→prod path. |
| Integration | **ZardoshtiOS module contract** (event bus + shared design system + shared types package) | Absorb as the Market Intelligence layer without a rewrite. |

## Architectural trade-offs flagged for the operator
- **Node/TS vs. Python/FastAPI for the backend:** chose **Node/TS** for one-
  language type sharing with the Next.js frontend and the cleanest Anthropic
  orchestration. Python would win if the roadmap leaned heavily on quant/ML
  libraries; it does not at MVP. Revisit if Phase 2 microstructure needs
  pandas/numpy — the ingestion/analysis layer could become a Python service
  behind the same ports.
- **Polling vs. webhook ingestion:** MVP **polls** on the morning schedule
  (simple, sufficient for a once-daily note). Webhooks/streaming become valuable
  only with intraday cadence (Phase 2) — deferred deliberately.
- **In-process cron vs. job queue:** in-process for a single daily job; the
  generate endpoint means moving to an external scheduler/queue later is a
  config change, not a rewrite.
- **Monolith vs. services:** **modular monolith** for the MVP (backend +
  frontend), with clean internal boundaries so a worker/service split (Phase 2)
  follows the existing seams.
