import { getDb } from '@/lib/db';
import { renderMarkdown } from '@/lib/render';
import { getAllSlugs } from '@/lib/search';
import Link from 'next/link';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const row = db.prepare('SELECT title FROM articles WHERE slug = ?').get(slug) as
    | { title: string }
    | undefined;
  return { title: row?.title ?? 'Not found' };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const article = db.prepare('SELECT * FROM articles WHERE slug = ?').get(slug) as
    | { slug: string; title: string; body: string; updated_at: string }
    | undefined;

  if (!article) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Article not found</h1>
        <p className="text-gray-500 mb-6">
          <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm">{slug}</code>{' '}
          doesn&apos;t exist yet.
        </p>
        <Link
          href={`/new?title=${encodeURIComponent(slug.replace(/-/g, ' '))}`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Create this article →
        </Link>
      </div>
    );
  }

  const slugs = getAllSlugs();
  const html = await renderMarkdown(article.body, slugs);

  return (
    <article>
      <div className="flex items-start justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/wiki/${slug}/history`}
            className="text-sm border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-600"
          >
            History
          </Link>
          <Link
            href={`/wiki/${slug}/edit`}
            className="text-sm border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-600"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="wiki-body" dangerouslySetInnerHTML={{ __html: html }} />

      <p className="mt-10 pt-4 border-t border-gray-100 text-xs text-gray-400">
        Last updated: {new Date(article.updated_at).toLocaleString()}
      </p>
    </article>
  );
}
