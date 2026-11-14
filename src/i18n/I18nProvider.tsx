import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, type I18n } from './context'
import { DICTIONARIES, format, LANGS, UNITS, type Lang } from './strings'

const STORAGE_KEY = 'lang'

function initialLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY)
  return (LANGS as readonly string[]).includes(saved ?? '') ? (saved as Lang) : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<I18n>(() => {
    const dict = DICTIONARIES[lang]
    return {
      lang,
      setLang,
      t: (key, vars) => format(dict[key], vars),
      tr: (v) => v[lang],
      unit: (u) => UNITS[lang][u] ?? u,
      num: (n, decimals = 0) => n.toFixed(decimals),
    }
  }, [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
