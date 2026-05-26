"use client";

import { useState } from "react";

interface Props {
  pageId: number;
  pageTitle: string;
  pagePath: string;
}

export default function ReportStaleForm({ pageId, pageTitle, pagePath }: Props) {
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    const res = await fetch("/api/report-stale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, pageTitle, pagePath, reason, reporterEmail: email }),
    });

    setStatus(res.ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-green-700">
        <p className="font-medium">Dziękujemy za zgłoszenie!</p>
        <p className="mt-1 text-sm">Autor artykułu zostanie powiadomiony e-mailem.</p>
        <a href={`/wiki/${pagePath}`} className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Powrót do artykułu
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
          Dlaczego artykuł jest nieaktualny?
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          required
          placeholder="Opisz, co jest nieaktualne lub niepoprawne..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Twój e-mail (opcjonalnie)
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jan.kowalski@firma.pl"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <p className="mt-1 text-xs text-gray-400">
          Podaj e-mail, jeśli chcesz otrzymać odpowiedź od autora.
        </p>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">Wystąpił błąd. Spróbuj ponownie.</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-lg bg-[var(--color-brand)] text-white px-6 py-2.5 text-sm font-medium hover:bg-[var(--color-brand-dark)] disabled:opacity-60 transition-colors"
      >
        {status === "submitting" ? "Wysyłanie..." : "Wyślij zgłoszenie"}
      </button>
    </form>
  );
}
