'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EditorProps {
  slug: string;
  initialTitle: string;
  initialBody: string;
  isNew?: boolean;
}

export default function Editor({ slug, initialTitle, initialBody, isNew }: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function loadPreview() {
    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    setPreview(data.html);
  }

  async function save() {
    setError('');
    setSaving(true);
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/api/articles' : `/api/articles/${slug}`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/wiki/${data.slug}`);
      router.refresh();
    } else {
      setError(data.error ?? 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title"
          className="w-full text-2xl font-bold border-b border-gray-300 pb-2 focus:outline-none focus:border-blue-400"
          autoFocus={isNew}
        />
        {isNew && title && (
          <p className="text-xs text-gray-400 mt-1">
            URL:{' '}
            <span className="font-mono">
              /wiki/
              {title
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')}
            </span>
          </p>
        )}
      </div>

      <div className="border border-gray-300 rounded">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setTab('write')}
            className={`px-4 py-2 text-sm rounded-tl ${
              tab === 'write' ? 'bg-white font-medium text-gray-900 border-b-2 border-blue-500 -mb-px' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Write
          </button>
          <button
            onClick={() => {
              setTab('preview');
              loadPreview();
            }}
            className={`px-4 py-2 text-sm ${
              tab === 'preview' ? 'bg-white font-medium text-gray-900 border-b-2 border-blue-500 -mb-px' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Preview
          </button>
        </div>

        {tab === 'write' ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-96 p-4 font-mono text-sm resize-y focus:outline-none"
            placeholder="Write your article in Markdown. Use [[Article Title]] to link to other wiki articles."
          />
        ) : (
          <div
            className="wiki-body p-4 min-h-96"
            dangerouslySetInnerHTML={{
              __html: preview || '<p class="text-gray-400 italic">Loading preview…</p>',
            }}
          />
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 mt-4">
        <button
          onClick={save}
          disabled={saving || !title.trim() || !body.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => router.back()}
          className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
