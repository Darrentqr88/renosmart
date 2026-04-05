import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/context';
import { PostHogProvider, TawkChat } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'RenoSmart — AI Renovation Management',
    template: '%s | RenoSmart',
  },
  description: 'AI-powered renovation quotation audit, Gantt scheduling, and project management for Malaysia & Singapore designers.',
  keywords: ['renovation', 'quotation', 'AI audit', 'interior design', 'Malaysia', 'Singapore', 'Gantt', 'project management'],
  openGraph: {
    title: 'RenoSmart — AI Renovation Management',
    description: 'Audit quotations, auto-generate Gantt charts, manage renovation projects.',
    images: ['/og-image.png'],
    siteName: 'RenoSmart',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RenoSmart — AI Renovation Management',
    description: 'AI-powered renovation quotation audit & project management.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://renosmart.vercel.app',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <PostHogProvider>
          <I18nProvider>{children}</I18nProvider>
        </PostHogProvider>
        <TawkChat />
      </body>
    </html>
  );
}
