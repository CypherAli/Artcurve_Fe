'use client'

// ─────────────────────────────────────────────────────────────────
//  CustomCursor.tsx
//
//  GSAP quickTo cursor follower — atmosphere, not decoration.
//  - Hides automatically on touch/coarse pointer devices
//  - mix-blend-mode: difference → inverts background color
//  - Grows when hovering [data-cursor-label] elements
//  - Pattern from cinematic-gsap-lenis skill
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { gsap }              from '@/lib/gsap'

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const dotRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return

    // Hide on touch / coarse pointer (phones / tablets)
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    cursor.style.opacity = '1'

    // quickTo creates optimized, non-blocking tweens for each axis
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' })
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' })

    const onMove = (e: PointerEvent) => {
      xTo(e.clientX)
      yTo(e.clientY)
    }
    document.addEventListener('pointermove', onMove)

    // Expand cursor on interactive elements — store handlers for cleanup
    const onEnter = () => {
      gsap.to(cursor, { scale: 2.2, duration: 0.35, ease: 'power3.out' })
      if (dotRef.current) gsap.to(dotRef.current, { scale: 0.4, duration: 0.35 })
    }
    const onLeave = () => {
      gsap.to(cursor, { scale: 1, duration: 0.35, ease: 'power3.out' })
      if (dotRef.current) gsap.to(dotRef.current, { scale: 1, duration: 0.35 })
    }

    const interactiveEls = Array.from(
      document.querySelectorAll<HTMLElement>('a, button, [data-cursor-label], [data-magnetic]')
    )
    interactiveEls.forEach((el) => {
      el.addEventListener('pointerenter', onEnter)
      el.addEventListener('pointerleave', onLeave)
    })

    return () => {
      document.removeEventListener('pointermove', onMove)
      interactiveEls.forEach((el) => {
        el.removeEventListener('pointerenter', onEnter)
        el.removeEventListener('pointerleave', onLeave)
      })
    }
  }, [])

  return (
    // data-cursor attr ties into CSS from globals.css
    <div
      ref={cursorRef}
      data-cursor
      className="pointer-events-none opacity-0"
      aria-hidden="true"
    >
      {/* Outer ring */}
      <div className="size-8 rounded-full border border-white/80 flex items-center justify-center">
        {/* Inner dot */}
        <div
          ref={dotRef}
          className="size-1.5 rounded-full bg-[var(--ac-paper)]"
        />
      </div>
    </div>
  )
}
