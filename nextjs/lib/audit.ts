import { getPool } from "./db";

export interface AuditEntry {
  id: string;
  event_time: string;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  space: string | null;
  diff_summary: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditListOptions {
  limit?: number;
  offset?: number;
  action?: string;
  space?: string;
  actorEmail?: string;
  from?: string;  // ISO date string
  to?: string;
}

export async function listAuditEntries(opts: AuditListOptions = {}): Promise<{ entries: AuditEntry[]; total: number }> {
  const pool = getPool();
  const { limit = 50, offset = 0, action, space, actorEmail, from, to } = opts;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (action) {
    conditions.push(`action = $${idx++}`);
    params.push(action);
  }
  if (space) {
    conditions.push(`space = $${idx++}`);
    params.push(space);
  }
  if (actorEmail) {
    conditions.push(`actor_email ILIKE $${idx++}`);
    params.push(`%${actorEmail}%`);
  }
  if (from) {
    conditions.push(`event_time >= $${idx++}`);
    params.push(from);
  }
  if (to) {
    conditions.push(`event_time <= $${idx++}`);
    params.push(to);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [dataRes, countRes] = await Promise.all([
    pool.query<AuditEntry>(
      `SELECT id, event_time, actor_email, action, entity_type, entity_id, entity_title,
              space, diff_summary, ip_address, metadata
         FROM audit_log ${where}
        ORDER BY event_time DESC
        LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM audit_log ${where}`,
      params
    ),
  ]);

  return {
    entries: dataRes.rows.map((r) => ({
      ...r,
      event_time: new Date(r.event_time).toISOString(),
    })),
    total: parseInt(countRes.rows[0].count, 10),
  };
}

export async function insertAuditEntry(
  entry: Omit<AuditEntry, "id" | "event_time">
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO audit_log
       (actor_email, action, entity_type, entity_id, entity_title, space, diff_summary, ip_address, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      entry.actor_email,
      entry.action,
      entry.entity_type,
      entry.entity_id,
      entry.entity_title,
      entry.space,
      entry.diff_summary,
      entry.ip_address,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
    ]
  );
}
