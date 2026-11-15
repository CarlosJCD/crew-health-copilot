import { useCallback, useMemo, useState } from 'react'
import type { SymptomLog } from '../orbit/body'
import { RULES, type Color, type DomainId, type Scenario } from '../orbit/config'
import { COLOR_SYMBOL, FIGURE, FIGURE_LIGHT, partKey } from '../orbit/display'
import type { Theme } from '../lib/theme'
import type { LoadedDemo } from '../orbit/demoData'
import { evaluateDay, STATE_ESCALATION, worstColor, type DayResult, type OrbitState } from '../orbit/engine'
import { HEAT, heatColor, heatOn, type ZoneHeat } from '../orbit/heat'
import { toViewerSide, type BodyView, type PainDay, type PainLog, type PaintStroke } from '../orbit/pain'
import { boostPlan, CARDS, DISPLAY, downrankedCards, type BoostLog } from '../orbit/boost'
import type { Checkins } from '../orbit/checkin'
import type { PulseSession } from '../orbit/pulse'
import { TANK_SIZE, type CareSummary } from '../orbit/care'
import { mainReminder, remindersFor, type Reminder } from '../orbit/plan'
import { useI18n } from '../i18n/context'
import type { StringKey } from '../i18n/strings'
import { useFigure } from '../lib/figure'
import { CareTank } from '../components/CareTank'
import { InfoTip } from '../components/InfoTip'
import { PainPanel } from '../components/PainPanel'
import { PaintSurface } from '../components/PainPainter'
import { Sheet } from '../components/Sheet'
import { TodayPlan } from '../components/TodayPlan'

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
  /** Protective factors used: the tank, compact on the phone and whole beside the body on wide screens. */
  care: CareSummary
  theme?: Theme
}

/** Main button of the day for the non-green states. Green follows what is still pending (see `greenAction`). */
const CTA: Record<Exclude<OrbitState, 'GREEN'>, { text: StringKey; href: string }> = {
  YELLOW: { text: 'home.cta.YELLOW', href: '#/boost' },
  EARLY_SIGNAL: { text: 'home.cta.EARLY_SIGNAL', href: '#/boost' },
  RED_PHYSICAL: { text: 'home.contactCmo', href: '#/transmit' },
  RED_PSYCH: { text: 'home.cta.RED_PSYCH', href: '#/mind?focus=talk' },
}

/**
 * On a green day the main button is the next thing still pending, or "All done for today". Pulse mode is
 * never the main button: it stays a reminder in "For today" (see `mainReminder`).
 */
function greenAction(reminders: Reminder[]): { text: StringKey; href?: string; pain?: boolean } {
  const next = mainReminder(reminders)
  if (!next) return { text: 'home.cta.done' }
  if (next.id === 'safety') return { text: 'home.cta.safety', href: '#/boost' }
  if (next.id === 'checkin') return { text: 'home.cta.GREEN', href: '#/mind' }
  if (next.id === 'did_it_help') return { text: 'home.cta.help', href: '#/boost' }
  return { text: 'home.cta.painAgain', pain: true }
}

