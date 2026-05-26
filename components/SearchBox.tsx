'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useRef } from 'react';

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const ref = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = ref.current?.value.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={submit} style={{ width: '100%', maxWidth: 480 }}>
      <input
        ref={ref}
        type="search"
        defaultValue={params.get('q') ?? ''}
        placeholder="Search articles…"
        className="topbar-search-input"
      />
    </form>
  );
}

export default function SearchBox() {
  return (
    <Suspense fallback={<div style={{ flex: 1, maxWidth: 480 }} />}>
      <Inner />
    </Suspense>
  );
}
