import { getDb } from './db';

export interface SearchResult {
  slug: string;
  title: string;
  snippet: string;
}

export function searchArticles(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const db = getDb();
  try {
    return db.prepare(`
      SELECT
        a.slug,
        a.title,
        snippet(articles_fts, 2, '<mark>', '</mark>', '…', 32) AS snippet
      FROM articles_fts
      JOIN articles a ON a.rowid = articles_fts.rowid
      WHERE articles_fts MATCH ?
      ORDER BY rank
      LIMIT 20
    `).all(query.trim().replace(/[^\w\s]/g, '') + '*') as SearchResult[];
  } catch {
    return [];
  }
}

export function getAllSlugs(): Set<string> {
  const db = getDb();
  const rows = db.prepare('SELECT slug FROM articles').all() as { slug: string }[];
  return new Set(rows.map((r) => r.slug));
}
