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
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title"
          className="editor-title-input"
          autoFocus={isNew}
        />
        {isNew && title && (
          <p className="editor-slug-hint">
            URL: /wiki/
            {title
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^\w-]/g, '')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '')}
          </p>
        )}
      </div>

      <div className="editor-wrap">
        <div className="editor-tabs">
          <button
            onClick={() => setTab('write')}
            className={`editor-tab${tab === 'write' ? ' editor-tab--active' : ''}`}
          >
            Write
          </button>
          <button
            onClick={() => {
              setTab('preview');
              loadPreview();
            }}
            className={`editor-tab${tab === 'preview' ? ' editor-tab--active' : ''}`}
          >
            Preview
          </button>
        </div>

        {tab === 'write' ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="editor-textarea"
            placeholder="Write your article in Markdown. Use [[Article Title]] to link to other wiki articles."
          />
        ) : (
          <div
            className="article__body editor-preview"
            dangerouslySetInnerHTML={{
              __html:
                preview ||
                '<p style="color:var(--fg-4);font-style:italic">Loading preview…</p>',
            }}
          />
        )}
      </div>

      {error && <p className="editor-error">{error}</p>}

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}>
        <button
          onClick={save}
          disabled={saving || !title.trim() || !body.trim()}
          className="btn-primary"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
