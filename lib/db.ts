import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'wiki.db');

// Global singleton — survives Next.js hot-reload in dev
const g = global as typeof globalThis & { _wikiDb?: Database.Database };

export function getDb(): Database.Database {
  if (!g._wikiDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    g._wikiDb = db;
  }
  return g._wikiDb;
}

function initSchema(db: Database.Database) {
  // Add category column if it doesn't exist (idempotent migration)
  const cols = (db.prepare('PRAGMA table_info(articles)').all() as any[]).map((c: any) => c.name);
  if (!cols.includes('category')) {
    db.exec("ALTER TABLE articles ADD COLUMN category TEXT NOT NULL DEFAULT 'General'");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      slug        TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      body        TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
      slug UNINDEXED,
      title,
      body,
      content='articles',
      content_rowid='rowid'
    );

    CREATE TABLE IF NOT EXISTS article_revisions (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      slug      TEXT NOT NULL REFERENCES articles(slug) ON DELETE CASCADE,
      body      TEXT NOT NULL,
      saved_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
      INSERT INTO articles_fts(rowid, slug, title, body)
      VALUES (new.rowid, new.slug, new.title, new.body);
    END;

    CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
      INSERT INTO articles_fts(articles_fts, rowid, slug, title, body)
      VALUES ('delete', old.rowid, old.slug, old.title, old.body);
    END;

    CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
      INSERT INTO articles_fts(articles_fts, rowid, slug, title, body)
      VALUES ('delete', old.rowid, old.slug, old.title, old.body);
      INSERT INTO articles_fts(rowid, slug, title, body)
      VALUES (new.rowid, new.slug, new.title, new.body);
    END;
  `);
}

export interface Article {
  slug: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Revision {
  id: number;
  slug: string;
  body: string;
  saved_at: string;
}
