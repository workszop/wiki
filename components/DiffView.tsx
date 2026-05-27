'use client';

import { diffLines } from 'diff';

interface DiffViewProps {
  oldText: string;
  newText: string;
}

export default function DiffView({ oldText, newText }: DiffViewProps) {
  const parts = diffLines(oldText, newText);

  if (parts.every((p) => !p.added && !p.removed)) {
    return <p className="diff-view__empty">No differences from current version.</p>;
  }

  return (
    <div className="diff-view">
      {parts.map((part, i) => {
        const lines = part.value.split('\n').filter((l, idx, arr) => idx < arr.length - 1 || l);
        const mod = part.added ? 'added' : part.removed ? 'removed' : 'context';
        const prefix = part.added ? '+' : part.removed ? '−' : ' ';

        return lines.map((line, j) => (
          <div key={`${i}-${j}`} className={`diff-view__line diff-view__line--${mod}`}>
            <span className="diff-view__prefix">{prefix}</span>
            <span>{line || ' '}</span>
          </div>
        ));
      })}
    </div>
  );
}
