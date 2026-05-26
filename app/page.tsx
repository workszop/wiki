import { getDb } from '@/lib/db';
import Link from 'next/link';

function extractPreview(body: string, maxLen = 160): string {
  return body
    .replace(/```[\s\S]*?```/g, '')       // remove code blocks
    .replace(/`[^`]+`/g, '')              // remove inline code
    .replace(/^\s*#{1,6}\s+.*/gm, '')     // remove headings
    .replace(/^\s*[-*]\s+/gm, '')         // remove list bullets
    .replace(/^\s*\d+\.\s+/gm, '')        // remove numbered list markers
    .replace(/^\s*\|.*\|.*$/gm, '')        // remove table rows
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → text
    .replace(/\[\[([^\]]+)\]\]/g, '$1')   // wiki-links → text
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // bold/italic → text
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, maxLen)
    .replace(/\s+\S*$/, '…');             // clean cut at word boundary
}

export default function Home() {
  const db = getDb();
  const articles = db
    .prepare('SELECT slug, title, body, updated_at FROM articles ORDER BY updated_at DESC')
    .all() as { slug: string; title: string; body: string; updated_at: string }[];

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
        <ul className="wiki-grid" style={{ listStyle: 'none', padding: 0 }}>
          {articles.map((a) => (
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
