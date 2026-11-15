import { useMemo, useState } from 'react'
import Body, { type ExtendedBodyPart } from 'react-muscle-highlighter'
import { isRedFlag, SYSTEMS, systemColor, systemOfZone, systemRisks, type SymptomLog, type SystemId } from '../orbit/body'
import { getIndicator, type Color, type Scenario } from '../orbit/config'
import { COLOR_SYMBOL, FIGURE, STATUS_FILL } from '../orbit/display'
import type { LoadedDemo } from '../orbit/demoData'
import { evaluateDay } from '../orbit/engine'
import type { PainDay, PainLog } from '../orbit/pain'
import { boostPlan, DISPLAY, downrankedCards, type BoostLog } from '../orbit/boost'
import type { Checkins } from '../orbit/checkin'
import { remindersFor } from '../orbit/plan'
import type { PulseSession } from '../orbit/pulse'
import { useI18n } from '../i18n/context'
import { DayControl } from '../components/DayControl'
import { PainPanel } from '../components/PainPanel'
import { StatePanel } from '../components/StatePanel'
import { SymptomHeatmap } from '../components/SymptomHeatmap'
import { TodayPlan } from '../components/TodayPlan'

interface Props {
  demo: LoadedDemo
  day: number
  onDayChange: (d: number) => void
  scenario: Scenario
  log: SymptomLog
  onLogChange: (log: SymptomLog) => void
  /** Pain logged on every day (the heat map needs the history). */
  painLog: PainLog
  onPainChange: (pain: PainDay) => void
  /** For the reminders and the self-care she chooses next to the body (same log as Boost). */
  checkins: Checkins
  pulseSessions: PulseSession[]
  boostLog: BoostLog
  onBoostLogChange: (log: BoostLog) => void
}

/**
 * Marker of each system as a fraction of the figure's box (female front model, measured on its zones):
 * brain on top of the head, eyes at eye level, heart on her left chest, gut on the abdomen, bone and muscle
 * on the thigh, immune system and skin on the forearm. The marker carries the shape (● ▲ ■ ○), so the
 * state reads without color, and it is the keyboard path to each system.
 */
const SPOTS: Record<SystemId, { x: number; y: number }> = {
  brain: { x: 0.505, y: 0.072 },
  eyes: { x: 0.505, y: 0.128 },
  heart: { x: 0.575, y: 0.271 },
  gut: { x: 0.505, y: 0.39 },
  musculoskeletal: { x: 0.396, y: 0.54 },
  immune: { x: 0.77, y: 0.393 },
}

/**
 * Home screen. Astronauts have little medical background and little time, so the first thing they see
 * is the body: today's state in one panel, the six-system figure with "For today" beside it (reminders
 * and the self-care she can choose), and "Does something hurt?". The numbers live one tap away in Metrics;
 * the technical details of each system stay folded.
 */
