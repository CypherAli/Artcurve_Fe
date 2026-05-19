'use client'

import { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'



// ── Primary button — liquid fill + magnetic hover ─────────────────
function PrimaryButton({ label }: { label: string }) {
  const btnRef  = useRef<HTMLAnchorElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const arrowRef = useRef<HTMLSpanElement>(null)

  // Magnetic quickTo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qX = useRef<((value: number) => any) | undefined>(undefined)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qY = useRef<((value: number) => any) | undefined>(undefined)

  useEffect(() => {
    if (!btnRef.current) return
    qX.current = gsap.quickTo(btnRef.current, 'x', { duration: 0.4, ease: 'power3.out' })
    qY.current = gsap.quickTo(btnRef.current, 'y', { duration: 0.4, ease: 'power3.out' })
  }, [])

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const r = btnRef.current!.getBoundingClientRect()
    qX.current?.((e.clientX - r.left - r.width  / 2) * 0.28)
    qY.current?.((e.clientY - r.top  - r.height / 2) * 0.28)
  }
  function onEnter() {
    gsap.killTweensOf(fillRef.current)
    gsap.fromTo(fillRef.current,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, transformOrigin: 'left center', duration: 0.45, ease: 'power3.out' },
    )
    gsap.to(btnRef.current, { boxShadow: '0 0 28px rgba(201,169,110,0.45)', duration: 0.35 })
    gsap.to(arrowRef.current, { x: 5, duration: 0.35, ease: 'power2.out' })
  }
  function onLeave() {
    gsap.killTweensOf(fillRef.current)
    gsap.to(fillRef.current, { scaleX: 0, transformOrigin: 'right center', duration: 0.32, ease: 'power3.in' })
    gsap.to(btnRef.current,  { x: 0, y: 0, boxShadow: '0 0 0px rgba(201,169,110,0)', duration: 0.45, ease: 'power3.out' })
    gsap.to(arrowRef.current, { x: 0, duration: 0.35, ease: 'power2.out' })
  }

  return (
    <a ref={btnRef} href="#"
      className="relative inline-flex items-center gap-3 overflow-hidden
                 h-[52px] px-10 border border-[#C9A96E]/70
                 text-[10px] tracking-[0.32em] uppercase font-medium
                 text-white group cursor-pointer select-none"
      style={{ willChange: 'transform, box-shadow' }}
      onMouseEnter={onEnter} onMouseLeave={onLeave} onMouseMove={onMove}
    >
      <span ref={fillRef} aria-hidden="true"
        className="absolute inset-0 bg-[#C9A96E]"
        style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
      />
      <span ref={textRef}
        className="relative z-10 group-hover:text-[#1A1A1A] transition-colors duration-200">
        {label}
      </span>
      <span ref={arrowRef}
        className="relative z-10 group-hover:text-[#1A1A1A] transition-colors duration-200"
        style={{ display: 'inline-block' }}>
        →
      </span>
    </a>
  )
}

// ── Ghost secondary link — animated underline sweep ───────────────
function GhostLink({ label, href = '#' }: { label: string; href?: string }) {
  const lineRef = useRef<HTMLSpanElement>(null)

  function onEnter() {
    gsap.killTweensOf(lineRef.current)
    gsap.fromTo(lineRef.current,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, transformOrigin: 'left center', duration: 0.38, ease: 'power3.out' },
    )
  }
  function onLeave() {
    gsap.killTweensOf(lineRef.current)
    gsap.to(lineRef.current, { scaleX: 0, transformOrigin: 'right center', duration: 0.28, ease: 'power3.in' })
  }

  return (
    <a href={href}
      className="relative inline-flex items-center gap-2 cursor-pointer select-none
                 text-[10px] tracking-[0.30em] uppercase font-mono text-white/45
                 hover:text-white/80 transition-colors duration-300"
      onMouseEnter={onEnter} onMouseLeave={onLeave}
    >
      {label}
      <span ref={lineRef} aria-hidden="true"
        className="absolute -bottom-0.5 left-0 right-0 h-px bg-white/40"
        style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
      />
    </a>
  )
}

