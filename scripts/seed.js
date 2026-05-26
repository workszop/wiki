// Standalone seed script — plain CJS, no TypeScript compilation needed
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'wiki.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    slug        TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
    slug UNINDEXED,
    title,
    body,
    content='articles',
    content_rowid='rowid'
  );

  CREATE TABLE IF NOT EXISTS article_revisions (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    slug      TEXT NOT NULL REFERENCES articles(slug) ON DELETE CASCADE,
    body      TEXT NOT NULL,
    saved_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
    INSERT INTO articles_fts(rowid, slug, title, body)
    VALUES (new.rowid, new.slug, new.title, new.body);
  END;

  CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
    INSERT INTO articles_fts(articles_fts, rowid, slug, title, body)
    VALUES ('delete', old.rowid, old.slug, old.title, old.body);
  END;

  CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
    INSERT INTO articles_fts(articles_fts, rowid, slug, title, body)
    VALUES ('delete', old.rowid, old.slug, old.title, old.body);
    INSERT INTO articles_fts(rowid, slug, title, body)
    VALUES (new.rowid, new.slug, new.title, new.body);
  END;
`);

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const articles = [
  {
    title: 'Getting Started',
    body: `# Getting Started

Welcome to the wiki! This is your central knowledge base.

## How to use this wiki

- **Browse** all articles on the home page
- **Search** for anything using the search box at the top
- **Edit** any article with the Edit button on the article page
- **Create** new articles with the "+ New article" button

## Linking to other articles

Use double brackets to link to another wiki article:

\`\`\`
[[Markdown Guide]]
[[Advanced Features]]
\`\`\`

These render as clickable links. If the target article doesn't exist yet, the link appears in red.

## Next steps

Check out the [[Markdown Guide]] to learn how to format articles, or jump straight to [[Advanced Features]] to see everything the wiki can do.

See also: [[About This Wiki]]
`,
  },
  {
    title: 'Markdown Guide',
    body: `# Markdown Guide

All articles are written in Markdown. Here's a quick reference.

## Text formatting

**Bold** is \`**bold**\` · *Italic* is \`*italic*\` · \`inline code\` is \`\`backticks\`\`

## Headings

\`\`\`
# H1
## H2
### H3
\`\`\`

## Links

| Syntax | Result |
|---|---|
| \`[text](https://example.com)\` | External link |
| \`[[Article Title]]\` | Internal wiki link |

## Lists

\`\`\`
- Unordered item
- Another item
  - Nested item

1. Ordered item
2. Second item
\`\`\`

## Code blocks

Use triple backticks with an optional language hint:

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

## Blockquotes

> Important information can be called out with a blockquote.

## Tables

\`\`\`
| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |
\`\`\`

---

Back to [[Getting Started]] · See also [[Advanced Features]]
`,
  },
  {
    title: 'Advanced Features',
    body: `# Advanced Features

## Revision history

Every time you save an article, the previous version is stored automatically. To browse the history of any article:

1. Open the article
2. Click **History** in the top-right
3. Click **View diff** next to any revision to compare it with the current version
4. Click **Restore** to roll back to that revision

## Wiki links and dead links

Use \`[[Article Title]]\` to link to another article.

- If the article exists → blue link: [[Getting Started]]
- If it doesn't exist → red dashed link: [[This Article Does Not Exist Yet]]

Clicking a red link takes you to a pre-filled "Create this article" page.

## Search

The search box in the header runs a full-text search across all article titles and bodies. Results include highlighted excerpts showing where your query matched.

## Editing

Any article can be edited at any time. The editor has two tabs:

- **Write** — a Markdown textarea with monospace font
- **Preview** — renders the current Markdown including wiki links

---

Back to [[Getting Started]] · [[Markdown Guide]]
`,
  },
  {
    title: 'About This Wiki',
    body: `# About This Wiki

This wiki is built from scratch without any third-party wiki framework.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | SQLite + FTS5 |
| Markdown rendering | unified / remark / rehype |
| Styling | Tailwind CSS |

## Features

- Markdown articles with HTML rendering
- \`[[Wiki links]]\` between articles with dead-link detection
- Full-text search with highlighted snippets
- In-browser Markdown editor with live preview
- Revision history with line-level diff view
- One-click restore to any previous revision

## Data

All data is stored in a single SQLite file at \`data/wiki.db\`. Back it up to keep your wiki safe.

## Running with Docker

\`\`\`bash
docker compose up
\`\`\`

The SQLite database is persisted in a named Docker volume.

---

See [[Getting Started]] to begin using the wiki.
`,
  },
];

const insert = db.prepare('INSERT INTO articles (slug, title, body) VALUES (?, ?, ?)');

for (const article of articles) {
  const slug = slugify(article.title);
  const exists = db.prepare('SELECT 1 FROM articles WHERE slug = ?').get(slug);
  if (exists) {
    console.log(`skip  ${slug}`);
  } else {
    insert.run(slug, article.title, article.body.trim());
    console.log(`added ${slug}`);
  }
}

console.log('done.');
