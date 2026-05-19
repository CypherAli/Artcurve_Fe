// ─────────────────────────────────────────────────────────────────
//  FeaturesSection.tsx  —  Server Component (no 'use client')
//
//  Three feature cards with GSAP data-reveal-group stagger.
//  Typography uses Cormorant Garamond for headers.
// ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    number:      '01',
    title:       'Bonding Curve\nPricing',
    description: 'Every artwork has its own automated market maker. Price rises with demand, falls when holders sell. Transparent, on-chain, incorruptible.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M4 24 C8 20, 12 8, 16 12 C20 16, 24 4, 28 8" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <circle cx="16" cy="12" r="2" fill="#C9A96E"/>
      </svg>
    ),
  },
  {
    number:      '02',
    title:       'Provenance\nOn-Chain',
    description: 'Every trade, every owner, every price point — permanently inscribed on Base. No forgeries. No disputes. Pure transparency.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="6" y="4" width="20" height="24" rx="2" stroke="#C9A96E" strokeWidth="1.5"/>
        <path d="M11 10h10M11 15h10M11 20h6" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="24" cy="24" r="5" fill="#FDFBF7" stroke="#C9A96E" strokeWidth="1.5"/>
        <path d="M22 24l1.5 1.5L26 22" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    number:      '03',
    title:       'Graduation\nto DEX',
    description: 'When an artwork reaches its target cap, it graduates to a decentralized exchange. Your shares become liquid, tradable across the ecosystem.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 4 L28 10 L28 22 L16 28 L4 22 L4 10 Z" stroke="#C9A96E" strokeWidth="1.5" fill="none"/>
        <path d="M16 4v24M4 10l12 6 12-6" stroke="#C9A96E" strokeWidth="1" strokeOpacity="0.4"/>
        <circle cx="16" cy="16" r="3" fill="#C9A96E" opacity="0.8"/>
      </svg>
    ),
  },
]

export function FeaturesSection() {
  return (
    <section
      id="marketplace"
      className="relative py-32 px-6 md:px-16 lg:px-24 bg-[#FDFBF7]"
      aria-labelledby="features-heading"
    >
      {/* Section header */}
      <div className="mb-20 max-w-xl" data-reveal="fade-up">
        <p className="mb-3 text-xs tracking-[0.35em] uppercase text-[#C9A96E]">
          How It Works
        </p>
        <h2
          id="features-heading"
          className="text-[clamp(2rem,5vw,3.5rem)]/[1.05] font-light text-[#1A1A1A]"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
          data-motion-text="lines"
        >
          <span className="motion-line-mask"><span className="motion-line block">The Art of</span></span>
          <span className="motion-line-mask"><span className="motion-line block italic text-[#C9A96E]">Liquid Markets.</span></span>
        </h2>
      </div>

      {/* Feature cards — staggered reveal via GSAP data-reveal-group */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#E4DDD3]"
        data-reveal-group
      >
        {FEATURES.map(({ number, title, icon, description }) => (
          <article
            key={number}
            className="bg-[#FDFBF7] p-10 flex flex-col gap-8 group hover:bg-[#F5F0E8] transition-colors duration-500"
            data-reveal-item
          >
            {/* Number + Icon */}
            <div className="flex items-start justify-between">
              <span
                className="text-5xl font-light text-[#E4DDD3] leading-none"
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
              className="text-2xl font-light leading-snug whitespace-pre-line text-[#1A1A1A]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {title}
            </h3>

            {/* Description */}
            <p className="text-sm/6 text-[#7A7570] font-light">
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
