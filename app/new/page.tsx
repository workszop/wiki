import Editor from '@/components/Editor';
import { slugify } from '@/lib/render';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Article' };

type Props = { searchParams: Promise<{ title?: string }> };

export default async function NewPage({ searchParams }: Props) {
  const { title = '' } = await searchParams;
  const slug = title ? slugify(title) : '__new__';

  return (
    <div className="wiki-page">
      <h1 className="wiki-page-title">New Article</h1>
      <Editor
        slug={slug}
        initialTitle={title.replace(/-/g, ' ')}
        initialBody=""
        isNew
      />
    </div>
  );
}
