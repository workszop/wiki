import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import SearchBox from '@/components/SearchBox';

export const metadata: Metadata = {
  title: { default: 'Wiki', template: '%s | Wiki' },
  description: 'Internal knowledge base',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
            <Link href="/" className="font-bold text-gray-900 text-lg shrink-0 hover:text-blue-600">
              Wiki
            </Link>
            <SearchBox />
            <Link
              href="/new"
              className="ml-auto shrink-0 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
            >
              + New article
            </Link>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
