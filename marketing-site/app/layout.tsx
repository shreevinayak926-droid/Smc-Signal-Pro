import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SMC SIGNAL — Trade Smarter with Smart Money Concepts',
    template: '%s | SMC SIGNAL',
  },
  description:
    'SMC SIGNAL is an institutional-grade trading analysis platform powered by Smart Money Concepts (SMC). Detect order blocks, fair value gaps, liquidity sweeps, and get real-time signals across Forex, Gold, Indices and Crypto.',
  keywords: [
    'SMC Signal',
    'Smart Money Concepts',
    'forex signals',
    'trading platform',
    'order blocks',
    'fair value gap',
    'paper trading',
    'AI scan',
    'institutional trading',
  ],
  authors: [{ name: 'SMC Signal Pro' }],
  creator: 'SMC Signal Pro',
  openGraph: {
    type: 'website',
    title: 'SMC SIGNAL — Trade Smarter with Smart Money Concepts',
    description:
      'Institutional-grade trading analysis with SMC order blocks, AI signals, backtesting, and paper trading.',
    siteName: 'SMC SIGNAL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SMC SIGNAL — Trade Smarter',
    description: 'Institutional SMC analysis platform for serious traders.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A0B0D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body className="min-h-screen bg-[#0A0B0D] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
