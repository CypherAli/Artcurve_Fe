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
//  - Đọc theme qua useSyncExternalStore (không phải useState+useEffect)
//    vì đây là state đồng bộ với nguồn bên ngoài React (DOM classList) —
//    đúng công cụ React khuyến nghị cho trường hợp này, tránh vi phạm
//    rule react-hooks/set-state-in-effect (setState đồng bộ trong effect).
// ─────────────────────────────────────────────────────────────────

import {
  createContext, useContext, useCallback, useSyncExternalStore, useMemo,
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

// ── External store: theme thật sự "sống" trong DOM classList, không phải
// React state — các listener được thông báo mỗi khi applyThemeToDom() chạy.
const listeners = new Set<() => void>()

function subscribeToTheme(callback: () => void) {
  listeners.add(callback)
  return () => { listeners.delete(callback) }
}

function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// Server không có DOM thật — luôn trả 'light' để khớp HTML server-rendered
// (script inline trong layout.tsx set class thật TRƯỚC khi hydrate).
function getServerThemeSnapshot(): Theme {
  return 'light'
}

function applyThemeToDom(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* private mode */ }
  listeners.forEach((fn) => fn())
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot)

  const setTheme = useCallback((next: Theme) => {
    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // flushSync đảm bảo DOM cập nhật đồng bộ trước khi View Transition
    // chụp snapshot cũ/mới — applyThemeToDom() tự notify listener, kích
    // hoạt useSyncExternalStore re-render trong cùng flush này.
    const apply = () => flushSync(() => applyThemeToDom(next))

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
