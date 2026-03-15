import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/context';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

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
      <body className={`${inter.variable} font-sans antialiased`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
