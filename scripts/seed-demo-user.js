/**
 * Idempotent demo-user seeder for Wiki.js.
 *
 * Runs as a one-shot Docker Compose service after Wiki.js boots. Polls the
 * Postgres `users` table until Wiki.js has initialized its schema, then
 * upserts a local-strategy demo account into the configured group.
 */

const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const {
  DB_HOST = "db",
  DB_PORT = "5432",
  DB_NAME = "wiki",
  DB_USER = "wiki",
  DB_PASSWORD,
  DEMO_EMAIL = "demo@local",
  DEMO_PASSWORD = "demo",
  DEMO_NAME = "Demo User",
  DEMO_GROUP = "Readers",
} = process.env;

const MAX_WAIT_SECONDS = 180;
const POLL_INTERVAL_MS = 3000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForSchema(client) {
  const start = Date.now();
  while ((Date.now() - start) / 1000 < MAX_WAIT_SECONDS) {
    const { rows } = await client.query(
      `SELECT to_regclass('public.users') AS users,
              to_regclass('public.groups') AS groups,
              to_regclass('public."userGroups"') AS user_groups`
    );
    if (rows[0].users && rows[0].groups && rows[0].user_groups) return;
    process.stdout.write(".");
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error("Timed out waiting for Wiki.js schema");
}

async function ensureGroup(client, name) {
  const existing = await client.query(
    "SELECT id FROM groups WHERE name = $1 LIMIT 1",
    [name]
  );
  if (existing.rows.length) return existing.rows[0].id;

  const created = await client.query(
    `INSERT INTO groups (name, permissions, "pageRules", "isSystem", "createdAt", "updatedAt")
     VALUES ($1, '["read:pages","read:assets","read:comments"]'::jsonb, '[]'::jsonb, false, now(), now())
     RETURNING id`,
    [name]
  );
  return created.rows[0].id;
}

async function ensureUser(client, hash) {
  const existing = await client.query(
    `SELECT id FROM users
     WHERE email = $1 AND "providerKey" = 'local'
     LIMIT 1`,
    [DEMO_EMAIL]
  );
  if (existing.rows.length) {
    return { id: existing.rows[0].id, created: false };
  }
  const inserted = await client.query(
    `INSERT INTO users
       (email, name, "providerKey", "providerId", password,
        "tfaIsActive", "isSystem", "isActive", "isVerified", "mustChangePwd",
        "createdAt", "updatedAt", locale, "jobTitle", timezone, "dateFormat", appearance)
     VALUES
       ($1, $2, 'local', NULL, $3,
        false, false, true, true, false,
        now(), now(), 'pl', '', 'Europe/Warsaw', '', '')
     RETURNING id`,
    [DEMO_EMAIL, DEMO_NAME, hash]
  );
  return { id: inserted.rows[0].id, created: true };
}

async function ensureMembership(client, userId, groupId) {
  await client.query(
    `INSERT INTO "userGroups" ("userId", "groupId", "createdAt", "updatedAt")
     VALUES ($1, $2, now(), now())
     ON CONFLICT DO NOTHING`,
    [userId, groupId]
  );
}

async function main() {
  if (!DB_PASSWORD) {
    console.error("DB_PASSWORD not set");
    process.exit(1);
  }

  const client = new Client({
    host: DB_HOST,
    port: Number(DB_PORT),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
  });
  await client.connect();

  try {
    console.log("Waiting for Wiki.js schema");
    await waitForSchema(client);
    console.log("\nSchema ready");

    const hash = bcrypt.hashSync(DEMO_PASSWORD, 12);
    const groupId = await ensureGroup(client, DEMO_GROUP);
    const { id: userId, created } = await ensureUser(client, hash);
    await ensureMembership(client, userId, groupId);

    console.log(
      created
        ? `Demo user seeded: ${DEMO_EMAIL} (id=${userId}) in group "${DEMO_GROUP}" (id=${groupId})`
        : `Demo user already exists: ${DEMO_EMAIL} (id=${userId}) — membership ensured in "${DEMO_GROUP}"`
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("seed-demo-user failed:", err.message);
  process.exit(1);
});
