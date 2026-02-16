import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/features/auth/auth-provider';
import { MigrationIndicator } from '@/components/migration-indicator';
import { MigrationOverlay } from '@/components/migration-overlay';
import { MobileRedirect } from '@/components/mobile-redirect';
import { PrivateBrowsingBanner } from '@/components/private-browsing-banner';
import { OfflineIndicator } from '@/components/offline-indicator';
import { SkipToContent } from '@/components/skip-to-content';
import { SmallScreenBanner } from '@/components/small-screen-banner';
import { GuestConversionOverlay } from '@/components/guest-conversion-overlay';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  display: 'swap',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  display: 'swap',
  subsets: ['latin'],
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Minstrel — AI Practice Companion',
  description: 'AI-powered real-time MIDI practice companion for instrumentalists',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <SkipToContent />
        <SmallScreenBanner />
        <PrivateBrowsingBanner />
        <OfflineIndicator />
        <MobileRedirect />
        <AuthProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <MigrationOverlay />
          <MigrationIndicator />
          <GuestConversionOverlay />
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
