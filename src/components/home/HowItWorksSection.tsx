'use client'

// ─────────────────────────────────────────────────────────────────
//  HowItWorksSection.tsx  —  Scroll-driven split-screen
//
//  Pure GSAP (no Framer Motion useScroll) so it stays in sync with
//  the Lenis smooth-scroll driver wired in SmoothScrollProvider.
//
//  Layout: h-[300vh] container → sticky h-screen split 43% / 57%
//  Left:   progress bar, eyebrow, heading, 3 step items
//  Right:  LED-blue bonding curve SVG animated on scroll
//
//  GSAP timeline (total duration 1.0) scrubbed to scroll:
//    Path draw      0 → 0.88
//    Step 1 active  0 → 0.22  (fades 0.22 → 0.30)
//    Step 2 active  0.24 → 0.32 (fade in)  0.50 → 0.58 (fade out)
//    Step 3 active  0.52 → 0.60 (fade in)  stays bright
//    Crosshair      0.42 → 0.58
//    Labels         0.58 → 0.74
//    Arrow onUpdate: moves along path via getPointAtLength()
// ─────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { useLanguage } from '@/context/LanguageContext'

// ── SVG path definition ───────────────────────────────────────────
const CURVE_D =
  'M 40 375 C 75 370 118 360 162 336 C 206 311 240 276 278 234 C 314 194 340 148 368 92 C 386 55 400 22 418 -22'
const AREA_D =
  'M 40 375 C 75 370 118 360 162 336 C 206 311 240 276 278 234 C 314 194 340 148 368 92 C 386 55 400 22 418 -22 L 418 375 Z'

