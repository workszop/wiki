import { getDb } from '@/lib/db';
import Editor from '@/components/Editor';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const row = db.prepare('SELECT title FROM articles WHERE slug = ?').get(slug) as
    | { title: string }
    | undefined;
  return { title: row ? `Edit: ${row.title}` : 'Not found' };
}

export default async function EditPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const article = db.prepare('SELECT slug, title, body FROM articles WHERE slug = ?').get(slug) as
    | { slug: string; title: string; body: string }
    | undefined;

  if (!article) notFound();

  return (
    <div className="wiki-page">
      <div
        style={{
          marginBottom: 'var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-caption)',
          color: 'var(--fg-3)',
        }}
      >
        <Link
          href={`/wiki/${slug}`}
          style={{ color: 'var(--quantica-pink)', textDecoration: 'none' }}
        >
          ← {article.title}
        </Link>
        <span>·</span>
        <span>Editing</span>
      </div>
      <Editor slug={article.slug} initialTitle={article.title} initialBody={article.body} />
    </div>
  );
}
