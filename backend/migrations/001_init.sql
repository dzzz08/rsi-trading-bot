-- 001_init.sql — ZardoshtiOS Market Intelligence (Morning Briefing) schema.
-- Authoritative logical model (docs/04-database-schema.md). The in-memory MVP
-- adapter mirrors these shapes; the Postgres adapter targets this file directly.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users -----------------------------------------------------------------------
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_preferences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timezone         TEXT NOT NULL DEFAULT 'Europe/London',
  session_focus    TEXT NOT NULL DEFAULT 'London',
  delivery_channel TEXT NOT NULL DEFAULT 'console',
  priority_assets  JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Reference + market data -----------------------------------------------------
CREATE TABLE assets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol         TEXT NOT NULL UNIQUE,
  display_name   TEXT NOT NULL,
  asset_class    TEXT NOT NULL CHECK (asset_class IN ('fx','commodity','index','crypto')),
  quote_currency TEXT NOT NULL,
  active         BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE quotes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id    UUID NOT NULL REFERENCES assets(id),
  price       NUMERIC NOT NULL,
  prev_close  NUMERIC NOT NULL,
  realized_vol NUMERIC NOT NULL DEFAULT 0,
  source      TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quotes_asset_time ON quotes(asset_id, captured_at DESC);

CREATE TABLE news_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline     TEXT NOT NULL,
  summary      TEXT,
  url          TEXT,
  source       TEXT NOT NULL,
  asset_tags   JSONB NOT NULL DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ NOT NULL,
  ingested_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_news_published ON news_items(published_at DESC);

CREATE TABLE economic_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  country      TEXT NOT NULL,
  impact       TEXT NOT NULL CHECK (impact IN ('high','medium','low')),
  actual       NUMERIC,
  forecast     NUMERIC,
  previous     NUMERIC,
  scheduled_at TIMESTAMPTZ NOT NULL,
  source       TEXT NOT NULL
);
CREATE INDEX idx_events_time ON economic_events(scheduled_at);

-- Briefings -------------------------------------------------------------------
CREATE TABLE briefings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  briefing_date     DATE NOT NULL,
  kind              TEXT NOT NULL DEFAULT 'morning' CHECK (kind IN ('morning','intraday','eod')),
  status            TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','generating','ready','failed','delivered')),
  risk_sentiment    TEXT CHECK (risk_sentiment IN ('risk_on','risk_off','mixed')),
  risk_breakdown    JSONB,
  analysis_snapshot JSONB,
  model             TEXT,
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, briefing_date, kind)
);
CREATE INDEX idx_briefings_user_date ON briefings(user_id, briefing_date DESC);

CREATE TABLE briefing_sections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  section_no  INT NOT NULL,
  key         TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  citations   JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (briefing_id, section_no)
);

CREATE TABLE price_moves (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id  UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  asset_id     UUID NOT NULL REFERENCES assets(id),
  change_abs   NUMERIC NOT NULL,
  change_pct   NUMERIC NOT NULL,
  zscore       NUMERIC NOT NULL,
  significant  BOOLEAN NOT NULL,
  direction    TEXT NOT NULL CHECK (direction IN ('up','down','flat'))
);

CREATE TABLE scenarios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id  UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('bull','bear','chop')),
  thesis       TEXT NOT NULL,
  conditions   JSONB NOT NULL DEFAULT '[]'::jsonb,
  invalidation JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE briefing_news (
  briefing_id  UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  news_item_id UUID NOT NULL REFERENCES news_items(id),
  PRIMARY KEY (briefing_id, news_item_id)
);

CREATE TABLE briefing_events (
  briefing_id       UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  economic_event_id UUID NOT NULL REFERENCES economic_events(id),
  PRIMARY KEY (briefing_id, economic_event_id)
);

-- User-owned lists ------------------------------------------------------------
CREATE TABLE watchlist_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_id   UUID NOT NULL REFERENCES assets(id),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset_id)
);

CREATE TABLE notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  briefing_id UUID REFERENCES briefings(id) ON DELETE SET NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deliveries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL,
  status      TEXT NOT NULL,
  error       TEXT,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed: covered asset universe + default single user --------------------------
INSERT INTO assets (symbol, display_name, asset_class, quote_currency) VALUES
  ('EURUSD','EUR/USD','fx','USD'),
  ('GBPUSD','GBP/USD','fx','USD'),
  ('USDJPY','USD/JPY','fx','JPY'),
  ('DXY','US Dollar Index','fx','USD'),
  ('XAUUSD','Gold','commodity','USD'),
  ('WTI','Crude Oil (WTI)','commodity','USD'),
  ('NAS100','Nasdaq 100','index','USD'),
  ('SPX','S&P 500','index','USD'),
  ('DJI','Dow Jones','index','USD'),
  ('DAX','DAX 40','index','EUR'),
  ('BTCUSD','Bitcoin','crypto','USD'),
  ('ETHUSD','Ethereum','crypto','USD');

INSERT INTO users (id, email, display_name)
VALUES ('00000000-0000-0000-0000-000000000001','operator@zardoshtios.local','Operator');

INSERT INTO user_preferences (user_id, priority_assets)
VALUES ('00000000-0000-0000-0000-000000000001', '["XAUUSD","NAS100"]'::jsonb);
