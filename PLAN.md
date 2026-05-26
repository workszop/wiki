# Plan — Custom Wiki (built from scratch)

## Goal

A lightweight, self-hosted wiki built from scratch. Articles are written in Markdown, rendered to HTML with working inter-article links, full-text search, and an in-browser editor.

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack, SSR, file-based routing |
| Database | SQLite + FTS5 (via `better-sqlite3`) | Zero-dependency, built-in full-text search, simple backup |
| Markdown → HTML | `unified` + `remark-parse` + `remark-rehype` + `rehype-stringify` + `rehype-sanitize` | Best ecosystem, composable plugins |
| Wiki links | Custom `remark` plugin | Converts `[[Article Title]]` to `<a href="/wiki/article-title">` |
| Editor | `@uiw/react-md-editor` | Split-pane Markdown/preview, minimal JS footprint |
| Styling | Tailwind CSS | Utility-first, fast to iterate |
| Deploy | Docker (single container, SQLite file mounted as volume) | Runs anywhere |

## Core features

### 1. Markdown rendering with active links
- Articles stored as raw Markdown in SQLite (`articles` table).
- Rendered server-side on every request (cached in memory with 60 s TTL).
- Standard Markdown links `[text](url)` and wiki-style `[[Article Title]]` both resolve to internal routes.
- `[[Article Title]]` plugin: slugifies title → checks DB → renders `<a href="/wiki/{slug}">` if exists, `<a class="dead-link">` if not (so you can see what's missing).
- `rehype-sanitize` with allowlist — no XSS.

### 2. Search
- SQLite FTS5 virtual table (`articles_fts`) mirrors `title` + `body` columns.
- Incremental update via trigger on `INSERT/UPDATE/DELETE` on `articles`.
- `/search?q=...` — server action queries FTS5 with `MATCH`, returns ranked results with highlighted snippets (`snippet()` function).
- Search box in persistent header, results page shows title + excerpt.

### 3. Edit articles
- Every article page has an **Edit** button → `/wiki/{slug}/edit`.
- Edit page loads `@uiw/react-md-editor` prefilled with current Markdown.
- Save → `POST /api/articles/{slug}` → writes to DB, invalidates cache.
- Revision history: `article_revisions` table stores previous body + timestamp on every save. `/wiki/{slug}/history` lists revisions; clicking one shows a diff (`diff` npm package).
- New article: `/wiki/new` → same editor, creates slug from title.

## Database schema

```sql
CREATE TABLE articles (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,          -- raw Markdown
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE VIRTUAL TABLE articles_fts USING fts5(
  slug UNINDEXED,
  title,
  body,
  content='articles',
  content_rowid='rowid'
);

CREATE TABLE article_revisions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL REFERENCES articles(slug),
  body        TEXT NOT NULL,
  saved_at    TEXT DEFAULT (datetime('now'))
);
```

## Routes

| Route | Description |
|---|---|
| `/` | Home — list of all articles, search box |
| `/wiki/[slug]` | Rendered article |
| `/wiki/[slug]/edit` | Markdown editor |
| `/wiki/[slug]/history` | Revision list |
| `/wiki/new` | New article form |
| `/search?q=` | Full-text search results |
| `POST /api/articles` | Create article |
| `PUT /api/articles/[slug]` | Update article |

## File layout

```
/
├── app/
│   ├── layout.tsx          # header with search box
│   ├── page.tsx            # article list / home
│   ├── wiki/
│   │   └── [slug]/
│   │       ├── page.tsx    # article view
│   │       ├── edit/page.tsx
│   │       └── history/page.tsx
│   ├── search/page.tsx
│   ├── new/page.tsx
│   └── api/articles/
│       └── route.ts        # REST handlers
├── lib/
│   ├── db.ts               # better-sqlite3 singleton
│   ├── render.ts           # unified pipeline + wiki-link plugin
│   └── search.ts           # FTS5 query helpers
├── Dockerfile
└── docker-compose.yml
```

## Build phases

**Phase 1 — Core (days 1–3)**
- Project scaffold: Next.js 15, Tailwind, SQLite, migrations.
- Article CRUD: create, read, update via DB.
- Markdown rendering pipeline with `[[wiki links]]`.
- Basic header + article list on home page.

**Phase 2 — Search + history (days 4–5)**
- FTS5 virtual table + triggers.
- `/search` results page with highlighted snippets.
- Revision table + save-on-edit trigger.
- `/history` page with diff view.

**Phase 3 — Polish + Docker (day 6)**
- Dead-link styling, slug collision handling.
- 404 page with "Create this article" CTA.
- Dockerfile (node:20-alpine, SQLite file at `/data/wiki.db`).
- `docker-compose.yml` with volume mount for DB.
- Seed script with a handful of demo articles cross-linking each other.

## Definition of done

- Article with `[[links]]` renders to HTML; linked article opens on click; dead link styled differently.
- Search returns ranked results for a multi-word query in < 100 ms on 10 000 articles.
- Edit, save, and revert to a previous revision all work end-to-end.
- Runs in Docker with a single `docker compose up`.
