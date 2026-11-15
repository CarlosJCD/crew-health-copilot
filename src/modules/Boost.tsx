import { useMemo } from 'react'
import {
  BOOST_DISCLAIMER,
  boostPlan,
  CARDS,
  DISPLAY,
  downrankedCards,
  type BoostDay,
  type BoostLog,
} from '../orbit/boost'
import type { LoadedDemo } from '../orbit/demoData'
import { evaluateDay } from '../orbit/engine'
import { useI18n } from '../i18n/context'
import { BoostCardBody } from '../components/BoostCardBody'

interface Props {
  demo: LoadedDemo
  day: number
  log: BoostLog
  onLogChange: (log: BoostLog) => void
  /** All care actions so far (the protective-factors tank on Today). */
  careActions: number
}

const EMPTY: BoostDay = { chosen: [], helped: {} }

/** Boost: protective actions for the day. She chooses up to 2; nothing is chosen for her. */
export function Boost({ demo, day, log, onLogChange, careActions }: Props) {
  const { t } = useI18n()
  const { data } = demo
  const result = useMemo(() => evaluateDay(data, day), [data, day])
  const record = data.days.find((d) => d.day === day)
  const today = log[day] ?? EMPTY
  const plan = useMemo(
    () => boostPlan(result, record, data.persona, downrankedCards(log), data.days.filter((d) => d.day <= day)),
    [result, record, data, log, day],
  )
  const yesterday = log[day - 1]
  const save = (next: BoostDay) => onLogChange({ ...log, [day]: next })
  const toggle = (id: string) => {
    const chosen = today.chosen.includes(id)
      ? today.chosen.filter((c) => c !== id)
      : today.chosen.length < DISPLAY.max_choices
        ? [...today.chosen, id]
        : today.chosen
    save({ ...today, chosen })
  }
  const rate = (id: string, answer: string, which: BoostDay = today, target = day) =>
    onLogChange({ ...log, [target]: { ...which, helped: { ...which.helped, [id]: answer } } })
  const askedYes = today.safety === 'yes'

  return (
    <div className="boost">
      <section className="boost-head">
        <h2>{t('boost.title', { day })}</h2>
        <p>{plan.red ? t('boost.red') : t('boost.intro', { n: DISPLAY.max_choices })}</p>
        <p className="muted">
          <span lang="en">{BOOST_DISCLAIMER}</span> · {t('boost.tank', { n: careActions })}
        </p>
      </section>

      {yesterday && yesterday.chosen.length > 0 && (
        <section className="boost-followup" aria-labelledby="followup">
          <h2 id="followup">{t('boost.followup')}</h2>
          {yesterday.chosen.map((id) => (
            <div key={id} className="help-row">
              <span lang="en">{CARDS[id]?.title_en ?? id}</span>
              <div className="actions" role="group" aria-label={t('boost.didItHelp')}>
                {DISPLAY.did_it_help.options_en.map((o) => (
                  <button key={o} type="button" className="button secondary" aria-pressed={yesterday.helped[id] === o} onClick={() => rate(id, o, yesterday, day - 1)}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {plan.escalate.length > 0 && (
        <section className="boost-escalate">
          {plan.escalate.map((c) => (
            <article key={c.id} className="card color-red">
              <BoostCardBody card={c} />
              <a className="button" href={c.id === 'talk_now' ? '#/mind' : '#/transmit'}>
                {c.id === 'talk_now' ? t('state.choose') : t('boost.openTransmit')}
              </a>
            </article>
          ))}
        </section>
      )}

      {plan.safetyQuestion && (
        <section className="boost-safety" aria-labelledby="safety">
          <h2 id="safety">{t('boost.safety')}</h2>
          <p lang="en">
            <strong>{plan.safetyQuestion.text_en}</strong>
          </p>
          <div className="actions">
            <button type="button" className="button secondary" aria-pressed={askedYes} onClick={() => save({ ...today, safety: 'yes' })}>
              {t('boost.yes')}
            </button>
            <button type="button" className="button secondary" aria-pressed={today.safety === 'no'} onClick={() => save({ ...today, safety: 'no' })}>
              {t('boost.no')}
            </button>
          </div>
          {askedYes && CARDS[plan.safetyQuestion.if_yes] && (
            <article className="card color-red">
              <BoostCardBody card={CARDS[plan.safetyQuestion.if_yes]} />
              <a className="button" href="#/transmit">
                {t('boost.openTransmit')}
              </a>
            </article>
          )}
        </section>
      )}

      {!askedYes && plan.checkFirst.length > 0 && (
        <section aria-labelledby="check-first">
          <h2 id="check-first">{t('boost.checkFirst')}</h2>
          <div className="grid">
            {plan.checkFirst.map((c) => (
              <article key={c.id} className="card">
                <BoostCardBody card={c} />
              </article>
            ))}
          </div>
        </section>
      )}

      {!askedYes && plan.offered.length > 0 && (
        <section aria-labelledby="offered">
          <h2 id="offered">{t('boost.choose', { n: DISPLAY.max_choices, chosen: today.chosen.length })}</h2>
          <div className="grid">
            {plan.offered.map((c) => {
              const chosen = today.chosen.includes(c.id)
              const full = !chosen && today.chosen.length >= DISPLAY.max_choices
              return (
                <article key={c.id} className={`card boost-card${chosen ? ' chosen' : ''}`}>
                  <BoostCardBody card={c} />
                  <button type="button" className="button" aria-pressed={chosen} disabled={full} onClick={() => toggle(c.id)}>
                    {chosen ? t('boost.chosen') : t('boost.pick')}
                  </button>
                  {chosen && (
                    <div className="help">
                      <p className="muted">{t('boost.didItHelpLater', { n: DISPLAY.did_it_help.ask_after_minutes })}</p>
                      <div className="actions" role="group" aria-label={t('boost.didItHelp')}>
                        {DISPLAY.did_it_help.options_en.map((o) => (
                          <button key={o} type="button" className="button secondary" aria-pressed={today.helped[c.id] === o} onClick={() => rate(c.id, o)}>
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
