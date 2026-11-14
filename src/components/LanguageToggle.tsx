import { useI18n } from '../i18n/context'
import { LANGS } from '../i18n/strings'

/** Segmented EN | ES switch. Each option is a toggle button so screen readers announce which is active. */
export function LanguageToggle() {
  const { lang, setLang, t } = useI18n()
  return (
    <div className="lang-toggle" role="group" aria-label={t('lang.switchTo')}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
