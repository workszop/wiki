'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RestoreButton({ slug, revisionId }: { slug: string; revisionId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function restore() {
    if (!confirm('Restore this revision? The current version will be saved to history.')) return;
    setLoading(true);
    await fetch(`/api/articles/${slug}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionId }),
    });
    router.push(`/wiki/${slug}`);
    router.refresh();
  }

  return (
    <button onClick={restore} disabled={loading} className="btn-restore">
      {loading ? 'Restoring…' : 'Restore'}
    </button>
  );
}
