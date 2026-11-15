import { useCallback, useMemo, useState } from 'react'
import type { SymptomLog } from '../orbit/body'
import { DOMAIN_IDS, type Color, type Scenario } from '../orbit/config'
import { COLOR_SYMBOL, FIGURE, FIGURE_LIGHT } from '../orbit/display'
import type { Theme } from '../lib/theme'
import type { LoadedDemo } from '../orbit/demoData'
import { evaluateDay, worstColor, type OrbitState } from '../orbit/engine'
import { heatColor, heatOn } from '../orbit/heat'
import { INTENSITY_COLORS, toViewerSide, type BodyView, type PainDay, type PainLog, type PaintStroke } from '../orbit/pain'
import { DISPLAY, type BoostLog } from '../orbit/boost'
import type { Checkins } from '../orbit/checkin'
import type { PulseSession } from '../orbit/pulse'
import type { CareSummary } from '../orbit/care'
import { useI18n } from '../i18n/context'
import { useFigure } from '../lib/figure'
import { PainPanel } from '../components/PainPanel'
import { PaintSurface } from '../components/PainPainter'
import { Sheet } from '../components/Sheet'

interface Props {
  demo: LoadedDemo
  day: number
  onDayChange: (d: number) => void
  scenario: Scenario
  /** Symptoms logged with the old per-system buttons (still warm the heat map). */
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

/** Where the main button of the day goes, by ORBIT state. */
const CTA_HREF: Record<OrbitState, string> = {
  GREEN: '#/mind',
  YELLOW: '#/boost',
  EARLY_SIGNAL: '#/boost',
  RED_PHYSICAL: '#/transmit',
  RED_PSYCH: '#/mind',
}

/**
 * Home: the body is the screen. One short line with today's state, and the figure as a heat map of what she
 * logged (warm = recent). She draws on it with her finger where it hurts, and one button takes her to
 * "what do you feel?". Everything else is one tap away in the navigation.
 */
export function BodyMap(props: Props) {
  const { demo, day, log, painLog, onPainChange, boostLog, onBoostLogChange, theme = 'dark' } = props
  const fig = theme === 'light' ? FIGURE_LIGHT : FIGURE
  const { t } = useI18n()
  const [view, setView] = useState<BodyView>('front')
  const [figure, setFigure] = useFigure()
  const [strokes, setStrokes] = useState<PaintStroke[]>([])
  const [painOpen, setPainOpen] = useState(false)
  const { data } = demo
  const result = useMemo(() => evaluateDay(data, day), [data, day])
  const state = result.state
  const overall: Color = worstColor(Object.values(result.domains))
  const heat = useMemo(() => heatOn(day, view, painLog, log), [day, view, painLog, log])
  const otherView: BodyView = view === 'front' ? 'back' : 'front'
  const otherWarm = useMemo(() => heatOn(day, otherView, painLog, log).zones.length, [day, otherView, painLog, log])
  const sideName = (v: BodyView) => t(v === 'front' ? 'home.front' : 'home.back')

  const boostToday = boostLog[day] ?? { chosen: [], helped: {} }
  const toggleCard = (id: string) => {
    const chosen = boostToday.chosen.includes(id)
      ? boostToday.chosen.filter((c) => c !== id)
      : boostToday.chosen.length < DISPLAY.max_choices
        ? [...boostToday.chosen, id]
        : boostToday.chosen
    onBoostLogChange({ ...boostLog, [day]: { ...boostToday, chosen } })
  }
  const closePain = useCallback(() => setPainOpen(false), [])
  const clearPaint = useCallback(() => setStrokes([]), [])
  const drew = strokes.length > 0

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
        <div className="figure-controls">
          <div className="segmented" role="group" aria-label={t('home.view')}>
            {(['front', 'back'] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                {sideName(v)}
                {v !== view && otherWarm > 0 && <span className="warm-dot" aria-label={t('home.warmThere', { n: otherWarm })} />}
              </button>
            ))}
          </div>
          <div className="segmented compact" role="group" aria-label={t('home.figureKind')}>
            {(['female', 'male'] as const).map((k) => (
              <button key={k} type="button" aria-pressed={figure === k} onClick={() => setFigure(k)}>
                {t(k === 'female' ? 'home.woman' : 'home.man')}
              </button>
            ))}
          </div>
        </div>
        <p className="paint-hint">{t('home.paintHint')}</p>

        <PaintSurface
          key={`${view}-${theme}-${figure}`}
          className="figure"
          view={view}
          size="m"
          scale={1.6}
          strokes={strokes}
          onChange={setStrokes}
          label={t('home.paintFigure', { view: sideName(view) })}
          base={heat.zones.map((z) => ({ slug: z.zone, color: heatColor(z.warmth), ...(z.side ? { side: toViewerSide(z.side, view) } : {}) }))}
          baseDots={heat.dots.map((d) => ({ ...d, color: heatColor(d.warmth) }))}
          fill={fig.fill}
          border={fig.border}
        />

        <div className="heat-key" aria-hidden="true">
          <span>{t('heat.recent')}</span>
          <span className="heat-bar" style={{ background: `linear-gradient(90deg, ${[...INTENSITY_COLORS].reverse().join(', ')}, ${fig.fill})` }} />
          <span>{t('heat.older')}</span>
        </div>
      </section>

      <div className="home-actions">
        {drew ? (
          <>
            <button type="button" className="button primary big" onClick={() => setPainOpen(true)}>
              {t('home.nextFeel')}
            </button>
            <div className="paint-tools">
              <button type="button" className="button ghost" onClick={() => setStrokes(strokes.slice(0, -1))}>
                {t('home.undo')}
              </button>
              <button type="button" className="button ghost" onClick={clearPaint}>
                {t('home.clear')}
              </button>
            </div>
          </>
        ) : (
          <>
            <a className="button primary big" href={CTA_HREF[state]}>
              {t(`home.cta.${state}`)}
            </a>
            <button type="button" className="button ghost big" onClick={() => setPainOpen(true)}>
              {t('home.log')}
            </button>
          </>
        )}
      </div>
      <p className="fineprint">{t('home.notDiag')}</p>

      {painOpen && (
        <Sheet onClose={closePain} title={t('home.painTitle')}>
          <PainPanel
            day={day}
            pain={painLog[day]}
            onChange={onPainChange}
            chosen={boostToday.chosen}
            onToggleCard={toggleCard}
            painted={strokes}
            onSaved={clearPaint}
          />
        </Sheet>
      )}
    </div>
  )
}
