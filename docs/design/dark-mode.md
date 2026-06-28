# Dark Mode

## Implementation

ArtCurve uses class-based dark mode with the View Transition API for a cinematic "claw rip" transition.

### Toggle Mechanism

```
ThemeContext (src/context/ThemeContext.tsx)
  └── Reads/writes localStorage key: 'artcurve-theme'
  └── Toggles class 'dark' on <html>
  └── Uses View Transition API for animation
```

### Flash Prevention

Inline script in `layout.tsx` reads localStorage before React hydrates:

```typescript
dangerouslySetInnerHTML={{
  __html: `try{if(localStorage.getItem('artcurve-theme')==='dark')
    document.documentElement.classList.add('dark')}catch(e){}`
}}
```

### CSS Variable System

All colors use CSS variables that auto-switch:

```css
:root {
  --ac-paper: #FDFBF7;    /* light cream */
  --ac-ink:   #1A1A1A;    /* dark text */
}

html.dark {
  --ac-paper: #0F0E0C;    /* dark charcoal */
  --ac-ink:   #F0EBE1;    /* light text */
}
```

### Transition Animation

The "claw rip" effect uses `@keyframes ac-claw-rip`:
1. Old theme captures as screenshot
2. New theme renders underneath
3. Screenshot tears away with shake animation
4. View Transition API handles the compositing

### Component Usage

```typescript
// In components — just use CSS variables
style={{ color: 'var(--ac-ink)', background: 'var(--ac-paper)' }}

// For dynamic colors (phase, artwork type)
// Use inline hex since these don't change with theme
style={{ color: '#D4AF37' }}  // gold accent — same in both modes
```
