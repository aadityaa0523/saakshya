CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL,
  language text NOT NULL,
  story text NOT NULL,
  fields jsonb NOT NULL,
  laws jsonb NOT NULL DEFAULT '[]',
  draft text,
  draft_translated text,
  priority text NOT NULL,
  urgency text NOT NULL,
  channel text NOT NULL DEFAULT 'web',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Hash-chained record of everything that happens to a report.
CREATE TABLE IF NOT EXISTS report_events (
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  seq int NOT NULL,
  at text NOT NULL,
  event jsonb NOT NULL,
  previous text NOT NULL,
  hash text NOT NULL,
  PRIMARY KEY (report_id, seq)
);

CREATE TABLE IF NOT EXISTS law_sections (
  id text PRIMARY KEY,
  act text NOT NULL,
  section text NOT NULL,
  text text NOT NULL,
  source_url text NOT NULL,
  -- A match in the section's title counts for far more than one in its body
  search tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(substring(text from '^[^—–]*'), '')), 'A') || setweight(to_tsvector('english', text), 'D')
  ) STORED
);
CREATE INDEX IF NOT EXISTS law_sections_search ON law_sections USING gin (search);

CREATE TABLE IF NOT EXISTS evidence (
  id uuid PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  name text NOT NULL,
  mime text NOT NULL,
  size int NOT NULL,
  sha256 text NOT NULL,
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evidence_report ON evidence (report_id);

-- Holds hashed client addresses only, and rows older than a minute are removed on each check.
CREATE TABLE IF NOT EXISTS rate_hits (
  key text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_hits_key_at ON rate_hits (key, at);

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_hits ENABLE ROW LEVEL SECURITY;

-- Supabase exposes the public schema over its API. With no policies, only the server's own
-- database connection can reach these tables.
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE law_sections ENABLE ROW LEVEL SECURITY;
