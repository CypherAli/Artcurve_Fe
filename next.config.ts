import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

// Fallback sang Railway khi NEXT_PUBLIC_API_URL chưa được set trên Vercel
const PROD_API = 'https://artcurve-be-production.up.railway.app/api/v1'
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? (isDev ? 'http://localhost:3001/api/v1' : PROD_API)

// Override env ở build time — baked into bundle
process.env.NEXT_PUBLIC_API_URL = rawApiUrl

// API URL để CSP connect-src cho phép WebSocket + REST
const apiUrl = rawApiUrl.replace('/api/v1', '')

const securityHeaders = [
  // Chống clickjacking
  { key: 'X-Frame-Options',        value: 'DENY' },
  // Chặn MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Chỉ gửi origin khi cross-origin (không gửi full URL cho external sites)
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  // Cho phép một số browser features (tắt những cái không dùng)
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS — chỉ áp production (dev dùng HTTP)
  ...(!isDev ? [{
    key:   'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload', // 2 năm
  }] : []),
  // Content Security Policy
  {
    key:   'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js cần inline scripts cho hydration; nonce-based là ideal nhưng phức tạp hơn
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      // Cho phép ảnh từ IPFS gateway và CDN
      "img-src 'self' data: blob: https: ipfs:",
      // Connect: API REST + WebSocket + WalletConnect + RainbowKit
      [
        "connect-src 'self'",
        apiUrl,
        apiUrl.replace('http', 'ws').replace('https', 'wss'), // WebSocket
        'https://*.walletconnect.com',
        'wss://*.walletconnect.com',
        'https://*.walletconnect.org',
        'https://api.web3modal.com',
        'https://rpc.walletconnect.com',
        'https://mainnet.base.org',
        'https://sepolia.base.org',
        'https://gateway.pinata.cloud',
        'https://*.infura.io',
        'https://*.alchemy.com',
        'https://artcurve-be-production.up.railway.app',
        'wss://artcurve-be-production.up.railway.app',
      ].join(' '),
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  // ── Bake env vars vào bundle (override Vercel nếu chưa set) ───
  env: {
    NEXT_PUBLIC_API_URL:  rawApiUrl,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID ?? '8453',
  },

  // ── Three.js / R3F: transpile ESM-only packages ───────────────
  transpilePackages: ['three'],

  // ── Image optimization ────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'gateway.pinata.cloud' },
      { protocol: 'https', hostname: '**.ipfs.dweb.link' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'ipfs.io' },
    ],
  },

  // ── Security headers ──────────────────────────────────────────
  async headers() {
    return [
      {
        source:  '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // ── Turbopack ─────────────────────────────────────────────────
  turbopack: {},
}

export default nextConfig
