import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import SearchBox from '@/components/SearchBox';

export const metadata: Metadata = {
  title: { default: 'Wiki', template: '%s | Wiki' },
  description: 'Internal knowledge base',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link className="topbar__logo" href="/" aria-label="Quantica Lab Wiki">
            <Image
              src="/quantica-logo-color.png"
              alt="Quantica Lab"
              width={120}
              height={28}
              priority
              style={{ height: 28, width: 'auto' }}
            />
          </Link>
          <div className="topbar__search">
            <SearchBox />
          </div>
          <div className="topbar__actions">
            <Link href="/new" className="btn-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New article
            </Link>
          </div>
        </header>

        <main className="wiki-main">{children}</main>

        <footer className="site-footer">
          <div className="site-footer__bar" />
          <div className="site-footer__inner">
            <Image
              src="/quantica-logo-color.png"
              alt="Quantica Lab"
              className="site-footer__logo"
              width={80}
              height={20}
              style={{ height: 20, width: 'auto' }}
            />
            <span className="type-mono">Quantica Lab Wiki</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
