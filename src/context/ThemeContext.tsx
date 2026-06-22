'use client'

// ─────────────────────────────────────────────────────────────────
//  ThemeContext — light/dark theme với hiệu ứng "xé toạc bức màn"
//
//  - Theme lưu localStorage ('artcurve-theme'), set class `dark`
//    lên <html>. Script inline trong layout.tsx set class TRƯỚC khi
//    hydrate để không bị flash sai theme (FOUC).
//  - toggleTheme() dùng View Transition API: snapshot theme cũ bị
//    "xé" đi theo keyframes ac-curtain-tear trong globals.css.
//    Firefox/reduced-motion: fallback đổi theme tức thì.
// ─────────────────────────────────────────────────────────────────

import {
  createContext, useContext, useCallback, useEffect, useState, useMemo,
  type ReactNode,
} from 'react'
import { flushSync } from 'react-dom'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'artcurve-theme'

interface ThemeContextValue {
  theme:       Theme
  toggleTheme: () => void
  setTheme:    (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:       'light',
  toggleTheme: () => {},
  setTheme:    () => {},
})

function applyThemeToDom(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* private mode */ }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Khởi tạo 'light' cho SSR; đồng bộ với DOM (do inline script set) sau mount
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
    return 'light'
  })

  const setTheme = useCallback((next: Theme) => {
    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const apply = () => {
      flushSync(() => setThemeState(next))
      applyThemeToDom(next)
    }

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void
    }

    if (doc.startViewTransition && !prefersReduced) {
      doc.startViewTransition(apply)
    } else {
      apply()
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
