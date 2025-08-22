import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/blog.css'
import { AuthProvider } from '@/lib/auth-context'
import CookieConsent from '@/components/CookieConsent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Project X - Moderne boligløsninger',
  description: 'Digital platform for udlejere og lejere med sikre betalingsløsninger, depositum-håndtering og kommunikation.',
  keywords: ['bolig', 'udlejning', 'depositum', 'Depositums Box', 'digitale løsninger'],
  authors: [{ name: 'Project X Team' }],
  creator: 'Project X',
  publisher: 'Project X',
  metadataBase: new URL('https://projectx.dk'),
  alternates: {
    canonical: '/',
    languages: {
      'da-DK': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'da_DK',
    url: 'https://projectx.dk',
    siteName: 'Project X',
    title: 'Project X - Moderne boligløsninger',
    description: 'Digital platform for udlejere og lejere med sikre betalingsløsninger, depositum-håndtering og kommunikation.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="da">
      <head>
        <link rel="alternate" type="application/rss+xml" title="Project X Blog RSS" href="/blog/rss.xml" />
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  )
}