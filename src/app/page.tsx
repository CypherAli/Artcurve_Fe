// ─────────────────────────────────────────────────────────────────
//  page.tsx  —  Homepage  (Server Component)
// ─────────────────────────────────────────────────────────────────

import { Header }             from '@/components/layout/Header'
import { HeroSection }        from '@/components/sections/HeroSection'
import { BelowFoldSections }  from '@/components/layout/BelowFoldSections'

export default function HomePage() {
  return (
    <>
      <Header />

      {/* ── 1. Hero — SSR, above the fold ──────────────────────── */}
      <HeroSection />

      {/* ── 2–8. Below fold — lazily loaded Client Component ───── */}
      <BelowFoldSections />
    </>
  )
}
