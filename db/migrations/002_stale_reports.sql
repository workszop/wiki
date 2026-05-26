-- "Report as stale" submissions from users
CREATE TABLE IF NOT EXISTS stale_reports (
  id           BIGSERIAL PRIMARY KEY,
  reported_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  page_id      INTEGER NOT NULL,     -- Wiki.js pages.id
  page_path    TEXT NOT NULL,
  page_title   TEXT,
  reporter_id  INTEGER,              -- Wiki.js users.id, NULL if anonymous
  reporter_email TEXT,
  reason       TEXT,                 -- free-text from the form
  status       TEXT NOT NULL DEFAULT 'open'   -- open | in_progress | resolved | dismissed
                 CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),
  resolved_at  TIMESTAMPTZ,
  resolved_by  INTEGER,
  resolution_note TEXT,
  notified_author BOOLEAN NOT NULL DEFAULT FALSE,
  metadata     JSONB
);

CREATE INDEX stale_reports_page_id_idx  ON stale_reports (page_id);
CREATE INDEX stale_reports_status_idx   ON stale_reports (status);
CREATE INDEX stale_reports_reported_at_idx ON stale_reports (reported_at DESC);
