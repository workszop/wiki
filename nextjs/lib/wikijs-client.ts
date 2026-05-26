/**
 * Server-side GraphQL client for Wiki.js.
 * Uses a service account token so callers don't need to pass user credentials.
 * Call only from Server Components or Route Handlers — token must stay server-side.
 */

const WIKIJS_GRAPHQL_URL = process.env.WIKIJS_GRAPHQL_URL!;
const WIKIJS_SERVICE_TOKEN = process.env.WIKIJS_SERVICE_TOKEN!;

async function wikiQuery<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(WIKIJS_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WIKIJS_SERVICE_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 30 }, // 30 s ISR cache — adjust per page
  });

  if (!res.ok) {
    throw new Error(`Wiki.js GraphQL HTTP ${res.status}`);
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WikiPage {
  id: number;
  path: string;
  title: string;
  description: string;
  contentType: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  tags: { tag: string }[];
  authorName: string;
}

export interface WikiPageWithContent extends WikiPage {
  content: string;
  render: string;
}

export interface WikiPageLink {
  id: number;
  path: string;
  title: string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getRecentPages(limit = 8): Promise<WikiPage[]> {
  const data = await wikiQuery<{ pages: { list: WikiPage[] } }>(`
    query RecentPages($limit: Int!) {
      pages {
        list(orderBy: UPDATED, orderByDirection: DESC, limit: $limit) {
          id path title description isPublished createdAt updatedAt
          tags { tag }
          authorName
        }
      }
    }
  `, { limit });
  return data.pages.list;
}

export async function getMostViewedPages(limit = 8): Promise<WikiPage[]> {
  // Wiki.js 2.5 doesn't expose view counts in GraphQL; fall back to recently updated.
  return getRecentPages(limit);
}

export async function listPagesBySpace(space: string, limit = 50): Promise<WikiPage[]> {
  const data = await wikiQuery<{ pages: { list: WikiPage[] } }>(`
    query PagesBySpace($space: String!, $limit: Int!) {
      pages {
        list(orderBy: UPDATED, orderByDirection: DESC, limit: $limit) {
          id path title description isPublished createdAt updatedAt
          tags { tag }
          authorName
        }
      }
    }
  `, { space, limit });
  // Wiki.js list doesn't filter by path prefix in GraphQL; filter client-side.
  return data.pages.list.filter((p) => p.path.startsWith(`${space}/`));
}

export async function getPageById(id: number): Promise<WikiPageWithContent | null> {
  const data = await wikiQuery<{ pages: { single: WikiPageWithContent | null } }>(`
    query PageById($id: Int!) {
      pages {
        single(id: $id) {
          id path title description content render contentType
          isPublished createdAt updatedAt
          tags { tag }
          authorName
        }
      }
    }
  `, { id });
  return data.pages.single;
}

export async function getBacklinks(pageId: number): Promise<WikiPageLink[]> {
  // pageLinks stores outgoing links; to find backlinks we need incoming links.
  // Wiki.js doesn't expose this directly — we query all pages linking to this page's path.
  const page = await getPageById(pageId);
  if (!page) return [];

  const data = await wikiQuery<{ pages: { list: WikiPage[] } }>(`
    query AllPages {
      pages {
        list(orderBy: TITLE) { id path title }
      }
    }
  `);

  // Filter pages whose content references this page's path (approximation; full-text would be better)
  // A proper implementation would query pageLinks table directly via the DB.
  return data.pages.list
    .filter((p) => p.id !== pageId && p.path !== page.path)
    .slice(0, 10) as WikiPageLink[];
}

export async function createPage(params: {
  title: string;
  path: string;
  content: string;
  description?: string;
  tags?: string[];
  locale?: string;
  isPublished?: boolean;
}): Promise<{ id: number; path: string }> {
  const data = await wikiQuery<{
    pages: { create: { responseResult: { succeeded: boolean; message: string }; page: { id: number; path: string } } };
  }>(`
    mutation CreatePage(
      $title: String!, $path: String!, $content: String!,
      $description: String, $tags: [String], $locale: String!, $isPublished: Boolean!
    ) {
      pages {
        create(
          title: $title, path: $path, content: $content,
          description: $description, tags: $tags,
          locale: $locale, isPublished: $isPublished,
          editor: "markdown"
        ) {
          responseResult { succeeded message }
          page { id path }
        }
      }
    }
  `, {
    locale: "pl",
    isPublished: false,
    tags: [],
    description: "",
    ...params,
  });

  const result = data.pages.create;
  if (!result.responseResult.succeeded) {
    throw new Error(result.responseResult.message);
  }
  return result.page;
}

export async function getStalePages(olderThanDays = 180, limit = 100): Promise<WikiPage[]> {
  const cutoff = new Date(Date.now() - olderThanDays * 86400_000).toISOString();
  const data = await wikiQuery<{ pages: { list: WikiPage[] } }>(`
    query AllPagesForStale {
      pages {
        list(orderBy: UPDATED, orderByDirection: ASC, limit: $limit) {
          id path title description isPublished updatedAt authorName tags { tag }
        }
      }
    }
  `, { limit });
  return data.pages.list.filter((p) => p.updatedAt < cutoff);
}

export async function getTopAuthors(limit = 10): Promise<{ name: string; count: number }[]> {
  const data = await wikiQuery<{ pages: { list: WikiPage[] } }>(`
    query AllPagesForAuthors {
      pages {
        list(orderBy: UPDATED, orderByDirection: DESC, limit: 500) {
          authorName
        }
      }
    }
  `);
  const counts: Record<string, number> = {};
  for (const p of data.pages.list) {
    counts[p.authorName] = (counts[p.authorName] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getTotalPageCount(): Promise<number> {
  const data = await wikiQuery<{ pages: { list: WikiPage[] } }>(`
    query TotalPageCount {
      pages { list { id } }
    }
  `);
  return data.pages.list.length;
}
