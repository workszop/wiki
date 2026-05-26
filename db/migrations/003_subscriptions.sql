-- Article subscriptions for daily digest notifications
CREATE TABLE IF NOT EXISTS subscriptions (
  id           BIGSERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id      INTEGER NOT NULL,         -- Wiki.js users.id
  user_email   TEXT NOT NULL,
  page_id      INTEGER,                  -- NULL = subscribe to entire space
  page_path    TEXT,
  space        TEXT,                     -- top-level space name; set when page_id IS NULL
  last_digest_at TIMESTAMPTZ,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT unique_subscription UNIQUE (user_id, page_id, space)
);

CREATE INDEX subscriptions_user_id_idx  ON subscriptions (user_id);
CREATE INDEX subscriptions_page_id_idx  ON subscriptions (page_id) WHERE page_id IS NOT NULL;
CREATE INDEX subscriptions_space_idx    ON subscriptions (space)   WHERE space IS NOT NULL;
CREATE INDEX subscriptions_active_idx   ON subscriptions (active, last_digest_at);

-- Digest queue: pages modified since last digest, per subscription
CREATE VIEW v_pending_digest AS
SELECT
  s.id           AS subscription_id,
  s.user_email,
  s.user_id,
  s.page_id,
  s.space,
  s.last_digest_at
FROM subscriptions s
WHERE s.active = TRUE
  AND EXISTS (
    SELECT 1 FROM audit_log al
    WHERE al.action IN ('page.create', 'page.update')
      AND (s.page_id IS NULL OR al.entity_id = (
            SELECT path FROM pages WHERE id = s.page_id LIMIT 1))
      AND (s.space   IS NULL OR al.space = s.space)
      AND al.event_time > COALESCE(s.last_digest_at, now() - interval '1 day')
  );
