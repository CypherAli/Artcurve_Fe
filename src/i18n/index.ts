import en from './locales/en'
import vi from './locales/vi'
import fr from './locales/fr'
import ja from './locales/ja'
import es from './locales/es'
import zh from './locales/zh'
import ko from './locales/ko'
import de from './locales/de'
import ar from './locales/ar'
import pt from './locales/pt'

export type LocaleCode = 'en' | 'vi' | 'fr' | 'ja' | 'es' | 'zh' | 'ko' | 'de' | 'ar' | 'pt'

export interface LangMeta {
  code:    LocaleCode
  flag:    string   // emoji flag
  label:   string   // English name
  native:  string   // Native name
  rtl?:    boolean  // right-to-left
}

export const LANGUAGES: LangMeta[] = [
  { code: 'en', flag: '🇺🇸', label: 'English',    native: 'English'    },
  { code: 'vi', flag: '🇻🇳', label: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'fr', flag: '🇫🇷', label: 'French',     native: 'Français'   },
  { code: 'ja', flag: '🇯🇵', label: 'Japanese',   native: '日本語'      },
  { code: 'es', flag: '🇪🇸', label: 'Spanish',    native: 'Español'    },
  { code: 'zh', flag: '🇨🇳', label: 'Chinese',    native: '中文'        },
  { code: 'ko', flag: '🇰🇷', label: 'Korean',     native: '한국어'      },
  { code: 'de', flag: '🇩🇪', label: 'German',     native: 'Deutsch'    },
  { code: 'ar', flag: '🇸🇦', label: 'Arabic',     native: 'العربية', rtl: true },
  { code: 'pt', flag: '🇧🇷', label: 'Portuguese', native: 'Português'  },
]

export const translations: Record<LocaleCode, typeof en> = {
  en, vi, fr, ja, es, zh, ko, de, ar, pt,
}

export const DEFAULT_LOCALE: LocaleCode = 'en'
