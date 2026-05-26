import { getDb } from '@/lib/db';
import Link from 'next/link';

type Props = { searchParams: Promise<{ sort?: string }> };

// Deterministic color per article from Quantica palette
const LOGO_COLORS = [
  '#C41E54', // quantica-pink
  '#7030A0', // violet-primary
  '#00A37A', // success green
  '#4F46E5', // indigo
  '#FF4D9A', // rose-pink
  '#FFC107', // amber
];

function ArticleLogo({ title }: { title: string }) {
  const color = LOGO_COLORS[title.charCodeAt(0) % LOGO_COLORS.length];
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer wireframe square */}
      <rect x="1" y="1" width="42" height="42" rx="10" stroke={color} strokeWidth="1.5" />
      {/* Inner corner marks — wireframe aesthetic */}
      <path d="M8 1.5 L1.5 1.5 L1.5 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M36 1.5 L42.5 1.5 L42.5 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M8 42.5 L1.5 42.5 L1.5 36" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M36 42.5 L42.5 42.5 L42.5 36" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
      {/* Monogram */}
      <text
        x="22"
        y="28"
        textAnchor="middle"
        fontSize={initials.length > 1 ? '15' : '18'}
        fontWeight="700"
        fontFamily="Satoshi, Inter, system-ui, sans-serif"
        fill={color}
        letterSpacing="-0.5"
      >
        {initials}
      </text>
    </svg>
  );
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
  const { sort = 'date' } = await searchParams;

  const db = getDb();
  const articles = db
    .prepare('SELECT slug, title, body, updated_at FROM articles')
    .all() as { slug: string; title: string; body: string; updated_at: string }[];

  const sorted = [...articles].sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="wiki-page">
      <div className="wiki-toolbar">
        <h1 className="wiki-page-title" style={{ margin: 0 }}>
          All Articles
        </h1>
        <nav className="wiki-sort" aria-label="Sort articles">
          <Link
            href="/?sort=date"
            className={`wiki-sort__btn${sort !== 'title' ? ' wiki-sort__btn--active' : ''}`}
          >
            Recent
          </Link>
          <Link
            href="/?sort=title"
            className={`wiki-sort__btn${sort === 'title' ? ' wiki-sort__btn--active' : ''}`}
          >
            A → Z
          </Link>
        </nav>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--fg-3)' }}>
          <p style={{ marginBottom: 16 }}>No articles yet.</p>
          <Link href="/new" className="btn-primary">
            Create the first one →
          </Link>
        </div>
      ) : (
        <ul className="wiki-grid" style={{ listStyle: 'none', padding: 0 }}>
          {sorted.map((a) => (
            <li key={a.slug}>
              <Link href={`/wiki/${a.slug}`} className="wiki-card">
                <div className="wiki-card__logo">
                  <ArticleLogo title={a.title} />
                </div>
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
