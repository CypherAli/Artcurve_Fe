'use client'

// ─────────────────────────────────────────────────────────────────
//  ConvergenceGallery.tsx  —  Contra Labs-style convergence
//
//  Mechanism (from analysis of contralabs.com):
//
//  • Each image flies from an off-screen start position to a UNIQUE
//    FINAL POSITION scattered around the text.  Images do NOT all
//    go to 0,0 — that causes clustering.
//
//  • "Sequential arrival" is natural, not coded:
//    - Images with finalX/Y close to 0 travel a SHORT distance
//      → enter the visible viewport early in the scroll
//    - Images with large finalX/Y (edge-bleed) travel FAR
//      → enter the visible viewport late in the scroll
//
//  • Two LARGE images bleed off the left/right viewport edges,
//    mirroring the Contra Labs layout exactly.
//
//  • GSAP scrubbed timeline (synced with Lenis via SmoothScrollProvider)
//
//  ► Images at:  /public/convergence/img1.jpg … img10.jpg
// ─────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react'
import Image                 from 'next/image'
import { gsap }              from '@/lib/gsap'



// ── Image layout definitions ──────────────────────────────────────
//
//  startVW / startVH  — starting position as × viewport size
//                       Always outside screen:  |val| > 1
//  finalX / finalY    — pixel destination from canvas center
//  dur                — portion of timeline used (0–1)
//                       shorter = arrives EARLIER = "closer" feel
//  ease               — power3 for large/fast, power2 for mid,
//                       power1 for small/gentle
//  w / h              — display size (px). Large at edges, small near center.
//  rot                — natural resting tilt (degrees)
//
const IMAGES = [
  // ── VERY LARGE — far LEFT, bleeds off edge ────────────────────
  //    Long journey → enters viewport late in scroll
  {
    id: 1, src: '/convergence/img1.jpg',
    startVW: -1.85, startVH: -0.10,
    finalX: -565,   finalY:   -15,
    dur: 0.90, ease: 'power3.out',
    w: 370, h: 500, rot: -2,
  },
  // ── SMALL — directly above text, near center ─────────────────
  //    Short journey → enters viewport almost immediately
  {
    id: 2, src: '/convergence/img2.jpg',
    startVW: -0.18, startVH: -1.55,
    finalX: -100,   finalY: -255,
    dur: 0.70, ease: 'power1.out',
    w: 170, h: 130, rot:  5,
  },
  // ── MEDIUM — upper right ──────────────────────────────────────
  {
    id: 3, src: '/convergence/img3.jpg',
    startVW:  0.95, startVH: -1.30,
    finalX:  320,   finalY: -205,
    dur: 0.80, ease: 'power2.out',
    w: 215, h: 175, rot: -6,
  },
  // ── VERY LARGE — far RIGHT, bleeds off edge ───────────────────
  {
    id: 4, src: '/convergence/img4.jpg',
    startVW:  1.85, startVH:  0.08,
    finalX:  660,   finalY:   35,
    dur: 0.90, ease: 'power3.out',
    w: 355, h: 480, rot:  3,
  },
  // ── TINY — top-center, between img2 and img3 ─────────────────
  {
    id: 5, src: '/convergence/img5.jpg',
    startVW:  0.05, startVH: -1.65,
    finalX:  110,   finalY: -240,
    dur: 0.68, ease: 'power1.out',
    w: 150, h: 115, rot:  2,
  },
  // ── MEDIUM — lower left ───────────────────────────────────────
  {
    id: 6, src: '/convergence/img6.jpg',
    startVW: -1.25, startVH:  1.40,
    finalX: -355,   finalY:  275,
    dur: 0.82, ease: 'power2.out',
    w: 235, h: 195, rot: -7,
  },
  // ── SMALL — lower center ─────────────────────────────────────
  {
    id: 7, src: '/convergence/img7.jpg',
    startVW:  0.08, startVH:  1.60,
    finalX:   80,   finalY:  315,
    dur: 0.74, ease: 'power2.out',
    w: 185, h: 255, rot:  4,
  },
  // ── MEDIUM — lower right ─────────────────────────────────────
  {
    id: 8, src: '/convergence/img8.jpg',
    startVW:  1.30, startVH:  1.40,
    finalX:  520,   finalY:  340,
    dur: 0.83, ease: 'power2.out',
    w: 270, h: 215, rot: -4,
  },
  // ── SMALL — lower left, near edge ────────────────────────────
  {
    id: 9, src: '/convergence/img9.jpg',
    startVW: -1.52, startVH:  1.45,
    finalX: -490,   finalY:  295,
    dur: 0.80, ease: 'power2.out',
    w: 190, h: 155, rot:  8,
  },
  // ── SMALL — upper right, near text ───────────────────────────
  {
    id: 10, src: '/convergence/img10.jpg',
    startVW:  0.88, startVH: -1.25,
    finalX:  285,   finalY: -180,
    dur: 0.72, ease: 'power2.out',
    w: 180, h: 245, rot: -9,
  },
] as const

