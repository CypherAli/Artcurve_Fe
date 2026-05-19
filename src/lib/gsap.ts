// ─────────────────────────────────────────────────────────────────
//  lib/gsap.ts  —  Single registration point for GSAP + plugins
//
//  Import gsap and ScrollTrigger from HERE (not from 'gsap' directly)
//  so registerPlugin runs exactly once, no matter how many modules
//  import it. All sections get the same pre-configured instance.
// ─────────────────────────────────────────────────────────────────

import { gsap }        from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }
