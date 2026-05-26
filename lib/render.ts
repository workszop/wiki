import { unified } from 'unified';
import type { Plugin } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Remark plugin: converts [[Article Title]] into internal links.
// Dead links (no matching article) get the 'dead-link' class.
const wikiLinksPlugin: Plugin<[Set<string>], Root> = function (existingSlugs) {
  return (tree) => {
    visit(tree, 'text', (node: any, index: any, parent: any) => {
      if (index === undefined || !parent) return;
      const text: string = node.value;
      const regex = /\[\[([^\]]+)\]\]/g;
      const parts: any[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      let hasMatch = false;

      while ((match = regex.exec(text)) !== null) {
        hasMatch = true;
        if (match.index > lastIndex) {
          parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        }
        const title = match[1];
        const slug = slugify(title);
        parts.push({
          type: 'link',
          url: `/wiki/${slug}`,
          data: {
            hProperties: {
              className: existingSlugs.has(slug) ? 'wiki-link' : 'wiki-link dead-link',
            },
          },
          children: [{ type: 'text', value: title }],
        });
        lastIndex = match.index + match[0].length;
      }

      if (!hasMatch) return;
      if (lastIndex < text.length) {
        parts.push({ type: 'text', value: text.slice(lastIndex) });
      }

      parent.children.splice(index, 1, ...parts);
    });
  };
};

// Allow className on all elements so wiki-link / dead-link classes survive sanitization
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), 'className'],
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    '*': ['className'],
  },
};

export async function renderMarkdown(
  body: string,
  existingSlugs: Set<string>,
): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(wikiLinksPlugin, existingSlugs)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeSanitize, sanitizeSchema as any)
    .use(rehypeStringify)
    .process(body);

  return String(file);
}
