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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {q ? (
          <>
            Search results for{' '}
            <span className="text-blue-600">&ldquo;{q}&rdquo;</span>
          </>
        ) : (
          'Search'
        )}
      </h1>

      {q && results.length === 0 && (
        <div className="text-gray-500">
          <p className="mb-3">No articles found.</p>
          <Link
            href={`/new?title=${encodeURIComponent(q)}`}
            className="text-blue-600 underline hover:text-blue-700"
          >
            Create an article titled &ldquo;{q}&rdquo; →
          </Link>
        </div>
      )}

      {results.length > 0 && (
        <ul className="space-y-5">
          {results.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/wiki/${r.slug}`}
                className="text-blue-600 hover:underline font-semibold text-lg"
              >
                {r.title}
              </Link>
              <p
                className="text-sm text-gray-600 mt-0.5 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: r.snippet }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
