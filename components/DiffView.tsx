'use client';

import { diffLines } from 'diff';

interface DiffViewProps {
  oldText: string;
  newText: string;
}

export default function DiffView({ oldText, newText }: DiffViewProps) {
  const parts = diffLines(oldText, newText);

  if (parts.every((p) => !p.added && !p.removed)) {
    return <p className="text-sm text-gray-500 italic">No differences from current version.</p>;
  }

  return (
    <div className="font-mono text-sm border border-gray-200 rounded overflow-auto max-h-[600px]">
      {parts.map((part, i) => {
        const lines = part.value.split('\n').filter((l, idx, arr) => idx < arr.length - 1 || l);
        const bg = part.added ? 'bg-green-50' : part.removed ? 'bg-red-50' : 'bg-white';
        const text = part.added ? 'text-green-800' : part.removed ? 'text-red-800' : 'text-gray-500';
        const prefix = part.added ? '+' : part.removed ? '−' : ' ';

        return lines.map((line, j) => (
          <div key={`${i}-${j}`} className={`flex px-3 py-0.5 ${bg} ${text}`}>
            <span className="select-none w-4 shrink-0 text-gray-400">{prefix}</span>
            <span className="break-all">{line || ' '}</span>
          </div>
        ));
      })}
    </div>
  );
}
