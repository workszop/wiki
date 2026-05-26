import { getDb } from '@/lib/db';
import Editor from '@/components/Editor';
import Link from 'next/link';
import type { Metadata } from 'next';

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

  if (!article) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>Article not found.</p>
        <Link href="/" className="text-blue-600 underline mt-2 inline-block">
          ← Home
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-500">
        <Link href={`/wiki/${slug}`} className="hover:text-gray-700">
          ← {article.title}
        </Link>
        <span className="mx-2">·</span>
        <span>Editing</span>
      </div>
      <Editor slug={article.slug} initialTitle={article.title} initialBody={article.body} />
    </div>
  );
}
