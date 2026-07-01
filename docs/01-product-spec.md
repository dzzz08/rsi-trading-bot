# 01 — Product Specification

**Module:** Market Intelligence — *Morning Briefing*
**Parent system:** ZardoshtiOS
**Status:** MVP (Phase 1)
**Last updated:** 2026-06-28

---

## 1. Purpose

Generate a **daily morning market briefing** written and structured like an
institutional analyst note (JPM/GS morning-desk quality), not a retail
newsletter. The briefing explains what happened overnight, *why* major assets
moved, the macro/news catalysts behind those moves, today's high-impact
calendar, key levels, and three conditional scenarios for the session.

This module is the first production component of **ZardoshtiOS**. It is built
standalone but designed to be absorbed later as the **Market Intelligence**
layer without a rewrite (see `09-roadmap.md`).

## 2. Non-negotiable constraints

1. **Not a trading-signal bot.** It never tells the user to buy or sell, never
   issues directional calls framed as instructions, and never implies certainty
   it does not have. Output is framed as *"here is what happened and here are
   the scenarios."*
2. **Anti-hallucination.** Every factual/causal claim must trace back to data
   ingested in that run. Thin, ambiguous, or conflicting data is stated as such,
   not smoothed over. See `07-agent-prompt-architecture.md`.
3. **Sourced.** Claims carry inline source references (which feed/article).
4. **Institutional tone.** No generic "stocks were mixed" filler. Specific
   levels, specific catalysts, explicit mechanism of *why* a move happened.

## 3. Target user

A single experienced macro/orderflow trader (the operator). Cares about
liquidity, gold, Nasdaq, FX, oil, and session timing (Asia/London/NY opens).
Wants deep, practical, institutional-quality context. The system is single-user
for the MVP but the data model and auth are built so multi-user is a config
change, not a refactor.

## 4. Scope

### In scope (MVP)
- One scheduled **Morning Briefing** generated before the user's session start.
- Coverage of FX (EUR/USD, GBP/USD, USD/JPY, DXY), commodities (Gold, Oil),
  indices (Nasdaq, S&P 500, Dow, DAX), crypto (BTC, ETH).
- Full ingestion → normalization → move detection → context retrieval →
  LLM analysis → storage → delivery pipeline, runnable end-to-end on **mocked
  data** with zero external keys, and on **one real data path** once keys exist.
- REST API + responsive web dashboard to read briefings, asset cards, calendar,
  watchlist, and notes.
- Persistence of every briefing for day-over-day comparison.
- Delivery via the **interface itself**: the app (dashboard/API) is the surface
  the operator reads the briefing on (default `in_app` adapter). A `console`
  adapter exists for dev; email/Telegram/Discord are optional additive push
  adapters behind the same port, not required for the MVP.

### Out of scope (placeholders only — see `03-advanced-features.md`)
- Intraday updates, end-of-day recaps.
- Searchable briefing archive / semantic search.
- AI market Q&A (chat over history).
- Full ZardoshtiOS multi-module integration.

These have **interfaces/placeholders** where it reduces future refactoring, but
**no implementation** in the MVP.

## 5. The briefing — 13-section contract

Every briefing is composed of exactly these sections, in order. This contract is
encoded in the domain model (`Briefing` entity) and the agent prompt.

| # | Section | Content |
|---|---|---|
| 1 | Overnight Summary | What happened from prior NY close → now |
| 2 | Why Assets Moved | Per-asset move + mechanism, not correlation |
| 3 | Macro Drivers & Catalysts | News/central-bank catalysts in window |
| 4 | FX | EUR/USD, GBP/USD, USD/JPY, DXY |
| 5 | Commodities | Gold, Oil |
| 6 | Indices | Nasdaq, S&P 500, Dow, DAX |
| 7 | Crypto | BTC, ETH |
| 8 | Risk Sentiment | risk-on / risk-off / mixed + rule-based reasoning |
| 9 | Economic Calendar | Today's events ranked by impact |
| 10 | Key Levels & Liquidity | Levels, liquidity zones, VWAP/volume context |
| 11 | Scenarios | Bull / Bear / Chop as conditional statements |
| 12 | What Actually Matters Today | Tight executive summary |
| 13 | Risk Warnings | High-impact news/risk windows, explicit |

## 6. Quality bar (acceptance)

A briefing passes if:
- All 13 sections are present and populated (or explicitly marked
  "insufficient data" with the reason).
- Every causal claim references at least one ingested data point or source.
- Risk sentiment matches the deterministic classifier's output (the LLM
  explains it; it does not overrule the rule set silently).
- No imperative buy/sell language appears (enforced by a lint pass over output).
- Scenarios are phrased conditionally ("if X holds/breaks, then …").

## 7. Success metrics (MVP)

- Briefing generates reliably on schedule (>95% of mornings).
- Operator reads it before session start instead of assembling context manually.
- Zero fabricated levels/catalysts on spot-check against sources.
