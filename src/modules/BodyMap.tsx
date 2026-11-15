import { useCallback, useMemo, useState } from 'react'
import Body, { type ExtendedBodyPart, type Slug } from 'react-muscle-highlighter'
import { SYSTEMS, systemColor, systemOfZone, type SymptomLog, type SystemId } from '../orbit/body'
import { DOMAIN_IDS, type Color, type Scenario } from '../orbit/config'
import { COLOR_SYMBOL, FIGURE, FIGURE_LIGHT, STATUS_FILL, STATUS_FILL_LIGHT } from '../orbit/display'
import type { Theme } from '../lib/theme'
import type { LoadedDemo } from '../orbit/demoData'
import { evaluateDay, worstColor, type OrbitState } from '../orbit/engine'
import type { PainDay, PainLog } from '../orbit/pain'
import { DISPLAY, type BoostLog } from '../orbit/boost'
import type { Checkins } from '../orbit/checkin'
import type { PulseSession } from '../orbit/pulse'
import type { CareSummary } from '../orbit/care'
import { useI18n } from '../i18n/context'
import { PainPanel } from '../components/PainPanel'
import { Sheet } from '../components/Sheet'
import { SymptomHeatmap } from '../components/SymptomHeatmap'

interface Props {
  demo: LoadedDemo
  day: number
  onDayChange: (d: number) => void
  scenario: Scenario
  /** Symptoms logged with the old per-system buttons (still shown on the heat map). */
  log: SymptomLog
  painLog: PainLog
  onPainChange: (pain: PainDay) => void
  checkins: Checkins
  pulseSessions: PulseSession[]
  boostLog: BoostLog
  onBoostLogChange: (log: BoostLog) => void
  /** Protective factors used (shown in Care). */
  care?: CareSummary
  theme?: Theme
}

/**
 * Markers of each system on the front figure, as a fraction of the figure's box (female model). The marker
 * carries the shape (● ▲ ■ ○), so the state reads without color, and it is the keyboard path to each system.
 */
const SPOTS: Record<SystemId, { x: number; y: number }> = {
  brain: { x: 0.505, y: 0.052 },
  eyes: { x: 0.505, y: 0.118 },
  heart: { x: 0.575, y: 0.271 },
  gut: { x: 0.505, y: 0.39 },
  musculoskeletal: { x: 0.396, y: 0.54 },
  immune: { x: 0.77, y: 0.393 },
}

/** Zones of the back view painted with a system's state (the engine's systems are defined on the front). */
const BACK_ZONES: Partial<Record<SystemId, Slug[]>> = {
  brain: ['head'],
  musculoskeletal: ['trapezius', 'upper-back', 'lower-back', 'gluteal', 'hamstring', 'calves', 'ankles', 'feet'],
}

/** Which system opens when she taps a part of the figure. Unassigned muscles open bone and muscle; the neck opens the throat. */
function systemForTap(slug: Slug | undefined, view: 'front' | 'back'): SystemId {
  if (!slug) return 'musculoskeletal'
  if (view === 'back') return slug === 'head' || slug === 'hair' ? 'brain' : 'musculoskeletal'
  if (slug === 'neck') return 'immune'
  return systemOfZone(slug) ?? 'musculoskeletal'
}

/** Where the main button of the day goes, by ORBIT state. */
const CTA_HREF: Record<OrbitState, string> = {
  GREEN: '#/mind',
  YELLOW: '#/boost',
  EARLY_SIGNAL: '#/boost',
  RED_PHYSICAL: '#/transmit',
  RED_PSYCH: '#/mind',
}

/**
 * Home: the body is the screen. One short line with today's state, the figure colored by system,
 * one main action, and "something hurts". Everything else is one tap away (a sheet per body part,
 * metrics and the rest in the navigation).
 */
