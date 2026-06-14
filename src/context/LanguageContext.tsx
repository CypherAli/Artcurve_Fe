'use client'

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react'
import { translations, DEFAULT_LOCALE, type LocaleCode } from '@/i18n'
import { authStore }   from '@/lib/auth-store'
import { userService } from '@/services/user.service'

const LS_KEY = 'artcurve_lang'

interface LanguageContextValue {
  locale: LocaleCode
  t:      typeof translations[LocaleCode]
  setLocale: (code: LocaleCode) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  locale:    DEFAULT_LOCALE,
  t:         translations[DEFAULT_LOCALE],
  setLocale: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE
    try {
      const saved = localStorage.getItem(LS_KEY) as LocaleCode | null
      if (saved && translations[saved]) return saved
    } catch { /* SSR */ }
    return DEFAULT_LOCALE
  })

  const setLocale = useCallback((code: LocaleCode) => {
    if (!translations[code]) return
    setLocaleState(code)
    localStorage.setItem(LS_KEY, code)

    // Sync to BE if logged in
    if (authStore.getJwt()) {
      userService.updateMe({ language: code }).catch(() => {})
    }
  }, [])

  return (
    <LanguageContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  )
}

/** Main hook — use anywhere in the app */
export function useLanguage() {
  return useContext(LanguageContext)
}
