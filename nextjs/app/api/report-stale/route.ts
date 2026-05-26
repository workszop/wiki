import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { sendStaleNotification } from "@/lib/mail";
import { getPageById } from "@/lib/wikijs-client";

export async function POST(req: NextRequest) {
  let body: {
    pageId: number;
    pageTitle: string;
    pagePath: string;
    reason: string;
    reporterEmail?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { pageId, pageTitle, pagePath, reason, reporterEmail } = body;

  if (!pageId || !reason?.trim()) {
    return NextResponse.json({ error: "pageId and reason are required" }, { status: 400 });
  }

  const pool = getPool();

  // Persist the report
  await pool.query(
    `INSERT INTO stale_reports (page_id, page_path, page_title, reporter_email, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [pageId, pagePath, pageTitle, reporterEmail ?? null, reason.trim()]
  );

  // Notify the page author via e-mail
  try {
    const page = await getPageById(pageId);
    // Wiki.js doesn't expose author e-mail in GraphQL — look up via users table
    const authorRow = await pool.query<{ email: string }>(
      `SELECT u.email FROM users u
       JOIN pages p ON p."authorId" = u.id
       WHERE p.id = $1 LIMIT 1`,
      [pageId]
    );

    const authorEmail = authorRow.rows[0]?.email;
    if (authorEmail) {
      await sendStaleNotification({
        authorEmail,
        pageTitle: page?.title ?? pageTitle,
        pagePath,
        reason,
        reporterEmail,
      });

      await pool.query(
        `UPDATE stale_reports SET notified_author = TRUE WHERE page_id = $1 AND notified_author = FALSE`,
        [pageId]
      );
    }
  } catch (err) {
    // Non-fatal — report was saved, notification failure is logged but doesn't break the flow
    console.error("Failed to send stale notification:", err);
  }

  return NextResponse.json({ ok: true });
}
