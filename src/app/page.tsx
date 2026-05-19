// ─────────────────────────────────────────────────────────────────
//  page.tsx  —  Homepage  (Server Component)
// ─────────────────────────────────────────────────────────────────

import { Header }                      from '@/components/layout/Header'
import { HeroSection }                 from '@/components/sections/HeroSection'
import { HowItWorksSection }           from '@/components/sections/HowItWorksSection'
import { CuratedGallerySection }       from '@/components/sections/CuratedGallerySection'
import { LiveActivitySection }         from '@/components/sections/LiveActivitySection'
import { TopCreatorsSection }          from '@/components/sections/TopCreatorsSection'
import { ConvergenceGallery }          from '@/components/sections/ConvergenceGallery'
import { ProtocolAnalyticsSection }    from '@/components/sections/ProtocolAnalyticsSection'
import { EcosystemSection }            from '@/components/sections/EcosystemSection'
import { GrandCTASection }             from '@/components/sections/GrandCTASection'

const HEADER_H = 80

function StickyLine() {
  return (
    <div
      className="sticky z-40 pointer-events-none"
      style={{ top: HEADER_H }}
      aria-hidden="true"
    >
      <div className="w-full h-[2px] bg-[#1A1A1A]/60" />
      <div
        className="w-full h-12"
        style={{ background: 'linear-gradient(to bottom, rgba(26,26,26,0.04) 0%, transparent 100%)' }}
      />
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <Header />

      {/* ── 1. Hero ────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── 2. How It Works ────────────────────────────────────── */}
      <div>
        <StickyLine />
        <HowItWorksSection />
      </div>

      {/* ── 3. Curated Gallery ─────────────────────────────────── */}
      <div>
        <StickyLine />
        <CuratedGallerySection />
      </div>

      {/* ── 3 + 4. LiveActivity wipes → TopCreators beneath ─────── */}
      <div>
        <StickyLine />
        <div data-wipe-zone="">
          <div style={{ position: 'sticky', top: HEADER_H, zIndex: 20 }}>
            <LiveActivitySection />
          </div>
          <TopCreatorsSection />
        </div>
      </div>

{/* ── 5b. Convergence Gallery ────────────────────────────── */}
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
