import { Audiowide, Roboto } from 'next/font/google';

export const audiowide = Audiowide({
  weight: '400',
  fallback: ['sans-serif'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-audiowide'
});

export const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  fallback: [
    'ui-sans-serif',
    'system-ui',
    'sans-serif',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji'
  ],
  subsets: ['latin'],
  display: 'swap'
});
