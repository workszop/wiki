import { unified } from 'unified';
import type { Plugin } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

export interface TocItem {
  level: number;
  id: string;
  text: string;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Remark plugin: converts [[Article Title]] into internal links.
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

// Extract plain text from a HAST node
function nodeText(node: any): string {
  if (node.type === 'text') return node.value ?? '';
  if (Array.isArray(node.children)) return node.children.map(nodeText).join('');
  return '';
}

// Rehype plugin: transform elements to Quantica design system class structure
const rehypeQuanticaBlocks: Plugin<[], any> = () => {
  return (tree: any) => {
    visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
      if (index === undefined || !parent) return;

      // pre > code → div.md-code-block > span.code-lang + pre > code
      if (node.tagName === 'pre') {
        if ((parent.properties?.className as string[])?.includes('md-code-block')) return;
        const code = node.children?.find(
          (c: any) => c.type === 'element' && c.tagName === 'code',
        );
        if (!code) return;
        const classes: string[] = code.properties?.className ?? [];
        const langClass = classes.find((c: string) => c.startsWith('language-'));
        const lang = langClass ? langClass.replace('language-', '') : null;
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['md-code-block'] },
          children: [
            ...(lang
              ? [
                  {
                    type: 'element',
                    tagName: 'span',
                    properties: { className: ['code-lang'] },
                    children: [{ type: 'text', value: lang }],
                  },
                ]
              : []),
            node,
          ],
        };
        return;
      }

      // blockquote → add md-blockquote class
      if (node.tagName === 'blockquote') {
        const cls: string[] = node.properties?.className ?? [];
        if (!cls.includes('md-blockquote')) {
          node.properties = { ...node.properties, className: [...cls, 'md-blockquote'] };
        }
        return;
      }

      // hr → div.md-hr > span
      if (node.tagName === 'hr') {
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['md-hr'], role: 'separator' },
          children: [{ type: 'element', tagName: 'span', properties: {}, children: [] }],
        };
        return;
      }

      // img → figure.md-figure > img + figcaption?
      if (node.tagName === 'img') {
        if (parent.tagName === 'figure') return;
        const title = node.properties?.title as string | undefined;
        parent.children[index] = {
          type: 'element',
          tagName: 'figure',
          properties: { className: ['md-figure'] },
          children: [
            { ...node, properties: { ...node.properties, loading: 'lazy' } },
            ...(title
              ? [
                  {
                    type: 'element',
                    tagName: 'figcaption',
                    properties: {},
                    children: [{ type: 'text', value: title }],
                  },
                ]
              : []),
          ],
        };
        return;
      }

      // table → div.md-table-wrap > table.md-table
      if (node.tagName === 'table') {
        const parentClasses = parent.properties?.className as string[] | undefined;
        if (parentClasses?.includes('md-table-wrap')) return;
        node.properties = {
          ...node.properties,
          className: [...(node.properties?.className ?? []), 'md-table'],
        };
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['md-table-wrap'] },
          children: [node],
        };
        return;
      }
    });
  };
};

// Rehype plugin: collect h2/h3 headings for ToC (runs after rehypeSlug adds ids)
function rehypeCollectTocTransformer(toc: TocItem[]) {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      const match = (node.tagName as string)?.match(/^h([23])$/);
      if (!match) return;
      const id = node.properties?.id as string | undefined;
      const text = nodeText(node).trim();
      if (id && text) {
        toc.push({ level: parseInt(match[1]), id, text });
      }
    });
  };
}

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a:          [...(defaultSchema.attributes?.a          ?? []), 'className'],
    code:       [...(defaultSchema.attributes?.code       ?? []), 'className'],
    div:        [...(defaultSchema.attributes?.div        ?? []), 'role'],
    img:        [...(defaultSchema.attributes?.img        ?? []), 'loading'],
    figure:     [],
    figcaption: [],
    '*':        [...(defaultSchema.attributes?.['*']      ?? []), 'className'],
  },
};

export async function renderMarkdown(
  body: string,
  existingSlugs: Set<string>,
): Promise<{ html: string; toc: TocItem[] }> {
  const toc: TocItem[] = [];

  const proc = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(wikiLinksPlugin, existingSlugs)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeHighlight as any, { ignoreMissing: true })
    .use(rehypeQuanticaBlocks);

  const file = await (proc as any)
    .use(function collectToc() { return rehypeCollectTocTransformer(toc); })
    .use(rehypeSanitize, sanitizeSchema as any)
    .use(rehypeStringify)
    .process(body);

  return { html: String(file), toc };
}
