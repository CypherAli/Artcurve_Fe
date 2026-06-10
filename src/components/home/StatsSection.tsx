'use client'

// ─────────────────────────────────────────────────────────────────
//  StatsSection.tsx
//
//  Dark charcoal section showing platform statistics.
//  Numbers use CountUp animation via GSAP + ScrollTrigger.
//  Background uses mouse-parallax subtle layer effect.
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { useLanguage } from '@/context/LanguageContext'

type StatItem = { value: number; suffix: string; label: string; prefix: string }

function StatCard({
  value,
  suffix,
  label,
  prefix,
  index,
}: StatItem & { index: number }) {
  const numRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!numRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      numRef.current.textContent = String(value)
      return
    }

    const obj = { val: 0 }
    const isDecimal = String(value).includes('.')

    gsap.to(obj, {
      val:      value,
      duration: 2,
      ease:     'power2.out',
      scrollTrigger: {
        trigger: numRef.current,
        start:   'top 80%',
        once:    true,
      },
      onUpdate() {
        if (!numRef.current) return
        numRef.current.textContent = isDecimal
          ? obj.val.toFixed(1)
          : Math.floor(obj.val).toLocaleString()
      },
    })
  }, [value])

  return (
    <div
      className="flex flex-col gap-3 p-8 border-r border-white/10 last:border-r-0"
      data-reveal-item
    >
      <div
        className="text-[clamp(2.5rem,6vw,4.5rem)]/none font-light text-white"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {prefix}
        <span ref={numRef}>0</span>
        <span className="text-[#C9A96E] ml-1">{suffix}</span>
      </div>
      <p className="text-xs tracking-[0.3em] uppercase text-white/40 font-light">
        {label}
      </p>
    </div>
  )
}

export function StatsSection() {
  const { t } = useLanguage()

  const STATS: StatItem[] = [
    { value: 2847,   suffix: '+',  label: t.home.statArtworks,   prefix: '' },
    { value: 12.4,   suffix: 'M',  label: t.home.statVolume,      prefix: '' },
    { value: 8300,   suffix: '+',  label: t.home.statCollectors,  prefix: '' },
    { value: 99.8,   suffix: '%',  label: t.home.statUptime,      prefix: '' },
  ]

  return (
    <section
      className="relative bg-[var(--ac-ink)] py-24 px-6 md:px-16 lg:px-24 overflow-hidden"
      aria-label="Platform statistics"
      data-mouse-parallax
    >
      {/* Background accent — subtle gold gradient blob */}
      <div
        className="absolute -top-32 -right-32 size-[500px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #C9A96E 0%, transparent 70%)',
        }}
        data-mouse-depth="0.03"
        aria-hidden="true"
      />

      {/* Section label */}
      <p
        className="mb-12 text-xs tracking-[0.35em] uppercase text-[#C9A96E]"
        data-reveal="fade-up"
      >
        {t.home.statsLabel}
      </p>

      {/* Stats grid */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 border border-white/10"
        data-reveal-group
      >
        {STATS.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>

      {/* Decorative quote */}
      <blockquote
        className="mt-16 max-w-2xl text-[clamp(1.25rem,3vw,2rem)]/[1.4] font-light text-white/30 italic"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
        data-reveal="fade-up"
        data-reveal-delay="0.2"
      >
        &ldquo;{t.home.statsQuote}&rdquo;
      </blockquote>
    </section>
  )
}
