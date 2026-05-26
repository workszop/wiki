import { getDb } from '@/lib/db';
import Link from 'next/link';

type Props = { searchParams: Promise<{ sort?: string }> };

function extractPreview(body: string, maxLen = 160): string {
  return body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/^\s*#{1,6}\s+.*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*\|.*\|.*$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, maxLen)
    .replace(/\s+\S*$/, '…');
}

export default async function Home({ searchParams }: Props) {
  const { sort = 'date' } = await searchParams;

  const db = getDb();
  const articles = db
    .prepare('SELECT slug, title, body, updated_at FROM articles')
    .all() as { slug: string; title: string; body: string; updated_at: string }[];

  const sorted = [...articles].sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="wiki-page">
      <div className="wiki-toolbar">
        <h1 className="wiki-page-title" style={{ margin: 0 }}>
          All Articles
        </h1>
        <nav className="wiki-sort" aria-label="Sort articles">
          <Link
            href="/?sort=date"
            className={`wiki-sort__btn${sort !== 'title' ? ' wiki-sort__btn--active' : ''}`}
          >
            Recent
          </Link>
          <Link
            href="/?sort=title"
            className={`wiki-sort__btn${sort === 'title' ? ' wiki-sort__btn--active' : ''}`}
          >
            A → Z
          </Link>
        </nav>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--fg-3)' }}>
          <p style={{ marginBottom: 16 }}>No articles yet.</p>
          <Link href="/new" className="btn-primary">
            Create the first one →
          </Link>
        </div>
      ) : (
        <ul className="wiki-grid" style={{ listStyle: 'none', padding: 0 }}>
          {sorted.map((a) => (
            <li key={a.slug}>
              <Link href={`/wiki/${a.slug}`} className="wiki-card">
                <div className="wiki-card__title">{a.title}</div>
                <p className="wiki-card__preview">{extractPreview(a.body)}</p>
                <div className="wiki-card__footer">
                  <span className="wiki-card__date">
                    {new Date(a.updated_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="wiki-card__arrow">Read →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
