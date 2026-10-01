import { useI18n } from '../i18n/LanguageProvider'
import type { Locale } from '../i18n/locales'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400">{t.lang.label}</span>
      <div className="flex rounded-lg bg-slate-100 p-0.5">
        {(['en', 'zh'] as Locale[]).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              locale === code
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.lang[code]}
          </button>
        ))}
      </div>
    </div>
  )
}
