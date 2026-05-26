import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const { revisionId } = await req.json();
  const db = getDb();

  const revision = db
    .prepare('SELECT body FROM article_revisions WHERE id = ? AND slug = ?')
    .get(revisionId, slug) as { body: string } | undefined;

  if (!revision) {
    return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
  }

  const current = db.prepare('SELECT body FROM articles WHERE slug = ?').get(slug) as
    | { body: string }
    | undefined;

  if (!current) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  // Save current body as a revision before overwriting
  db.prepare('INSERT INTO article_revisions (slug, body) VALUES (?, ?)').run(slug, current.body);

  db.prepare("UPDATE articles SET body = ?, updated_at = datetime('now') WHERE slug = ?").run(
    revision.body,
    slug,
  );

  return NextResponse.json({ ok: true });
}
