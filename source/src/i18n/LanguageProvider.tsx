import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  type Locale,
  type Messages,
  LOCALE_STORAGE_KEY,
  detectDefaultLocale,
  messages,
} from './locales'

interface LanguageContextValue {
  locale: Locale
  t: Messages
  setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectDefaultLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try { localStorage.setItem(LOCALE_STORAGE_KEY, next) } catch { /* Private browsing may disable storage. */ }
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en'
  }, [])

  const value = useMemo(
    () => ({ locale, t: messages[locale], setLocale }),
    [locale, setLocale],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider')
  return ctx
}
