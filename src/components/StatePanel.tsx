import { delayText, RULES, type Scenario } from '../orbit/config'
import { STATE_ESCALATION, type DayResult } from '../orbit/engine'
import { useI18n } from '../i18n/context'
import type { StringKey } from '../i18n/strings'
import { ORBIT_STEPS, orbitStep } from '../lib/orbit'

/** Today's ORBIT state, what ORBIT says, who sees it, and what reaches Earth given the delay. */
export function StatePanel({ result, scenario }: { result: DayResult; scenario: Scenario }) {
  const { t, lang } = useI18n()
  const esc = RULES.escalation[STATE_ESCALATION[result.state]]
  const live = scenario.one_way_delay_s < 60
  const delay = delayText(scenario.one_way_delay_s)[lang]
  const reply = delayText(scenario.one_way_delay_s * 2)[lang]
  const who = `who.${esc.to}` as StringKey
  const step = orbitStep(result.state)

  return (
    <section className={`state state-${result.state}`} aria-labelledby="state-title" role="status">
      <p className="overline">{t('orbit.today')}</p>
      <ol className="orbit-strip" aria-label={t('orbit.label')}>
        {ORBIT_STEPS.map((s) => (
          <li key={s} aria-current={s === step ? 'step' : undefined} title={t(`orbit.${s}`)}>
            <span aria-hidden="true">{s[0].toUpperCase()}</span>
            <span className="sr-only">{t(`orbit.${s}`)}</span>
          </li>
        ))}
      </ol>
      <p className="orbit-heading">{t(`orbit.heading.${step as 'observe' | 'boost' | 'transmit'}`)}</p>
      <h2 id="state-title">{t(`state.${result.state}`)}</h2>
      <p className="state-text" lang="en">{esc.en}</p>
      {result.state === 'EARLY_SIGNAL' && <p className="state-why">{t('state.days')}</p>}
      <p className="state-who">
        <strong>{t('state.to')}</strong> {t(who)}
        {esc.offer_share_with && <> · {t('state.offer')}</>}
      </p>
      {esc.ground_packet && <p>{live ? t('state.groundLive') : t('state.ground', { delay, reply })}</p>}
      {result.state === 'EARLY_SIGNAL' && (
        <a className="button" href="#/boost">
          {t('state.boost')}
        </a>
      )}
      {result.state === 'RED_PSYCH' && (
        <a className="button" href="#/mind">
          {t('state.choose')}
        </a>
      )}
      <p className="disclaimer">{t('state.disclaimer')}</p>
    </section>
  )
}
