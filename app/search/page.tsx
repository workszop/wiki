import { searchArticles } from '@/lib/search';
import Link from 'next/link';
import type { Metadata } from 'next';

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `"${q}" — Search` : 'Search' };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const results = q ? searchArticles(q) : [];

  return (
    <div className="wiki-page">
      <h1 className="wiki-page-title">
        {q ? (
          <>
            Results for{' '}
            <span style={{ color: 'var(--quantica-pink)' }}>&ldquo;{q}&rdquo;</span>
          </>
        ) : (
          'Search'
        )}
      </h1>

      {q && results.length === 0 && (
        <div style={{ color: 'var(--fg-3)' }}>
          <p style={{ marginBottom: 12 }}>No articles found.</p>
          <Link
            href={`/new?title=${encodeURIComponent(q)}`}
            className="btn-primary"
            style={{ display: 'inline-flex' }}
          >
            Create &ldquo;{q}&rdquo; →
          </Link>
        </div>
      )}

      {results.length > 0 && (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {results.map((r) => (
            <li key={r.slug}>
              <Link href={`/wiki/${r.slug}`} className="search-result-title">
                {r.title}
              </Link>
              <p
                className="search-result-snippet"
                dangerouslySetInnerHTML={{ __html: r.snippet }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
