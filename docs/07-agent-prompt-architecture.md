# 07 — Agent Prompt Architecture

This is the spec for the **analyst LLM layer** — the `LlmAnalyst` port and its
`AnthropicAnalyst` implementation. The goal: turn a deterministic
`AnalysisSnapshot` (numbers, catalysts, sentiment already computed in code) into
a 13-section institutional briefing **without inventing anything**.

Design principle: **the model reasons and writes; it does not compute.** All
numbers, move-significance, and the risk-sentiment label are computed in code
(Stages 3–5 of `06-data-flow.md`) and handed to the model as ground truth. The
model's job is *explanation, mechanism, scenarios, and prose* — strictly over
the provided data.

## Why a single composed call (with structured output)

For the MVP we use **one structured call** per briefing rather than a multi-hop
agent. Rationale:
- The hard reasoning (move detection, context matching, sentiment) is already
  done deterministically — the model isn't deciding *what* is true, only
  *explaining* what's been established.
- One call with the full snapshot is cheaper, faster, easier to make
  reproducible, and far easier to guardrail than a multi-tool loop.
- The port (`LlmAnalyst.analyze(snapshot)`) hides this choice, so Phase 2 can
  swap in a multi-step / tool-using agent (e.g. for live Q&A) without changing
  callers.

## Inputs handed to the model

A single JSON `AnalysisSnapshot`:

```ts
{
  window: { from: ISO, to: ISO, label: "prior NY close → 05:30 London" },
  asUser: { sessionFocus: "London", priorityAssets: ["XAUUSD","NAS100"] },
  moves: [
    { symbol, assetClass, displayName, price, prevClose,
      changeAbs, changePct, zscore, significant, direction,
      realizedVol, catalysts: [{ type:"news"|"event", id, source, url,
                                 headline|title, publishedAt }] }
  ],
  riskSentiment: { label:"risk_off", score:-4, breakdown:{...component votes} },
  calendarToday: [ { title, country, impact, scheduledAt, forecast, previous } ],
  dataQuality: { marketData:"ok", news:"ok", calendar:"degraded:reason" },
  priorBriefing?: { date, riskSentiment, scenariosKeptOrInvalidated }
}
```

Everything the model is allowed to assert must be derivable from this object.

## Prompt structure

### System prompt (identity + hard rules)

```
You are the Market Intelligence analyst for ZardoshtiOS — an institutional
macro/markets desk analyst writing a morning note for one experienced
macro/orderflow trader. Tone: JPM/GS morning-desk. Precise, mechanism-driven,
no filler. If a sentence could appear unchanged in a retail newsletter, it is
wrong — add the specific level, catalyst, or mechanism.

ABSOLUTE RULES:
1. You are NOT a signal service. Never instruct the user to buy or sell, never
   frame a directional call as an instruction, never imply certainty you lack.
   Frame everything as "here is what happened and here are the scenarios."
2. Ground every factual and causal claim in the provided snapshot ONLY. You may
   reason about mechanism (e.g. higher yields → stronger DXY → headwind for
   gold), but the underlying facts (the move, the catalyst) must exist in the
   snapshot. Never introduce a number, level, headline, or event not present.
3. When data is thin, ambiguous, or conflicting, say so explicitly. Do not
   smooth over gaps. "Insufficient data to attribute this move" is a valid and
   preferred answer over a guess.
4. The risk-sentiment label is computed deterministically and given to you.
   Explain it using the component breakdown. You may add nuance, but you may not
   silently contradict the label; if the prose tension is real, name it.
5. Cite sources inline using the catalyst `source` (and url when present), e.g.
   "(Marketaux)". Every causal attribution names its source.
6. Scenarios are CONDITIONAL ("if X holds/breaks, then …"), never directives.

You output ONLY valid JSON matching the provided schema. No prose outside JSON.
```

### Task prompt (the data + the contract)

