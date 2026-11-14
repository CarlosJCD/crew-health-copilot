import { useI18n } from '../i18n/context'
import type { EscalationPlan, Step } from '../lib/escalation'

/** Escalation ladder adapted to the communication delay of the selected mission. */
export function EscalationPanel({ plan }: { plan: EscalationPlan }) {
  const { t } = useI18n()
  const mark = (step: Step | 'ground') => {
    const current = step === 'ground' ? plan.notifyGround : plan.recommended === step
    return current
      ? { className: 'current', 'aria-current': 'step' as const, badge: <span className="now">{t('esc.now')}</span> }
      : { className: undefined, 'aria-current': undefined, badge: null }
  }
  const self = mark('self-care')
  const cmo = mark('crew-medical-officer')
  const ground = mark('ground')

  return (
    <section className="escalation" aria-labelledby="esc-title">
      <h2 id="esc-title">{t('esc.title')}</h2>
      <ol>
        <li className={self.className} aria-current={self['aria-current']}>
          <strong>{t('esc.self')}</strong> {t('esc.selfBody')} {self.badge}
        </li>
        <li className={cmo.className} aria-current={cmo['aria-current']}>
          <strong>{t('esc.cmo')}</strong> {t('esc.cmoBody')} {cmo.badge}
        </li>
        <li className={ground.className} aria-current={ground['aria-current']}>
          <strong>{t('esc.ground')}</strong>{' '}
          {plan.groundMode === 'queued' ? t('esc.groundDelayed', { n: plan.roundTripMin }) : t('esc.groundLive')}{' '}
          {ground.badge}
        </li>
      </ol>
      <p className="disclaimer">{t('esc.disclaimer')}</p>
    </section>
  )
}
