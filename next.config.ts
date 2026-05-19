import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ── Three.js / R3F: transpile ESM-only packages ───────────────
  transpilePackages: ['three'],

  // ── Image optimization ────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // ── Turbopack (Next.js 16 default) ───────────────────────────
  // Empty config silences the "webpack config present" warning.
  // GLSL shaders are written as inline template literals in
  // HeroCanvas.tsx so no custom loader is needed.
  turbopack: {},
}

export default nextConfig