```
WINDOW: {window.label} ({window.from} → {window.to})
OPERATOR FOCUS: session={asUser.sessionFocus}, priority={asUser.priorityAssets}
DATA QUALITY: {dataQuality}   ← if a feed is degraded, reflect it in the note.

RISK SENTIMENT (computed, ground truth):
  label={riskSentiment.label}  score={riskSentiment.score}
  breakdown={riskSentiment.breakdown}

MOVES (computed, ground truth — significant flagged):
  {moves as compact table: symbol, %chg, zscore, significant, catalysts[]}

TODAY'S CALENDAR (ranked by impact):
  {calendarToday}

PRIOR BRIEFING (for day-over-day continuity), if present:
  {priorBriefing}

Produce the morning briefing as JSON with EXACTLY these 13 sections (keys fixed)
plus scenarios. For each section, populate `body` and `citations`
(citations reference catalyst ids/sources you used). Sections:

  1 overnight_summary   2 why_assets_moved     3 macro_drivers
  4 fx                  5 commodities          6 indices
  7 crypto              8 risk_sentiment        9 economic_calendar
 10 key_levels         11 scenarios            12 what_matters
 13 risk_warnings

For `why_assets_moved`: for each SIGNIFICANT move, state the move, then the
mechanism linking its catalyst(s) to that specific asset. If no catalyst exists
in the snapshot for a significant move, say "no clear catalyst in window —
likely positioning/flow" rather than inventing one.

For `key_levels`: only cite levels derivable from the snapshot (price,
prev_close, supplied levels). If VWAP/volume-profile data is absent, say it is
unavailable rather than fabricating zones.

For `scenarios`: exactly three — bull, bear, chop — each with `thesis`,
`conditions[]` (conditional triggers), and `invalidation[]`.
```

### Output schema (structured)

The adapter requests structured JSON (Anthropic tool/`response`-style schema):

```ts
{
  sections: Array<{ key: SectionKey; title: string; body: string;
                    citations: Array<{ type:"news"|"event"; refId:string;
                                       source:string; url?:string }> }>,
  scenarios: Array<{ kind:"bull"|"bear"|"chop"; thesis:string;
                     conditions:string[]; invalidation:string[] }>,
  notes?: { dataCaveats:string[] }   // explicit gaps/ambiguities
}
```

## Anti-hallucination, enforced in three layers

1. **Input shaping** — the model only ever receives computed truth; it cannot
   see raw, unverified provider blobs.
2. **Prompt rules** — the system rules above (ground-only, cite, declare gaps).
3. **Post-generation lint** (`Stage 7`, deterministic code):
   - **Buy/sell guard:** regex/keyword scan for imperative trade language
     ("buy", "sell now", "go long/short", "take profit") → flag/reject.
   - **Citation guard:** every section asserting a catalyst must have ≥1
     citation whose `refId` exists in the snapshot. Dangling ids → flag.
   - **Sentiment-consistency guard:** the `risk_sentiment` section must not
     assert the opposite label to the computed one.
   - **Number guard (best-effort):** numeric levels in prose are checked to be
     within the snapshot's set of known prices/levels; unknown precise numbers
     are flagged for review.
   A failing lint marks the briefing `failed` (real provider) — nothing
   fabricated is stored as `ready`.

## Model choice

- Default: **`claude-sonnet-4-6`** — strong reasoning/writing at sensible cost
  for a daily run. Configurable via `LLM_MODEL`.
- **`claude-opus-4-8`** available for higher-stakes/quality runs.
- A deterministic **`MockAnalyst`** composes the same 13 sections directly from
  the snapshot (no API key) so the pipeline is reviewable end-to-end and used in
  tests. It deliberately mirrors the structure the real prompt produces.
- Settings: low temperature (≈0.3) for consistency; `max_tokens` sized for a
  full note; structured output to guarantee the section contract.

## Why this survives ZardoshtiOS integration
- The contract is the `AnalysisSnapshot` in / typed `Briefing` out — a stable
  seam. Other modules consume the typed output, not prompt internals.
- Swapping to a tool-using agent (for Q&A or richer retrieval) is a new
  `LlmAnalyst` implementation, not a caller change.
