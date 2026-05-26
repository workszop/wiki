import { NextRequest, NextResponse } from "next/server";
import { createPage } from "@/lib/wikijs-client";
import { insertAuditEntry } from "@/lib/audit";

interface ArticlePayload {
  path: string;
  title: string;
  description: string;
  tags: string[];
  content: string;
}

export async function POST(req: NextRequest) {
  let body: { articles: ArticlePayload[] };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.articles) || body.articles.length === 0) {
    return NextResponse.json({ error: "No articles provided" }, { status: 400 });
  }

  const success: ArticlePayload[] = [];
  const errors: { file: string; message: string }[] = [];

  for (const article of body.articles) {
    try {
      await createPage({
        title: article.title,
        path: article.path,
        content: article.content,
        description: article.description,
        tags: article.tags,
        isPublished: false, // imported as drafts — editor reviews before publishing
      });

      await insertAuditEntry({
        actor_email: "system-import",
        action: "page.create",
        entity_type: "page",
        entity_id: article.path,
        entity_title: article.title,
        space: article.path.split("/")[0],
        diff_summary: "Zaimportowany z ZIP (wersja robocza)",
        ip_address: null,
        metadata: { tags: article.tags, source: "bulk-import" },
      });

      success.push(article);
    } catch (err) {
      errors.push({
        file: article.path,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ success, errors });
}
