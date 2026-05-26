-- Granular audit log for page-level events (Wiki.js only logs auth + admin natively)
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  event_time  TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id    INTEGER,           -- Wiki.js users.id, NULL for system
  actor_email TEXT,
  action      TEXT NOT NULL,     -- e.g. 'page.create', 'page.update', 'page.delete', 'page.restore'
  entity_type TEXT NOT NULL,     -- 'page' | 'pageHistory' | 'user' | 'group'
  entity_id   TEXT,              -- page path or numeric ID
  entity_title TEXT,
  space       TEXT,              -- top-level space: Companies | Products | Contacts | Technologies
  diff_summary TEXT,             -- short human-readable description of what changed
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB
);

CREATE INDEX audit_log_event_time_idx   ON audit_log (event_time DESC);
CREATE INDEX audit_log_actor_id_idx     ON audit_log (actor_id);
CREATE INDEX audit_log_entity_id_idx    ON audit_log (entity_id);
CREATE INDEX audit_log_action_idx       ON audit_log (action);

-- Retention policy: keep 12 months (enforced by pg_cron or application cron)
-- DELETE FROM audit_log WHERE event_time < now() - interval '12 months';

-- Trigger function: fires after INSERT/UPDATE/DELETE on pages table
CREATE OR REPLACE FUNCTION trg_pages_audit() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (action, entity_type, entity_id, entity_title, space, diff_summary, metadata)
    VALUES (
      'page.create',
      'page',
      NEW.path::TEXT,
      NEW.title,
      split_part(NEW.path, '/', 1),
      'Page created',
      jsonb_build_object('localeCode', NEW."localeCode", 'isPublished', NEW."isPublished")
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (action, entity_type, entity_id, entity_title, space, diff_summary, metadata)
    VALUES (
      'page.update',
      'page',
      NEW.path::TEXT,
      NEW.title,
      split_part(NEW.path, '/', 1),
      'Page updated',
      jsonb_build_object('isPublished', NEW."isPublished", 'publishState', NEW."publishState")
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (action, entity_type, entity_id, entity_title, space, diff_summary, metadata)
    VALUES (
      'page.delete',
      'page',
      OLD.path::TEXT,
      OLD.title,
      split_part(OLD.path, '/', 1),
      'Page deleted',
      jsonb_build_object('localeCode', OLD."localeCode")
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach to Wiki.js pages table (created by Wiki.js on first run)
-- Using DO block to defer creation until table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pages') THEN
    CREATE TRIGGER pages_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON pages
      FOR EACH ROW EXECUTE FUNCTION trg_pages_audit();
  END IF;
END;
$$;