export function BodyMap(props: Props) {
  const { demo, day, onDayChange, scenario, log, onLogChange, painLog, onPainChange, checkins, pulseSessions, boostLog, onBoostLogChange } = props
  const { t } = useI18n()
  const [selected, setSelected] = useState<SystemId>('heart')
  const [mode, setMode] = useState<'today' | 'history'>('today')
  const { data } = demo
  const result = useMemo(() => evaluateDay(data, day), [data, day])
  const record = data.days.find((d) => d.day === day)
  const symptomsToday = record?.symptoms ?? []
  const logged = log[day] ?? []
  const colors = Object.fromEntries(SYSTEMS.map((s) => [s.id, systemColor(s, result, symptomsToday)])) as Record<SystemId, Color>
  const system = SYSTEMS.find((s) => s.id === selected)!
  const name = (id: SystemId) => t(`body.${id}`)

  const add = (symptom: string) => {
    const s = symptom.trim().toLowerCase()
    if (s && !logged.includes(s)) onLogChange({ ...log, [day]: [...logged, s] })
  }
  const remove = (symptom: string) => onLogChange({ ...log, [day]: logged.filter((s) => s !== symptom) })
  // Boost's plan for the day, the reminders, and her choices (shared with Boost).
  const plan = useMemo(
    () => boostPlan(result, record, data.persona, downrankedCards(boostLog), data.days.filter((d) => d.day <= day)),
    [result, record, data, boostLog, day],
  )
  const reminders = remindersFor({ day, checkins, pulseSessions, boostLog, painLog, plan })
  const boostToday = boostLog[day] ?? { chosen: [], helped: {} }
  const toggleCard = (id: string) => {
    const chosen = boostToday.chosen.includes(id)
      ? boostToday.chosen.filter((c) => c !== id)
      : boostToday.chosen.length < DISPLAY.max_choices
        ? [...boostToday.chosen, id]
        : boostToday.chosen
    onBoostLogChange({ ...boostLog, [day]: { ...boostToday, chosen } })
  }
  const goToPain = () => document.getElementById('pain-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  // Each system paints its zones with its state; the selected one gets an outline.
  const zones: ExtendedBodyPart[] = SYSTEMS.flatMap((s) =>
    s.zones.map((slug) => ({
      slug,
      ...(colors[s.id] !== 'none' ? { color: STATUS_FILL[colors[s.id]] } : {}),
      ...(selected === s.id ? { styles: { stroke: FIGURE.outline, strokeWidth: 6 } } : {}),
    })),
  )

  return (
    <div className="body-home">
      <DayControl demo={demo} day={day} onDayChange={onDayChange} />
      <StatePanel result={result} scenario={scenario} />
      <p className="see-metrics">
        <a className="button secondary" href="#/today">
          {t('body.seeMetrics')}
        </a>
      </p>

      <div className="bodymap">
        <section className="bodymap-figure" aria-label={t('body.title', { day })}>
          <h2>{t('body.title', { day })}</h2>
          <div className="actions" role="group" aria-label={t('body.title', { day })}>
            <button type="button" className="button secondary" aria-pressed={mode === 'today'} onClick={() => setMode('today')}>
              {t('body.viewToday')}
            </button>
            <button type="button" className="button secondary" aria-pressed={mode === 'history'} onClick={() => setMode('history')}>
              {t('body.viewHistory')}
            </button>
          </div>
          {mode === 'history' ? (
            <SymptomHeatmap day={day} painLog={painLog} symptomLog={log} />
          ) : (
            <>
            <div className="system-figure" role="group" aria-label={t('body.figure')}>
              <Body
                gender="female"
                side="front"
                scale={1.4}
                data={zones}
                defaultFill={FIGURE.fill}
                border={FIGURE.border}
                onBodyPartPress={(part) => {
                  const id = part.slug && systemOfZone(part.slug)
                  if (id) setSelected(id)
                }}
              />
              <div className="spot-layer">
                {SYSTEMS.map((s) => {
                  const p = SPOTS[s.id]
                  const c = colors[s.id]
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`spot color-${c}${selected === s.id ? ' selected' : ''}`}
                      style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                      aria-pressed={selected === s.id}
                      aria-label={`${name(s.id)}: ${t(`color.${c}`)}`}
                      onClick={() => setSelected(s.id)}
                    >
                      <span aria-hidden="true">{COLOR_SYMBOL[c]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <ul className="system-list">
              {SYSTEMS.map((s) => (
                <li key={s.id}>
                  <button type="button" className={`system-btn color-${colors[s.id]}`} aria-pressed={selected === s.id} onClick={() => setSelected(s.id)}>
                    <span aria-hidden="true">{COLOR_SYMBOL[colors[s.id]]}</span> {name(s.id)} · {t(`color.${colors[s.id]}`)}
                  </button>
                </li>
              ))}
            </ul>
            </>
          )}
        </section>

        <div className="bodymap-side">
        <TodayPlan
          day={day}
          plan={plan}
          reminders={reminders}
          painLog={painLog}
          chosen={boostToday.chosen}
          onToggle={toggleCard}
          onPainAgain={goToPain}
        />
        <section className={`bodymap-detail card color-${colors[selected]}`} aria-live="polite">
          <header className="card-head">
            <h2>{name(selected)}</h2>
            <span className="badge">
              <span aria-hidden="true">{COLOR_SYMBOL[colors[selected]]}</span> {t(`color.${colors[selected]}`)}
            </span>
          </header>

          <details className="more">
            <summary>{t('body.more')}</summary>
            {system.indicators.length > 0 ? (
              <>
                <h3>{t('body.watches')}</h3>
                <ul className="watch-list">
                  {system.indicators.map((id) => {
                    const def = getIndicator(id)
                    const r = result.indicators[id]
                    return (
                      <li key={id}>
                        <strong lang="en">{def.label_en}</strong> · {t(`color.${r?.color ?? 'none'}`)}
                        <br />
                        <span lang="en">{r?.reason}</span>
                        <br />
                        <span className="muted">
                          {t('body.how')} <span lang="en">{def.input}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : (
              <p className="muted">{t('body.noIndicator')}</p>
            )}

            <p>
              <strong>{t('card.risk')}</strong>{' '}
              {systemRisks(system).map((risk, i) => (
                <span key={risk}>
                  {i > 0 && ' · '}
                  <a href="https://www.nasa.gov/hrp/risks/" target="_blank" rel="noreferrer" lang="en">
                    {risk}
                  </a>
                </span>
              ))}
            </p>
          </details>

          <h3>{t('body.log')}</h3>
          {system.symptoms.length > 0 && (
            <div className="actions symptom-buttons">
              {system.symptoms.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`button secondary${isRedFlag(s) ? ' alarm' : ''}`}
                  aria-pressed={logged.includes(s)}
                  onClick={() => (logged.includes(s) ? remove(s) : add(s))}
                  lang="en"
                >
                  {isRedFlag(s) && <span aria-hidden="true">■ </span>}
                  {s}
                </button>
              ))}
            </div>
          )}
          <p className="muted">{t('body.alarmNote')}</p>

          {logged.length > 0 && (
            <div role="status">
              <p>
                <strong>{t('body.logged', { day })}</strong>{' '}
                {logged.map((s) => (
                  <button key={s} type="button" className="chip" onClick={() => remove(s)} aria-label={t('body.remove', { s })}>
                    {s} ✕
                  </button>
                ))}
              </p>
              {logged.some(isRedFlag) && (
                <p>
                  {t('body.redNow')} <a href="#/boost">{t('body.openBoost')}</a> · <a href="#/transmit">{t('boost.openTransmit')}</a>
                </p>
              )}
            </div>
          )}
        </section>
        </div>
      </div>

      <PainPanel
        day={day}
        pain={painLog[day]}
        onChange={onPainChange}
        chosen={boostToday.chosen}
        onToggleCard={toggleCard}
      />
    </div>
  )
}
