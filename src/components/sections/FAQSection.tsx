'use client'

// ─────────────────────────────────────────────────────────────────
//  FAQSection.tsx  —  The Neo-Luxury FAQ
//
//  Accordion pattern with Framer Motion height animation.
//  Each item: thin line divider, italic serif question, expanded
//  answer fades + grows. No thick borders — just line geometry.
//  Entrance: label → title word-mask → items stagger fade-up.
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion }      from 'framer-motion'
import { gsap }                         from 'gsap'
import { ScrollTrigger }                from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FAQS = [
  {
    q: 'What exactly is a Bonding Curve?',
    a: 'A bonding curve is a mathematical formula that automatically sets the price of a token based on its circulating supply. The more tokens are bought, the higher the price becomes — and vice versa. On ArtCurve, each artwork is its own bonding curve token. The smart contract holds the liquidity directly, so there is no need for a traditional order book.',
  },
  {
    q: 'How do I sell my artwork token back?',
    a: 'Selling is the inverse of buying. You send your tokens back to the bonding curve smart contract, and it returns ETH to your wallet based on the current price. The price decreases slightly with each sale, which is how the curve self-regulates. Gas fees apply, but on Base they are typically under $0.01.',
  },
  {
    q: 'Why does the price automatically increase when others buy?',
    a: 'The price is a function of supply: P = k / (virtualSupply − soldShares)². As more shares are purchased, the denominator shrinks and price rises exponentially. Early collectors benefit the most — this is the "accumulation zone" before the curve steepens into FOMO territory.',
  },
  {
    q: 'What happens at DEX Migration?',
    a: 'Once 95% of the maximum supply is purchased, the bonding curve hits its target cap. At that point, the liquidity held in the smart contract is automatically seeded into a decentralized exchange (DEX) liquidity pool. The artwork token is now freely tradeable on the open market — this is graduation.',
  },
  {
    q: 'How are gas fees calculated on Base?',
    a: 'ArtCurve runs on Base, an Ethereum L2. Gas fees are computed the same way as Ethereum (gasUsed × baseFeePerGas + tip), but because Base batches thousands of transactions into a single Ethereum calldata post, the cost is typically 100–1000× cheaper — often under $0.01 per trade.',
  },
  {
    q: 'Is my investment protected against rug pulls?',
    a: 'The smart contract holds all liquidity in a non-custodial vault — artists cannot withdraw it. The bonding curve guarantees buy and sell liquidity at any time. Our contracts are audited and the source is verified on-chain. You can always sell back to the curve regardless of the artist\'s actions.',
  },
]

// ── Single accordion item ─────────────────────────────────────────
function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: (typeof FAQS)[0]
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-t border-[#E4DDD3]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-6 py-5 text-left group"
        aria-expanded={isOpen}
      >
        {/* Question */}
        <div className="flex items-start gap-5">
          <span className="shrink-0 font-mono text-[10px] tracking-[0.3em] text-[#C9A96E] mt-1.5">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3
            className="text-[1.15rem] md:text-[1.35rem] font-light text-[#1A1A1A] leading-snug
                       italic group-hover:text-[#C9A96E] transition-colors duration-300"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {faq.q}
          </h3>
        </div>

        {/* Toggle icon */}
        <span
          className="shrink-0 size-5 mt-1 flex items-center justify-center text-[#C9A96E]
                     transition-transform duration-400"
          style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1v12M1 7h12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      {/* Answer — Framer Motion height expand */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p
              className="pl-9 pb-5 text-[0.88rem] leading-[1.75] text-[#7A7570] font-light"
            >
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main section ──────────────────────────────────────────────────
export function FAQSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const labelRef   = useRef<HTMLParagraphElement>(null)
  const titleRef   = useRef<HTMLHeadingElement>(null)
  const itemsRef   = useRef<(HTMLDivElement | null)[]>([])
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  // ── Entrance animations ──────────────────────────────────────
  useEffect(() => {
    const titleWords = Array.from(
      titleRef.current?.querySelectorAll<HTMLElement>('.faq-word') ?? []
    )

    gsap.set(labelRef.current, { autoAlpha: 0, y: 12 })
    gsap.set(titleWords,       { yPercent: 110, opacity: 0, filter: 'blur(8px)' })
    gsap.set(itemsRef.current.filter(Boolean), { autoAlpha: 0, y: 28 })

    const ctx = gsap.context(() => {
      // Header reveal
      gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', once: true },
      })
      .to(labelRef.current,
        { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }, 0)
      .to(titleWords,
        { yPercent: 0, opacity: 1, filter: 'blur(0px)',
          duration: 1.0, ease: 'expo.out', stagger: 0.14 }, 0.1)

      // Items stagger
      itemsRef.current.forEach((el, i) => {
        if (!el) return
        gsap.to(el, {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          ease: 'power3.out',
          delay: i * 0.07,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        })
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#FDFBF7] py-14 overflow-hidden"
      aria-label="FAQ"
    >
      <div className="grid-overlay" aria-hidden="true" />

      <div className="relative z-10 px-6 md:px-16 lg:px-24 max-w-[900px]">

        {/* ── Header ─────────────────────────────────────────── */}
        <p ref={labelRef} className="mb-4 text-[11px] tracking-[0.35em] uppercase text-[#C9A96E]">
          Common Questions
        </p>

        <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
          <h2
            ref={titleRef}
            className="font-light text-[#1A1A1A] flex flex-wrap gap-x-[0.22em]"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize:   'clamp(2rem, 4vw, 3.5rem)',
            }}
            aria-label="FAQ"
          >
            {['Frequently', 'Asked'].map(word => (
              <span key={word} className="overflow-hidden inline-block" aria-hidden="true">
                <span className="faq-word inline-block"
                  style={{ willChange: 'transform, opacity, filter' }}>
                  {word}
                </span>
              </span>
            ))}
          </h2>
        </div>

        {/* ── Accordion list ─────────────────────────────────── */}
        {FAQS.map((faq, i) => (
          <div
            key={i}
            ref={el => { itemsRef.current[i] = el }}
          >
            <FAQItem
              faq={faq}
              index={i}
              isOpen={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          </div>
        ))}

        {/* Bottom border */}
        <div className="border-t border-[#E4DDD3]" />
      </div>
    </section>
  )
}
