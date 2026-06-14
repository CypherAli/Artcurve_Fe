'use client'

// ─────────────────────────────────────────────────────────────────
//  ArtCard.tsx  | "Neo-Luxury Trading Floor" Card
//
//  Design law: ART and DATA never mix.
//    · Top half  → full-bleed square image, ZERO overlays
//    · Bottom half → data terminal: ticker / market cap / curve bar
//
//  Phase is communicated via a 3px left-edge accent |the same
//  convention used on Bloomberg / TradingView watchlist rows.
//
//  FOMO Weapon = bonding curve progress bar. Seeing "85% TO
//  GRADUATION" in gold mono triggers urgency without gimmick.
// ─────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────
export type Phase = 'Accumulation' | 'FOMO' | 'Migration'

export interface ArtCardData {
  id:             number
  title:          string
  ticker:         string     // e.g. "$NOCTURNE"
  artist:         string
  phase:          Phase
  marketCap:      number     // raw ETH number (for sorting)
  marketCapLabel: string     // display "2.45 ETH"
  change24h:      string     // "+18.4%" or "-3.2%"
  changePositive: boolean
  progress:       number     // 0–100, bonding curve completion
  image:          string
}

// ── Phase accent colors ────────────────────────────────────────────
export const PHASE_COLOR: Record<Phase, string> = {
  Accumulation: '#4ade80',
  FOMO:         '#D4AF37',
  Migration:    '#f87171',
}

// ── Framer Motion variants (consumed by parent container too) ──────
export const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y:       0,
    transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
}

// ── Component ──────────────────────────────────────────────────────
export function ArtCard({
  data,
  onCollect,
}: {
  data:      ArtCardData
  onCollect: (data: ArtCardData) => void
}) {
  const phaseColor = PHASE_COLOR[data.phase]
  const graduated  = data.progress >= 100

  return (
    <motion.article
      variants={cardVariants}
      onClick={() => onCollect(data)}
      aria-label={`${data.title} |${data.marketCapLabel}`}
      className="group relative rounded-sm overflow-hidden cursor-pointer select-none
                 transition-[border-color,box-shadow] duration-300
                 border border-white/10 bg-[#111111]
                 hover:border-[#D4AF37]/50 hover:shadow-[0_0_32px_-8px_rgba(212,175,55,0.15)]"
    >
      {/* ── Phase accent  (3px left edge |trading terminal convention) ─── */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-[3px] z-10"
        style={{ background: phaseColor }}
      />

      {/* ─────────────────────────────────────────────────────────────
          ART ZONE |ABSOLUTELY CLEAN
          Rule: no badge, no text, no gradient, no overlay of any kind.
          The artwork speaks for itself.
      ───────────────────────────────────────────────────────────── */}
      <div className="aspect-square w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.image}
          alt={data.title}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="w-full h-full object-cover
                     transition-transform duration-700 ease-out
                     group-hover:scale-105"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DATA TERMINAL
          Three rows of financial data |clean mono / serif typography.
          Nothing decorative, everything meaningful.
      ───────────────────────────────────────────────────────────── */}
      <div
        className="p-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >

        {/* ── Row 1: Title  +  Ticker symbol ── */}
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className="font-light truncate leading-snug"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize:   '1.05rem',
              color:      'var(--ac-paper)',
            }}
          >
            {data.title}
          </h3>
          <span
            className="font-mono text-[9.5px] shrink-0 tracking-wide"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {data.ticker}
          </span>
        </div>

        {/* ── Row 2: Market Cap  |  24h Change ── */}
        <div className="flex items-end justify-between mt-3">
          <div>
            <p
              className="text-[8px] uppercase tracking-[0.22em] mb-[3px]"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              Market Cap
            </p>
            <p
              className="font-mono leading-none"
              style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.88)' }}
            >
              {data.marketCapLabel}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-[8px] uppercase tracking-[0.22em] mb-[3px]"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              24h
            </p>
            <p
              className="font-mono leading-none"
              style={{
                fontSize: '0.95rem',
                color:    data.changePositive ? '#4ade80' : '#f87171',
              }}
            >
              {data.change24h}
            </p>
          </div>
        </div>

        {/* ── Row 3: Bonding Curve Progress |"The FOMO Weapon" ── */}
        <div className="mt-4">
          {/* Label row: progress text  +  phase label */}
          <div className="flex items-center justify-between mb-[7px]">
            <span
              className="font-mono uppercase tracking-[0.16em]"
              style={{
                fontSize: '9px',
                color:    graduated ? '#4ade80' : '#D4AF37',
              }}
            >
              {graduated ? '✦ GRADUATED' : `${data.progress}% TO GRADUATION`}
            </span>
            <span
              className="text-[7.5px] uppercase tracking-[0.18em]"
              style={{ color: phaseColor }}
            >
              {data.phase}
            </span>
          </div>

          {/* Progress track */}
          <div
            className="h-[5px] w-full rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width:      `${Math.min(data.progress, 100)}%`,
                background: graduated
                  ? '#4ade80'
                  : 'linear-gradient(90deg, #D4AF37, #F3E5AB)',
              }}
            />
          </div>
        </div>

      </div>
    </motion.article>
  )
}
