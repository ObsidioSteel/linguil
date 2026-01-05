// Import global styles.
import './globals.css';

// Import Next.js and React types and components.
import type { Metadata } from 'next';
import { PT_Sans, Source_Code_Pro } from 'next/font/google';
import { Suspense } from 'react';

// Import custom components.
import { ConditionalHeader } from '@/components/common/ConditionalHeader';
import { GlobalLoadingSpinner } from '@/components/common/GlobalLoadingSpinner';
import { Providers } from './providers';
import { Footer } from '@/components/common/Footer';
import { Toaster } from '@/components/ui/toaster';
import { PaymentProcessor } from '@/components/payments/PaymentProcessor';

// Initialize application fonts and expose them as CSS variables.
const ptSans = PT_Sans({ subsets: ['latin'], style: ['normal', 'italic'], weight: ['400', '700'], variable: '--font-pt-sans' });
const sourceCodePro = Source_Code_Pro({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-source-code-pro' });

// Define metadata for the application's head tag.
export const metadata: Metadata = {
  metadataBase: new URL('https://linguil.app'),
  title: 'linguil | The daily language guessing game',
  description: 'Play a new word daily, compete with friends, and add new languages!',
  authors: [{ name: 'Charlie McCombie', url: 'https://github.com/Papuang' }],
  manifest: '/manifest.json',
  icons: {
    shortcut: '/favicon.ico?v=5',
    icon: [
      { url: '/icon.png?v=5', type: 'image/png' },
      { url: '/icon-192x192.png?v=5', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512x512.png?v=5', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-icon.png?v=5',
  },
  openGraph: {
    title: 'linguil | The daily language guessing game',
    description: 'Play a new word daily, compete with friends, and add new languages!',
    url: 'https://linguil.app',
    siteName: 'linguil',
    images: [
      {
        url: '/logo.png?v=5',
        width: 240,
        height: 70,
        alt: 'linguil logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'linguil | The daily language guessing game',
    description: 'Play a new word daily, compete with friends, and add new languages!',
    images: ['/logo.png?v=5'],
  },
};

// Define the root layout component for the entire application.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['VideoGame', 'WebApplication'],
    'name': 'linguil',
    'url': 'https://linguil.app',
    'description': 'Play a new word daily, compete with friends, and add new languages!',
    'applicationCategory': 'Game',
    'operatingSystem': 'Web Browser',
    'inLanguage': 'en-US',
    'isAccessibleForFree': true,
    'playMode': 'SinglePlayer',
    'publisher': {
        '@type': 'Organization',
        'name': 'linguil',
        'logo': {
            '@type': 'ImageObject',
            'url': 'https://linguil.app/logo.png'
        }
    },
    'image': 'https://linguil.app/logo.png'
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta property="og:type" content="website" />
        {/* Immediately sets the color mode to prevent theme flashing on load. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getInitialColorMode() {
                  const persistedColorPreference = window.localStorage.getItem('theme');
                  const hasPersistedPreference = typeof persistedColorPreference === 'string';
                  if (hasPersistedPreference) {
                    return persistedColorPreference;
                  }
                  const mql = window.matchMedia('(prefers-color-scheme: dark)');
                  const hasMediaQueryPreference = typeof mql.matches === 'boolean';
                  if (hasMediaQueryPreference) {
                    return mql.matches ? 'dark' : 'light';
                  }
                  return 'light';
                }
                const colorMode = getInitialColorMode();
                if (colorMode === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        {/* Preconnect to external services to accelerate loading. */}
        <link rel="preconnect" href="https://auth.linguil.app" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebase.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://apis.google.com" crossOrigin="anonymous" />

        {/* Add JSON-LD structured data for enhanced SEO. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      {/* Apply fonts and layout styles to the body. */}
      <body className={`${ptSans.variable} ${sourceCodePro.variable} font-body antialiased flex flex-col min-h-screen overflow-x-hidden`}>
        {/* Wrap the application with context providers. */}
        <Providers>
          <ConditionalHeader />
          {/* Define the main content area with a fallback loading spinner. */}
          <main className="w-full max-w-2xl mx-auto flex flex-col justify-start flex-grow">
            <Suspense fallback={<GlobalLoadingSpinner />}>
              {children}
            </Suspense>
          </main>
          <Footer />
          <Toaster />
          <Suspense fallback={null}>
            <PaymentProcessor />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}