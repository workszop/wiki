"use client";

import { useState, useRef } from "react";

interface ParsedArticle {
  path: string;
  title: string;
  description: string;
  tags: string[];
  space: string;
  content: string;
  error?: string;
}

interface ImportResult {
  success: ParsedArticle[];
  errors: { file: string; message: string }[];
}

export default function ImportPage() {
  const [preview, setPreview] = useState<ParsedArticle[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setParseError(null);
    setPreview(null);
    setResult(null);

    const body = new FormData();
    body.append("zip", file);

    try {
      const res = await fetch("/api/import/preview", { method: "POST", body });
      const data = (await res.json()) as { articles?: ParsedArticle[]; error?: string };
      if (!res.ok || data.error) {
        setParseError(data.error ?? "Błąd parsowania ZIP");
      } else {
        setPreview(data.articles ?? []);
      }
    } catch {
      setParseError("Nie można przetworzyć pliku");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!preview) return;
    setImporting(true);
    setResult(null);

    try {
      const res = await fetch("/api/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles: preview.filter((a) => !a.error) }),
      });
      const data = (await res.json()) as ImportResult;
      setResult(data);
    } catch {
      setResult({ success: [], errors: [{ file: "*", message: "Błąd połączenia z serwerem" }] });
    } finally {
      setImporting(false);
    }
  }

  const validArticles = preview?.filter((a) => !a.error) ?? [];
  const invalidArticles = preview?.filter((a) => a.error) ?? [];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Masowy import artykułów</h1>
        <p className="mt-1 text-sm text-gray-500">
          Prześlij plik ZIP zawierający pliki <code>.md</code> z YAML front matter.
        </p>
      </div>

      {/* Format guide */}
      <details className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
        <summary className="cursor-pointer font-medium">Format pliku ZIP</summary>
        <div className="mt-3 space-y-2 text-gray-600">
          <p>Każdy plik <code>.md</code> powinien mieć YAML front matter:</p>
          <pre className="bg-white rounded p-3 text-xs border border-gray-200 overflow-x-auto">{`---
title: "Nazwa artykułu"
description: "Krótki opis"
tags:
  - tag1
  - tag2
space: companies        # companies | products | contacts | technologies
path: companies/abc/artykul   # opcjonalna ścieżka (default: space/filename)
---

Treść artykułu w Markdown...`}</pre>
          <p>Struktura katalogów w ZIP jest mapowana na przestrzenie Wiki.js.</p>
        </div>
      </details>

      {/* File input */}
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <input
          ref={fileRef}
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          className="hidden"
          id="zip-input"
        />
        <label
          htmlFor="zip-input"
          className="cursor-pointer inline-flex flex-col items-center gap-2"
        >
          <span className="text-4xl">📦</span>
          <span className="font-medium text-gray-700">Kliknij, aby wybrać plik ZIP</span>
          <span className="text-xs text-gray-400">lub przeciągnij i upuść</span>
        </label>
        {loading && <p className="mt-4 text-sm text-blue-600 animate-pulse">Parsowanie ZIP...</p>}
        {parseError && <p className="mt-4 text-sm text-red-600">{parseError}</p>}
      </div>

      {/* Preview */}
      {preview && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Podgląd ({validArticles.length} gotowych, {invalidArticles.length} błędów)
            </h2>
            {validArticles.length > 0 && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="rounded bg-[var(--color-brand)] text-white px-5 py-2 text-sm font-medium hover:bg-[var(--color-brand-dark)] disabled:opacity-60 transition-colors"
              >
                {importing ? "Importowanie..." : `Importuj ${validArticles.length} artykułów`}
              </button>
            )}
          </div>

          {invalidArticles.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="font-medium text-red-700 mb-2">Pliki z błędami (zostaną pominięte):</h3>
              <ul className="space-y-1 text-sm text-red-600">
                {invalidArticles.map((a) => (
                  <li key={a.path}>
                    <code>{a.path}</code> — {a.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validArticles.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2 text-left">Tytuł</th>
                    <th className="px-4 py-2 text-left">Ścieżka</th>
                    <th className="px-4 py-2 text-left">Przestrzeń</th>
                    <th className="px-4 py-2 text-left">Tagi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {validArticles.map((a) => (
                    <tr key={a.path} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{a.title}</td>
                      <td className="px-4 py-2 text-gray-500 font-mono text-xs">{a.path}</td>
                      <td className="px-4 py-2 text-gray-500 capitalize">{a.space}</td>
                      <td className="px-4 py-2 text-gray-500">{a.tags.join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Result */}
      {result && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Wynik importu</h2>
          {result.success.length > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              Zaimportowano {result.success.length} artykuł(ów) pomyślnie.
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="font-medium text-red-700 mb-2">Błędy podczas importu:</h3>
              <ul className="space-y-1 text-sm text-red-600">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    <code>{e.file}</code> — {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
