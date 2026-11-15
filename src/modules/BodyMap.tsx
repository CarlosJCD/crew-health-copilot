import { useMemo, useState, type KeyboardEvent } from 'react'
import { isRedFlag, SYSTEMS, systemColor, systemRisks, type SymptomLog, type SystemId } from '../orbit/body'
import { getIndicator, type Color, type Scenario } from '../orbit/config'
import { COLOR_SYMBOL } from '../orbit/display'
import type { LoadedDemo } from '../orbit/demoData'
import { evaluateDay } from '../orbit/engine'
import type { PainDay } from '../orbit/pain'
import { useI18n } from '../i18n/context'
import { DayControl } from '../components/DayControl'
import { PainPanel } from '../components/PainPanel'
import { StatePanel } from '../components/StatePanel'

interface Props {
  demo: LoadedDemo
  day: number
  onDayChange: (d: number) => void
  scenario: Scenario
  log: SymptomLog
  onLogChange: (log: SymptomLog) => void
  pain: PainDay | undefined
  onPainChange: (pain: PainDay) => void
}

/** Hotspot position of each system on the figure (viewBox 0 0 200 400). */
const SPOTS: Record<SystemId, { x: number; y: number; r: number }> = {
  brain: { x: 100, y: 34, r: 13 },
  eyes: { x: 100, y: 62, r: 9 },
  heart: { x: 114, y: 136, r: 14 },
  immune: { x: 44, y: 186, r: 12 },
  gut: { x: 100, y: 196, r: 15 },
  musculoskeletal: { x: 82, y: 300, r: 13 },
}

/**
 * Home screen. Astronauts have little medical background and little time, so the first thing they see
 * is the body: today's state in one panel, the six-system figure, and "Does something hurt?". The
 * numbers live one tap away in Metrics; the technical details of each system stay folded.
 */
export function BodyMap({ demo, day, onDayChange, scenario, log, onLogChange, pain, onPainChange }: Props) {
  const { t } = useI18n()
  const [selected, setSelected] = useState<SystemId>('heart')
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
  const keyActivate = (id: SystemId) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setSelected(id)
    }
  }

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
          <svg viewBox="0 0 200 400" className="figure" role="group" aria-label={t('body.figure')}>
            <g className="silhouette" aria-hidden="true">
              <circle cx="100" cy="46" r="32" />
              <rect x="90" y="76" width="20" height="14" rx="4" />
              <rect x="62" y="88" width="76" height="140" rx="26" />
              <rect x="34" y="96" width="22" height="120" rx="11" />
              <rect x="144" y="96" width="22" height="120" rx="11" />
              <rect x="68" y="222" width="28" height="150" rx="13" />
              <rect x="104" y="222" width="28" height="150" rx="13" />
            </g>
            {SYSTEMS.map((s) => {
              const p = SPOTS[s.id]
              const c = colors[s.id]
              return (
                <g
                  key={s.id}
                  className={`spot color-${c}${selected === s.id ? ' selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected === s.id}
                  aria-label={`${name(s.id)}: ${t(`color.${c}`)}`}
                  onClick={() => setSelected(s.id)}
                  onKeyDown={keyActivate(s.id)}
                >
                  <circle cx={p.x} cy={p.y} r={p.r} />
                  <text x={p.x} y={p.y + 4} textAnchor="middle" aria-hidden="true">
                    {COLOR_SYMBOL[c]}
                  </text>
                </g>
              )
            })}
          </svg>
          <ul className="system-list">
            {SYSTEMS.map((s) => (
              <li key={s.id}>
                <button type="button" className={`system-btn color-${colors[s.id]}`} aria-pressed={selected === s.id} onClick={() => setSelected(s.id)}>
                  <span aria-hidden="true">{COLOR_SYMBOL[colors[s.id]]}</span> {name(s.id)} · {t(`color.${colors[s.id]}`)}
                </button>
              </li>
            ))}
          </ul>
        </section>

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

      <PainPanel day={day} pain={pain} onChange={onPainChange} />
    </div>
  )
}
