import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Firmowe Wiki",
  description: "Wewnętrzna baza wiedzy grupy kapitałowej",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-[var(--color-brand)] text-white shadow-md">
          <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
              <span className="text-2xl">📚</span>
              Firmowe Wiki
            </a>
            <nav className="flex gap-6 text-sm font-medium">
              <a href="/" className="hover:opacity-80">Start</a>
              <a href="/dashboard" className="hover:opacity-80">Dashboard</a>
              <a href="/admin/import" className="hover:opacity-80">Import</a>
              <a href="/admin/audit" className="hover:opacity-80">Audit log</a>
              <a href="/wiki/" className="hover:opacity-80">Wiki</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-gray-200 py-6 text-center text-xs text-gray-400">
          Firmowe Wiki &copy; {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
