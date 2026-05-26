import { getDb } from '@/lib/db';
import Link from 'next/link';

export default function Home() {
  const db = getDb();
  const articles = db
    .prepare('SELECT slug, title, updated_at FROM articles ORDER BY updated_at DESC')
    .all() as { slug: string; title: string; updated_at: string }[];

  return (
    <div className="wiki-page">
      <h1 className="wiki-page-title">All Articles</h1>

      {articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--fg-3)' }}>
          <p style={{ marginBottom: 16 }}>No articles yet.</p>
          <Link href="/new" className="btn-primary">
            Create the first one →
          </Link>
        </div>
      ) : (
        <ul className="wiki-article-list">
          {articles.map((a) => (
            <li key={a.slug} className="wiki-article-item">
              <Link href={`/wiki/${a.slug}`} className="wiki-article-link">
                {a.title}
              </Link>
              <span className="wiki-article-date">
                {new Date(a.updated_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