/** Symptom words of the vocabulary are lower case; shown with a capital first letter. */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "a, b and c" in the current language. */
const listText = (items: string[], and: string) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${and} ${items.at(-1)}`)

/**
 * Home: the body is the screen. Today's state in one line with what changed and who sees it, the medical
 * officer first on a red day, "For today" and the tank one tap away (each opens in a panel), and
 * the figure as a heat map of what she logged, where she draws what hurts.
 */
export function BodyMap(props: Props) {
  const { demo, day, log, painLog, onPainChange, checkins, pulseSessions, boostLog, onBoostLogChange, care, theme = 'dark' } = props
  const fig = theme === 'light' ? FIGURE_LIGHT : FIGURE
  const { t } = useI18n()
  const [figure] = useFigure()
  const [view, setView] = useState<BodyView>('front')
  const [strokes, setStrokes] = useState<PaintStroke[]>([])
  const [painOpen, setPainOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [tankOpen, setTankOpen] = useState(false)
  const { data } = demo
  const result = useMemo(() => evaluateDay(data, day), [data, day])
  const record = data.days.find((d) => d.day === day)
  const state = result.state
  const overall: Color = worstColor(Object.values(result.domains))
  const heat = useMemo(() => heatOn(day, view, painLog, log), [day, view, painLog, log])
  const otherView: BodyView = view === 'front' ? 'back' : 'front'
  const otherWarm = useMemo(() => heatOn(day, otherView, painLog, log).zones.length, [day, otherView, painLog, log])
  const sideName = (v: BodyView) => t(v === 'front' ? 'home.front' : 'home.back')

  // Boost's plan for the day and the reminders ("For today"), shared with Care.
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
  const closePain = useCallback(() => setPainOpen(false), [])
  const closePlan = useCallback(() => setPlanOpen(false), [])
  const closeTank = useCallback(() => setTankOpen(false), [])
  const clearPaint = useCallback(() => setStrokes([]), [])
  const openPain = useCallback(() => {
    setPlanOpen(false)
    setPainOpen(true)
  }, [])
  const drew = strokes.length > 0

  const esc = RULES.escalation[STATE_ESCALATION[state]]
  const cta = state === 'GREEN' ? greenAction(reminders) : CTA[state]

  const todayPlan = (
    <TodayPlan
      day={day}
      plan={plan}
      reminders={reminders}
      painLog={painLog}
      chosen={boostToday.chosen}
      onToggle={toggleCard}
      onPainAgain={openPain}
    />
  )

  // What she logged where, in words (the heat map is not only color).
  const ago = (d: number) => (day - d === 0 ? t('heat.today') : day - d === 1 ? t('heat.agoOne') : t('heat.ago', { n: day - d }))
  const heatRows = heatByDay(heat.zones).map(({ day: d, zones }) =>
    t('home.heatRow', { zones: zoneList(zones, (z) => t(partKey(z.zone))), day: d, ago: ago(d) }),
  )
  // Eyes, skin and symptoms with no zone: they have no place on the figure, so they are listed under it
  // (the most recent day of each).
  const offFigure = [...new Map([...heat.noPlace].sort((a, b) => a.day - b.day).map((n) => [n.symptom, n])).values()].sort((a, b) => b.day - a.day)
  const offText = offFigure.map((n) => `${cap(n.symptom)} (${ago(n.day)})`)
  const summary = [...heatRows, ...(offText.length ? [`${t('heat.noPlace')} ${offText.join(', ')}`] : [])].join('; ') || t('home.heatNone')

  return (
    <div className={`home state-${state}`}>
      <div className="home-main">
        <section className="hero" aria-labelledby="home-state">
          <h1 id="home-state" className="hero-state">
            <span className="shape" aria-hidden="true">{COLOR_SYMBOL[overall]}</span>
            {t(`home.state.${state}`)}
          </h1>
          <p className="hero-sub" role="status" aria-live="polite">{subLine(result, t)}</p>
          {state !== 'GREEN' && (
            <p className="hero-who">
              <strong>{t('state.to')}</strong> {t(`who.${esc.to}` as StringKey)}
              {esc.offer_share_with && (
                <>
                  {' · '}
                  <a href="#/transmit">{t('home.share')}</a>
                </>
              )}
            </p>
          )}
        </section>

        {state === 'RED_PHYSICAL' && (
          <section className="cmo-card" role="alert" aria-labelledby="cmo-title">
            <h2 id="cmo-title" lang="en">{CARDS.cmo_now?.title_en}</h2>
            <p lang="en">{CARDS.cmo_now?.what_en}</p>
          </section>
        )}

        <section className="figure-stage" aria-labelledby="figure-title">
          <h2 id="figure-title" className="sr-only">{t('home.figureTitle')}</h2>
          {/* Drawing is one way; the list is the other, for anyone who cannot or would rather not draw. */}
          <p className="paint-hint">
            {t('home.paintHint')} {t('home.or')}{' '}
            <button type="button" className="link-btn" onClick={openPain}>
              {t('home.pickList')}
            </button>{' '}
            <InfoTip label={t('home.heatHelp')}>{t('home.heatNote', { n: HEAT.halfLifeDays })}</InfoTip>
          </p>
          <div className="today-strip">
            <button type="button" className="strip-btn" onClick={() => setPlanOpen(true)}>
              <strong>{t('plan.title')}</strong>
              <span className="muted long">{reminders.length ? t('home.planCount', { n: reminders.length }) : t('home.planNone')}</span>
              <span className="muted short" aria-hidden="true">{reminders.length}</span>
            </button>
            <button type="button" className="strip-btn tank-mini" onClick={() => setTankOpen(true)} aria-label={t('care.level', { n: care.level, size: TANK_SIZE })}>
              <svg viewBox="0 0 12 20" aria-hidden="true">
                <rect x="1" y="1" width="10" height="18" rx="3" className="tank-shell" />
                <rect x="2.5" y={2.5 + 15 * (1 - care.level / TANK_SIZE)} width="7" height={15 * (care.level / TANK_SIZE)} rx="2" className="tank-fill" />
              </svg>
              <span className="long">{t('home.tank', { n: care.level, size: TANK_SIZE })}</span>
              <span className="short" aria-hidden="true">
                <strong>{t('home.tankShort')}</strong>
                <br />
                {care.level}/{TANK_SIZE}
              </span>
            </button>
          </div>
          <div className="segmented" role="group" aria-label={t('home.view')}>
            {(['front', 'back'] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                {sideName(v)}
                {v !== view && otherWarm > 0 && <span className="warm-dot" aria-label={t('home.warmThere', { n: otherWarm })} />}
              </button>
            ))}
          </div>

          <PaintSurface
            key={`${view}-${theme}-${figure}`}
            className="figure"
            view={view}
            size="m"
            scale={1.6}
            strokes={strokes}
            onChange={setStrokes}
            label={t('home.paintFigure', { view: sideName(view), summary })}
            base={heat.zones.map((z) => ({ slug: z.zone, color: heatColor(z.warmth), ...(z.side ? { side: toViewerSide(z.side, view) } : {}) }))}
            baseDots={heat.dots.map((d) => ({ ...d, color: heatColor(d.warmth) }))}
            fill={fig.fill}
            border={fig.border}
          />
          {offText.length > 0 && (
            <p className="also-logged" aria-hidden="true">
              <span className="muted">{t('heat.noPlace')}</span> <span lang="en">{offText.slice(0, 3).join(' · ')}</span>
              {offText.length > 3 && <span className="muted"> {t('home.more', { n: offText.length - 3 })}</span>}
            </p>
          )}

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
              {'pain' in cta && cta.pain ? (
                <button type="button" className="button primary big" onClick={openPain}>
                  {t(cta.text)}
                </button>
              ) : cta.href ? (
                <a className="button primary big" href={cta.href}>
                  {t(cta.text)}
                </a>
              ) : (
                <span className="button primary big done" aria-disabled="true">
                  {t(cta.text)}
                </span>
              )}
            </>
          )}
        </div>
        <p className="fineprint">{t('home.notDiag')}</p>
      </div>

      {planOpen && (
        <Sheet onClose={closePlan} title={t('plan.title')}>
          {todayPlan}
        </Sheet>
      )}

      {tankOpen && (
        <Sheet onClose={closeTank} title={t('home.tankTitle')}>
          <CareTank care={care} />
          <a className="button ghost wide" href="#/boost">
            {t('nav.care')}
          </a>
        </Sheet>
      )}

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
            onDone={closePain}
            figureColors={fig}
          />
        </Sheet>
      )}
    </div>
  )
}

/** Indicators named in the state line of Today; the rest show as "+N more". */
const SUB_NAMES = 2

/** The state line with real data: which indicators moved, which domains changed. */
function subLine(result: DayResult, t: ReturnType<typeof useI18n>['t']): string {
  const and = t('home.and')
  if (result.state === 'YELLOW' && result.flagged.length) {
    // At most two names, so the line stays short and the body keeps its size; Metrics lists them all.
    const names = result.flagged.map((id) => t(`ind.${id}` as StringKey))
    const shown = names.slice(0, SUB_NAMES).join(' · ')
    const what = names.length > SUB_NAMES ? `${shown} · ${t('home.more', { n: names.length - SUB_NAMES })}` : shown
    return t('home.sub.YELLOW2', { what })
  }
  if (result.state === 'EARLY_SIGNAL' && result.flaggedDomains.length) {
    const domains = listText(result.flaggedDomains.map((d: DomainId) => t(`domain.${d}`)), and)
    return t('home.sub.EARLY2', { domains })
  }
  return t(`home.sub.${result.state}`)
}

/** Warm zones grouped by the day they were logged, newest first. */
function heatByDay(zones: ZoneHeat[]): { day: number; zones: ZoneHeat[] }[] {
  const byDay = new Map<number, ZoneHeat[]>()
  for (const z of zones) byDay.set(z.day, [...(byDay.get(z.day) ?? []), z])
  return [...byDay.entries()].sort((a, b) => b[0] - a[0]).map(([day, zs]) => ({ day, zones: zs }))
}

/** "Chest, abdomen": the first name as written, the rest in lower case. */
function zoneList(zones: ZoneHeat[], name: (z: ZoneHeat) => string): string {
  const names = [...new Set(zones.map(name))]
  return names.map((n, i) => (i === 0 ? n : n.toLowerCase())).join(', ')
}
