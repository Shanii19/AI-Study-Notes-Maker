import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '✍🏻 AI Study Notes Maker',
  description: 'Generate clean study notes from YouTube videos, PDFs, documents, and more',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

