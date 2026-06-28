# Deployment — Vercel

## Auto-Deploy

Connected to GitHub: `CypherAli/Artcurve_Fe`
- Push to `main` → auto-deploy to production
- Pull requests → preview deployments

**Live URL**: https://artcurve-fe.vercel.app

## Vercel Environment Variables

```
NEXT_PUBLIC_API_URL=https://artcurve-be.onrender.com/api/v1
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_WS_HUB_URL=wss://artcurve-ws-hub.onrender.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<project-id>
NEXT_PUBLIC_SITE_URL=https://artcurve-fe.vercel.app
NEXT_PUBLIC_LIVEKIT_URL=wss://artcurve-3el8ft2f.livekit.cloud
```

## Build Settings

- Framework: Next.js (auto-detected)
- Build command: `npm run build`
- Output directory: `.next`
- Node.js version: 20 (set via `.nvmrc`)

## Notes

- No server-side secrets (all env vars are `NEXT_PUBLIC_*`)
- Gemini API key removed from FE — now proxied through BE
- CSP headers configured in `next.config.ts`
