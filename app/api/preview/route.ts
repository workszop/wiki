import { NextRequest, NextResponse } from 'next/server';
import { renderMarkdown } from '@/lib/render';
import { getAllSlugs } from '@/lib/search';

export async function POST(req: NextRequest) {
  const { body } = await req.json();
  if (!body) return NextResponse.json({ html: '' });

  const slugs = getAllSlugs();
  const html = await renderMarkdown(body, slugs);
  return NextResponse.json({ html });
}
