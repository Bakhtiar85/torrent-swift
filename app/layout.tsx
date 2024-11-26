import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GoogleAnalytics from './components/analytics/GoogleAnalytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Torrent Swift',
  description: 'Torrent Swift! An app for downloading torrent files.',
  icons: {
    icon: '/favicon.ico',
    apple: 'favicon_io/apple-touch-icon.png',
    other: [
      { rel: 'icon', type: 'image/png', sizes: '512x512', url: 'favicon_io/favicon-512x512.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', url: 'favicon_io/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', url: 'favicon_io/favicon-16x16.png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <GoogleAnalytics />
      <body className={inter.className}>{children}</body>
    </html>
  )
}
