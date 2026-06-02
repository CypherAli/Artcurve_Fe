'use client'

// ─────────────────────────────────────────────────────────────────
//  EcosystemSection.tsx  —  Infrastructure / Trust Signals
//
//  Cream bg (#FDFBF7) minimal trust section.
//  No header — just marquee rows + trust badges.
//
//  Marquee:
//    • Row 1 scrolls LEFT  (marquee-left,  35s, infinite)
//    • Row 2 scrolls RIGHT (marquee-right, 28s, infinite)
//    • Each row duplicates its item list twice for seamless loop
//    • CSS @keyframes injected via <style> JSX tag
//    • Items separated by gold diamond ◆
//
//  Trust badges: 3 centered items with SVG circle icons
// ─────────────────────────────────────────────────────────────────

import { useRef } from 'react'

// ── Marquee content ───────────────────────────────────────────────
const ROW_1_ITEMS = [
  'BASE',
  'ETHEREUM',
  'CERTIK',
  'OPENZEPPELIN',
  'BASE MAINNET',
  'IPFS',
  'CHAINLINK',
  'ALCHEMY',
]

const ROW_2_ITEMS = [
  'SMART CONTRACT AUDIT',
  'DECENTRALIZED',
  'NON-CUSTODIAL',
  'ON-CHAIN',
  'PERMISSIONLESS',
  'TRUSTLESS',
  'IMMUTABLE',
]

// ── Trust badge data ──────────────────────────────────────────────
const TRUST_BADGES = [
  { label: 'Built on Base' },
  { label: 'Audited by CertiK' },
  { label: 'Powered by Ethereum' },
]

// ── MarqueeRow ────────────────────────────────────────────────────
function MarqueeRow({
  items,
  direction,
  duration,
}: {
  items:     string[]
  direction: 'left' | 'right'
  duration:  number
}) {
  const allItems = [...items, ...items]

  return (
    <div
      className="overflow-hidden select-none"
      aria-hidden="true"
    >
      <div
        className="flex items-center whitespace-nowrap"
        style={{
          animation: `marquee-${direction} ${duration}s linear infinite`,
          width: 'max-content',
        }}
      >
        {allItems.map((item, i) => (
          <span key={i} className="inline-flex items-center">
            <span
              className="font-mono text-[11px] tracking-[0.3em] uppercase"
              style={{ color: 'rgba(26,26,26,0.50)' }}
            >
              {item}
            </span>
            <span
              className="mx-5 text-[8px]"
              style={{ color: 'rgba(201,169,110,0.40)' }}
            >
              ◆
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── TrustBadge ────────────────────────────────────────────────────
function TrustBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
        <circle cx="4" cy="4" r="4" fill="#C9A96E" fillOpacity="0.55" />
      </svg>
      <span
        className="text-[10px] tracking-[0.28em] uppercase"
        style={{ color: '#7A7570' }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Main Section ──────────────────────────────────────────────────
export function EcosystemSection() {
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#FDFBF7] pt-0 pb-5 overflow-hidden"
      aria-label="Infrastructure"
    >
      <style>{`
        @keyframes marquee-left {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
      `}</style>

      <div className="relative z-10 max-w-[1400px] mx-auto">

        {/* ── Marquee block ────────────────────────────────────────── */}
        <div>
          {/* Top divider */}
          <div className="h-px bg-[#E4DDD3]" aria-hidden="true" />

          {/* Row 1 — scrolls LEFT, 35s */}
          <div className="py-3">
            <MarqueeRow items={ROW_1_ITEMS} direction="left" duration={35} />
          </div>

          {/* Middle divider */}
          <div className="h-px bg-[#E4DDD3]" aria-hidden="true" />

          {/* Row 2 — scrolls RIGHT, 28s */}
          <div className="py-3">
            <MarqueeRow items={ROW_2_ITEMS} direction="right" duration={28} />
          </div>

          {/* Bottom divider */}
          <div className="h-px bg-[#E4DDD3]" aria-hidden="true" />
        </div>

        {/* ── Trust badges ─────────────────────────────────────────── */}
        <div className="px-6 md:px-16 lg:px-24 mt-4 flex items-center justify-center gap-0">
          {TRUST_BADGES.map((badge, i) => (
            <div key={badge.label} className="flex items-center">
              <TrustBadge label={badge.label} />
              {i < TRUST_BADGES.length - 1 && (
                <div
                  className="mx-6 w-px h-3 self-center"
                  style={{ background: '#E4DDD3' }}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
