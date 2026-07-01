# 06 — Data Flow

End-to-end path for one morning briefing. The same pipeline backs future
cadences (intraday/EOD) by swapping the composition template.

## Pipeline (text diagram)

```
                    ┌─────────────────────────────────────────────┐
                    │  TRIGGER                                     │
                    │  node-cron (in-process)  OR                  │
                    │  external cron → POST /internal/.../generate │
                    └───────────────────────┬─────────────────────┘
                                            │
                ┌───────────────────────────▼───────────────────────────┐
   STAGE 1      │  INGESTION  (application/ingestion/IngestionService)    │
   ingestion    │  parallel pulls for window [prior NY close → now]:     │
                │    MarketDataProvider   → raw quotes                    │
                │    NewsProvider         → raw headlines                 │
                │    EconomicCalendar     → today's events                │
                │  each provider is a PORT; mock or real adapter behind it│
                └───────────────────────────┬───────────────────────────┘
                                            │ raw, provider-shaped
                ┌───────────────────────────▼───────────────────────────┐
   STAGE 2      │  NORMALIZATION                                         │
   normalize    │  adapters map wire format → domain types:             │
                │    Quote · NewsItem · EconomicEvent                    │
                │  (normalization lives in the adapter, so the core      │
                │   never sees a provider's JSON)                        │
                └───────────────────────────┬───────────────────────────┘
                                            │ MarketSnapshot
                ┌───────────────────────────▼───────────────────────────┐
   STAGE 3      │  MOVE DETECTION  (application/analysis/MoveDetector)    │
   detect       │  per asset:                                           │
                │    change_abs = price − prev_close                     │
                │    change_pct = change_abs / prev_close                │
                │    zscore     = change_pct / recent_realized_vol       │
                │    significant = |change_pct| ≥ classThreshold         │
                │                  OR |zscore| ≥ zThreshold              │
                │  → ranked PriceMove[] (significant first, by |zscore|) │
                └───────────────────────────┬───────────────────────────┘
                                            │
                ┌───────────────────────────▼───────────────────────────┐
   STAGE 4      │  CONTEXT RETRIEVAL  (analysis/ContextRetriever)        │
   contextize   │  for each significant move:                           │
                │    match NewsItem by asset_tags / keyword              │
                │    match EconomicEvent by country↔asset mapping        │
                │  → each move carries its candidate catalysts           │
                └───────────────────────────┬───────────────────────────┘
                                            │
                ┌───────────────────────────▼───────────────────────────┐
   STAGE 5      │  RISK CLASSIFICATION  (RiskSentimentClassifier)        │
   classify     │  deterministic rule set (see §Risk rules) →           │
                │    risk_on | risk_off | mixed  + component breakdown   │
                └───────────────────────────┬───────────────────────────┘
                                            │ AnalysisSnapshot
                ┌───────────────────────────▼───────────────────────────┐
   STAGE 6      │  LLM ANALYSIS  (LlmAnalyst port)                        │
   analyze      │  input = AnalysisSnapshot (moves+catalysts+sentiment)  │
                │  system+task prompt from doc 07                        │
                │  output = 13 typed sections + 3 scenarios + citations  │
                │  adapters: AnthropicAnalyst | MockAnalyst              │
                └───────────────────────────┬───────────────────────────┘
                                            │ Briefing (draft)
                ┌───────────────────────────▼───────────────────────────┐
   STAGE 7      │  GUARDRAIL LINT  (analysis/output guards)              │
   guard        │  reject/flag: imperative buy/sell language;            │
                │  uncited causal claims; sentiment overruled silently   │
                └───────────────────────────┬───────────────────────────┘
                                            │ Briefing (ready)
                ┌───────────────────────────▼───────────────────────────┐
   STAGE 8      │  PERSIST  (BriefingRepository)                         │
   store        │  save sections + scenarios + moves + analysis_snapshot │
                │  (in-memory adapter MVP demo / Postgres adapter real)  │
                └───────────────────────────┬───────────────────────────┘
                                            │
                ┌───────────────────────────▼───────────────────────────┐
   STAGE 9      │  DELIVER  (DeliveryChannel port)                       │
   deliver      │  in_app (default: available in dashboard/API) /        │
                │  console (dev) / optional email|telegram|discord push  │
                │  record a `deliveries` row per attempt                 │
                └───────────────────────────┬───────────────────────────┘
                                            │
                ┌───────────────────────────▼───────────────────────────┐
   READ PATH    │  REST API  →  Next.js dashboard                        │
                │  briefing view · asset cards · calendar · watchlist ·  │
                │  notes · scenario cards                                │
                └───────────────────────────────────────────────────────┘
```

## Move-detection parameters

| Asset class | `classThreshold` (|%|) | Notes |
|---|---|---|
| fx | 0.4% | majors are low-vol; small moves matter |
| commodity | 0.8% | gold/oil are more volatile |
| index | 0.6% | cash/futures proxy |
| crypto | 2.0% | high baseline vol |

- `zThreshold` = 1.5 across classes (z-score vs. recent realized vol).
- A move is **significant** if it clears the class threshold **or** the z-score
  threshold — so an unusually large move for a normally-quiet asset is caught
  even below the absolute threshold.
- `recent_realized_vol` in the MVP is supplied per asset by the provider
  snapshot (mock provides plausible values); Phase 2 computes it from a rolling
  window of stored quotes.

## Risk-sentiment rules (deterministic)

Each component votes +1 (risk-on) / −1 (risk-off) / 0 (flat):

| Component | risk-on when… | risk-off when… |
|---|---|---|
| Equities (Nasdaq/S&P avg) | up | down |
| Crypto (BTC/ETH avg) | up | down |
| DXY | down | up |
| USD/JPY | up (carry on) | down (carry off) |
| Gold | down | up |
| Yields (proxy) | up (growth) | down (flight) |

`score = Σ votes`. `score ≥ +2 → risk_on`, `score ≤ −2 → risk_off`, else
`mixed`. The breakdown (each component's vote) is stored and shown so the call
is auditable. The LLM **explains** this result; it cannot silently overrule it.

## Failure handling (MVP)
- Any provider failure degrades gracefully: the snapshot marks that feed as
  `unavailable`, the affected sections say so explicitly, and the run still
  completes (anti-hallucination > completeness).
- A failed LLM call marks the briefing `failed` and records the error; the
  scheduler may retry. Nothing fabricated is ever persisted as `ready`.
