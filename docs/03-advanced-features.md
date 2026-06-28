# 03 — Advanced / Future Features

Deferred beyond the MVP. Listed with an eye toward eventual **ZardoshtiOS**
integration. The MVP only ships *interfaces/placeholders* where they materially
reduce future refactoring; nothing here is implemented yet.

## A. More cadences (intraday + EOD)
- **Intraday updates**: lighter briefings triggered by event windows
  (data releases, large moves). Reuses the same ingestion + move-detection +
  analysis pipeline with a different composition template.
- **End-of-day recap**: settles the day vs. the morning scenarios — "which case
  played out, and why." Naturally consumes the stored morning briefing.
- *Placeholder now:* `BriefingKind` enum (`morning | intraday | eod`) already
  exists on the `Briefing` entity so storage/queries don't change later.

## B. Searchable briefing archive
- Full-text + filter search over all historical briefings (by date, asset,
  catalyst, sentiment).
- Day-over-day and week-over-week diffing surfaced in the UI.
- *Placeholder now:* every briefing persists its full analysis snapshot, so the
  archive has structured data to index later.

## C. Semantic memory (vector store)
- Embed briefings + catalysts so the agent can recall "last time CPI surprised
  hot, here's how gold/DXY behaved." Powers comparison and pattern recall.
- *Placeholder now:* repository port is storage-agnostic; an embedding pipeline
  can subscribe to the same persisted snapshots.

## D. AI market Q&A
- Conversational interface over the archive + live snapshot: "why is gold bid
  this week?" answered from ingested data with citations.
- Reuses the `LlmAnalyst` port and the same anti-hallucination guardrails.

## E. Richer data + microstructure
- True VWAP / volume-profile / liquidity-zone computation from intraday bars.
- Order-flow / COT / positioning data.
- Options-derived levels (gamma, dealer positioning) for indices.
- Central-bank speech transcription + tone scoring.

## F. Delivery & UX
- Push to email / Telegram / Discord (operator picks the real channel).
- Audio version (TTS) of the "what actually matters" section for the commute.
- Per-section "explain more" drill-downs in the dashboard.

## G. Reliability & scale (production hardening)
- Job queue with retries/backfill (BullMQ/Temporal) replacing in-process cron.
- Provider failover and data-quality scoring across multiple price feeds.
- Multi-tenant auth and per-user preferences (the schema already supports a
  `user_id` foreign key throughout).

## H. ZardoshtiOS integration
- Expose this module behind the ZardoshtiOS module contract (event bus +
  shared identity).
- Contribute "Market Intelligence" context to cross-module workflows
  (e.g., calendar/agenda module surfaces today's high-impact risk windows).
- *Placeholder now:* the API is the integration seam; domain types are exported
  from a shared layer so other modules consume typed contracts, not JSON blobs.

## Explicitly NOT building in the MVP
Intraday, EOD, archive search, vector memory, Q&A, real microstructure, and
multi-channel delivery. Interfaces exist; implementations are deferred.
