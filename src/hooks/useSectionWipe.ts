'use client'

// ─────────────────────────────────────────────────────────────────
//  useSectionWipe.ts  —  "Cuốn rèm vào đường line" per-section
//
//  Cơ chế:
//    1. Section được PIN khi top chạm đỉnh viewport
//    2. GSAP animate clip-path: inset(0 0 0%→100% 0) theo scrub
//       → nội dung biến mất từ dưới lên, "bị nuốt vào line trên"
//    3. pinSpacing: false → section sau trượt lên ngay bên dưới
//       tạo cảm giác được "reveal" từ phía sau tấm rèm
//
//  Yêu cầu: section cần position: relative + z-index phù hợp
//  (section sau nằm dưới section hiện tại về z-index)
// ─────────────────────────────────────────────────────────────────

import { RefObject, useEffect } from 'react'
import { gsap }          from '@/lib/gsap'



interface WipeOptions {
  /** Scroll distance the wipe plays over. Default: '75vh' */
  distance?: string
  /** scrub lag in seconds. Default: 1 (1:1 bám sát scroll) */
  scrub?: number
  /** z-index of THIS section during pin. Default: 10 */
  zIndex?: number
}

export function useSectionWipe(
  ref: RefObject<HTMLElement | null>,
  options: WipeOptions = {},
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const { distance = '75vh', scrub = 1, zIndex = 10 } = options

    // ── Layer stacking ──────────────────────────────────────────
    // This section sits on top; the next sibling is revealed behind it
    gsap.set(el, {
      position:  'relative',
      zIndex,
      clipPath:  'inset(0 0 0% 0)',   // initial: fully visible
    })

    // Next sibling (the divider + next section) sits behind
    const nextSibling = el.nextElementSibling as HTMLElement | null
    if (nextSibling) gsap.set(nextSibling, { position: 'relative', zIndex: zIndex - 5 })

    const ctx = gsap.context(() => {
      gsap.to(el, {
        // Wipe bottom→top: content "retreats into" the top divider line
        clipPath: 'inset(0 0 100% 0)',
        ease:     'none',
        scrollTrigger: {
          trigger:             el,
          start:               'top top',     // pin when top of section hits viewport top
          end:                 `+=${distance}`,
          pin:                 true,
          pinSpacing:          false,          // next section slides up BEHIND
          scrub,
          anticipatePin:       1,
          invalidateOnRefresh: true,
        },
      })
    }, el)

    return () => ctx.revert()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])
}