// ─────────────────────────────────────────────────────────────────
export function GrandCTASection() {
  const sectionRef    = useRef<HTMLElement>(null)
  const videoWrapRef  = useRef<HTMLDivElement>(null)
  const videoInnerRef = useRef<HTMLDivElement>(null)
  const frameTopRef   = useRef<HTMLDivElement>(null)
  const frameBotRef   = useRef<HTMLDivElement>(null)
  const overlayRef    = useRef<HTMLDivElement>(null)
  const footerRef     = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    gsap.set(videoWrapRef.current,  { clipPath: 'inset(0 0 100% 0 round 2px)' })
    gsap.set(videoInnerRef.current, { scale: 1.08 })
    gsap.set([frameTopRef.current, frameBotRef.current], { scaleX: 0, transformOrigin: 'left center' })

    const lines  = overlayRef.current?.querySelectorAll<HTMLElement>('.gc-line')  ?? []
    const extras = overlayRef.current?.querySelectorAll<HTMLElement>('.gc-extra') ?? []
    gsap.set(Array.from(lines),  { yPercent: 110, opacity: 0 })
    gsap.set(Array.from(extras), { opacity: 0, y: 16 })

    // Dynamic import: refresh scroll positions after this section mounts
    requestAnimationFrame(() => ScrollTrigger.refresh())

    const ctx = gsap.context(() => {

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',    // fires the moment section enters viewport bottom
          once: true,
          invalidateOnRefresh: true,
        },
        defaults: { ease: 'power4.out' },
      })

      tl.to([frameTopRef.current, frameBotRef.current],
            { scaleX: 1, duration: 0.6, ease: 'expo.out', stagger: 0.06 })
        .to(videoWrapRef.current,
            { clipPath: 'inset(0 0 0% 0 round 2px)', duration: 0.75, ease: 'expo.out' }, '-=0.45')
        .to(videoInnerRef.current,
            { scale: 1.0, duration: 1.0, ease: 'power3.out' }, '<')
        .to(Array.from(lines),
            { yPercent: 0, opacity: 1, duration: 1.0, ease: 'expo.out', stagger: 0.12 }, '-=0.65')
        .to(Array.from(extras),
            { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', stagger: 0.10 }, '-=0.55')

      // Footer stagger
      const footerItems = Array.from(footerRef.current?.querySelectorAll<HTMLElement>('.fc-item') ?? [])
      gsap.set(footerItems, { opacity: 0, y: 10 })
      ScrollTrigger.create({
        trigger: footerRef.current, start: 'top 94%', once: true,
        onEnter() {
          gsap.to(footerItems, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.08 })
        },
      })

    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="cta" className="relative" aria-labelledby="gc-heading">
      <div>

        {/* ── VIDEO BLOCK ─────────────────────────────────────────── */}
        <div className="relative w-full">

          {/* Gold frame — top */}
          <div ref={frameTopRef} className="absolute top-0 left-0 right-0 h-px z-20" aria-hidden="true"
            style={{ background: 'linear-gradient(90deg, #C9A96E, rgba(201,169,110,0.4) 60%, transparent)', transformOrigin: 'left center' }} />

          {/* Clip-path reveal */}
          <div ref={videoWrapRef} className="relative overflow-hidden w-full" style={{ aspectRatio: '16 / 9' }}>

            {/* Scale / Ken-Burns */}
            <div ref={videoInnerRef} className="absolute inset-0" style={{ willChange: 'transform' }}>
              <video src="/cta-video.mp4" autoPlay muted loop playsInline preload="auto"
                className="w-full h-full object-cover"
                style={{ display: 'block', objectPosition: 'center 25%',
                  filter: 'brightness(1.08) contrast(1.12)' }}
              />

              {/* Dual gradient: left + bottom */}
              <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
                style={{ background: [
                  'linear-gradient(to bottom, transparent 30%, rgba(4,4,4,0.80) 100%)',
                  'linear-gradient(to right,  rgba(4,4,4,0.60) 0%, transparent 52%)',
                ].join(', ') }}
              />
            </div>

            {/* ── OVERLAY ───────────────────────────────────────────── */}
            <div ref={overlayRef} id="gc-heading"
              className="absolute inset-0 z-10 flex flex-col justify-end
                         px-10 md:px-16 lg:px-24 pb-12 md:pb-16"
            >
              {/* Left column */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">

                {/* ── Text block ──────────────────────────────── */}
                <div className="flex-1 max-w-xl">

                  {/* Eyebrow */}
                  <p className="gc-extra text-[9px] tracking-[0.52em] uppercase font-mono mb-3"
                    style={{ color: '#C9A96E' }}>
                    ArtCurve · Begin Your Collection
                  </p>

                  {/* Gold rule */}
                  <div className="gc-extra mb-5">
                    <div className="h-px w-10"
                      style={{ background: 'linear-gradient(90deg, #C9A96E, transparent)' }} />
                  </div>

                  {/* Headline — line mask */}
                  <div className="mb-5" aria-label="Shape the Curve. Own the Art.">
                    <div className="overflow-hidden" style={{ lineHeight: 0.95 }}>
                      <span className="gc-line block font-light text-white"
                        style={{ fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 'clamp(2.6rem, 5.5vw, 6.5rem)', willChange: 'transform' }}>
                        Shape the Curve.
                      </span>
                    </div>
                    <div className="overflow-hidden" style={{ lineHeight: 0.95 }}>
                      <span className="gc-line block font-light italic"
                        style={{ fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 'clamp(2.6rem, 5.5vw, 6.5rem)', color: '#C9A96E', willChange: 'transform' }}>
                        Own the Art.
                      </span>
                    </div>
                  </div>

                  {/* Sub descriptor */}
                  <p className="gc-extra text-[0.78rem] leading-[1.85] font-light mb-8"
                    style={{ color: 'rgba(255,255,255,0.38)', maxWidth: '340px', letterSpacing: '0.01em' }}>
                    Trade unique artworks as bonding-curve tokens on Base.
                    Every collector shapes the price.
                  </p>

                  {/* Buttons */}
                  <div className="gc-extra flex items-center gap-7">
                    <PrimaryButton label="Connect Wallet" />
                    <GhostLink label="Explore Gallery" />
                  </div>
                </div>

                {/* ── Stats block — bottom right ───────────────── */}
                <div className="gc-extra hidden md:flex flex-col items-end gap-5 pb-1">
                  {[
                    { val: '847',   unit: 'ETH', label: 'Total Locked' },
                    { val: '3,241', unit: '',    label: 'Artworks' },
                    { val: '9,180', unit: '',    label: 'Collectors' },
                  ].map(({ val, unit, label }) => (
                    <div key={label} className="text-right">
                      <p className="font-light leading-none"
                        style={{ fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 'clamp(1.4rem, 2vw, 2rem)', color: 'rgba(255,255,255,0.75)' }}>
                        {val}
                        {unit && (
                          <span style={{ fontSize: '0.44em', color: '#C9A96E',
                            letterSpacing: '0.08em', marginLeft: '4px' }}>{unit}</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[8px] tracking-[0.26em] uppercase font-mono"
                        style={{ color: 'rgba(255,255,255,0.22)' }}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>

          {/* Gold frame — bottom */}
          <div ref={frameBotRef} className="absolute bottom-0 left-0 right-0 h-px z-20" aria-hidden="true"
            style={{ background: 'linear-gradient(90deg, #C9A96E, rgba(201,169,110,0.4) 60%, transparent)', transformOrigin: 'left center' }} />
        </div>

      </div>

      {/* ══════════════════════════════ FOOTER ══════════════════════ */}
      <footer ref={footerRef} className="relative z-10"
        style={{ background: '#080808' }}>

        {/* ── Top row: brand / nav / social text ─────────────────── */}
        <div className="px-8 md:px-20 lg:px-28 py-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

            <div className="fc-item">
              <p className="text-[1.15rem] text-white/80 font-light leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}>ArtCurve</p>
              <p className="mt-1.5 text-[9px] tracking-[0.24em] uppercase text-white/20 font-mono">
                On-chain art · Built on Base
              </p>
            </div>

            <div className="fc-item flex items-center gap-4">
              {[
                { name: 'X',         hoverColor: '#e7e7e7',  viewBox: '0 0 24 24', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                { name: 'YouTube',   hoverColor: '#FF0000',  viewBox: '0 0 24 24', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
                { name: 'LinkedIn',  hoverColor: '#0A66C2',  viewBox: '0 0 24 24', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                { name: 'Instagram', hoverColor: '#E1306C',  viewBox: '0 0 24 24', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z' },
                { name: 'TikTok',    hoverColor: '#69C9D0',  viewBox: '0 0 24 24', path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.73a8.2 8.2 0 0 0 4.79 1.52V6.79a4.85 4.85 0 0 1-1.03-.1z' },
                { name: 'Pinterest', hoverColor: '#E60023',  viewBox: '0 0 24 24', path: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z' },
              ].map(({ name, viewBox, path, hoverColor }) => (
                <a key={name} href="#" aria-label={name}
                  className="group flex items-center justify-center w-8 h-8 rounded-full
                             transition-all duration-300 hover:bg-white/8"
                  style={{ color: 'rgba(255,255,255,0.28)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = hoverColor }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.28)' }}
                >
                  <svg viewBox={viewBox} fill="currentColor"
                    className="w-[15px] h-[15px] transition-transform duration-300 group-hover:scale-110">
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>

            <div className="fc-item">
              <p className="text-[9px] font-mono text-white/15 tracking-wide text-right">
                © 2025 ArtCurve. All rights reserved.
              </p>
            </div>

          </div>
        </div>


      </footer>
    </section>
  )
}
