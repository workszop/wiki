import { getDb } from '@/lib/db';
import Link from 'next/link';

export default function Home() {
  const db = getDb();
  const articles = db
    .prepare('SELECT slug, title, updated_at FROM articles ORDER BY updated_at DESC')
    .all() as { slug: string; title: string; updated_at: string }[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Articles</h1>
      {articles.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">No articles yet.</p>
          <Link href="/new" className="text-blue-600 underline hover:text-blue-700">
            Create the first one →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 bg-white rounded-lg border border-gray-200">
          {articles.map((a) => (
            <li key={a.slug} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
              <Link
                href={`/wiki/${a.slug}`}
                className="text-blue-600 hover:underline font-medium flex-1"
              >
                {a.title}
              </Link>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(a.updated_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
