import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgenticLanding AI - AI-Powered Landing Page Generation',
  description: 'Transform campaign context into high-converting, brand-compliant landing pages with AI-driven insights and real-time optimization.',
  keywords: ['AI landing pages', 'brand compliance', 'conversion optimization', 'automated content generation'],
  authors: [{ name: 'AgenticLanding AI' }],
  openGraph: {
    title: 'AgenticLanding AI',
    description: 'AI-powered landing page generation platform',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}