import { useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/context'
import type { EscalationPlan } from '../lib/escalation'
import { ORBIT_STEPS, orbitStep } from '../lib/orbit'

interface Props {
  plan: EscalationPlan
  /** Plain-text summary for the Crew Medical Officer (built by the dashboard). */
  shareText: string
  children?: ReactNode
}

/**
 * "Next step": where the crew is in today's ORBIT loop (Observe, Read, Boost, Iterate, Transmit),
 * what to do now, and what happens with the flight surgeons on Earth given the mission's signal delay.
 * Exactly one letter is current: Nominal → O, Watch → B (self-care), Act → T (Crew Medical Officer).
 */
export function EscalationPanel({ plan, shareText, children }: Props) {
  const { t } = useI18n()
  // Result of the last copy, kept only while the summary text is unchanged.
  const [copied, setCopied] = useState<{ text: string; ok: boolean }>()
  const copyState = copied?.text === shareText ? (copied.ok ? 'done' : 'failed') : 'idle'

  const step = orbitStep(plan.overall)
  const action =
    step === 'transmit'
      ? t('next.transmit')
      : step === 'boost'
        ? t('next.boost')
        : plan.overall === 'no-data'
          ? t('next.observeNoData')
          : t('next.observe')
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
      <ol className="orbit-strip" aria-label={t('orbit.label')}>
        {ORBIT_STEPS.map((s) => (
          <li key={s} aria-current={s === step ? 'step' : undefined} title={t(`orbit.${s}`)}>
            <span aria-hidden="true">{s[0].toUpperCase()}</span>
            <span className="sr-only">{t(`orbit.${s}`)}</span>
          </li>
        ))}
      </ol>
      <p className="next-action">
        <strong>{t(`orbit.heading.${step}`)}</strong> {action}
      </p>
      {step === 'transmit' && (
        <div className="next-share">
          <button type="button" className="btn primary" onClick={copySummary}>
            {t('esc.copy')}
          </button>
          <small role="status">{copyState === 'done' ? t('esc.copied') : copyState === 'failed' ? t('esc.copyFailed') : ''}</small>
        </div>
      )}
      <p className="ground">
        <span className="overline">{t('esc.ground')}</span>
        {ground}
      </p>
      <p className="disclaimer">{t('esc.disclaimer')}</p>
      {children}
    </section>
  )
}
