'use client'

// ─────────────────────────────────────────────────────────────────
//  BelowFoldSections.tsx  —  Client wrapper for lazy-loaded sections
//
//  next/dynamic with ssr:false is only allowed in Client Components.
//  This wrapper owns all below-fold imports so the hero bundle stays
//  lean and each section's GSAP code is parsed on-demand.
//
//  IMPORTANT: Because these sections mount after window.load, we must
//  call ScrollTrigger.refresh() once after all sections are rendered
//  so every trigger gets correct page-height coordinates.
// ─────────────────────────────────────────────────────────────────

import dynamic    from 'next/dynamic'
import { useEffect } from 'react'
import { ScrollTrigger } from '@/lib/gsap'

const HowItWorksSection        = dynamic(() => import('@/components/home/HowItWorksSection').then(m => ({ default: m.HowItWorksSection })),              { ssr: false })
const CuratedGallerySection    = dynamic(() => import('@/components/home/CuratedGallerySection').then(m => ({ default: m.CuratedGallerySection })),      { ssr: false })
const LiveActivitySection      = dynamic(() => import('@/components/home/LiveActivitySection').then(m => ({ default: m.LiveActivitySection })),          { ssr: false })
const TopCreatorsSection       = dynamic(() => import('@/components/home/TopCreatorsSection').then(m => ({ default: m.TopCreatorsSection })),            { ssr: false })
const ConvergenceGallery       = dynamic(() => import('@/components/home/ConvergenceGallery').then(m => ({ default: m.ConvergenceGallery })),            { ssr: false })
const ProtocolAnalyticsSection = dynamic(() => import('@/components/home/ProtocolAnalyticsSection').then(m => ({ default: m.ProtocolAnalyticsSection })), { ssr: false })
const EcosystemSection         = dynamic(() => import('@/components/home/EcosystemSection').then(m => ({ default: m.EcosystemSection })),                { ssr: false })
const CryptoCarousel           = dynamic(() => import('@/components/home/CryptoCarousel').then(m => ({ default: m.CryptoCarousel })),                    { ssr: false })
const GrandCTASection          = dynamic(() => import('@/components/home/GrandCTASection').then(m => ({ default: m.GrandCTASection })),                  { ssr: false })

const HEADER_H = 80

function StickyLine() {
  return (
    <div
      className="sticky z-40 pointer-events-none"
      style={{ top: HEADER_H }}
      aria-hidden="true"
    >
      <div className="w-full h-[2px] bg-[var(--ac-ink)]/60" />
      <div
        className="w-full h-12"
        style={{ background: 'linear-gradient(to bottom, rgba(var(--ac-ink-rgb),0.04) 0%, transparent 100%)' }}
      />
    </div>
  )
}

export function BelowFoldSections() {
  // After all dynamic sections mount, recalculate every ScrollTrigger
  // so their start/end positions reflect the real page height.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <>
      {/* ── 2. How It Works ────────────────────────────────────── */}
      <div id="how-it-works">
        <StickyLine />
        <HowItWorksSection />
      </div>

      {/* ── 3. Curated Gallery ─────────────────────────────────── */}
      <div>
        <StickyLine />
        <CuratedGallerySection />
      </div>

      {/* ── 4. LiveActivity wipes → TopCreators beneath ─────────── */}
      <div>
        <StickyLine />
        <div data-wipe-zone="">
          <div style={{ position: 'sticky', top: HEADER_H, zIndex: 20 }}>
            <LiveActivitySection />
          </div>
          <TopCreatorsSection />
        </div>
      </div>

      {/* ── 5. Convergence Gallery ─────────────────────────────── */}
      <ConvergenceGallery />

      {/* ── 6. Protocol Analytics ──────────────────────────────── */}
      <div>
        <StickyLine />
        <div style={{ marginTop: '-48px' }}>
          <ProtocolAnalyticsSection />
        </div>
      </div>

      {/* ── 7. Ecosystem ───────────────────────────────────────── */}
      <div>
        <StickyLine />
        <div style={{ marginTop: '-48px' }}>
          <EcosystemSection />
        </div>
      </div>

      {/* ── 7b. Live Crypto Carousel ────────────────────────────── */}
      <CryptoCarousel />

      {/* ── 8. Grand CTA + Footer ──────────────────────────────── */}
      <div>
        <StickyLine />
        <div style={{ marginTop: '-48px' }}>
          <GrandCTASection />
        </div>
      </div>
    </>
  )
}
