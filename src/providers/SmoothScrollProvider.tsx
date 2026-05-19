'use client'

// ─────────────────────────────────────────────────────────────────
//  SmoothScrollProvider.tsx
//
//  Initializes Lenis smooth scroll and wires it through GSAP ticker
//  so ScrollTrigger + Lenis stay perfectly synced.
//
//  Pattern from cinematic-gsap-lenis skill:
//    lenis.on('scroll', ScrollTrigger.update)
//    gsap.ticker.add(time => lenis.raf(time * 1000))
//
//  Also initializes the GSAP motion system (text reveals, scroll
//  reveals, parallax, cursor) after DOM is ready.
// ─────────────────────────────────────────────────────────────────

import { ReactNode, useEffect } from 'react'
import Lenis                    from 'lenis'
import { gsap, ScrollTrigger } from '@/lib/gsap'

gsap.defaults({ ease: 'power3.out', duration: 0.85 })

interface SmoothScrollProviderProps {
  children: ReactNode
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  useEffect(() => {
    // Respect prefers-reduced-motion
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Add motion class so GSAP initial states apply (visibility: hidden)
    if (!reduceMotion) {
      document.documentElement.classList.add('has-motion')
    }

    if (reduceMotion) {
      // Skip Lenis + animations; just make content visible
      gsap.set('[data-motion-text],[data-reveal],[data-reveal-item],[data-image-reveal]', {
        autoAlpha: 1,
        clearProps: 'all',
      })
      return
    }

    // ── Initialize Lenis ────────────────────────────────────────
    const lenis = new Lenis({
      lerp:          0.08,   // Smoothness (0 = instant, 1 = never arrives)
      smoothWheel:   true,
      wheelMultiplier:0.9,
    })

    // Sync Lenis → ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    // Drive Lenis RAF through GSAP ticker (keeps both in lock-step)
    const gsapTickerId = gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    // Refresh ScrollTrigger after all images/fonts load
    // rAF defers to next paint so all DOM is fully laid out
    window.addEventListener('load', () => requestAnimationFrame(() => ScrollTrigger.refresh()))

    // ── Initialize GSAP Motion System ───────────────────────────
    const cleanupMotion = initMotionSystem(reduceMotion)

    return () => {
      // Cleanup: kill Lenis + ScrollTrigger on unmount / route change
      cleanupMotion?.()
      gsap.ticker.remove(gsapTickerId)
      lenis.destroy()
      ScrollTrigger.getAll().forEach((t) => t.kill())
      document.documentElement.classList.remove('has-motion')
    }
  }, [])

  return <>{children}</>
}

// ─── GSAP Motion System ────────────────────────────────────────────
// Patterns from cinematic-gsap-lenis-motion-system skill

function initMotionSystem(reduceMotion: boolean) {
  if (reduceMotion) return

  // Use gsap.context for safe cleanup
  const ctx = gsap.context(() => {
    initTextReveals()
    initScrollReveals()
    initImageReveals()
    initMouseParallax()
  })

  return () => ctx.revert()
}

// Word-by-word staggered reveal
function initTextReveals() {
  gsap.utils.toArray<HTMLElement>('[data-motion-text="words"]').forEach((el) => {
    const text  = el.textContent ?? ''
    const parts = text.split(/(\s+)/)

    el.textContent = ''
    el.setAttribute('aria-label', text.trim())

    let index = 0
    parts.forEach((part) => {
      if (!part.trim()) { el.appendChild(document.createTextNode(part)); return }

      const mask = document.createElement('span')
      const word = document.createElement('span')
      mask.className = 'motion-word-mask'
      mask.setAttribute('aria-hidden', 'true')
      word.className = 'motion-word'
      word.textContent = part
      word.style.setProperty('--word-index', String(index))
      mask.appendChild(word)
      el.appendChild(mask)
      index++
    })

    gsap.set(el, { autoAlpha: 1 })
    gsap.fromTo(
      el.querySelectorAll('.motion-word'),
      { yPercent: 110, autoAlpha: 0 },
      {
        yPercent: 0, autoAlpha: 1,
        duration: 0.9, ease: 'power4.out', stagger: 0.055,
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      }
    )
  })

  // Line-by-line reveal (for headings)
  gsap.utils.toArray<HTMLElement>('[data-motion-text="lines"]').forEach((el) => {
    const lines = el.querySelectorAll('.motion-line')
    const targets = lines.length ? lines : el.children

    gsap.set(el, { autoAlpha: 1 })
    gsap.fromTo(
      targets,
      { yPercent: 100, autoAlpha: 0 },
      {
        yPercent: 0, autoAlpha: 1,
        duration: 1.05, ease: 'power4.out', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 84%', once: true },
      }
    )
  })
}

