'use client'

// ─────────────────────────────────────────────────────────────────
//  CTASection.tsx  —  Final call-to-action + footer strip
//
//  Cream background, centered large serif type, gold CTA button.
//  Framer Motion scroll-reveal (alternative to GSAP for declarative
//  sections — shows both libraries coexisting).
// ─────────────────────────────────────────────────────────────────

import { motion, useInView } from 'framer-motion'
import { useRef }            from 'react'
import { useLanguage }       from '@/context/LanguageContext'

export function CTASection() {
  const { t } = useLanguage()
  const ref       = useRef<HTMLElement>(null)
  const isInView  = useInView(ref, { once: true, margin: '-80px 0px' })

  const containerVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
  }

  // Framer Motion 12: ease must be number[4] (cubic bezier) or named string
  const luxuryEase: [number, number, number, number] = [0.16, 1, 0.3, 1]

  const itemVariants = {
    hidden:  { y: 40, opacity: 0 },
    visible: {
      y: 0, opacity: 1,
      transition: { duration: 0.9, ease: luxuryEase },
    },
  }

  return (
    <section
      ref={ref}
      id="about"
      className="relative py-40 px-6 md:px-16 lg:px-24 bg-[var(--ac-paper)] overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Decorative background line */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[var(--ac-line)]"
        aria-hidden="true"
      />

      <motion.div
        className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-10"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        {/* Eyebrow */}
        <motion.p
          variants={itemVariants}
          className="text-xs tracking-[0.35em] uppercase text-[#C9A96E]"
        >
          Start Trading
        </motion.p>

        {/* Headline */}
        <motion.h2
          variants={itemVariants}
          id="cta-heading"
          className="text-[clamp(2.5rem,7vw,6rem)]/[0.95] font-light text-[var(--ac-ink)]"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {t.home.ctaHeading1}
          {' '}
          <em className="text-gold-shimmer not-italic">{t.home.ctaHeading2}</em>
        </motion.h2>

        {/* Sub-copy */}
        <motion.p
          variants={itemVariants}
          className="max-w-lg text-base/7 text-[var(--ac-muted)] font-light"
        >
          {t.home.ctaDesc}
        </motion.p>

        {/* CTA button */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center">
          <a
            href="#"
            className={[
              'h-14 px-10 inline-flex items-center gap-3',
              'bg-[var(--ac-ink)] text-[var(--ac-paper)] text-sm tracking-widest uppercase font-medium',
              'hover:bg-[#2C2C2C] transition-colors duration-300 group',
            ].join(' ')}
            data-cursor-label="Launch App"
          >
            {t.home.ctaLaunch}
            <svg
              className="group-hover:translate-x-1.5 transition-transform duration-300"
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              aria-hidden="true"
            >
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <a
            href="#"
            className={[
              'h-14 px-10 inline-flex items-center',
              'border border-[var(--ac-line)] text-[var(--ac-ink)] text-sm tracking-widest uppercase',
              'hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all duration-300',
            ].join(' ')}
          >
            {t.home.ctaDocs}
          </a>
        </motion.div>
      </motion.div>

      {/* Footer strip */}
      <footer className="relative z-10 mt-32 pt-8 border-t border-[var(--ac-line)] flex flex-col md:flex-row items-center justify-between gap-4">
        <p
          className="text-xl text-[var(--ac-ink)]"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
        >
          ArtCurve
        </p>
        <p className="text-xs text-[var(--ac-muted)] tracking-wider">
          {t.home.ctaFooter}
        </p>
        <div className="flex gap-6">
          {['Twitter', 'Discord', 'GitHub'].map((link) => (
            <a
              key={link}
              href="#"
              className="text-xs tracking-widest uppercase text-[var(--ac-muted)] hover:text-[#C9A96E] transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
      </footer>
    </section>
  )
}
