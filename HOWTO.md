# Wiki — How To

## Development

### npm

```bash
npm install
npm run dev        # starts at http://localhost:3000
```

### Docker

```bash
docker compose up --build
# app available at http://localhost:3000
```

---

## Production

### npm

```bash
npm run build
npm start          # starts at http://localhost:3000
```

### Docker

```bash
docker compose up -d --build   # detached, restarts automatically
docker compose logs -f         # tail logs
docker compose down            # stop
```

---

## Import Markdown files in bulk

```bash
# Entire directory
npm run import -- ./docs/

# Single file
npm run import -- ./docs/my-article.md

# Assign a category
npm run import -- ./docs/ --cat "Foundations"

# Preview without writing
npm run import -- ./docs/ --dry-run

# Add only new articles, skip existing
npm run import -- ./docs/ --skip-existing
```

**With Docker** — copy files into the running container first, then run the script:

```bash
docker compose cp ./docs/ wiki:/tmp/docs
docker compose exec wiki node scripts/import-md.js /tmp/docs --cat "My Category"
```

### How titles and slugs are resolved

| Source | Example |
|---|---|
| YAML front-matter `title:` | `title: My Article` |
| First `# Heading` in the file | `# My Article` |
| Filename fallback | `my-article.md` → `My Article` |

Embed a custom date with an HTML comment anywhere in the file:

```markdown
<!-- date: 2024-06-15 -->
```

---

## Seed sample data

```bash
node scripts/seed.js                  # original sample articles
node scripts/seed-ai-articles.js      # 10 AI technology articles
node scripts/migrate-categories.js    # assign categories to existing articles
```
