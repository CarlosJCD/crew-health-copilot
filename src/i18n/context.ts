import { createContext, useContext } from 'react'
import type { Lang, Localized, StringKey } from './strings'

export interface I18n {
  lang: Lang
  setLang: (lang: Lang) => void
  /** UI string by key, with `{name}` placeholders filled from `vars`. */
  t: (key: StringKey, vars?: Record<string, string | number>) => string
  /** Pick the current language from a data-file value. */
  tr: (value: Localized) => string
  unit: (unit: string) => string
  /** Number formatting. Both languages use a decimal point (as in Mexico). */
  num: (value: number, decimals?: number) => string
}

export const I18nContext = createContext<I18n | null>(null)

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
