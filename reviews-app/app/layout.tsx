import type { Metadata } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-jost',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Share Your Experience — Num Num's Bakery",
  description: 'Let us know how we did. Your feedback helps us bake it better every time.',
  icons: {
    icon: '/review/favicon-brand.png',
    apple: '/review/favicon-brand.png',
  },
  openGraph: {
    title: "Share Your Experience — Num Num's Bakery",
    description: 'Let us know how we did. Your feedback helps us bake it better every time.',
    url: 'https://numnumsbakery.com.au/review',
    siteName: "Num Num's Bakery",
    images: [
      {
        url: 'https://numnumsbakery.com.au/review/og-review.jpg',
        width: 1200,
        height: 630,
        alt: "Num Num's Bakery — Share your experience",
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Share Your Experience — Num Num's Bakery",
    description: 'Let us know how we did. Your feedback helps us bake it better every time.',
    images: ['https://numnumsbakery.com.au/review/og-review.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  )
}
