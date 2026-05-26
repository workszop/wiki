import { getDb, type Revision } from '@/lib/db';
import DiffView from '@/components/DiffView';
import RestoreButton from '@/components/RestoreButton';
import Link from 'next/link';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ rev?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const row = db.prepare('SELECT title FROM articles WHERE slug = ?').get(slug) as
    | { title: string }
    | undefined;
  return { title: row ? `History: ${row.title}` : 'History' };
}

export default async function HistoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { rev } = await searchParams;
  const db = getDb();

  const article = db.prepare('SELECT slug, title, body FROM articles WHERE slug = ?').get(slug) as
    | { slug: string; title: string; body: string }
    | undefined;

  if (!article) {
    return (
      <div className="wiki-page" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-3)', marginBottom: 12 }}>Article not found.</p>
        <Link href="/" className="btn-secondary" style={{ display: 'inline-flex' }}>
          ← Home
        </Link>
      </div>
    );
  }

  const revisions = db
    .prepare('SELECT * FROM article_revisions WHERE slug = ? ORDER BY saved_at DESC')
    .all(slug) as Revision[];

  const selected = rev ? revisions.find((r) => r.id === Number(rev)) : null;

  return (
    <div className="wiki-page">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-7)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-caption)',
          color: 'var(--fg-3)',
        }}
      >
        <Link
          href={`/wiki/${slug}`}
          style={{ color: 'var(--quantica-pink)', textDecoration: 'none', fontWeight: 500 }}
        >
          ← {article.title}
        </Link>
        <span>/</span>
        <span>History</span>
      </div>

      {selected && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-h3)',
              fontWeight: 'var(--fw-medium)',
              color: 'var(--fg-1)',
              marginBottom: 4,
            }}
          >
            Revision from {new Date(selected.saved_at).toLocaleString()} vs. current
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-caption)',
              color: 'var(--fg-4)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Red = old version · Green = current version
          </p>
          <DiffView oldText={selected.body} newText={article.body} />
        </div>
      )}

      <h2
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-h3)',
          fontWeight: 'var(--fw-medium)',
          color: 'var(--fg-1)',
          marginBottom: 'var(--space-3)',
        }}
      >
        Revisions
      </h2>
      {revisions.length === 0 ? (
        <p style={{ color: 'var(--fg-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)' }}>
          No previous revisions yet.
        </p>
      ) : (
        <ul className="wiki-article-list">
          {revisions.map((r) => (
            <li key={r.id} className="wiki-article-item" style={{ gap: 'var(--space-5)' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--fs-caption)',
                  color: 'var(--fg-2)',
                  flex: 1,
                }}
              >
                {new Date(r.saved_at).toLocaleString()}
              </span>
              <Link
                href={`/wiki/${slug}/history?rev=${r.id}`}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--fs-caption)',
                  color: 'var(--quantica-pink)',
                  textDecoration: 'none',
                  fontWeight: Number(rev) === r.id ? 700 : 400,
                }}
              >
                {Number(rev) === r.id ? 'Viewing diff' : 'View diff'}
              </Link>
              <RestoreButton slug={slug} revisionId={r.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
