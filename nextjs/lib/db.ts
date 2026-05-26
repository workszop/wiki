import { Pool } from "pg";

// Single shared pool — safe in Next.js server context (single Node process per container)
let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}