// ── Main Section ──────────────────────────────────────────────────
export function HowItWorksSection() {
  const { t } = useLanguage()

  const STEPS = [
    { num: '01', title: t.home.step1Title, body: t.home.step1Desc },
    { num: '02', title: t.home.step2Title, body: t.home.step2Desc },
    { num: '03', title: t.home.step3Title, body: t.home.step3Desc },
  ]

  const containerRef   = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const stepRefs       = useRef<(HTMLDivElement | null)[]>([])

  // SVG element refs
  const pathRef       = useRef<SVGPathElement>(null)
  const areaRef       = useRef<SVGPathElement>(null)
  const crossHRef     = useRef<SVGLineElement>(null)
  const crossVRef     = useRef<SVGLineElement>(null)
  const crossDotRef   = useRef<SVGCircleElement>(null)
  const labelsRef     = useRef<SVGGElement>(null)
  const arrowGroupRef = useRef<SVGGElement>(null)
  const glowCircleRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const path      = pathRef.current
    if (!container || !path) return

    const totalLen = path.getTotalLength()

    // ── Initial states ──────────────────────────────────────────
    gsap.set(path, { strokeDasharray: totalLen, strokeDashoffset: totalLen })
    gsap.set(areaRef.current,     { opacity: 0 })
    gsap.set([crossHRef.current, crossVRef.current, crossDotRef.current], { opacity: 0 })
    gsap.set(labelsRef.current,   { opacity: 0 })

    // Steps: step 1 starts fully bright, 2+3 start dim
    gsap.set(stepRefs.current[0], { opacity: 1 })
    gsap.set(stepRefs.current[1], { opacity: 0.3 })
    gsap.set(stepRefs.current[2], { opacity: 0.3 })

    // Arrow: place at curve start
    const pt0 = path.getPointAtLength(0)
    gsap.set(arrowGroupRef.current,  { attr: { transform: `translate(${pt0.x},${pt0.y}) rotate(82)` } })
    gsap.set(glowCircleRef.current,  { attr: { cx: pt0.x, cy: pt0.y } })
    gsap.set(progressBarRef.current, { width: '0%' })

    const ctx = gsap.context(() => {

      // ── Master scrubbed timeline (total duration = 1.0) ─────
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start:   'top top',
          end:     'bottom bottom',
          scrub:   0.6,
        },
      })

      // Path draw  0 → 0.88
      tl.to(path, { strokeDashoffset: 0, ease: 'none', duration: 0.88 }, 0)
      // Area fill  0 → 0.88
      tl.to(areaRef.current, { opacity: 1, ease: 'none', duration: 0.88 }, 0)
      // Progress bar  0 → 1.0  (sets total timeline duration to 1.0)
      tl.to(progressBarRef.current, { width: '100%', ease: 'none', duration: 1.0 }, 0)

      // Step 1: dim  0.22 → 0.30
      tl.to(stepRefs.current[0], { opacity: 0.3, ease: 'none', duration: 0.08 }, 0.22)

      // Step 2: bright 0.24 → 0.32, then dim 0.50 → 0.58
      tl.to(stepRefs.current[1], { opacity: 1,   ease: 'none', duration: 0.08 }, 0.24)
      tl.to(stepRefs.current[1], { opacity: 0.3, ease: 'none', duration: 0.08 }, 0.50)

      // Step 3: bright 0.52 → 0.60, stays bright
      tl.to(stepRefs.current[2], { opacity: 1,   ease: 'none', duration: 0.08 }, 0.52)

      // Crosshair: appears 0.42 → 0.58
      tl.to(
        [crossHRef.current, crossVRef.current, crossDotRef.current],
        { opacity: 0.7, ease: 'none', duration: 0.16 },
        0.42,
      )

      // Labels: appear 0.58 → 0.74
      tl.to(labelsRef.current, { opacity: 1, ease: 'none', duration: 0.16 }, 0.58)

      // ── Arrow position — live onUpdate (no scrub lag needed) ─
      ScrollTrigger.create({
        trigger: container,
        start:   'top top',
        end:     'bottom bottom',
        onUpdate(self) {
          const progress    = Math.min(self.progress, 0.88)
          const len         = (progress / 0.88) * totalLen
          const pt          = path.getPointAtLength(len)
          const eps         = Math.min(4, totalLen - len - 0.01)
          const pt2         = path.getPointAtLength(len + eps)
          const rot         = Math.atan2(pt2.x - pt.x, -(pt2.y - pt.y)) * 180 / Math.PI

          arrowGroupRef.current?.setAttribute(
            'transform',
            `translate(${pt.x},${pt.y}) rotate(${rot})`,
          )
          glowCircleRef.current?.setAttribute('cx', String(pt.x))
          glowCircleRef.current?.setAttribute('cy', String(pt.y))
        },
      })

    }, container)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="relative h-[300vh] bg-[var(--ac-paper)]">

      {/* Technical grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(var(--ac-ink-rgb),0.042) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--ac-ink-rgb),0.042) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
        aria-hidden="true"
      />

      {/* ── Sticky split-screen ──────────────────────────────────── */}
      <div className="sticky top-0 h-screen flex overflow-hidden">

        {/* ══ LEFT ════════════════════════════════════════════════ */}
        <div className="w-[43%] shrink-0 flex flex-col justify-center pl-12 md:pl-20 pr-8 py-14">

          {/* Progress bar */}
          <div className="mb-8 h-[1.5px] bg-[#E0D8CE] relative overflow-hidden rounded-full">
            <div
              ref={progressBarRef}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: 'linear-gradient(90deg, #0066cc, #00e5ff)', width: '0%' }}
            />
          </div>

          {/* Eyebrow */}
          <p
            className="mb-2.5 text-[10px] tracking-[0.45em] uppercase font-medium"
            style={{ color: '#00aaff' }}
          >
            {t.home.howLabel}
          </p>

          {/* Heading */}
          <h2
            className="mb-11 font-light text-[var(--ac-ink)] leading-[1.06]"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize:   'clamp(2.1rem, 3vw, 3.4rem)',
            }}
          >
            {t.home.howHeading1}<br />
            <em style={{ fontStyle: 'italic', color: '#C9A96E' }}>{t.home.howHeading2}</em>
          </h2>

          {/* Steps */}
          <div className="flex flex-col gap-8">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                ref={el => { stepRefs.current[i] = el }}
                className="flex gap-5 items-start"
              >
                <span
                  className="shrink-0 font-mono text-[10px] tracking-[0.3em] mt-[6px] select-none"
                  style={{ color: '#00d4ff', opacity: 0.8 }}
                >
                  {step.num}
                </span>
                <div>
                  <h3
                    className="mb-2 font-light text-[var(--ac-ink)] leading-tight"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize:   'clamp(1.4rem, 1.8vw, 1.75rem)',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[0.875rem] leading-[1.85] text-[#2E2C2A] font-light max-w-[370px]">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          className="self-center h-3/5 w-px shrink-0"
          style={{
            background:
              'linear-gradient(to bottom, transparent, rgba(0,200,255,0.15) 40%, rgba(0,200,255,0.15) 60%, transparent)',
          }}
          aria-hidden="true"
        />

        {/* ══ RIGHT ═══════════════════════════════════════════════ */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <svg
            viewBox="0 -10 480 410"
            className="w-full max-w-[580px]"
            style={{ overflow: 'visible' }}
            aria-hidden="true"
          >
            <defs>
              {/* LED blue gradient */}
              <linearGradient id="ledGrad" x1="0" y1="1" x2="0.4" y2="0">
                <stop offset="0%"   stopColor="#0066cc" stopOpacity="0.9" />
                <stop offset="40%"  stopColor="#00aaff" />
                <stop offset="75%"  stopColor="#00e5ff" />
                <stop offset="100%" stopColor="#80ffff" />
              </linearGradient>
              {/* Area fill */}
              <linearGradient id="ledArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#00d4ff" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.02" />
              </linearGradient>
              {/* Curve glow */}
              <filter id="ledGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Arrow / dot glow */}
              <filter id="dotGlow" x="-150%" y="-150%" width="400%" height="400%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Grid ────────────────────────────────────────────── */}
            {[60, 120, 180, 240, 300, 360].map(y => (
              <line key={`hy${y}`} x1="40" y1={y} x2="440" y2={y}
                stroke="rgba(var(--ac-ink-rgb),0.07)" strokeWidth="1" />
            ))}
            {[100, 160, 220, 280, 340, 400].map(x => (
              <line key={`vx${x}`} x1={x} y1="50" x2={x} y2="378"
                stroke="rgba(var(--ac-ink-rgb),0.07)" strokeWidth="1" />
            ))}

            {/* ── Axes ────────────────────────────────────────────── */}
            <line x1="40" y1="375" x2="448" y2="375" stroke="rgba(var(--ac-ink-rgb),0.28)" strokeWidth="1.5" />
            <line x1="40" y1="50"  x2="40"  y2="378" stroke="rgba(var(--ac-ink-rgb),0.28)" strokeWidth="1.5" />
            <polygon points="448,371 457,375 448,379" fill="rgba(var(--ac-ink-rgb),0.28)" />
            <polygon points="36,50 40,42 44,50"        fill="rgba(var(--ac-ink-rgb),0.28)" />
            <text x="18" y="200" textAnchor="middle" fontSize="9"
              fill="rgba(var(--ac-ink-rgb),0.4)" letterSpacing="2.5" fontFamily="monospace"
              transform="rotate(-90,18,200)">{t.home.chartPrice}</text>
            <text x="245" y="396" textAnchor="middle" fontSize="9"
              fill="rgba(var(--ac-ink-rgb),0.4)" letterSpacing="2.5" fontFamily="monospace">{t.home.chartSupply}</text>

            {/* Y ticks */}
            {([{ label: t.home.chartHigh, y: 110 }, { label: t.home.chartMid, y: 230 }, { label: t.home.chartLow, y: 340 }] as { label: string; y: number }[]).map(tick => (
              <g key={tick.label}>
                <line x1="35" y1={tick.y} x2="45" y2={tick.y} stroke="rgba(var(--ac-ink-rgb),0.22)" strokeWidth="1.2" />
                <text x="32" y={tick.y + 4} textAnchor="end" fontSize="8"
                  fill="rgba(var(--ac-ink-rgb),0.38)" letterSpacing="1" fontFamily="monospace">
                  {tick.label}
                </text>
              </g>
            ))}

            {/* ── Area fill ───────────────────────────────────────── */}
            <path
              ref={areaRef}
              d={AREA_D}
              fill="url(#ledArea)"
              opacity={0}
            />

            {/* ── Bonding curve (animated via stroke-dashoffset) ─── */}
            <path
              ref={pathRef}
              d={CURVE_D}
              fill="none"
              stroke="url(#ledGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#ledGlow)"
            />

            {/* ── Crosshair at midpoint (y=234, x=278) ────────────── */}
            <line ref={crossHRef} x1="40"  y1="234" x2="278" y2="234"
              stroke="#00d4ff" strokeWidth="0.9" strokeDasharray="5 4" opacity={0} />
            <line ref={crossVRef} x1="278" y1="234" x2="278" y2="375"
              stroke="#00d4ff" strokeWidth="0.9" strokeDasharray="5 4" opacity={0} />
            <circle ref={crossDotRef} cx={278} cy={234} r={3.5}
              fill="#00d4ff" fillOpacity={0.3} stroke="#00d4ff" strokeWidth={1} opacity={0} />

            {/* ── Labels ──────────────────────────────────────────── */}
            <g ref={labelsRef} opacity={0}>
              <rect x="322" y="-10" width="74" height="22" rx="3"
                fill="#00d4ff" fillOpacity="0.12" stroke="#00d4ff" strokeWidth="0.6" strokeOpacity="0.5" />
              <text x="359" y="5" textAnchor="middle" fontSize="10"
                fill="#00d4ff" fontFamily="monospace" letterSpacing="0.5">P = k / S²</text>
              <rect x="42" y="222" width="48" height="16" rx="2" fill="#00d4ff" fillOpacity="0.10" />
              <text x="66" y="233" textAnchor="middle" fontSize="8"
                fill="#00d4ff" fontFamily="monospace" letterSpacing="1">PRICE ↑</text>
              <rect x="252" y="358" width="58" height="16" rx="2" fill="#00d4ff" fillOpacity="0.10" />
              <text x="281" y="369" textAnchor="middle" fontSize="8"
                fill="#00d4ff" fontFamily="monospace" letterSpacing="1">DEMAND →</text>
            </g>

            {/* ── Glow blob ────────────────────────────────────────── */}
            <circle
              ref={glowCircleRef}
              cx={40} cy={375} r={14}
              fill="#00d4ff" fillOpacity={0.12}
              filter="url(#dotGlow)"
            />

            {/* ── Travelling arrow ─────────────────────────────────── */}
            {/* Starts at curve origin; GSAP sets transform="translate(x,y) rotate(r)" */}
            <g ref={arrowGroupRef}>
              <polygon
                points="0,-12 -6,6 6,6"
                fill="#00e5ff"
                filter="url(#ledGlow)"
                opacity={0.95}
              />
              <polygon
                points="0,-8 -3.5,4 3.5,4"
                fill="#ffffff"
                opacity={0.9}
              />
              <line x1="0" y1="6" x2="0" y2="13"
                stroke="#00e5ff" strokeWidth="1.8" strokeLinecap="round" opacity={0.65} />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
