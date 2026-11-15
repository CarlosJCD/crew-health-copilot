import { CARDS } from '../orbit/boost'
import { TANK_SIZE, type CareSummary } from '../orbit/care'
import { getIndicator } from '../orbit/config'
import { useI18n } from '../i18n/context'
import { useContent } from '../i18n/content'

/** "Protective factors used": a tank that only fills up (no color, positive feedback only). */
export function CareTank({ care }: { care: CareSummary }) {
  const { t } = useI18n()
  const c = useContent()
  const def = getIndicator('protective')
  const fill = care.level / TANK_SIZE
  const H = 80
  return (
    <section className="care" aria-labelledby="care-title">
      <svg viewBox="0 0 40 100" className="tank" role="img" aria-label={t('care.level', { n: care.level, size: TANK_SIZE })}>
        <rect x="4" y="10" width="32" height={H + 6} rx="10" className="tank-shell" />
        <rect x="7" y={13 + H * (1 - fill)} width="26" height={Math.max(0, H * fill)} rx="7" className="tank-fill" />
      </svg>
      <div>
        <h2 id="care-title">{c(def.label_en)}</h2>
        {care.actions === 0 ? (
          <p className="muted">{t('care.empty')}</p>
        ) : (
          <>
            <p>
              <strong>
                {care.actions === 1 ? t('care.actionOne') : t('care.actions', { n: care.actions })} ·{' '}
                {care.days === 1 ? t('care.dayOne') : t('care.days', { n: care.days })}
              </strong>
            </p>
            <p className="muted">
              {t('care.level', { n: care.level, size: TANK_SIZE })}
              {care.tanksFilled > 0 && ` · ${t('care.tanks', { n: care.tanksFilled })}`}
            </p>
            {care.helped.length > 0 && (
              <p>
                {t('care.helped')}{' '}
                <span>{care.helped.map((id) => c(CARDS[id]?.title_en ?? id)).join(' · ')}</span>
              </p>
            )}
          </>
        )}
        <p className="muted">{c(def.why_en)}</p>
      </div>
    </section>
  )
}
