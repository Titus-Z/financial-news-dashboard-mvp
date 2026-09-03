import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signal Desk — Trustworthy Financial News Inbox',
  description: 'An evidence-first dashboard that compresses public financial headlines into persistent, explainable stories.',
  openGraph: {
    type: 'website',
    title: 'Signal Desk — Trustworthy Financial News Inbox',
    description: 'Trustworthy financial news, compressed into stories.',
    siteName: 'Signal Desk',
    images: [{
      url: 'https://raw.githubusercontent.com/Titus-Z/financial-news-dashboard-mvp/main/public/og.png',
      width: 1200,
      height: 630,
      alt: 'Signal Desk trustworthy financial news dashboard',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Signal Desk — Trustworthy Financial News Inbox',
    description: 'Trustworthy financial news, compressed into stories.',
    images: ['https://raw.githubusercontent.com/Titus-Z/financial-news-dashboard-mvp/main/public/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
