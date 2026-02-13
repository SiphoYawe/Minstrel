import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/features/auth/auth-provider';
import { MigrationIndicator } from '@/components/migration-indicator';
import { MobileRedirect } from '@/components/mobile-redirect';
import { OfflineIndicator } from '@/components/offline-indicator';
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        <OfflineIndicator />
        <MobileRedirect />
        <AuthProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <MigrationIndicator />
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
