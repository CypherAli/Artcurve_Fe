// ─────────────────────────────────────────────────────────────────
//  layout.tsx  —  Root App Shell  (Server Component)
//
//  Provider stack (outermost → innermost):
//    SmoothScrollProvider  — Lenis + GSAP (client)
//    Web3Provider          — Wagmi + RainbowKit (client)
//
//  Fonts:
//    - Cormorant Garamond (serif, display headings)
//    - Inter (sans-serif, body)
//  Both loaded via next/font/google — zero layout shift.
// ─────────────────────────────────────────────────────────────────

import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { SmoothScrollProvider }  from '@/providers/SmoothScrollProvider'
import { Web3Provider }          from '@/providers/Web3Provider'
import { ToastContainer }        from '@/components/common/Toast'
import { LanguageProvider }      from '@/context/LanguageContext'
import './globals.css'

// ── Font configuration ────────────────────────────────────────────

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
})

const cormorant = Cormorant_Garamond({
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600'],
  style:    ['normal', 'italic'],
  variable: '--font-cormorant',
  display:  'swap',
})

// ── Metadata ──────────────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://artcurve.io'
  ),
  title: {
    default:  'ArtCurve — On-Chain Art Trading',
    template: '%s | ArtCurve',
  },
  description: 'Trade fractionalised art on a bonding curve DEX. Discover, collect, and speculate on digital artworks tokenised on Base.',
  keywords: ['NFT', 'art', 'bonding curve', 'DeFi', 'Base', 'Web3', 'trading'],
  authors: [{ name: 'ArtCurve' }],
  openGraph: {
    type:        'website',
    locale:      'en_US',
    url:         'https://artcurve.io',
    siteName:    'ArtCurve',
    title:       'ArtCurve — On-Chain Art Trading',
    description: 'Trade fractionalised art on a bonding curve DEX on Base.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ArtCurve' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'ArtCurve — On-Chain Art Trading',
    description: 'Trade fractionalised art on a bonding curve DEX on Base.',
    images:      ['/og-image.png'],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#070707',
}

// ── Root Layout ───────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // suppressHydrationWarning prevents mismatch from theme/Lenis class toggling
      suppressHydrationWarning
      className={`${inter.variable} ${cormorant.variable}`}
    >
      <body className="min-h-dvh bg-[#FDFBF7] text-[#1A1A1A] antialiased">
        <LanguageProvider>
        <SmoothScrollProvider>
          <Web3Provider>
            {/* Accessibility: skip to main content */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#C9A96E] focus:text-[#1A1A1A]"
            >
              Skip to content
            </a>


            <main id="main-content">
              {children}
            </main>
            <ToastContainer />
          </Web3Provider>
        </SmoothScrollProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
