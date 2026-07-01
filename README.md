# ZardoshtiOS — Market Intelligence · Morning Briefing (MVP)

The first production module of **ZardoshtiOS**. It generates a daily **morning
market briefing** written like an institutional analyst note — what moved
overnight, *why* (mechanism, not correlation), the macro catalysts, today's
high-impact calendar, key levels, and three conditional day scenarios.

> **Not a trading-signal bot.** It never issues buy/sell instructions and never
> implies certainty it doesn't have. Every causal claim is grounded in ingested
> data and cited. See `docs/01-product-spec.md` §2.

This module is built standalone but designed to be absorbed as the Market
Intelligence layer of ZardoshtiOS with minimal refactoring (clean architecture,
ports/adapters, typed contracts). Future cadences (intraday/EOD), archive
search, vector memory, and AI Q&A exist only as interfaces/placeholders — see
`docs/03-advanced-features.md`.

## Repository layout

```
docs/        10 planning deliverables (spec, schema, API, data-flow, agent
             prompt architecture, worked example, roadmap, tech stack)
backend/     Node + TypeScript. Clean architecture:
             domain → application → infrastructure → interfaces/http
frontend/    Next.js (App Router) + Tailwind dashboard (mobile-responsive)
```

## Quick start (no API keys required)

The whole pipeline runs on deterministic mock data and a deterministic analyst,
so you can see it end-to-end before wiring anything real.

```bash
# 1) Backend — generate a full mocked briefing to the console
cd backend
npm install
npm run briefing:demo        # ingestion → analysis → guardrails → render
npm test                     # unit + end-to-end pipeline tests

# 2) Backend API
cp .env.example .env
npm run dev                  # http://localhost:4000/health

# 3) Frontend dashboard (renders the bundled sample if no backend is set)
cd ../frontend
npm install
npm run dev                  # http://localhost:3000
```

To point the dashboard at the live API, set `NEXT_PUBLIC_API_URL=http://localhost:4000`
and `NEXT_PUBLIC_API_TOKEN=<API_BEARER_TOKEN>` in `frontend/.env.local`.

### Generate a briefing via the API

```bash
curl -X POST localhost:4000/api/v1/internal/briefings/generate \
  -H "authorization: Bearer dev-scheduler-token" \
  -H "content-type: application/json" -d '{"date":"2026-06-29"}'

curl localhost:4000/api/v1/briefings/latest -H "authorization: Bearer dev-operator-token"
```

## The pipeline (docs/06-data-flow.md)

```
ingest → normalize → detect moves → retrieve catalysts → classify risk
       → LLM analysis → guardrail lint → persist → deliver → API → dashboard
```

- **Move detection** and **risk sentiment** are computed deterministically in
  code; the LLM only *explains and writes*, never recomputes (anti-hallucination
  by construction — `docs/07-agent-prompt-architecture.md`).
- **Guardrails** (post-generation lint) reject imperative buy/sell language,
  dangling citations, and sentiment contradictions.
- Everything is wired through **ports**; mock↔real, in-memory↔Postgres,
  console↔Telegram, mock-analyst↔Claude are config changes in one composition
  root (`backend/src/config/container.ts`).

## Configuration

All switches are documented in `backend/.env.example`. Defaults are fully
mocked. Set `DATA_SOURCE=real` + provider keys, `LLM_PROVIDER=anthropic` +
`ANTHROPIC_API_KEY`, and `PERSISTENCE=postgres` + `DATABASE_URL` to wire real
adapters. SQL schema: `backend/migrations/001_init.sql`.

## Decisions & stated assumptions (MVP defaults)

Per the build brief's Step 0, blocking items were defaulted (not stalled on)
since they only bite when wiring real data:

- **Backend language:** Node/TypeScript end-to-end (shared types with the
  frontend, clean Anthropic orchestration). Rationale in `docs/10-tech-stack.md`.
- **LLM:** Anthropic Claude (`claude-sonnet-4-6` default, `claude-opus-4-8`
  optional) behind a port; a deterministic mock analyst runs the offline demo.
- **Persistence:** in-memory for the demo; Postgres adapter + migration ready.
- **Delivery = the interface.** The app (dashboard/API) is the delivery surface;
  the default `in_app` adapter just makes the persisted briefing available to
  read. Messaging channels (email/Telegram/Discord) are optional additive
  adapters, not a required push — and not the headline decision.

## Open questions for the operator (before Step 3 — wiring real data)

These are genuinely the operator's calls and gate the real-data path, not the
mocked MVP:

1. **LLM key** — confirm the `ANTHROPIC_API_KEY` to use, and Sonnet vs Opus.
2. **Data providers** — confirm which free/trial tiers to start with
   (Twelve Data + Marketaux + Trading Economics/FRED are the proposed lean).
3. **Hosting/scheduling** — in-process cron vs external (GitHub Actions /
   platform) hitting the generate endpoint.

(Delivery is settled: the app/dashboard is the interface — no messaging channel
is required. Email/Telegram/Discord remain optional adapters if you ever want a
push as well.)

## Status

- [x] Step 1 — planning docs (`/docs`)
- [x] Step 2 — clean-architecture scaffold + **mocked end-to-end flow**
- [ ] Step 3 — wire one real data path (pending operator confirmation above)
- [ ] Step 4 — iterate (full coverage, real delivery, day-over-day, polish)
