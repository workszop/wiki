// Assign categories to all existing articles
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'wiki.db');
const db = new Database(DB_PATH);

// Add column if missing
const cols = db.prepare('PRAGMA table_info(articles)').all().map(c => c.name);
if (!cols.includes('category')) {
  db.exec("ALTER TABLE articles ADD COLUMN category TEXT NOT NULL DEFAULT 'General'");
  console.log('Added category column');
}

const CATEGORIES = {
  'transformer-architecture':         'Foundations',
  'embedding-models':                 'Foundations',
  'model-quantization':               'Foundations',
  'retrieval-augmented-generation':   'Retrieval & RAG',
  'vector-databases':                 'Retrieval & RAG',
  'ai-agents-and-tools':              'Agents & Apps',
  'multimodal-models':                'Agents & Apps',
  'prompt-engineering':               'Practice',
  'fine-tuning-llms':                 'Practice',
  'ai-evaluation-benchmarks':         'Practice',
  'getting-started':                  'Wiki Docs',
  'markdown-guide':                   'Wiki Docs',
  'advanced-features':                'Wiki Docs',
  'about-this-wiki':                  'Wiki Docs',
};

const update = db.prepare('UPDATE articles SET category = ? WHERE slug = ?');

const apply = db.transaction(() => {
  for (const [slug, cat] of Object.entries(CATEGORIES)) {
    const changes = update.run(cat, slug).changes;
    if (changes) console.log(`  ${slug} → ${cat}`);
  }
});

console.log('Assigning categories…');
apply();
console.log('Done.');
