'use client'

// ─────────────────────────────────────────────────────────────────
//  CandlestickChart.tsx  —  ApexCharts candlestick, dark trading UI
//
//  · Dynamically imported (no SSR) to avoid window-is-not-defined
//  · OHLC data generated deterministically from sparkline + artId seed
//  · Up candles  → #4ADE80   Down candles → #EF4444
//  · Y-axis on the right, no grid, dashed current-price annotation
// ─────────────────────────────────────────────────────────────────

import dynamic   from 'next/dynamic'
import { useMemo } from 'react'
import type { ApexOptions } from 'apexcharts'

// ── Dynamic import — ApexCharts needs the browser ─────────────────
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr:     false,
  loading: () => (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
    >
      <span className="font-mono text-[8px] tracking-widest animate-pulse"
        style={{ color: 'rgba(255,255,255,0.2)' }}>
        LOADING CHART
      </span>
    </div>
  ),
})

// ── Types ─────────────────────────────────────────────────────────
export type CandleRange = '1H' | '6H' | '1D' | '7D'

interface OHLCPoint {
  x: Date
  y: [number, number, number, number]  // [open, high, low, close]
}

// ── Seeded xorshift32 PRNG — deterministic per artId+range ────────
function mkRng(seed: number) {
  let s = ((seed | 0) + 1) >>> 0
  return () => {
    s ^= s << 13
    s ^= s >> 17
    s ^= s << 5
    return (s >>> 0) / 0xffffffff
  }
}

// ── OHLC generator — follows sparkline trend with realistic noise ──
function buildCandles(
  sparkline: number[],
  range:     CandleRange,
  artId:     number,
): OHLCPoint[] {
  const rng = mkRng(artId * 7919 + range.charCodeAt(0) * 31)

  const COUNT: Record<CandleRange, number> = { '1H': 30, '6H': 28, '1D': 48, '7D': 42 }
  const MS:    Record<CandleRange, number> = {
    '1H':    2 * 60_000,      //  2-min candles → 1 h window
    '6H':   15 * 60_000,      // 15-min candles → 6 h window
    '1D':   30 * 60_000,      // 30-min candles → 1 d window
    '7D':    4 * 3_600_000,   //  4-hr candles  → 7 d window
  }

  const count = COUNT[range]
  const ms    = MS[range]
  const now   = Date.now()

  // Start a bit below sparkline[0] so the curve climbs toward sparkline[-1]
  let price = sparkline[0] * (0.88 + rng() * 0.08)

  const pts: OHLCPoint[] = []

  for (let i = 0; i < count; i++) {
    // Interpolate a "target" from sparkline to keep trend shape
    const t       = i / (count - 1)
    const idx     = t * (sparkline.length - 1)
    const lo      = Math.floor(idx)
    const hi      = Math.min(lo + 1, sparkline.length - 1)
    const frac    = idx - lo
    const target  = sparkline[lo] * (1 - frac) + sparkline[hi] * frac

    const volatility = price * (0.022 + rng() * 0.038)
    const pull       = 0.12 + rng() * 0.10          // mean-reversion toward target
    const drift      = (target - price) * pull
    const noise      = (rng() - 0.47) * volatility

    const open  = price
    const close = open + drift + noise
    const high  = Math.max(open, close) + rng() * volatility * 0.55
    const low   = Math.min(open, close) - rng() * volatility * 0.55

    pts.push({
      x: new Date(now - (count - i) * ms),
      y: [
        parseFloat(open.toFixed(4)),
        parseFloat(high.toFixed(4)),
        parseFloat(low.toFixed(4)),
        parseFloat(close.toFixed(4)),
      ],
    })

    price = close
  }

  return pts
}

// ── Component ──────────────────────────────────────────────────────
export interface CandlestickChartProps {
  artId:      number
  sparkline:  number[]
  phaseColor: string
  range:      CandleRange
  height?:    number
}

export function CandlestickChart({
  artId,
  sparkline,
  phaseColor,
  range,
  height = 160,
}: CandlestickChartProps) {

  const candles      = useMemo(
    () => buildCandles(sparkline, range, artId),
    [sparkline, range, artId],
  )
  const currentPrice = candles[candles.length - 1]?.y[3] ?? 0
  const series       = useMemo(() => [{ data: candles }], [candles])

  const options = useMemo<ApexOptions>(() => ({
    chart: {
      type:       'candlestick',
      background: 'transparent',
      toolbar:    { show: false },
      zoom:       { enabled: false },
      selection:  { enabled: false },
      animations: {
        enabled:  true,
        speed:    380,
        easing:   'easeInOut',
        animateGradually: { enabled: true, delay: 40 },
      },
    },

    plotOptions: {
      candlestick: {
        colors:  { upward: '#4ADE80', downward: '#EF4444' },
        wick:    { useFillColor: true },
      },
    },

    // ── X-axis ────────────────────────────────────────────────────
    xaxis: {
      type:       'datetime',
      labels: {
        show:        height > 80,
        rotate:      0,
        datetimeUTC: false,
        format:      range === '7D' ? 'dd MMM' : 'HH:mm',
        style: {
          colors:     'rgba(255,255,255,0.22)',
          fontFamily: '"Courier New", monospace',
          fontSize:   '8px',
        },
      },
      axisBorder: { show: false },
      axisTicks:  { show: false },
    },

    // ── Y-axis — RIGHT side ───────────────────────────────────────
    yaxis: {
      opposite: true,
      show:     height > 80,
      tickAmount: 4,
      labels: {
        style: {
          colors:     'rgba(255,255,255,0.22)',
          fontFamily: '"Courier New", monospace',
          fontSize:   '8px',
        },
        formatter: (v: number) => v.toFixed(2),
      },
    },

    // ── No grid ───────────────────────────────────────────────────
    grid: { show: false },

    // ── Current-price dashed annotation ──────────────────────────
    annotations: {
      yaxis: [
        {
          y:               currentPrice,
          borderColor:     'rgba(255,255,255,0.28)',
          borderWidth:     1,
          strokeDashArray: 5,
          label: {
            text:     `${currentPrice.toFixed(3)} ETH`,
            position: 'right',
            style: {
              color:      'rgba(255,255,255,0.5)',
              background: 'rgba(0,0,0,0.7)',
              fontFamily: '"Courier New", monospace',
              fontSize:   '8px',
              padding:    { top: 2, bottom: 2, left: 5, right: 5 },
            },
          },
        },
      ],
    },

    // ── Tooltip ───────────────────────────────────────────────────
    tooltip: {
      enabled: true,
      theme:   'dark',
      style:   {
        fontFamily: '"Courier New", monospace',
        fontSize:   '10px',
      },
    },

    // ── Theme ─────────────────────────────────────────────────────
    theme: { mode: 'dark' },
  }), [currentPrice, range, height])

  return (
    <div
      className="relative w-full overflow-hidden rounded-sm"
      style={{
        height,
        transition: 'height 0.38s cubic-bezier(0.25,0.46,0.45,0.94)',
        background: 'rgba(0,0,0,0.55)',
        border:     '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <ReactApexChart
        type="candlestick"
        series={series}
        options={options}
        width="100%"
        height={height}
      />
    </div>
  )
}
