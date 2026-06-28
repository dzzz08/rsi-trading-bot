# 04 — Database Schema

**Engine:** PostgreSQL (MVP runs on an in-memory adapter with the *same* logical
model, so the schema is authoritative regardless of backing store).

Design principles:
- Every user-owned row carries `user_id` so single-user → multi-user is a config
  change, not a migration of intent.
- Briefings store both the **rendered sections** and the **analysis snapshot**
  they were generated from (full audit + future archive/vector indexing).
- Times are `timestamptz`, always UTC at rest.

## ERD (mermaid)

```mermaid
erDiagram
    users ||--o{ user_preferences : has
    users ||--o{ watchlist_items : owns
    users ||--o{ notes : writes
    users ||--o{ briefings : receives

    assets ||--o{ quotes : "priced by"
    assets ||--o{ price_moves : "moved in"
    assets ||--o{ watchlist_items : "referenced by"

    briefings ||--o{ briefing_sections : contains
    briefings ||--o{ price_moves : "snapshot of"
    briefings ||--o{ scenarios : proposes
    briefings ||--o{ briefing_news : cites
    briefings ||--o{ briefing_events : cites
    briefings ||--o{ deliveries : "sent via"
    briefings ||--o{ notes : "annotated by"

    news_items ||--o{ briefing_news : linked
    economic_events ||--o{ briefing_events : linked

    users {
        uuid id PK
        text email
        text display_name
        timestamptz created_at
    }

    user_preferences {
        uuid id PK
        uuid user_id FK
        text timezone
        text session_focus
        text delivery_channel
        jsonb priority_assets
        timestamptz updated_at
    }

    assets {
        uuid id PK
        text symbol
        text display_name
        text asset_class
        text quote_currency
        boolean active
    }

    quotes {
        uuid id PK
        uuid asset_id FK
        numeric price
        numeric prev_close
        text source
        timestamptz captured_at
    }

    price_moves {
        uuid id PK
        uuid briefing_id FK
        uuid asset_id FK
        numeric change_abs
        numeric change_pct
        numeric zscore
        boolean significant
        text direction
    }

    news_items {
        uuid id PK
        text headline
        text summary
        text url
        text source
        jsonb asset_tags
        timestamptz published_at
        timestamptz ingested_at
    }

    economic_events {
        uuid id PK
        text title
        text country
        text impact
        numeric actual
        numeric forecast
        numeric previous
        timestamptz scheduled_at
        text source
    }

    briefings {
        uuid id PK
        uuid user_id FK
        date briefing_date
        text kind
        text status
        text risk_sentiment
        jsonb risk_breakdown
        jsonb analysis_snapshot
        text model
        timestamptz generated_at
    }

    briefing_sections {
        uuid id PK
        uuid briefing_id FK
        int section_no
        text key
        text title
        text body
        jsonb citations
    }

    scenarios {
        uuid id PK
        uuid briefing_id FK
        text kind
        text thesis
        jsonb conditions
        jsonb invalidation
    }

    briefing_news {
        uuid briefing_id FK
        uuid news_item_id FK
    }

    briefing_events {
        uuid briefing_id FK
        uuid economic_event_id FK
    }

    watchlist_items {
        uuid id PK
        uuid user_id FK
        uuid asset_id FK
        int sort_order
        timestamptz created_at
    }

    notes {
        uuid id PK
        uuid user_id FK
        uuid briefing_id FK
        text body
        timestamptz created_at
    }

    deliveries {
        uuid id PK
        uuid briefing_id FK
        text channel
        text status
        text error
        timestamptz sent_at
    }
```

## Table notes

### `assets`
Reference data for the covered universe. `asset_class ∈
{fx, commodity, index, crypto}`. Seeded by migration with the MVP universe.

### `quotes`
One row per asset per ingestion run. `prev_close` is the prior-NY-close anchor
used for move detection. `source` records the provider for citation/audit.

### `price_moves`
The move-detection output, snapshotted **per briefing** (so a briefing is
reproducible). `direction ∈ {up, down, flat}`; `significant` is the threshold +
z-score decision; `zscore` is vs. recent realized vol.

### `briefings`
- `kind ∈ {morning, intraday, eod}` — only `morning` is produced in the MVP, but
  the column exists so future cadences need no migration.
- `status ∈ {pending, generating, ready, failed, delivered}`.
- `risk_sentiment ∈ {risk_on, risk_off, mixed}` from the deterministic
  classifier; `risk_breakdown` stores the component scores.
- `analysis_snapshot` (jsonb) is the full normalized input the LLM saw — the
  audit trail and the seed for future archive/vector indexing.
- `model` records which LLM (or `mock`) produced it.
- Unique on `(user_id, briefing_date, kind)`.

### `briefing_sections`
The 13 sections, one row each, ordered by `section_no`. `key` is a stable
machine key (e.g. `overnight_summary`); `citations` is an array of
`{type, ref_id, source, url}`.

### `scenarios`
Bull / Bear / Chop. `conditions` and `invalidation` are arrays of conditional
strings — never imperatives.

### `news_items` / `economic_events`
Provider-agnostic normalized feeds. Linked to briefings via the join tables so
the same item can support multiple briefings without duplication.

### `deliveries`
Audit of every delivery attempt per channel.

## Migrations
`backend/migrations/001_init.sql` creates all tables, indexes, and seeds
`assets` + a default single-user row. The in-memory adapter mirrors these shapes
exactly so behavior is identical with or without Postgres.
