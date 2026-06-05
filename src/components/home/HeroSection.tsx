'use client'

// ─────────────────────────────────────────────────────────────────
//  HeroSection.tsx  —  Editorial split + Looping Video
//
//  Skill patterns applied (cinematic-gsap-lenis):
//    • Hero choreography: text lines → sub → CTA → video col
//    • Video column: clipPath reveal inset(0 0 100% 0) → 0
//    • Scroll parallax: video translateY via ScrollTrigger scrub
//    • height: 115%, object-fit: cover — no hard crop, no scale hack
//    • Edge gradient: 16px ONLY at absolute border — never covers content
//    • Mouse parallax on video column (data-mouse-depth)
//
//  Layout:
//    Left  52%  — cream bg, vertically-centred content
//    Right 52%  — looping video, bleeds top + bottom 7.5%
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { artworkService } from '@/services/artwork.service'

const HERO_LINES = ['Where Art', 'Meets the', 'Blockchain.']

const DEFAULT_STATS = [
  { num: '10K+',  label: 'Artworks'     },
  { num: '$2.4M', label: 'Total Volume' },
  { num: '3.2K',  label: 'Collectors'  },
]

export function HeroSection() {
  const [stats, setStats] = useState(DEFAULT_STATS)

  useEffect(() => {
    artworkService.platformStats().then(data => {
      const vol = parseFloat(data.totalVolumeEth)
      const volLabel = vol >= 1000 ? `$${(vol / 1000).toFixed(1)}K` : `$${vol.toFixed(2)}`
      setStats([
        { num: data.artworkCount > 999 ? `${(data.artworkCount / 1000).toFixed(0)}K+` : String(data.artworkCount), label: 'Artworks' },
        { num: volLabel, label: 'Total Volume' },
        { num: data.collectorCount > 999 ? `${(data.collectorCount / 1000).toFixed(1)}K` : String(data.collectorCount), label: 'Collectors' },
      ])
    }).catch(() => { /* keep defaults on error */ })
  }, [])

  const headingRef  = useRef<HTMLHeadingElement>(null)
  const subRef      = useRef<HTMLParagraphElement>(null)
  const ctaRef      = useRef<HTMLDivElement>(null)
  const statsRef    = useRef<HTMLDivElement>(null)
  const videoColRef = useRef<HTMLDivElement>(null)
  const videoRef    = useRef<HTMLVideoElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)

  // Ensure autoplay (Safari/iOS requires explicit .play())
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = true
    v.play().catch(() => {/* mobile: needs gesture, fail silently */})
  }, [])

  // GSAP entrance + scroll parallax
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      gsap.set(
        [headingRef.current, subRef.current, ctaRef.current, statsRef.current, videoColRef.current],
        { autoAlpha: 1, clearProps: 'all' }
      )
      return
    }

    const ctx = gsap.context(() => {
      const lines = headingRef.current?.querySelectorAll('.motion-line') ?? []

      // ── Entrance choreography ─────────────────────────────────
      // Skill: hero bg/media first, headline second, copy third, CTA last
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })

      // 1. Video column: fast expo.out reveal — starts immediately at full speed
      tl.fromTo(videoColRef.current,
        { clipPath: 'inset(0 0 100% 0)', opacity: 1 },
        { clipPath: 'inset(0 0 0% 0)',   duration: 0.7, ease: 'expo.out' },
        0
      )

      // 2. Headline lines — start almost simultaneously with video
      tl.fromTo(lines,
        { yPercent: 110, opacity: 0 },
        { yPercent: 0,   opacity: 1, duration: 0.85, stagger: 0.08 },
        0.05
      )

      // 3. Sub-copy
      .fromTo(subRef.current,
        { y: 18, opacity: 0 },
        { y: 0,  opacity: 1, duration: 0.65 },
        '-=0.45'
      )

      // 4. CTAs
      .fromTo(ctaRef.current,
        { y: 12, opacity: 0 },
        { y: 0,  opacity: 1, duration: 0.6 },
        '-=0.4'
      )

      // 5. Stats strip
      .fromTo(statsRef.current,
        { y: 8, opacity: 0 },
        { y: 0,  opacity: 1, duration: 0.55 },
        '-=0.35'
      )

      // Scroll parallax disabled — video stays fixed, no sway on scroll
    })

    return () => ctx.revert()
  }, [])

  return (
    <section
      className="relative min-h-dvh flex overflow-x-hidden bg-white"
      aria-label="Hero"
    >

      {/* ══ LEFT — editorial content ═════════════════════════════ */}
      <div className="
        relative z-10 flex flex-col justify-center
        w-full md:w-[52%] shrink-0
        px-6 md:px-12 lg:px-20 xl:px-28
        pt-28 pb-20
      ">

        {/* Eyebrow */}
        <p className="mb-5 text-[11px] tracking-[0.38em] uppercase text-[#C9A96E] font-medium">
          Web3 Art Exchange · Built on Base
        </p>

        {/* Heading — manual line split, masked reveal */}
        <h1
          ref={headingRef}
          className="mb-8 font-light text-[#1A1A1A]"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize:   'clamp(3.2rem, 5.5vw, 7rem)',
            lineHeight: '0.93',
          }}
          aria-label={HERO_LINES.join(' ')}
        >
          {HERO_LINES.map((line, i) => (
            <span key={i} className="motion-line-mask block" aria-hidden="true">
              <span className="motion-line block">
                {i === HERO_LINES.length - 1
                  ? <em className="text-gold-shimmer not-italic">{line}</em>
                  : line}
              </span>
            </span>
          ))}
        </h1>

        {/* Sub-copy */}
        <p
          ref={subRef}
          className="mb-10 max-w-[420px] text-[15px] leading-[1.75] text-[#7A7570] font-light"
          style={{ opacity: 0 }}
        >
          Trade unique artworks as bonding-curve tokens.
          Every brushstroke has a price.
          Every collector shapes the curve.
        </p>

        {/* CTAs */}
        <div
          ref={ctaRef}
          className="flex flex-wrap gap-3 items-center"
          style={{ opacity: 0 }}
        >
          <a
            href="/marketplace"
            className="h-12 px-7 inline-flex items-center gap-2.5
                       bg-[#1A1A1A] text-white text-[11px] tracking-[0.18em] uppercase font-medium
                       hover:bg-[#333] transition-colors duration-300 group"
            data-cursor-label="Explore"
          >
            Explore Art
            <svg
              className="group-hover:translate-x-1 transition-transform duration-300"
              width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"
            >
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <a
            href="#how-it-works"
            className="h-12 px-7 inline-flex items-center
                       border border-[#D5CCC2] text-[#1A1A1A] text-[11px] tracking-[0.18em] uppercase
                       hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all duration-300"
          >
            Learn More
          </a>
        </div>

      </div>

      {/* Stats strip — overlaid bottom-left of video column */}
      <div
        ref={statsRef}
        className="absolute bottom-8 left-6 md:left-12 lg:left-20 xl:left-28 z-20
                   flex gap-10 pt-7 border-t border-[#E4DDD3]"
        style={{ opacity: 0 }}
      >
        {stats.map(({ num, label }) => (
          <div key={label}>
            <p
              className="text-[1.65rem] font-light text-[#1A1A1A] leading-none"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {num}
            </p>
            <p className="mt-1 text-[10px] tracking-[0.25em] uppercase text-[#7A7570]">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ══ RIGHT — looping video column ════════════════════════ */}
      {/*
        Strategy (cinematic skill):
        • Outer container: absolute, overflow-hidden, clips video
        • Inner wrap (videoWrapRef): h-[115%] top-[-7.5%]
          → extra 15% height = parallax budget without gap
        • Video: w-full h-full object-cover — fills container
        • Gradients: ONLY at absolute screen edges
          → never covers portrait subject or laptop
        • Left gradient: 14px — just enough to remove hard canvas seam
      */}
      <div
        ref={videoColRef}
        className="hidden md:block absolute right-0 top-0 w-[65%] h-full overflow-hidden"
        style={{ clipPath: 'inset(0 0 100% 0)' }}
        aria-hidden="true"
      >
        {/* Outer: white bg, clips everything */}
        <div className="relative w-full h-full bg-white overflow-hidden flex items-center justify-center">

          {/* Explicit white backdrop — kills letterbox black */}
          <div className="absolute inset-0 bg-white z-0" aria-hidden="true" />

          {/* Video wrapper: scale 125% + move down 5px */}
          <div
            ref={videoWrapRef}
            className="relative z-[1] w-full h-full will-change-transform"
            style={{ transform: 'scale(1.35) translateY(55px)' }}
          >
            <video
              ref={videoRef}
              src="/videos/hero_video.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-contain object-right"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>

        </div>
      </div>

      {/* Grid ruler overlay — multiply blend: shows on white, vanishes on dark figure */}
      <div className="grid-overlay" aria-hidden="true" />

    </section>
  )
}
