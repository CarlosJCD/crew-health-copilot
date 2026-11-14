import type { Scenario } from '../data/types'
import { useI18n } from '../i18n/context'

/** Escalation ladder adapted to the communication delay of the selected mission. */
export function EscalationPanel({ scenario }: { scenario: Scenario }) {
  const { t } = useI18n()
  const delayed = scenario.worstRoundTripMin >= 5
  return (
    <section className="escalation" aria-labelledby="esc-title">
      <h2 id="esc-title">{t('esc.title')}</h2>
      <ol>
        <li>
          <strong>{t('esc.self')}</strong> {t('esc.selfBody')}
        </li>
        <li>
          <strong>{t('esc.cmo')}</strong> {t('esc.cmoBody')}
        </li>
        <li>
          <strong>{t('esc.ground')}</strong>{' '}
          {delayed ? t('esc.groundDelayed', { n: scenario.worstRoundTripMin }) : t('esc.groundLive')}
        </li>
      </ol>
      <p className="disclaimer">{t('esc.disclaimer')}</p>
    </section>
  )
}
