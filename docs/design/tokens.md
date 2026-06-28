# Design Tokens

All tokens defined in `src/app/globals.css`.

## Brand Colors

### Light Mode (`:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--ac-paper` | `#FDFBF7` | Main background (cream) |
| `--ac-paper-2` | `#F5F0E8` | Alt background |
| `--ac-ink` | `#1A1A1A` | Main text (charcoal) |
| `--ac-muted` | `#7A7570` | Muted text |
| `--ac-line` | `#E4DDD3` | Borders |

### Dark Mode (`html.dark`)

| Token | Value | Usage |
|-------|-------|-------|
| `--ac-paper` | `#0F0E0C` | Main background (warm charcoal) |
| `--ac-paper-2` | `#181613` | Alt background |
| `--ac-ink` | `#F0EBE1` | Main text (ivory) |
| `--ac-muted` | `#8E877B` | Muted text |
| `--ac-line` | `#2B2823` | Borders |

## Trade Page Tokens (`--tp-*`)

| Token | Light | Dark |
|-------|-------|------|
| `--tp-panel` | `#FFFFFF` | `rgba(0,0,0,0.35)` |
| `--tp-panel-alt` | `#F0EDE7` | `rgba(0,0,0,0.22)` |
| `--tp-border` | `#8C8070` | `rgba(255,255,255,0.05)` |
| `--tp-text-1` | `#0A0A0A` | `rgba(255,255,255,0.92)` |
| `--tp-text-2` | `#1E1E1E` | `rgba(255,255,255,0.58)` |
| `--tp-text-3` | `#333333` | `rgba(255,255,255,0.28)` |
| `--tp-text-4` | `#555555` | `rgba(255,255,255,0.18)` |
| `--tp-text-5` | `#777777` | `rgba(255,255,255,0.10)` |

## Accent Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Gold (primary) | `#D4AF37` | Accent, active states, CTA |
| Gold (light) | `#E8D5B0` | Hover states |
| Gold (dark) | `#8B6914` | Pressed states |
| Green | `#4ade80` | Accumulation phase, Original artwork |
| Purple | `#a78bfa` | AI Art artwork type |
| Blue | `#60a5fa` | AI Assisted artwork type |
| Red | `#f87171` | Migration phase, errors |

## Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-serif` | `Cormorant Garamond, serif` | Headings, artwork titles |
| `--font-sans` | `Inter, system-ui, sans-serif` | Body, UI elements |

## Motion

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-luxury` | `cubic-bezier(0.16, 1, 0.3, 1)` | Page transitions |
| `--ease-reveal` | `cubic-bezier(0.77, 0, 0.175, 1)` | Element reveals |
