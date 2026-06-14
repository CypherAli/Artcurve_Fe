'use client'
// ─────────────────────────────────────────────────────────────────
//  StudioPage.tsx  —  Artist creation studio
//  Layout: Left form | Center preview + curve | Right checklist
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { useEthBalance } from '@/web3/hooks/useContract'
import { useAccount } from 'wagmi'
import { useLanguage } from '@/context/LanguageContext'

// ── Types ─────────────────────────────────────────────────────────
type StepStatus = 'pending' | 'active' | 'done' | 'error'
interface Step { id:string; label:string; status:StepStatus; note?:string }
type ModerationStatus = 'idle' | 'checking' | 'approved' | 'rejected'

// ── Helpers ───────────────────────────────────────────────────────
function generateTicker(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '$TOKEN'
  const raw = words.length >= 2
    ? (words[0].slice(0,3) + words[1].slice(0,3)).toUpperCase()
    : words[0].slice(0,6).toUpperCase()
  return '$' + raw
}

function bondingCurvePoints(supply: number, k: number, exp: number): [number,number][] {
  const pts: [number,number][] = []
  for (let i = 0; i <= 50; i++) {
    const s = (i / 50) * supply
    pts.push([s, k * Math.pow(s, exp)])
  }
  return pts
}

function scaleToSVG(pts: [number,number][], W: number, H: number, pad=12): [number,number][] {
  const xs = pts.map(p=>p[0]), ys = pts.map(p=>p[1])
  const minX=Math.min(...xs), maxX=Math.max(...xs)
  const minY=Math.min(...ys), maxY=Math.max(...ys)
  return pts.map(([x,y]) => [
    pad + ((x - minX) / (maxX - minX || 1)) * (W - pad*2),
    H - pad - ((y - minY) / (maxY - minY || 1)) * (H - pad*2),
  ])
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ── Constants ─────────────────────────────────────────────────────
const CATEGORIES = ['Painting','Drawing','Digital','Photography','Sculpture','Mixed Media','Generative'] as const
type Category = typeof CATEGORIES[number]

const EASE: [number,number,number,number] = [0.215, 0.61, 0.355, 1.0]

// ── Variants ──────────────────────────────────────────────────────
const PANEL_V = {
  hidden: { opacity:0, y:16 },
  show:   { opacity:1, y:0, transition:{ type:'spring' as const, stiffness:320, damping:26 } },
}
const CONTAINER_V = {
  hidden: { opacity:0 },
  show:   { opacity:1, transition:{ staggerChildren:0.08, delayChildren:0.1 } },
}

// ─────────────────────────────────────────────────────────────────
//  Left: Upload + settings form
// ─────────────────────────────────────────────────────────────────
interface FormData {
  title:       string
  ticker:      string
  description: string
  category:    Category
  supply:      number   // total token supply
  initPrice:   number   // initial price ETH
  curveType:   'linear' | 'quadratic' | 'exponential'
  royalty:     number   // %
}

interface UploadFormProps {
  form: FormData
  fileInfo: { name:string; size:string } | null
  onFileSelect: (f: File) => void
  onTitleChange: (title: string) => void
  onTickerChange: (ticker: string) => void
  onChange: (f: FormData) => void
  onSubmit: () => void
  modStatus: ModerationStatus
}

function UploadForm({
  form, fileInfo, onFileSelect, onTitleChange, onTickerChange, onChange, onSubmit, modStatus
}: UploadFormProps) {
  const { t } = useLanguage()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const catLabel = (cat: Category): string => ({
    Painting: t.studio.catPainting, Drawing: t.studio.catDrawing,
    Digital: t.studio.catDigital, Photography: t.studio.catPhotography,
    Sculpture: t.studio.catSculpture, 'Mixed Media': t.studio.catMixedMedia,
    Generative: t.studio.catGenerative,
  }[cat])

  const curveLabel = (ct: 'linear'|'quadratic'|'exponential'): string =>
    ct === 'linear' ? t.studio.curveLinear :
    ct === 'quadratic' ? t.studio.curveQuadratic : t.studio.curveExponential

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) onFileSelect(f)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) onFileSelect(f)
  }

  return (
    <div className="flex flex-col h-full"
      style={{ borderRight:'1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between px-3 shrink-0"
        style={{ height:36, background:'rgba(0,0,0,0.38)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <span className="font-mono text-[7px] tracking-[0.2em] uppercase" style={{ color:'rgba(255,255,255,0.22)' }}>{t.studio.createArtwork}</span>
        {form.ticker !== '$TOKEN' && (
          <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="font-mono text-[9px] font-bold" style={{ color:'#D4AF37' }}>
            {form.ticker}
          </motion.span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3"
        style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.06) transparent' }}>

        {/* Artwork upload dropzone */}
        <input ref={fileRef} type="file" accept="image/*,video/mp4" hidden onChange={handleFileInput}/>
        <motion.div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          animate={{ borderColor: dragOver ? 'rgba(212,175,55,0.6)' : fileInfo ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.1)' }}
          whileHover={{ borderColor:'rgba(212,175,55,0.4)' }}
          className="flex flex-col items-center justify-center gap-2 py-5 cursor-pointer"
          style={{
            border:'1.5px dashed rgba(255,255,255,0.1)',
            background: fileInfo ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.015)',
          }}>
          {fileInfo ? (
            <>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#4ade80" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="font-mono text-[8px] font-semibold" style={{ color:'#4ade80' }}>{fileInfo.name}</span>
              <span className="font-mono text-[6.5px]" style={{ color:'rgba(74,222,128,0.45)' }}>{fileInfo.size} · {t.studio.clickToChange}</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <span className="font-mono text-[8px]" style={{ color:'rgba(255,255,255,0.22)' }}>{t.studio.uploadPrompt}</span>
              <span className="font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.12)' }}>{t.studio.uploadHint}</span>
            </>
          )}
        </motion.div>

        {/* Title */}
        <div>
          <label className="font-mono text-[7px] tracking-wider uppercase block mb-1"
            style={{ color:'rgba(255,255,255,0.28)' }}>{t.studio.artworkTitleLabel}</label>
          <input
            value={form.title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder={t.studio.artworkTitlePlaceholder}
            className="w-full bg-transparent font-sans text-[11px] px-2.5 py-1.5 outline-none"
            style={{ border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.78)', caretColor:'#D4AF37' }}
          />
        </div>

        {/* Ticker — editable */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-mono text-[7px] tracking-wider uppercase"
              style={{ color:'rgba(255,255,255,0.28)' }}>{t.studio.tickerLabel}</label>
            <span className="font-mono text-[6.5px]" style={{ color:'rgba(255,255,255,0.16)' }}>{t.studio.tickerHint}</span>
          </div>
          <div className="relative">
            <input
              value={form.ticker}
              onChange={e => {
                const raw = e.target.value.toUpperCase().replace(/[^A-Z$]/g,'')
                onTickerChange(raw.startsWith('$') ? raw : '$' + raw)
              }}
              maxLength={8}
              placeholder="$TOKEN"
              className="w-full bg-transparent font-mono text-[11px] font-bold px-2.5 py-1.5 outline-none"
              style={{
                border:'1px solid rgba(212,175,55,0.25)',
                background:'rgba(212,175,55,0.04)',
                color:'#D4AF37',
                caretColor:'#D4AF37',
                letterSpacing:'0.05em',
              }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[6.5px]"
              style={{ color:'rgba(255,255,255,0.18)' }}>
              {form.ticker.replace('$','').length}/6
            </span>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="font-mono text-[7px] tracking-wider uppercase block mb-1.5"
            style={{ color:'rgba(255,255,255,0.28)' }}>{t.studio.categoryLabel}</label>
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map(cat => {
              const active = form.category === cat
              return (
                <motion.button key={cat} type="button"
                  onClick={() => onChange({ ...form, category: cat })}
                  whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                  className="px-2 py-1 font-mono text-[7px]"
                  style={{
                    border:`1px solid ${active?'rgba(212,175,55,0.45)':'rgba(255,255,255,0.08)'}`,
                    background: active?'rgba(212,175,55,0.1)':'transparent',
                    color: active?'#D4AF37':'rgba(255,255,255,0.3)',
                  }}>
                  {catLabel(cat)}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="font-mono text-[7px] tracking-wider uppercase block mb-1"
            style={{ color:'rgba(255,255,255,0.28)' }}>{t.studio.descriptionLabel}</label>
          <textarea
            value={form.description}
            onChange={e => onChange({ ...form, description:e.target.value })}
            placeholder={t.studio.descriptionPlaceholder}
            rows={3}
            className="w-full bg-transparent font-sans text-[11px] px-2.5 py-1.5 outline-none resize-none"
            style={{ border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.78)', caretColor:'#D4AF37' }}
          />
        </div>

        {/* Curve type */}
        <div>
          <label className="font-mono text-[7px] tracking-wider uppercase block mb-1.5"
            style={{ color:'rgba(255,255,255,0.28)' }}>{t.studio.bondingCurveTypeLabel}</label>
          <div className="grid grid-cols-3 gap-1">
            {(['linear','quadratic','exponential'] as const).map(ct => {
              const active = form.curveType === ct
              return (
                <motion.button key={ct} type="button" onClick={() => onChange({ ...form, curveType:ct })}
                  whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  className="py-1.5 font-mono text-[7px] tracking-wider capitalize"
                  style={{
                    border:`1px solid ${active?'rgba(212,175,55,0.4)':'rgba(255,255,255,0.07)'}`,
                    background: active?'rgba(212,175,55,0.07)':'transparent',
                    color: active?'#D4AF37':'rgba(255,255,255,0.28)',
                  }}>
                  {curveLabel(ct)}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Supply & Init price */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-mono text-[7px] tracking-wider uppercase block mb-1"
              style={{ color:'rgba(255,255,255,0.28)' }}>{t.studio.totalSupplyLabel}</label>
            <input
              type="number" min="1000" max="1000000"
              value={form.supply}
              onChange={e => onChange({ ...form, supply: Math.max(1000, Number(e.target.value)) })}
              className="w-full bg-transparent font-mono text-[11px] px-2.5 py-1.5 outline-none"
              style={{ border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.78)', caretColor:'#D4AF37' }}
            />
          </div>
          <div>
            <label className="font-mono text-[7px] tracking-wider uppercase block mb-1"
              style={{ color:'rgba(255,255,255,0.28)' }}>{t.studio.initPriceLabel}</label>
            <input
              type="number" min="0.0001" step="0.0001"
              value={form.initPrice}
              onChange={e => onChange({ ...form, initPrice: Math.max(0.0001, Number(e.target.value)) })}
              className="w-full bg-transparent font-mono text-[11px] px-2.5 py-1.5 outline-none"
              style={{ border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.78)', caretColor:'#D4AF37' }}
            />
          </div>
        </div>

        {/* Royalty slider */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-mono text-[7px] tracking-wider uppercase"
              style={{ color:'rgba(255,255,255,0.28)' }}>{t.studio.creatorRoyaltyLabel}</label>
            <span className="font-mono text-[9px] font-semibold" style={{ color:'#D4AF37' }}>{form.royalty}%</span>
          </div>
          <input type="range" min="0" max="10" step="0.5"
            value={form.royalty}
            onChange={e => onChange({ ...form, royalty: Number(e.target.value) })}
            className="w-full h-1 appearance-none"
            style={{ accentColor:'#D4AF37' }}
          />
          <div className="flex justify-between mt-0.5">
            <span className="font-mono text-[6.5px]" style={{ color:'rgba(255,255,255,0.15)' }}>0%</span>
            <span className="font-mono text-[6.5px]" style={{ color:'rgba(255,255,255,0.15)' }}>10%</span>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="button"
          onClick={onSubmit}
          disabled={!form.title || modStatus === 'checking'}
          whileHover={form.title ? { scale:1.01 } : {}}
          whileTap={form.title  ? { scale:0.98 } : {}}
          transition={{ type:'spring', stiffness:400, damping:18 }}
          className="w-full py-3 font-mono text-[9px] tracking-[0.2em] uppercase font-bold mt-1"
          style={{
            background: form.title ? 'linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.08))' : 'rgba(255,255,255,0.02)',
            border:     form.title ? '1px solid rgba(212,175,55,0.38)' : '1px solid rgba(255,255,255,0.06)',
            color:      form.title ? '#D4AF37' : 'rgba(255,255,255,0.14)',
            cursor:     form.title && modStatus!=='checking' ? 'pointer' : 'not-allowed',
          }}>
          <AnimatePresence mode="wait">
            {modStatus === 'checking' ? (
              <motion.span key="checking" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate:360 }} transition={{ duration:0.9,repeat:Infinity,ease:'linear' }}
                  className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full"/>
                {t.studio.aiModeration}
              </motion.span>
            ) : (
              <motion.span key="submit" initial={{ opacity:0,y:4 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-4 }}>
                {t.studio.launchArtwork}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Center: Preview card + bonding curve SVG
// ─────────────────────────────────────────────────────────────────
function PreviewPanel({ form }: { form: FormData }) {
  const { t } = useLanguage()

  const catLabel = (cat: Category): string => ({
    Painting: t.studio.catPainting, Drawing: t.studio.catDrawing,
    Digital: t.studio.catDigital, Photography: t.studio.catPhotography,
    Sculpture: t.studio.catSculpture, 'Mixed Media': t.studio.catMixedMedia,
    Generative: t.studio.catGenerative,
  }[cat])

  const curveLabel = (ct: 'linear'|'quadratic'|'exponential'): string =>
    ct === 'linear' ? t.studio.curveLinear :
    ct === 'quadratic' ? t.studio.curveQuadratic : t.studio.curveExponential

  const curveExp = form.curveType === 'linear' ? 1 : form.curveType === 'quadratic' ? 2 : 3
  const k = form.initPrice / Math.pow(1, curveExp)
  const pts = bondingCurvePoints(form.supply, k, curveExp)
  const scaled = scaleToSVG(pts, 320, 130)
  const pathD = scaled.map(([x,y],i) => `${i===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  const targetPrice = k * Math.pow(form.supply * 0.8, curveExp)
  const ethToGrad   = pts.reduce((s, [,p], i) => i === 0 ? s : s + (p + pts[i-1][1])/2 * (pts[i][0]-pts[i-1][0]), 0) * 0.8

  // Gas estimate: base 0.0018 ETH + small cost scaling with supply complexity
  const gasEstimate = (0.0018 + (form.supply / 1_000_000) * 0.0012 + (curveExp - 1) * 0.0003).toFixed(4)
  const gasUSD = (Number(gasEstimate) * 3240).toFixed(2)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 shrink-0"
        style={{ height:36, background:'rgba(0,0,0,0.38)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <span className="font-mono text-[7px] tracking-[0.2em] uppercase" style={{ color:'rgba(255,255,255,0.22)' }}>{t.studio.previewLabel}</span>
        <span className="font-mono text-[7.5px]" style={{ color:'rgba(255,255,255,0.18)' }}>{t.studio.curveLabel.replace('{type}', curveLabel(form.curveType))}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
        style={{ scrollbarWidth:'none' }}>

        {/* Token card preview */}
        <motion.div layout className="flex gap-4 p-3"
          style={{ border:'1px solid rgba(212,175,55,0.15)', background:'rgba(212,175,55,0.04)' }}>
          {/* Artwork placeholder */}
          <div className="shrink-0 w-14 h-14 flex items-center justify-center"
            style={{ border:'1px solid rgba(212,175,55,0.2)', background:'rgba(0,0,0,0.4)' }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 21V9"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-mono text-[11px] font-bold" style={{ color:'#D4AF37' }}>
                {form.ticker}
              </div>
              {form.category && (
                <span className="font-mono text-[6.5px] px-1.5 py-0.5"
                  style={{ border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.3)' }}>
                  {catLabel(form.category).toUpperCase()}
                </span>
              )}
            </div>
            <div className="font-sans text-[10px] mt-0.5 truncate" style={{ color:'rgba(255,255,255,0.55)' }}>
              {form.title || t.studio.untitledArtwork}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div>
                <div className="font-mono text-[6px] uppercase" style={{ color:'rgba(255,255,255,0.2)' }}>{t.studio.initPriceCard}</div>
                <div className="font-mono text-[10px]" style={{ color:'rgba(255,255,255,0.6)' }}>{form.initPrice.toFixed(4)} ETH</div>
              </div>
              <div>
                <div className="font-mono text-[6px] uppercase" style={{ color:'rgba(255,255,255,0.2)' }}>{t.studio.supplyCard}</div>
                <div className="font-mono text-[10px]" style={{ color:'rgba(255,255,255,0.6)' }}>{form.supply.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-mono text-[6px] uppercase" style={{ color:'rgba(255,255,255,0.2)' }}>{t.studio.royaltyCard}</div>
                <div className="font-mono text-[10px]" style={{ color:'rgba(255,255,255,0.6)' }}>{form.royalty}%</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bonding curve chart */}
        <div style={{ border:'1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between px-3 py-1.5"
            style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <span className="font-mono text-[7px] tracking-wider" style={{ color:'rgba(255,255,255,0.22)' }}>{t.studio.bondingCurveChart}</span>
            <span className="font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.14)' }}>{t.studio.priceVsSupply}</span>
          </div>
          <svg width="100%" viewBox="0 0 320 130" style={{ display:'block' }}>
            <defs>
              <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.02"/>
              </linearGradient>
            </defs>
            <motion.path
              d={pathD + ` L${(scaled[scaled.length-1]?.[0]??320).toFixed(1)},118 L${(scaled[0]?.[0]??12).toFixed(1)},118 Z`}
              fill="url(#curveGrad)"
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5 }}
            />
            <motion.path d={pathD} fill="none" stroke="#D4AF37" strokeWidth="1.5"
              initial={{ pathLength:0 }} animate={{ pathLength:1 }}
              transition={{ duration:0.8, ease:EASE }}/>
            {/* 80% marker */}
            {scaled[40] && (
              <>
                <line x1={scaled[40][0].toFixed(1)} y1="12" x2={scaled[40][0].toFixed(1)} y2="118"
                  stroke="rgba(255,255,255,0.12)" strokeDasharray="3,3" strokeWidth="1"/>
                <text x={Number(scaled[40][0])+3} y="20" fontFamily="monospace" fontSize="7"
                  fill="rgba(255,255,255,0.3)">{t.studio.supply80}</text>
              </>
            )}
            <text x="12" y="126" fontFamily="monospace" fontSize="7" fill="rgba(255,255,255,0.18)">0</text>
            <text x="284" y="126" fontFamily="monospace" fontSize="7" fill="rgba(255,255,255,0.18)">{form.supply.toLocaleString()}</text>
          </svg>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: t.studio.targetPrice,  value:`${targetPrice.toFixed(4)} ETH`,             note: t.studio.at80Supply },
            { label: t.studio.ethToGrad,    value:`${Math.min(ethToGrad,9999).toFixed(2)} ETH`, note: t.studio.graduationThreshold },
          ].map(({ label, value, note }) => (
            <div key={label} className="px-3 py-2"
              style={{ border:'1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.2)' }}>
              <div className="font-mono text-[6.5px] uppercase tracking-wider mb-1" style={{ color:'rgba(255,255,255,0.2)' }}>{label}</div>
              <div className="font-mono text-[11px] font-semibold" style={{ color:'rgba(255,255,255,0.7)' }}>{value}</div>
              <div className="font-mono text-[6.5px] mt-0.5" style={{ color:'rgba(255,255,255,0.18)' }}>{note}</div>
            </div>
          ))}
        </div>

        {/* Gas estimate */}
        <div className="flex items-center justify-between px-3 py-2.5"
          style={{ border:'1px solid rgba(255,165,0,0.18)', background:'rgba(255,165,0,0.04)' }}>
          <div className="flex items-center gap-2">
            {/* Gas icon */}
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="rgba(255,165,0,0.55)" strokeWidth="1.5">
              <path d="M3 22V8l6-6 6 6v14H3zM9 22v-5h4v5M19 6l2 2v10a2 2 0 01-2 2h-2"/>
              <path d="M19 10h2"/>
            </svg>
            <div>
              <div className="font-mono text-[7px] uppercase tracking-wider" style={{ color:'rgba(255,165,0,0.55)' }}>{t.studio.estGasCost}</div>
              <div className="font-mono text-[6.5px] mt-0.5" style={{ color:'rgba(255,255,255,0.2)' }}>{t.studio.deployDesc.replace('{type}', curveLabel(form.curveType))}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] font-semibold" style={{ color:'rgba(255,165,0,0.8)' }}>
              {gasEstimate} ETH
            </div>
            <div className="font-mono text-[6.5px]" style={{ color:'rgba(255,255,255,0.2)' }}>≈ ${gasUSD}</div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Right: Launch checklist
// ─────────────────────────────────────────────────────────────────
function ChecklistPanel({ steps, modStatus, submitError }: { steps:Step[]; modStatus:ModerationStatus; submitError?: string | null }) {
  const { t } = useLanguage()
  const done  = steps.filter(s => s.status==='done').length
  const total = steps.length

  return (
    <div className="flex flex-col h-full"
      style={{ borderLeft:'1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between px-3 shrink-0"
        style={{ height:36, background:'rgba(0,0,0,0.38)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <span className="font-mono text-[7px] tracking-[0.2em] uppercase" style={{ color:'rgba(255,255,255,0.22)' }}>{t.studio.launchChecklist}</span>
        <span className="font-mono text-[7.5px] font-semibold" style={{ color: done===total?'#4ade80':'rgba(255,255,255,0.28)' }}>
          {done}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="shrink-0 h-1" style={{ background:'rgba(255,255,255,0.05)' }}>
        <motion.div className="h-full"
          animate={{ width:`${(done/total)*100}%` }}
          style={{ background:'linear-gradient(90deg,#D4AF3770,#D4AF37)' }}
          transition={{ duration:0.5, ease:'easeOut' }}/>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5"
        style={{ scrollbarWidth:'none' }}>
        {steps.map(step => {
          const isActive = step.status === 'active'
          const isDone   = step.status === 'done'
          const isErr    = step.status === 'error'
          return (
            <motion.div key={step.id} layout
              className="flex items-start gap-2.5 p-2.5"
              style={{
                border:`1px solid ${isDone?'rgba(74,222,128,0.18)':isActive?'rgba(212,175,55,0.22)':isErr?'rgba(248,113,113,0.18)':'rgba(255,255,255,0.05)'}`,
                background: isDone?'rgba(74,222,128,0.04)':isActive?'rgba(212,175,55,0.05)':isErr?'rgba(248,113,113,0.04)':'rgba(0,0,0,0.15)',
              }}>
              {/* Icon */}
              <div className="shrink-0 w-4 h-4 flex items-center justify-center mt-0.5">
                {isDone && <span style={{ color:'#4ade80', fontSize:10 }}>✓</span>}
                {isErr  && <span style={{ color:'#f87171', fontSize:10 }}>✗</span>}
                {isActive && (
                  <motion.span animate={{ rotate:360 }} transition={{ duration:1,repeat:Infinity,ease:'linear' }}
                    className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full"
                    style={{ color:'#D4AF37' }}/>
                )}
                {step.status==='pending' && (
                  <span className="w-2 h-2 rounded-full" style={{ background:'rgba(255,255,255,0.14)', display:'block' }}/>
                )}
              </div>
              <div>
                <div className="font-mono text-[8px]"
                  style={{ color: isDone?'#4ade80':isActive?'#D4AF37':isErr?'#f87171':'rgba(255,255,255,0.35)' }}>
                  {step.label}
                </div>
                {step.note && (
                  <div className="font-sans text-[7px] mt-0.5" style={{ color:'rgba(255,255,255,0.2)' }}>{step.note}</div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* AI moderation status */}
      <div className="shrink-0 px-3 pb-3">
        <div className="p-3" style={{ border:'1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.2)' }}>
          <div className="font-mono text-[7px] uppercase tracking-wider mb-2" style={{ color:'rgba(255,255,255,0.22)' }}>
            {t.studio.aiModerationTitle}
          </div>
          <AnimatePresence mode="wait">
            {modStatus === 'idle' && (
              <motion.div key="idle" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <div className="font-mono text-[8px]" style={{ color:'rgba(255,255,255,0.28)' }}>{t.studio.awaitingSubmission}</div>
                <div className="font-sans text-[7px] mt-1" style={{ color:'rgba(255,255,255,0.16)' }}>
                  {t.studio.aiCheckDescription}
                </div>
              </motion.div>
            )}
            {modStatus === 'checking' && (
              <motion.div key="checking" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="flex items-center gap-2">
                <motion.span animate={{ rotate:360 }} transition={{ duration:1,repeat:Infinity,ease:'linear' }}
                  className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full"
                  style={{ color:'#D4AF37' }}/>
                <span className="font-mono text-[8px]" style={{ color:'#D4AF37' }}>{t.studio.analyzing}</span>
              </motion.div>
            )}
            {modStatus === 'approved' && (
              <motion.div key="approved" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]">✓</span>
                  <span className="font-mono text-[8px]" style={{ color:'#4ade80' }}>{t.studio.approved}</span>
                </div>
                <div className="font-sans text-[7px] mt-1" style={{ color:'rgba(74,222,128,0.4)' }}>
                  {t.studio.approvedDetails}
                </div>
              </motion.div>
            )}
            {modStatus === 'rejected' && (
              <motion.div key="rejected" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]">✗</span>
                  <span className="font-mono text-[8px]" style={{ color:'#f87171' }}>{t.studio.rejected}</span>
                </div>
                <div className="font-sans text-[7px] mt-1" style={{ color:'rgba(248,113,113,0.5)' }}>
                  {submitError ?? t.studio.rejectedMessage}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Main StudioPage
// ─────────────────────────────────────────────────────────────────
export function StudioPage() {
  const { t } = useLanguage()
  const { address, isConnected }        = useAccount()
  const { formatted: ethBal }           = useEthBalance()
  const shortAddr = address ? `${address.slice(0,5)}…${address.slice(-4)}` : null

  const [form, setForm] = useState<FormData>({
    title: '', ticker: '$TOKEN', description: '',
    category: 'Digital', supply: 100_000,
    initPrice: 0.001, curveType: 'quadratic', royalty: 5,
  })
  const [modStatus, setModStatus]   = useState<ModerationStatus>('idle')
  const [fileInfo,  setFileInfo]    = useState<{ name:string; size:string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [tickerDirty, setTickerDirty] = useState(false)

  // Title change: auto-sync ticker unless user has manually edited it
  const handleTitleChange = useCallback((title: string) => {
    setForm(prev => ({
      ...prev,
      title,
      ticker: tickerDirty ? prev.ticker : generateTicker(title),
    }))
  }, [tickerDirty])

  const handleTickerChange = useCallback((ticker: string) => {
    setTickerDirty(true)
    setForm(prev => ({ ...prev, ticker }))
  }, [])

  const handleFileSelect = useCallback((f: File) => {
    setSelectedFile(f)
    setFileInfo({ name: f.name, size: formatBytes(f.size) })
  }, [])

  const steps: Step[] = useMemo(() => {
    const hasFile    = !!fileInfo
    const hasTitle   = !!form.title.trim()
    const hasDesc    = !!form.description.trim()
    const hasTicker  = form.ticker !== '$TOKEN' && form.ticker.length > 1
    const hasCat     = !!form.category
    return [
      { id:'upload',    label: t.studio.stepUpload,    status:'pending' as StepStatus },
      { id:'metadata',  label: t.studio.stepTitle,     status:'pending' as StepStatus },
      { id:'ticker',    label: t.studio.stepTicker,    status:'pending' as StepStatus },
      { id:'category',  label: t.studio.stepCategory,  status:'pending' as StepStatus },
      { id:'curve',     label: t.studio.stepCurve,     status:'pending' as StepStatus },
      { id:'moderation',label: t.studio.stepAiCheck,   status:'pending' as StepStatus },
      { id:'wallet',    label: t.studio.stepWallet,    status:'pending' as StepStatus },
      { id:'gas',       label: t.studio.stepGas,       status:'pending' as StepStatus },
      { id:'deploy',    label: t.studio.stepDeploy,    status:'pending' as StepStatus },
    ].map(s => {
      if (s.id === 'upload')
        return { ...s, status: hasFile ? 'done' : 'pending', note: hasFile ? fileInfo?.name : undefined } as Step
      if (s.id === 'metadata')
        return { ...s, status: hasTitle && hasDesc ? 'done' : hasTitle ? 'active' : 'pending' } as Step
      if (s.id === 'ticker')
        return { ...s, status: hasTicker ? 'done' : hasTitle ? 'active' : 'pending', note: hasTicker ? form.ticker : undefined } as Step
      if (s.id === 'category')
        return { ...s, status: hasCat ? 'done' : 'pending', note: hasCat ? form.category : undefined } as Step
      if (s.id === 'curve')
        return { ...s, status: hasTitle ? 'done' : 'pending', note: hasTitle ? form.curveType : undefined } as Step
      if (s.id === 'moderation')
        return { ...s,
          status: modStatus==='approved'?'done':modStatus==='checking'?'active':modStatus==='rejected'?'error':'pending' } as Step
      if (s.id === 'wallet')
        return { ...s, status: isConnected ? 'done' : 'error', note: isConnected && shortAddr ? `${shortAddr} connected` : t.studio.notConnected } as Step
      if (s.id === 'gas')
        return { ...s, status: isConnected && ethBal >= 0.005 ? 'done' : 'error', note: isConnected ? `${ethBal.toFixed(4)} ETH available` : '-' } as Step
      if (s.id === 'deploy')
        return { ...s, status: modStatus==='approved'?'active':'pending' } as Step
      return s as Step
    })
  }, [form.title, form.description, form.ticker, form.category, form.curveType, fileInfo, modStatus, t, isConnected, shortAddr, ethBal])

  const handleSubmit = useCallback(async () => {
    if (!form.title) return
    setSubmitError(null)
    setModStatus('checking')

    try {
      // Step 1: upload image + pin metadata to IPFS (if file chosen)
      let ipfsMetadataUri: string | undefined
      let imageUri:        string | undefined
      if (selectedFile) {
        const upload = await api.artworks.uploadMedia(
          selectedFile,
          form.title,
          form.description,
        )
        ipfsMetadataUri = upload.metadata_uri
        imageUri        = upload.image_uri
      }

      // Step 2: create DRAFT in backend
      await api.artworks.createDraft({
        title:             form.title,
        description:       form.description,
        image_uri:         imageUri,
        ipfs_metadata_uri: ipfsMetadataUri,
        target_cap:        String(form.supply * form.initPrice),
        ticker:            form.ticker !== '$TOKEN' ? form.ticker : undefined,
        category:          form.category,
        royalty_pct:       form.royalty.toFixed(2),
        curve_type:        form.curveType,
        init_price:        form.initPrice.toFixed(8),
      })

      setModStatus('approved')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed'
      setSubmitError(message)
      setModStatus('rejected')
    }
  }, [form, selectedFile])

  return (
    <motion.div
      className="flex flex-col overflow-hidden"
      style={{ height:'calc(100vh - 68px)', marginTop:68, background:'#070707', paddingTop:10 }}
      variants={CONTAINER_V} initial="hidden" animate="show">

      {/* Top breadcrumb bar */}
      <motion.div variants={PANEL_V}
        className="flex items-center gap-3 px-4 shrink-0"
        style={{ height:36, background:'rgba(0,0,0,0.45)', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:0 }}>
        <span className="font-mono text-[7px] tracking-[0.2em] uppercase" style={{ color:'rgba(255,255,255,0.22)' }}>{t.studio.breadcrumbStudio}</span>
        <span style={{ color:'rgba(255,255,255,0.12)' }}>›</span>
        <span className="font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.16)' }}>{t.studio.breadcrumbNew}</span>
        {form.title && (
          <motion.span initial={{ opacity:0, x:-4 }} animate={{ opacity:1, x:0 }}
            className="font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.3)' }}>
            › {form.title}
          </motion.span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.16)' }}>
            {isConnected && shortAddr ? `Connected: ${shortAddr}` : t.studio.notConnected}
          </span>
          <span className="size-1.5 rounded-full" style={{ background: isConnected ? '#22c55e' : '#ef4444' }}/>
        </div>
      </motion.div>

      {/* 3-column body */}
      <div className="flex flex-1 min-h-0">
        <motion.div variants={PANEL_V} className="shrink-0 overflow-hidden" style={{ width:280 }}>
          <UploadForm
            form={form}
            fileInfo={fileInfo}
            onFileSelect={handleFileSelect}
            onTitleChange={handleTitleChange}
            onTickerChange={handleTickerChange}
            onChange={setForm}
            onSubmit={handleSubmit}
            modStatus={modStatus}
          />
        </motion.div>
        <motion.div variants={PANEL_V} className="flex-1 min-w-0 overflow-hidden">
          <PreviewPanel form={form}/>
        </motion.div>
        <motion.div variants={PANEL_V} className="shrink-0 overflow-hidden" style={{ width:252 }}>
          <ChecklistPanel steps={steps} modStatus={modStatus} submitError={submitError}/>
        </motion.div>
      </div>
    </motion.div>
  )
}
