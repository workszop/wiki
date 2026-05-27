#!/usr/bin/env node
/**
 * Import one or more Markdown files into the wiki.
 *
 * Usage:
 *   npm run import -- ./docs/          # all .md files in a directory
 *   npm run import -- ./docs/foo.md    # single file
 *   npm run import -- ./docs/ --cat "Foundations"   # override category
 *   npm run import -- ./docs/ --dry-run             # preview only
 *
 * Title    — taken from the first # Heading in the file, else the filename
 * Slug     — derived from the title (lowercase, hyphens, no special chars)
 * Category — from --cat flag; if omitted defaults to "General"
 * Date     — current time unless the file has a <!-- date: YYYY-MM-DD --> comment
 *
 * Existing slugs are updated (body + category + updated_at).
 * Use --skip-existing to leave existing articles untouched.
 */

const Database = require('better-sqlite3');
const fs   = require('fs');
const path = require('path');

// ── Parse args ────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const flags   = {};
const targets = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--cat')           { flags.cat          = args[++i]; }
  else if (args[i] === '--dry-run')  { flags.dryRun       = true; }
  else if (args[i] === '--skip-existing') { flags.skipExisting = true; }
  else if (!args[i].startsWith('--')) targets.push(args[i]);
}

if (targets.length === 0) {
  console.error('Usage: npm run import -- <path/to/dir-or-file> [--cat "Category"] [--dry-run] [--skip-existing]');
  process.exit(1);
}

// ── Collect .md files ─────────────────────────────────────────────────────────
function collectFiles(target) {
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) { console.error(`Not found: ${abs}`); process.exit(1); }
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    return fs.readdirSync(abs)
      .filter(f => /\.(md|markdown)$/i.test(f))
      .map(f => path.join(abs, f));
  }
  return [abs];
}

const files = targets.flatMap(collectFiles);
if (files.length === 0) {
  console.error('No .md files found in the specified path(s).');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractTitle(body, filename) {
  // 1. YAML front-matter title: field
  const fm = body.match(/^---[\s\S]*?^title:\s*["']?([^"'\n]+)["']?/m);
  if (fm) return fm[1].trim();
  // 2. First # Heading outside of fenced code blocks
  const stripped = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
  const h = stripped.match(/^#\s+(.+)/m);
  if (h) return h[1].trim();
  // 3. Filename fallback
  return path.basename(filename, path.extname(filename)).replace(/[-_]/g, ' ');
}

function extractDate(body) {
  const m = body.match(/<!--\s*date:\s*(\d{4}-\d{2}-\d{2})\s*-->/);
  return m ? new Date(m[1]).toISOString().replace('T', ' ').slice(0, 19) : null;
}

// ── Database ──────────────────────────────────────────────────────────────────
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'wiki.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Ensure category column exists
const cols = db.prepare('PRAGMA table_info(articles)').all().map(c => c.name);
if (!cols.includes('category')) {
  db.exec("ALTER TABLE articles ADD COLUMN category TEXT NOT NULL DEFAULT 'General'");
}

const stmtGet    = db.prepare('SELECT slug FROM articles WHERE slug = ?');
const stmtInsert = db.prepare(`
  INSERT INTO articles (slug, title, body, category, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const stmtUpdate = db.prepare(`
  UPDATE articles SET title = ?, body = ?, category = ?, updated_at = ?
  WHERE slug = ?
`);

// ── Import ────────────────────────────────────────────────────────────────────
const category = flags.cat ?? 'General';
let created = 0, updated = 0, skipped = 0;

const runImport = db.transaction(() => {
  for (const file of files) {
    const body  = fs.readFileSync(file, 'utf8');
    const title = extractTitle(body, file);
    const slug  = slugify(title);
    const ts    = extractDate(body) ?? new Date().toISOString().replace('T', ' ').slice(0, 19);
    const exists = stmtGet.get(slug);

    if (exists && flags.skipExisting) {
      console.log(`  ⊘ skip   ${slug}  (${title})`);
      skipped++;
      continue;
    }

    if (flags.dryRun) {
      const action = exists ? 'update' : 'create';
      console.log(`  ~ ${action.padEnd(6)} ${slug}  →  "${title}"  [${category}]`);
      exists ? updated++ : created++;
      continue;
    }

    if (exists) {
      stmtUpdate.run(title, body, category, ts, slug);
      console.log(`  ↻ update  ${slug}  →  "${title}"`);
      updated++;
    } else {
      stmtInsert.run(slug, title, body, category, ts, ts);
      console.log(`  + create  ${slug}  →  "${title}"`);
      created++;
    }
  }
});

console.log(`\nImporting ${files.length} file(s)${flags.dryRun ? ' (dry run)' : ''}…`);
runImport();

console.log(`\nDone.  created: ${created}  updated: ${updated}  skipped: ${skipped}`);
if (flags.dryRun) console.log('(no changes written — remove --dry-run to apply)');
