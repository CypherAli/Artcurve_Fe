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

import type { Metadata }      from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { SmoothScrollProvider } from '@/providers/SmoothScrollProvider'
import { Web3Provider }         from '@/providers/Web3Provider'
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
    default:  'ArtCurve — Where Art Meets the Blockchain',
    template: '%s | ArtCurve',
  },
  description:
    'Trade unique artworks as bonding-curve tokens on Base. ' +
    'Every brushstroke has a price. Every collector shapes the curve.',
  keywords: ['NFT', 'art', 'blockchain', 'Base', 'DeFi', 'bonding curve', 'Web3'],
  openGraph: {
    type:        'website',
    siteName:    'ArtCurve',
    title:       'ArtCurve — Where Art Meets the Blockchain',
    description: 'Trade unique artworks as bonding-curve tokens on Base.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'ArtCurve',
    description: 'Trade unique artworks as bonding-curve tokens on Base.',
  },
  robots: { index: true, follow: true },
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
          </Web3Provider>
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
