import type { Metadata } from 'next';
import { DM_Sans, Cormorant_Garamond, DM_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/context';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '600', '700'],
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['400', '500'],
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RenoSmart — AI Renovation Management',
  description: 'AI-powered renovation management for Malaysia and Singapore designers.',
  openGraph: {
    title: 'RenoSmart',
    description: 'Audit quotations, auto-generate Gantt charts, manage renovation projects.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${cormorant.variable} ${dmMono.variable} ${playfair.variable} font-sans antialiased`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
