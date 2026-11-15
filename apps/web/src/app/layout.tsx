import type { Metadata } from 'next';
import {
  Bricolage_Grotesque,
  Inter,
  JetBrains_Mono,
} from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Snack Overflow — Office Pantry Manager',
  description: 'Never fight over the last packet again.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/snack-overflow-mark.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${bricolage.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              border: '2px solid var(--ink)',
              boxShadow: '4px 4px 0 var(--ink)',
              borderRadius: 'var(--radius-sm)',
            },
          }}
        />
      </body>
    </html>
  );
}
