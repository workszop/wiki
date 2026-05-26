import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'q-pink':   'var(--quantica-pink)',
        'q-berry':  'var(--deep-berry)',
        'q-fg1':    'var(--fg-1)',
        'q-fg2':    'var(--fg-2)',
        'q-fg3':    'var(--fg-3)',
        'q-fg4':    'var(--fg-4)',
        'q-border': 'var(--border-1)',
        'q-bg1':    'var(--bg-1)',
        'q-bg2':    'var(--bg-2)',
        'q-tint':   'var(--magenta-tint)',
      },
      fontFamily: {
        sans:  ['var(--font-sans)'],
        mono:  ['var(--font-mono)'],
        display: ['var(--font-display)'],
      },
    },
  },
  plugins: [typography],
};

export default config;
