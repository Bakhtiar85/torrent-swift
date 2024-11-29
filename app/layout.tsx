import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GoogleAnalytics from './components/analytics/GoogleAnalytics'
import Header from './components/homepage/Header'
import Footer from './components/homepage/Footer'

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
      <body className={inter.className}>
        <main className="flex min-h-screen flex-col items-center justify-between p-1 sm:p-4 md:px-10 md:py-3 bg-gray-900 text-white">
          <Header />

          {children}

          <Footer />
        </main>
      </body>
    </html>
  )
}
