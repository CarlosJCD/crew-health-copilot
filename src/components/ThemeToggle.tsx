import { useI18n } from '../i18n/context'
import { THEMES, type Theme } from '../lib/theme'

/** Dark (default, "Mission") | Light ("Day") switch, styled like the language toggle. */
export function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  const { t } = useI18n()
  return (
    <div className="segmented" role="group" aria-label={t('theme.label')}>
      {THEMES.map((th) => (
        <button key={th} type="button" aria-pressed={theme === th} onClick={() => onChange(th)}>
          {t(th === 'dark' ? 'theme.dark' : 'theme.light')}
        </button>
      ))}
    </div>
  )
}