// Preset-based scroll reveals
function initScrollReveals() {
  const presets: Record<string, { from: gsap.TweenVars; to: gsap.TweenVars }> = {
    'fade-up':    { from: { y: 32,  autoAlpha: 0 }, to: { y: 0, autoAlpha: 1 } },
    'blur-in':    { from: { y: 18,  autoAlpha: 0 }, to: { y: 0, autoAlpha: 1 } },
    'scale':      { from: { scale: 0.96, autoAlpha: 0 }, to: { scale: 1, autoAlpha: 1 } },
    'slide-left': { from: { x: 48,  autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 } },
    'slide-right':{ from: { x: -48, autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 } },
  }

  // Staggered groups
  gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((group) => {
    const items = group.querySelectorAll('[data-reveal-item]')
    gsap.set(group, { autoAlpha: 1 })
    gsap.fromTo(items,
      { y: 36, autoAlpha: 0 },
      {
        y: 0, autoAlpha: 1,
        duration: 0.95, ease: 'power4.out', stagger: 0.075,
        scrollTrigger: { trigger: group, start: 'top 82%', once: true },
      }
    )
  })

  // Individual reveals
  gsap.utils.toArray<HTMLElement>('[data-reveal]:not([data-reveal-item])').forEach((el) => {
    const preset = presets[el.dataset.reveal as string] ?? presets['fade-up']
    gsap.set(el, { autoAlpha: 1 })
    gsap.fromTo(el, preset.from, {
      ...preset.to,
      duration: 0.9, ease: 'power4.out',
      delay: Number(el.dataset.revealDelay ?? 0),
      scrollTrigger: { trigger: el, start: 'top 84%', once: true },
    })
  })
}

// Clip-path image reveal with counter-scale
function initImageReveals() {
  gsap.utils.toArray<HTMLElement>('[data-image-reveal]').forEach((figure) => {
    const img = figure.querySelector('img')
    gsap.set(figure, { autoAlpha: 1 })

    const tl = gsap.timeline({
      scrollTrigger: { trigger: figure, start: 'top 82%', once: true },
    })
    tl.fromTo(figure,
      { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power4.out' }
    )
    if (img) {
      tl.fromTo(img,
        { scale: 1.08, autoAlpha: 0.8 },
        { scale: 1, autoAlpha: 1, duration: 1.2, ease: 'power4.out' },
        0
      )
    }
  })
}

// Mouse-reactive layered depth (non-3D sections)
function initMouseParallax() {
  if (window.matchMedia('(pointer: coarse)').matches) return

  gsap.utils.toArray<HTMLElement>('[data-mouse-parallax]').forEach((section) => {
    const layers = Array.from(section.querySelectorAll<HTMLElement>('[data-mouse-depth]'))
    const setters = layers.map((layer) => ({
      depth: Number(layer.dataset.mouseDepth ?? 0.04),
      xTo: gsap.quickTo(layer, 'x', { duration: 0.8, ease: 'power3.out' }),
      yTo: gsap.quickTo(layer, 'y', { duration: 0.8, ease: 'power3.out' }),
    }))

    section.addEventListener('pointermove', (e) => {
      const rect = section.getBoundingClientRect()
      const x    = e.clientX - rect.left  - rect.width  / 2
      const y    = e.clientY - rect.top   - rect.height / 2
      setters.forEach(({ depth, xTo, yTo }) => { xTo(x * depth); yTo(y * depth) })
    })
    section.addEventListener('pointerleave', () => {
      setters.forEach(({ xTo, yTo }) => { xTo(0); yTo(0) })
    })
  })
}
