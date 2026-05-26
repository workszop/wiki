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
    <form onSubmit={submit} className="flex-1 max-w-lg">
      <input
        ref={ref}
        type="search"
        defaultValue={params.get('q') ?? ''}
        placeholder="Search articles…"
        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </form>
  );
}

export default function SearchBox() {
  return (
    <Suspense fallback={<div className="flex-1 max-w-lg" />}>
      <Inner />
    </Suspense>
  );
}
