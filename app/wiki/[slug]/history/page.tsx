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
      <div className="text-center py-20 text-gray-500">
        Article not found.{' '}
        <Link href="/" className="text-blue-600 underline">
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
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href={`/wiki/${slug}`} className="text-blue-600 hover:underline font-medium">
          ← {article.title}
        </Link>
        <span>/</span>
        <span>History</span>
      </div>

      {selected && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-1">
            Revision from {new Date(selected.saved_at).toLocaleString()} vs. current
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Red = old version · Green = current version
          </p>
          <DiffView oldText={selected.body} newText={article.body} />
        </div>
      )}

      <h2 className="font-semibold text-gray-900 mb-3">Revisions</h2>
      {revisions.length === 0 ? (
        <p className="text-gray-500 text-sm">No previous revisions yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-lg">
          {revisions.map((r) => (
            <li key={r.id} className="px-4 py-3 flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {new Date(r.saved_at).toLocaleString()}
              </span>
              <Link
                href={`/wiki/${slug}/history?rev=${r.id}`}
                className={`text-sm text-blue-600 hover:underline ${
                  Number(rev) === r.id ? 'font-semibold' : ''
                }`}
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
