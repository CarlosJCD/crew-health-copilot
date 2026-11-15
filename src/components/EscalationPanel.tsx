import { useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/context'
import type { EscalationPlan, Step } from '../lib/escalation'

interface Props {
  plan: EscalationPlan
  /** Plain-text summary for the Crew Medical Officer (built by the dashboard). */
  shareText: string
  children?: ReactNode
}

/**
 * Escalation ladder adapted to the communication delay of the selected mission. Exactly one step is
 * marked "You are here"; the ground step describes what happens with Earth instead of competing with it.
 */
export function EscalationPanel({ plan, shareText, children }: Props) {
  const { t } = useI18n()
  // Result of the last copy, kept only while the summary text is unchanged.
  const [copied, setCopied] = useState<{ text: string; ok: boolean }>()
  const copyState = copied?.text === shareText ? (copied.ok ? 'done' : 'failed') : 'idle'

  const current = (step: Step) => (plan.recommended === step ? ('step' as const) : undefined)
  const here = (step: Step) => plan.recommended === step && <span className="here">{t('esc.now')}</span>
  const ground = plan.notifyGround
    ? plan.groundMode === 'queued'
      ? t('esc.groundQueued', { n: plan.roundTripMin })
      : t('esc.groundLiveNow')
    : plan.groundMode === 'queued'
      ? t('esc.groundLater', { n: plan.roundTripMin })
      : t('esc.groundLive')

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied({ text: shareText, ok: true })
    } catch {
      setCopied({ text: shareText, ok: false })
    }
  }

  return (
    <section className="panel escalation" aria-labelledby="esc-title">
      <h2 id="esc-title" className="overline">
        {t('esc.title')}
      </h2>
      <ol className="steps">
        <li aria-current={current('self-care')}>
          <span className="n">1</span>
          <div>
            <strong>
              {t('esc.self')} {here('self-care')}
            </strong>
            <small>{t('esc.selfBody')}</small>
          </div>
        </li>
        <li aria-current={current('crew-medical-officer')}>
          <span className="n">2</span>
          <div>
            <strong>
              {t('esc.cmo')} {here('crew-medical-officer')}
            </strong>
            <small>{t('esc.cmoBody')}</small>
            {plan.recommended === 'crew-medical-officer' && (
              <>
                <button type="button" className="btn primary" onClick={copySummary}>
                  {t('esc.copy')}
                </button>
                <small role="status">{copyState === 'done' ? t('esc.copied') : copyState === 'failed' ? t('esc.copyFailed') : ''}</small>
              </>
            )}
          </div>
        </li>
        <li>
          <span className="n">3</span>
          <div>
            <strong>{t('esc.ground')}</strong>
            <small>{ground}</small>
          </div>
        </li>
      </ol>
      {!plan.recommended && <p className="all-clear">{t('esc.allClear')}</p>}
      <p className="disclaimer">{t('esc.disclaimer')}</p>
      {children}
    </section>
  )
}
