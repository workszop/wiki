import { getDb } from '@/lib/db';
import { renderMarkdown } from '@/lib/render';
import { getAllSlugs } from '@/lib/search';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { TocItem } from '@/lib/render';

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
      <div className="wiki-page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h2)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--fg-1)',
            marginBottom: 12,
          }}
        >
          Article not found
        </h1>
        <p style={{ color: 'var(--fg-3)', marginBottom: 24 }}>
          <code
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--magenta-tint)',
              color: 'var(--quantica-pink)',
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            {slug}
          </code>{' '}
          doesn&apos;t exist yet.
        </p>
        <Link
          href={`/new?title=${encodeURIComponent(slug.replace(/-/g, ' '))}`}
          className="btn-primary"
        >
          Create this article →
        </Link>
      </div>
    );
  }

  const slugs = getAllSlugs();
  // Strip a leading # h1 that duplicates the page title
  const body = article.body.replace(/^\s*#\s+[^\n]*\n?/, '');
  const { html, toc } = await renderMarkdown(body, slugs);
  const hasToc = toc.length >= 3;

  return (
    <>
      {hasToc && <TocSidebar toc={toc} />}
      <article className={`article${hasToc ? ' article--with-toc' : ''}`}>
        <div className="article-header">
          <h1 className="article-title">{article.title}</h1>
          <div className="article-actions">
            <Link href={`/wiki/${slug}/history`} className="article-action-link">
              History
            </Link>
            <Link href={`/wiki/${slug}/edit`} className="article-action-link">
              Edit
            </Link>
          </div>
        </div>

        <div className="article__body" dangerouslySetInnerHTML={{ __html: html }} />

        <p className="article-meta">
          Last updated: {new Date(article.updated_at).toLocaleString()}
        </p>
      </article>
    </>
  );
}

function TocSidebar({ toc }: { toc: TocItem[] }) {
  return (
    <nav className="toc" aria-label="Table of contents">
      <div className="toc__label type-eyebrow">Contents</div>
      <ol className="toc__list">
        {toc.map((item, i) => (
          <li
            key={item.id}
            className={`toc__item toc__item--h${item.level}`}
          >
            <a href={`#${item.id}`} className="toc__link">
              <span className="toc__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="toc__text">{item.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
