import { getDb } from '@/lib/db';
import Link from 'next/link';

type Props = { searchParams: Promise<{ sort?: string; cat?: string }> };

const CARD_COLORS = [
  '#C41E54', '#7030A0', '#00A37A', '#4F46E5',
  '#FF4D9A', '#FFC107', '#FF20A1', '#4F1F75',
];

// Fixed display order for categories in the sidebar
const CATEGORY_ORDER = [
  'Foundations',
  'Retrieval & RAG',
  'Agents & Apps',
  'Practice',
  'Wiki Docs',
  'General',
];

function cardColor(title: string): string {
  return CARD_COLORS[title.charCodeAt(0) % CARD_COLORS.length];
}

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
  const { sort = 'date', cat } = await searchParams;

  const db = getDb();
  const all = db
    .prepare('SELECT slug, title, body, category, updated_at FROM articles')
    .all() as { slug: string; title: string; body: string; category: string; updated_at: string }[];

  // Build category counts
  const counts: Record<string, number> = {};
  for (const a of all) {
    counts[a.category] = (counts[a.category] ?? 0) + 1;
  }

  // Categories sorted by fixed order, then alphabetically for unknowns
  const categories = [
    ...CATEGORY_ORDER.filter((c) => counts[c] !== undefined),
    ...Object.keys(counts).filter((c) => !CATEGORY_ORDER.includes(c)).sort(),
  ];

  // Filter + sort
  const filtered = all
    .filter((a) => !cat || a.category === cat)
    .sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  // Helpers to build href preserving other params
  function sortHref(s: string) {
    const p = new URLSearchParams();
    p.set('sort', s);
    if (cat) p.set('cat', cat);
    return `/?${p}`;
  }
  function catHref(c?: string) {
    const p = new URLSearchParams();
    if (sort !== 'date') p.set('sort', sort);
    if (c) p.set('cat', c);
    return p.toString() ? `/?${p}` : '/';
  }

  return (
    <div className="wiki-home-wrapper">
      <div className="wiki-toolbar">
        <h1 className="wiki-page-title" style={{ margin: 0 }}>
          {cat ? cat : 'All Articles'}
          {cat && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)', color: 'var(--fg-4)', marginLeft: 12, fontWeight: 400 }}>
              {filtered.length} article{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </h1>
        <nav className="wiki-sort" aria-label="Sort articles">
          <Link href={sortHref('date')} className={`wiki-sort__btn${sort !== 'title' ? ' wiki-sort__btn--active' : ''}`}>
            Recent
          </Link>
          <Link href={sortHref('title')} className={`wiki-sort__btn${sort === 'title' ? ' wiki-sort__btn--active' : ''}`}>
            A → Z
          </Link>
        </nav>
      </div>

      <div className="wiki-home-layout">
        {/* ── Articles grid ── */}
        <div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--fg-3)' }}>
              <p style={{ marginBottom: 16 }}>No articles in this category yet.</p>
              <Link href={catHref()} style={{ color: 'var(--quantica-pink)', textDecoration: 'underline' }}>
                View all articles
              </Link>
            </div>
          ) : (
            <ul className="wiki-grid" style={{ listStyle: 'none', padding: 0 }}>
              {filtered.map((a, i) => {
                const color = cardColor(a.title);
                const num = String(i + 1).padStart(2, '0');
                const date = new Date(a.updated_at).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                });

                if (i === 0) {
                  return (
                    <li key={a.slug}>
                      <Link href={`/wiki/${a.slug}`} className="wiki-card wiki-card--hero">
                        <div className="wiki-card__body">
                          <span className="wiki-card__eyebrow">{a.category} · {date}</span>
                          <div className="wiki-card__title">{a.title}</div>
                          <p className="wiki-card__preview">{extractPreview(a.body, 240)}</p>
                          <div className="wiki-card__footer">
                            <span className="wiki-card__date">{num}</span>
                            <span className="wiki-card__arrow">Read article →</span>
                          </div>
                        </div>
                        <div className="wiki-card__hero-num" aria-hidden="true">{num}</div>
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={a.slug}>
                    <Link
                      href={`/wiki/${a.slug}`}
                      className="wiki-card"
                      style={{ '--card-accent': color } as React.CSSProperties}
                    >
                      <span className="wiki-card__index" aria-hidden="true">{num}</span>
                      <div className="wiki-card__title">{a.title}</div>
                      <p className="wiki-card__preview">{extractPreview(a.body)}</p>
                      <div className="wiki-card__footer">
                        <span className="wiki-card__date">{date}</span>
                        <span className="wiki-card__arrow">Read →</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Category sidebar ── */}
        <aside className="wiki-sidebar" aria-label="Filter by category">
          <div className="wiki-sidebar__header">Categories</div>
          <ul className="wiki-sidebar__list">
            <li>
              <Link href={catHref()} className={`wiki-sidebar__link${!cat ? ' wiki-sidebar__link--active' : ''}`}>
                <span className="wiki-sidebar__label">All Articles</span>
                <span className="wiki-sidebar__count">{all.length}</span>
              </Link>
            </li>
            <li className="wiki-sidebar__divider" role="separator" />
            {categories.map((c) => (
              <li key={c}>
                <Link href={catHref(c)} className={`wiki-sidebar__link${cat === c ? ' wiki-sidebar__link--active' : ''}`}>
                  <span className="wiki-sidebar__label">{c}</span>
                  <span className="wiki-sidebar__count">{counts[c]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
