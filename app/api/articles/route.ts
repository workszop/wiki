import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { slugify } from '@/lib/render';

export async function POST(req: NextRequest) {
  const { title, body } = await req.json();

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
  }

  const slug = slugify(title.trim());
  if (!slug) {
    return NextResponse.json({ error: 'Title produces an empty slug' }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare('SELECT slug FROM articles WHERE slug = ?').get(slug);
  if (existing) {
    return NextResponse.json(
      { error: `An article with the slug "${slug}" already exists` },
      { status: 409 },
    );
  }

  db.prepare('INSERT INTO articles (slug, title, body) VALUES (?, ?, ?)').run(
    slug,
    title.trim(),
    body,
  );

  return NextResponse.json({ slug }, { status: 201 });
}