export function BodyMap(props: Props) {
  const { demo, day, log, painLog, onPainChange, boostLog, onBoostLogChange, theme = 'dark' } = props
  const fig = theme === 'light' ? FIGURE_LIGHT : FIGURE
  const fill = theme === 'light' ? STATUS_FILL_LIGHT : STATUS_FILL
  const { t } = useI18n()
  const [view, setView] = useState<'front' | 'back' | 'history'>('front')
  const [open, setOpen] = useState<SystemId | null>(null)
  const [painOpen, setPainOpen] = useState(false)
  const { data } = demo
  const result = useMemo(() => evaluateDay(data, day), [data, day])
  const record = data.days.find((d) => d.day === day)
  const symptomsToday = record?.symptoms ?? []
  const colors = Object.fromEntries(SYSTEMS.map((s) => [s.id, systemColor(s, result, symptomsToday)])) as Record<SystemId, Color>
  const state = result.state
  const name = (id: SystemId) => t(`body.${id}`)

  const boostToday = boostLog[day] ?? { chosen: [], helped: {} }
  const toggleCard = (id: string) => {
    const chosen = boostToday.chosen.includes(id)
      ? boostToday.chosen.filter((c) => c !== id)
      : boostToday.chosen.length < DISPLAY.max_choices
        ? [...boostToday.chosen, id]
        : boostToday.chosen
    onBoostLogChange({ ...boostLog, [day]: { ...boostToday, chosen } })
  }
  const closeSystem = useCallback(() => setOpen(null), [])
  const closePain = useCallback(() => setPainOpen(false), [])

  // Paint each system's zones with its state; the open one gets a white outline.
  const zones: ExtendedBodyPart[] = SYSTEMS.flatMap((s) =>
    (view === 'front' ? s.zones : view === 'back' ? (BACK_ZONES[s.id] ?? []) : []).map((slug) => ({
      slug,
      ...(colors[s.id] !== 'none' ? { color: fill[colors[s.id]] } : {}),
      ...(open === s.id ? { styles: { stroke: fig.outline, strokeWidth: 6 } } : {}),
    })),
  )

  const system = open ? SYSTEMS.find((s) => s.id === open)! : null
  // The indicator that sets the color of the open system (the first yellow or red one), for one short reason.
  const cause = system?.indicators
    .map((id) => ({ id, r: result.indicators[id] }))
    .find((x) => x.r && (x.r.color === 'yellow' || x.r.color === 'red'))
  const overall: Color = worstColor(Object.values(result.domains))

  return (
    <div className={`home state-${state}`}>
      <section className="hero" role="status" aria-live="polite">
        <p className="hero-state">
          <span className="shape" aria-hidden="true">{COLOR_SYMBOL[overall]}</span>
          {t(`home.state.${state}`)}
        </p>
        <p className="hero-sub">{t(`home.sub.${state}`)}</p>
        <ul className="domain-row">
          {DOMAIN_IDS.map((d) => (
            <li key={d} className={`pill color-${result.domains[d]}`}>
              <span aria-hidden="true">{COLOR_SYMBOL[result.domains[d]]}</span> {t(`domain.${d}`)}
              <span className="sr-only">: {t(`color.${result.domains[d]}`)}</span>
            </li>
          ))}
        </ul>
      </section>


      <section className="figure-stage" aria-label={t('home.figure')}>
        <div className="segmented" role="group" aria-label={t('home.view')}>
          <button type="button" aria-pressed={view === 'front'} onClick={() => setView('front')}>
            {t('home.front')}
          </button>
          <button type="button" aria-pressed={view === 'back'} onClick={() => setView('back')}>
            {t('home.back')}
          </button>
          <button type="button" aria-pressed={view === 'history'} onClick={() => setView('history')}>
            {t('home.history')}
          </button>
        </div>

        {view === 'history' ? (
          <div className="figure-history">
            <SymptomHeatmap day={day} painLog={painLog} symptomLog={log} />
          </div>
        ) : (
        <div className="figure">
          <Body
            key={`${view}-${theme}`}
            gender="female"
            side={view === 'back' ? 'back' : 'front'}
            scale={1.6}
            data={zones}
            defaultFill={fig.fill}
            border={fig.border}
            onBodyPartPress={(part) => setOpen(systemForTap(part.slug, view === 'back' ? 'back' : 'front'))}
          />
          {view === 'front' && (
            <div className="spot-layer">
              {SYSTEMS.map((s) => {
                const p = SPOTS[s.id]
                const c = colors[s.id]
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`spot color-${c}${open === s.id ? ' selected' : ''}`}
                    style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                    aria-label={`${name(s.id)}: ${t(`color.${c}`)}`}
                    onClick={() => setOpen(s.id)}
                  >
                    <span aria-hidden="true">{COLOR_SYMBOL[c]}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        )}
      </section>

      <div className="home-actions">
        <a className="button primary big" href={CTA_HREF[state]}>
          {t(`home.cta.${state}`)}
        </a>
        <button type="button" className="button ghost big" onClick={() => setPainOpen(true)}>
          {t('home.log')}
        </button>
      </div>
      <p className="fineprint">{t('home.notDiag')}</p>

      {system && (
        <Sheet
          onClose={closeSystem}
          title={
            <>
              {name(system.id)}{' '}
              <span className={`pill color-${colors[system.id]}`}>
                <span aria-hidden="true">{COLOR_SYMBOL[colors[system.id]]}</span> {t(`color.${colors[system.id]}`)}
              </span>
            </>
          }
        >
          {cause ? (
            <p className="reason">
              <span lang="en">{cause.r.reason}</span>{' '}
              <a href={`#/today?day=${day}&why=${cause.id}`}>{t('home.why')}</a>
            </p>
          ) : (
            <p className="muted">{system.indicators.length ? t('home.allClear') : t('home.noData')}</p>
          )}

          <button
            type="button"
            className="button ghost wide"
            onClick={() => {
              setOpen(null)
              setPainOpen(true)
            }}
          >
            {t('home.logHere')}
          </button>
        </Sheet>
      )}

      {painOpen && (
        <Sheet onClose={closePain} title={t('home.painTitle')}>
          <PainPanel day={day} pain={painLog[day]} onChange={onPainChange} chosen={boostToday.chosen} onToggleCard={toggleCard} />
        </Sheet>
      )}
    </div>
  )
}