// ── Component ─────────────────────────────────────────────────────
export function ConvergenceGallery() {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRefs      = useRef<(HTMLDivElement | null)[]>([])
  const ruleRef      = useRef<HTMLDivElement>(null)
  const subRef       = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const vw = window.innerWidth
    const vh = window.innerHeight

    // ── Place every image at its off-screen start ──────────────
    IMAGES.forEach((item, i) => {
      const el = imgRefs.current[i]
      if (!el) return
      gsap.set(el, {
        x:        item.startVW * vw,   // e.g. -1.85 × 1440 = -2664px
        y:        item.startVH * vh,
        rotation: item.rot * 2,        // doubled tilt at launch
        scale:    1.2,
        opacity:  0,
        force3D:  true,
      })
    })
    gsap.set([ruleRef.current, subRef.current], { opacity: 0 })

    const ctx = gsap.context(() => {

      // ── Master scrubbed timeline ───────────────────────────────
      // Timeline total duration = 1.0 (progress = scroll fraction)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start:   'top top',
          end:     'bottom bottom',
          scrub:   0.8,
        },
      })

      // ── Animate each image independently ──────────────────────
      // Images with small |finalX/Y| travel short → enter viewport
      // sooner.  Images with large |finalX/Y| travel far → arrive
      // late.  This creates natural sequential feel automatically.
      IMAGES.forEach((item, i) => {
        const el = imgRefs.current[i]
        if (!el) return

        // Fade in at launch (0 → 0.06)
        tl.to(el, {
          opacity:  1,
          ease:     'none',
          duration: 0.06,
        }, 0)

        // Fly to final position (0 → item.dur)
        tl.to(el, {
          x:        item.finalX,
          y:        item.finalY,
          rotation: item.rot,
          scale:    1.0,
          ease:     item.ease,
          duration: item.dur,
        }, 0)
      })

      // Text decorations appear at ~25% scroll
      tl.to(ruleRef.current, { opacity: 1, ease: 'none', duration: 0.08 }, 0.25)
      tl.to(subRef.current,  { opacity: 1, ease: 'none', duration: 0.08 }, 0.33)

    }, container)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="relative h-[400vh]">

      {/* ── Sticky canvas ─────────────────────────────────────── */}
      <div
        className="sticky top-0 h-screen w-full overflow-hidden
                   flex items-center justify-center"
        style={{ background: '#FDFBF7' }}
      >

        {/* Faint editorial grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(26,26,26,0.020) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(26,26,26,0.020) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
          aria-hidden="true"
        />

        {/* ── Images ──────────────────────────────────────────── */}
        {IMAGES.map((item, i) => (
          <div
            key={item.id}
            ref={el => { imgRefs.current[i] = el }}
            aria-hidden="true"
            className="absolute pointer-events-none"
            style={{ width: item.w, height: item.h, zIndex: 3 }}
          >
            <Image
              src={item.src}
              alt=""
              fill
              sizes="500px"
              className="object-cover"
              style={{
                borderRadius: '2px',
                boxShadow:
                  '0 6px 28px rgba(26,26,26,0.14), 0 1px 6px rgba(26,26,26,0.08)',
              }}
            />
          </div>
        ))}

        {/* ── Center text — always visible, above images ──────── */}
        <div
          className="relative text-center pointer-events-none select-none px-8"
          style={{ zIndex: 10 }}
        >
          {/* Eyebrow */}
          <p
            className="text-[10px] tracking-[0.52em] uppercase font-mono mb-5"
            style={{ color: '#C9A96E' }}
          >
            ArtCurve
          </p>

          {/* Headline */}
          <h2
            className="font-light text-[#1A1A1A] leading-[1.06]"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize:   'clamp(2.2rem, 4vw, 4.6rem)',
            }}
          >
            The community
            <br />
            <em style={{ color: '#C9A96E', fontStyle: 'italic' }}>
              shapes the curve.
            </em>
          </h2>

          {/* Thin gold rule */}
          <div ref={ruleRef} className="mt-6" style={{ opacity: 0 }}>
            <div
              className="h-px w-16 mx-auto"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #C9A96E, transparent)',
              }}
            />
          </div>

          {/* Subtext */}
          <p
            ref={subRef}
            className="mt-5 font-light"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize:   'clamp(1rem, 1.3vw, 1.2rem)',
              fontStyle:  'italic',
              color:      'rgba(26,26,26,0.42)',
              opacity:     0,
            }}
          >
            Every collector. Every vote. Every transaction.
          </p>
        </div>

      </div>
    </div>
  )
}
