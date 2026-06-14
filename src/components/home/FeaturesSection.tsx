'use client'

// ─────────────────────────────────────────────────────────────────
//  FeaturesSection.tsx  —  Client Component (needs useLanguage)
//
//  Three feature cards with GSAP data-reveal-group stagger.
//  Typography uses Cormorant Garamond for headers.
// ─────────────────────────────────────────────────────────────────

import { useLanguage } from '@/context/LanguageContext'

const FEATURE_ICONS = [
  (
    <svg key="curve" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M4 24 C8 20, 12 8, 16 12 C20 16, 24 4, 28 8" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="16" cy="12" r="2" fill="#C9A96E"/>
    </svg>
  ),
  (
    <svg key="doc" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="6" y="4" width="20" height="24" rx="2" stroke="#C9A96E" strokeWidth="1.5"/>
      <path d="M11 10h10M11 15h10M11 20h6" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="24" cy="24" r="5" fill="var(--ac-paper)" stroke="#C9A96E" strokeWidth="1.5"/>
      <path d="M22 24l1.5 1.5L26 22" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  (
    <svg key="hex" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 4 L28 10 L28 22 L16 28 L4 22 L4 10 Z" stroke="#C9A96E" strokeWidth="1.5" fill="none"/>
      <path d="M16 4v24M4 10l12 6 12-6" stroke="#C9A96E" strokeWidth="1" strokeOpacity="0.4"/>
      <circle cx="16" cy="16" r="3" fill="#C9A96E" opacity="0.8"/>
    </svg>
  ),
]

export function FeaturesSection() {
  const { t } = useLanguage()

  const FEATURES = [
    {
      number:      '01',
      title:       t.home.feat1Title,
      description: t.home.feat1Desc,
      icon:        FEATURE_ICONS[0],
    },
    {
      number:      '02',
      title:       t.home.feat2Title,
      description: t.home.feat2Desc,
      icon:        FEATURE_ICONS[1],
    },
    {
      number:      '03',
      title:       t.home.feat3Title,
      description: t.home.feat3Desc,
      icon:        FEATURE_ICONS[2],
    },
  ]

  return (
    <section
      id="marketplace"
      className="relative py-32 px-6 md:px-16 lg:px-24 bg-[var(--ac-paper)]"
      aria-labelledby="features-heading"
    >
      {/* Section header */}
      <div className="mb-20 max-w-xl" data-reveal="fade-up">
        <p className="mb-3 text-xs tracking-[0.35em] uppercase text-[#C9A96E]">
          {t.home.featLabel}
        </p>
        <h2
          id="features-heading"
          className="text-[clamp(2rem,5vw,3.5rem)]/[1.05] font-light text-[var(--ac-ink)]"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
          data-motion-text="lines"
        >
          <span className="motion-line-mask"><span className="motion-line block">{t.home.featHeading1}</span></span>
          <span className="motion-line-mask"><span className="motion-line block italic text-[#C9A96E]">{t.home.featHeading2}</span></span>
        </h2>
      </div>

      {/* Feature cards — staggered reveal via GSAP data-reveal-group */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--ac-line)]"
        data-reveal-group
      >
        {FEATURES.map(({ number, title, icon, description }) => (
          <article
            key={number}
            className="bg-[var(--ac-paper)] p-10 flex flex-col gap-8 group hover:bg-[var(--ac-paper-2)] transition-colors duration-500"
            data-reveal-item
          >
            {/* Number + Icon */}
            <div className="flex items-start justify-between">
              <span
                className="text-5xl font-light text-[var(--ac-line)] leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                aria-hidden="true"
              >
                {number}
              </span>
              <div className="group-hover:scale-110 transition-transform duration-500">
                {icon}
              </div>
            </div>

            {/* Title */}
            <h3
              className="text-2xl font-light leading-snug whitespace-pre-line text-[var(--ac-ink)]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {title}
            </h3>

            {/* Description */}
            <p className="text-sm/6 text-[var(--ac-muted)] font-light">
              {description}
            </p>

            {/* Hover indicator */}
            <div className="mt-auto h-px w-0 bg-[#C9A96E] group-hover:w-full transition-[width] duration-500" aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  )
}
