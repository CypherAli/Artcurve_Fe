'use client'

// ─────────────────────────────────────────────────────────────────
//  ProtocolAnalyticsSection.tsx  —  Protocol Analytics
//
//  Compact 3-column horizontal layout.
//  Each stat: thin top bar accent, animated counter, label below.
//  Entrance: columns fade-up stagger + counter on enter.
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { gsap }              from 'gsap'
import { ScrollTrigger }     from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STATS = [
  {
    key:     'tvl',
    value:   847.2,
    suffix:  'ETH',
    label:   'Total Value Locked',
    sub:     'Smart Contract Vault',
    decimal: true,
    change:  '+12.4%',
    up:      true,
  },
  {
    key:     'minted',
    value:   3241,
    suffix:  'works',
    label:   'Total Minted',
    sub:     'Unique On-Chain',
    decimal: false,
    change:  '+284',
    up:      true,
  },
  {
    key:     'holders',
    value:   9180,
    suffix:  'wallets',
    label:   'Holders',
    sub:     'Active Collectors',
    decimal: false,
    change:  '+1.2K',
    up:      true,
  },
] as const

export function ProtocolAnalyticsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const labelRef   = useRef<HTMLParagraphElement>(null)
  const colRefs    = useRef<(HTMLDivElement | null)[]>([])
  const numRefs    = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    gsap.set(labelRef.current, { autoAlpha: 0, y: 10 })
    gsap.set(colRefs.current.filter(Boolean), { autoAlpha: 0, y: 24 })

    const ctx = gsap.context(() => {

      // Eyebrow
      gsap.to(labelRef.current, {
        autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      })

      // Columns stagger fade-up
      gsap.to(colRefs.current.filter(Boolean), {
        autoAlpha: 1, y: 0, duration: 0.65, ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', once: true },
      })

      // Counters
      colRefs.current.forEach((col, i) => {
        if (!col) return
        const numEl = numRefs.current[i]
        const stat  = STATS[i]

        ScrollTrigger.create({
          trigger: col,
          start:   'top 85%',
          once:    true,
          onEnter: () => {
            if (!numEl) return
            const proxy = { val: 0 }
            gsap.to(proxy, {
              val:      stat.value,
              duration: 1.8,
              ease:     'power2.out',
              delay:    i * 0.1,
              onUpdate() {
                numEl.textContent = stat.decimal
                  ? proxy.val.toFixed(1)
                  : Math.floor(proxy.val).toLocaleString()
              },
            })
          },
        })
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#0F0F0F] py-10 px-6 md:px-16 lg:px-24 overflow-hidden"
      aria-label="Protocol Analytics"
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-32 -right-32 size-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #C9A96E 0%, transparent 65%)', opacity: 0.05 }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1400px] mx-auto">

        {/* Eyebrow + top rule */}
        <div className="flex items-center gap-5 mb-8">
          <p ref={labelRef} className="text-[10px] tracking-[0.42em] uppercase text-[#C9A96E] shrink-0">
            Protocol Analytics
          </p>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          {/* Live pulse indicator */}
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-60" />
              <span className="relative inline-flex rounded-full size-1.5 bg-[#4ade80]" />
            </span>
            <span className="text-[9px] tracking-[0.25em] uppercase text-white/20">Live</span>
          </span>
        </div>

        {/* ── 3-column stat grid ───────────────────────────────────── */}
        <div className="grid grid-cols-3 divide-x divide-white/[0.07]">
          {STATS.map((stat, i) => (
            <div
              key={stat.key}
              ref={el => { colRefs.current[i] = el }}
              className={`flex flex-col gap-3 ${i === 0 ? 'pr-10' : i === 1 ? 'px-10' : 'pl-10'}`}
            >
              {/* Thin top accent bar */}
              <div
                className="h-[2px] w-12"
                style={{ background: 'linear-gradient(90deg, #C9A96E, transparent)' }}
              />

              {/* Number */}
              <div
                className="font-light text-white leading-none"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize:   'clamp(2.2rem, 3.8vw, 4rem)',
                }}
              >
                <span ref={el => { numRefs.current[i] = el }}>0</span>
                <span
                  className="text-[#C9A96E] ml-2"
                  style={{ fontSize: '0.38em', letterSpacing: '0.1em' }}
                >
                  {stat.suffix}
                </span>
              </div>

              {/* Label + change badge */}
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] tracking-[0.28em] uppercase text-white/45">
                    {stat.label}
                  </p>
                  <p className="font-mono text-[8px] text-white/18 mt-0.5 tracking-wide">
                    {stat.sub}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[9px] tracking-wider font-mono px-1.5 py-0.5 rounded-sm"
                  style={{
                    color:      stat.up ? '#4ade80' : '#f87171',
                    background: stat.up ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
                  }}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom quote */}
        <div
          className="mt-8 pt-6 flex items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p
            className="font-light italic text-white/18"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize:   'clamp(0.9rem, 1.4vw, 1.15rem)',
            }}
          >
            "Every transaction is a vote. The curve is democracy."
          </p>
          <p className="shrink-0 font-mono text-[9px] text-white/15 tracking-widest">
            UPDATED LIVE
          </p>
        </div>

      </div>
    </section>
  )
}
