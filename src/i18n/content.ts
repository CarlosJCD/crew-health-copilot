// Spanish for the texts of the team's data files, which are written in English and copied unchanged:
// orbit-indicators.json, the Boost library, pulse-spec.json, pain-spec.json, constellations.json, scenarios.json
// and the demo story. The files stay as they are; this map gives each English text its Spanish, keyed by the
// English text itself. A text with no Spanish yet shows in English (a test lists any that are missing).
import CONTENT_ES from './content-es.json'
import { useI18n } from './context'
import type { Lang } from './strings'

const ES = CONTENT_ES as Record<string, string>

/** The text in the current language: Spanish from the map, or the English text when there is none. */
export function L(text: string | undefined | null, lang: Lang): string {
  if (!text) return ''
  if (lang !== 'es') return text
  return ES[text] ?? ES[text.trim()] ?? text
}

/** Whether a data-file text has its Spanish (used by the tests). */
export const hasSpanish = (text: string) => text in ES

/** Hook: `const c = useContent(); c(card.title_en)`. */
export function useContent() {
  const { lang } = useI18n()
  return (text: string | undefined | null) => L(text, lang)
}
