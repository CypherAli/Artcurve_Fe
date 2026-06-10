'use client'

// Nút chuyển light/dark — icon mặt trời/mặt trăng morph bằng CSS,
// trigger hiệu ứng xé màn qua ThemeContext.toggleTheme()

import { useTheme } from '@/context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="relative w-9 h-9 flex items-center justify-center rounded-full
                 border border-[var(--ac-line)] text-[var(--ac-ink)]
                 hover:border-[#C9A96E] hover:text-[#C9A96E]
                 transition-colors duration-300 cursor-pointer"
    >
      {/* Sun */}
      <svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
        className={`absolute w-[18px] h-[18px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
      >
        <circle cx="12" cy="12" r="4" />
        <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      {/* Moon */}
      <svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
        className={`absolute w-[18px] h-[18px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
      </svg>
    </button>
  )
}
