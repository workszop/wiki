import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type Ctx = { params: Promise<{ slug: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const { title, body } = await req.json();

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare('SELECT body FROM articles WHERE slug = ?').get(slug) as
    | { body: string }
    | undefined;

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Snapshot current body as a revision before overwriting
  db.prepare('INSERT INTO article_revisions (slug, body) VALUES (?, ?)').run(
    slug,
    existing.body,
  );

  db.prepare(
    "UPDATE articles SET title = ?, body = ?, updated_at = datetime('now') WHERE slug = ?",
  ).run(title.trim(), body, slug);

  return NextResponse.json({ slug });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const db = getDb();
  db.prepare('DELETE FROM articles WHERE slug = ?').run(slug);
  return NextResponse.json({ ok: true });
}
