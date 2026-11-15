import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_SCENARIO_ID, SCENARIOS } from './orbit/config'
import type { BoostLog } from './orbit/boost'
import { applyCheckins, type Checkins } from './orbit/checkin'
import { BUILT_IN_DEMO, dayRange, loadDemoData, resolveDay, STORY_DAYS, type LoadedDemo } from './orbit/demoData'
import { DEFAULT_SHARE, type Packet, type ShareSettings } from './orbit/transmit'
import { applyPulse, type PulseSession } from './orbit/pulse'
import { applySymptoms, type SymptomLog } from './orbit/body'
import { applyPain, type PainDay, type PainLog } from './orbit/pain'
import { careSummary } from './orbit/care'
import { LanguageToggle } from './components/LanguageToggle'
import { ScenarioSelector } from './components/ScenarioSelector'
import { Icon, type IconName } from './components/Icon'
import { Sheet } from './components/Sheet'
import { CareTank } from './components/CareTank'
import { Logo } from './components/Logo'
import { ThemeToggle } from './components/ThemeToggle'
import { useTheme } from './lib/theme'
import { useFigure } from './lib/figure'
import { useStoredJson } from './hooks/useStoredJson'
import { useI18n } from './i18n/context'
import { Boost } from './modules/Boost'
import { BodyMap } from './modules/BodyMap'
import { Mind } from './modules/Mind'
import { Placeholder } from './modules/Placeholder'
import { Play } from './modules/Play'
import { Today } from './modules/Today'
import { Transmit } from './modules/Transmit'
import { DEFAULT_MODULE, MODULES } from './modules/registry'

export const APP_NAME = 'ORBIT'
/** The name is the loop: Observe, Read, Boost, Iterate, Transmit. */
export const APP_EXPANSION = 'Observe · Read · Boost · Iterate · Transmit'

/** Bottom navigation: four places and "More" (metrics, Constellations, mission and language live there). */
const NAV: { id: string; icon: IconName; label: 'nav.home' | 'nav.care' | 'nav.mind' | 'nav.send' }[] = [
  { id: 'body', icon: 'body', label: 'nav.home' },
  { id: 'boost', icon: 'care', label: 'nav.care' },
  { id: 'mind', icon: 'mind', label: 'nav.mind' },
  { id: 'transmit', icon: 'send', label: 'nav.send' },
]

/** Route from the hash: `#/today?day=27&why=temp`, `#/play?board=2&solved=1` (deep links for the deck and the demo). */
function readRoute(): { id: string; day?: number; why?: string; board?: number; solved?: boolean } {
  const [path, query = ''] = window.location.hash.replace(/^#\/?/, '').split('?')
  const params = new URLSearchParams(query)
  const day = Number(params.get('day'))
  return {
    id: MODULES.some((m) => m.id === path) ? path : DEFAULT_MODULE,
    day: params.has('day') && Number.isInteger(day) ? day : undefined,
    why: params.get('why') ?? undefined,
    board: params.has('board') ? Number(params.get('board')) - 1 : undefined,
    solved: params.get('solved') === '1',
  }
}

/** Testers open `?test` (or `#/body?test=1`) to see the testing tools; the published demo hides them. */
const TESTING = new URLSearchParams(window.location.search).has('test') || /[?&]test=1\b/.test(window.location.hash)

/** A day the link asked for that is not the day shown (old numbering or outside the file). */
type DayNotice = { asked: number; day: number; moved: 'legacy' | 'clamped' }

export default function App() {
  const { t } = useI18n()
  const [route, setRoute] = useState(readRoute)
  const [scenarioId, setScenarioId] = useStoredJson('orbit.scenario', DEFAULT_SCENARIO_ID)
  const [loaded, setLoaded] = useState<LoadedDemo>({ data: BUILT_IN_DEMO, origin: 'built-in', errors: [] })
  // The mission starts on day 1 and the demo story is days 23 to 30: the app opens on the first story day,
  // and a link's day is read as a day of the file (old links with days 121 to 128 still land on the story).
  const [start] = useState(() => (route.day === undefined ? undefined : resolveDay(route.day, dayRange(BUILT_IN_DEMO))))
  const [day, setDay] = useState(start?.day ?? STORY_DAYS.first)
  const [dayNotice, setDayNotice] = useState<DayNotice | null>(start?.moved && route.day !== undefined ? { asked: route.day, day: start.day, moved: start.moved } : null)
  const [online, setOnline] = useState(navigator.onLine)
  const [checkins, setCheckins] = useStoredJson<Checkins>('orbit.checkins', {})
  const [share, setShare] = useStoredJson<ShareSettings>('orbit.share', DEFAULT_SHARE)
  const [outbox, setOutbox] = useStoredJson<Packet[]>('orbit.outbox', [])
  const [demoClock, setDemoClock] = useStoredJson('orbit.demoClock', true)
  const [boostLog, setBoostLog] = useStoredJson<BoostLog>('orbit.boost', {})
  const [pulseSessions, setPulseSessions] = useStoredJson<PulseSession[]>('orbit.pulse', [])
  const [symptomLog, setSymptomLog] = useStoredJson<SymptomLog>('orbit.symptoms', {})
  const [painLog, setPainLog] = useStoredJson<PainLog>('orbit.pain', {})
  const [boardsDone, setBoardsDone] = useStoredJson('orbit.play', 0)
  const [moreOpen, setMoreOpen] = useState(false)
  /** Testing: "Reset my symptoms" asks once more before clearing. */
  const [confirmReset, setConfirmReset] = useState(false)
  const [theme, setTheme] = useTheme()
  const [figure, setFigure] = useFigure()
  const [playing, setPlaying] = useState(false)


  // Her check-in answers, pulse sessions, logged symptoms and pain replace or add to that day's values,
  // so every module sees the same data.
  const demo = useMemo(
    () => ({
      ...loaded,
      data: applyPain(applySymptoms(applyPulse(applyCheckins(loaded.data, checkins), pulseSessions), symptomLog), painLog),
    }),
    [loaded, checkins, pulseSessions, symptomLog, painLog],
  )
  const care = useMemo(
    () => careSummary({ checkins, boostLog, pulseSessions, boardsDone }),
    [checkins, boostLog, pulseSessions, boardsDone],
  )
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS.find((s) => s.id === DEFAULT_SCENARIO_ID)!
  const active = MODULES.find((m) => m.id === route.id) ?? MODULES[0]
  // The arrows reach every day of the file (her history before the story too); play replays the story.
  const { first, last } = dayRange(demo.data)
  const rangeRef = useRef({ first, last })
  useEffect(() => {
    rangeRef.current = { first, last }
  }, [first, last])

  useEffect(() => {
    const onHash = () => {
      const r = readRoute()
      // A new screen opens at the top, not at the scroll position of the one before.
      setRoute((prev) => {
        if (prev.id !== r.id) window.scrollTo(0, 0)
        return r
      })
      if (r.day !== undefined) {
        const resolved = resolveDay(r.day, rangeRef.current)
        setDay(resolved.day)
        setDayNotice(resolved.moved ? { asked: r.day, day: resolved.day, moved: resolved.moved } : null)
      }
    }
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('hashchange', onHash)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    loadDemoData().then((result) => {
      setLoaded(result)
      if (result.errors.length) console.warn('demo-data.json problems:', result.errors)
    })
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const inStory = day >= STORY_DAYS.first && day <= STORY_DAYS.last
  const record = demo.data.days.find((d) => d.day === day)
  const closeMore = useCallback(() => {
    setMoreOpen(false)
    setConfirmReset(false)
  }, [])
  const symptomCount = Object.values(painLog).reduce((n, d) => n + (d?.events?.length ?? 0), 0) + Object.values(symptomLog).reduce((n, s) => n + (s?.length ?? 0), 0)

  // Demo replay: from where she is to the last day; quiet days before the story pass quickly (0.7 s),
  // story days take 2.5 s each.
  useEffect(() => {
    if (!playing) return
    const id = window.setTimeout(
      () => {
        if (day >= last) setPlaying(false)
        else setDay(day + 1)
      },
      day < STORY_DAYS.first - 1 ? 700 : 2500,
    )
    return () => window.clearTimeout(id)
  }, [playing, day, last])

  return (
    <div className={`app route-${active.id}`}>
      <header className="topbar">
        {/* The day of the demo, always in sight; it opens More, where the day control is. */}
        <button type="button" className="topbar-side day-chip" onClick={() => setMoreOpen(true)} aria-label={t('home.dayOpen', { n: day })}>
          {t('home.day', { n: day })}
        </button>
        {/* Wordmark in the center: the logo ring is the O of ORBIT (design proposal, variant V2). */}
        <a className="wordmark" href="#/body" aria-label={APP_NAME} title={APP_EXPANSION}>
          <Logo />
          <span aria-hidden="true">{APP_NAME.slice(1)}</span>
        </a>
        <span className={`topbar-side net ${online ? 'on' : 'off'}`} title={online ? t('net.online') : t('net.offlineLong')} role="status">
          <Icon name={online ? 'signal' : 'nosignal'} size={18} />
          <span className={online ? 'sr-only' : 'net-text'}>{online ? t('net.online') : t('net.offlineLong')}</span>
        </span>
      </header>
      {!online && <p className="offline-bar" role="status">{t('net.offlineLong')}</p>}
      {dayNotice && (
        <p className="day-notice" role="status">
          <span>{t(dayNotice.moved === 'legacy' ? 'day.movedLegacy' : 'day.movedClamped', { asked: dayNotice.asked, day: dayNotice.day })}</span>
          <button type="button" className="icon-btn" onClick={() => setDayNotice(null)} aria-label={t('home.close')}>
            ✕
          </button>
        </p>
      )}
      {playing && record && record.events.length > 0 && (
        <p className="story-log" aria-live="polite">
          <strong>{t('more.log', { n: day })}</strong> <span lang="en">{record.events.join(' · ')}</span>
        </p>
      )}

      <main>
        {active.id === 'today' ? (
          <Today demo={demo} day={day} onDayChange={setDay} scenario={scenario} openWhy={route.why} />
        ) : active.id === 'transmit' ? (
          <Transmit
            demo={demo}
            day={day}
            scenario={scenario}
            share={share}
            onShareChange={setShare}
            outbox={outbox}
            onOutboxChange={setOutbox}
            demoClock={demoClock}
            onDemoClockChange={setDemoClock}
            pain={painLog[day]}
          />
        ) : active.id === 'body' ? (
          <BodyMap
            demo={demo}
            day={day}
            onDayChange={setDay}
            scenario={scenario}
            log={symptomLog}
            care={care}
            painLog={painLog}
            onPainChange={(p: PainDay) => setPainLog((all) => ({ ...all, [day]: p }))}
            checkins={checkins}
            pulseSessions={pulseSessions}
            boostLog={boostLog}
            onBoostLogChange={setBoostLog}
            theme={theme}
          />
        ) : active.id === 'play' ? (
          <Play
            key={`${route.board ?? 0}-${route.solved}`}
            completed={boardsDone}
            onComplete={() => setBoardsDone((n) => n + 1)}
            initialBoard={route.board}
            initialSolved={route.solved}
          />
        ) : active.id === 'boost' ? (
          <>
            <CareTank care={care} />
            <Boost demo={demo} day={day} log={boostLog} onLogChange={setBoostLog} careActions={care.actions} />
          </>
        ) : active.id === 'mind' ? (
          <Mind
            demo={demo}
            day={day}
            checkins={checkins}
            onCheckinsChange={setCheckins}
            pulseSessions={pulseSessions}
            onPulseSessionsChange={setPulseSessions}
          />
        ) : (
          <Placeholder module={active} />
        )}
      </main>

      <nav className="bottom-nav" aria-label={t('nav.label')}>
        {NAV.map((n) => (
          <a key={n.id} href={`#/${n.id}`} aria-current={active.id === n.id ? 'page' : undefined}>
            <Icon name={n.icon} />
            <span>{t(n.label)}</span>
          </a>
        ))}
        <button type="button" onClick={() => setMoreOpen(true)} aria-current={['today', 'play'].includes(active.id) ? 'page' : undefined}>
          <Icon name="more" />
          <span>{t('nav.more')}</span>
        </button>
      </nav>

      {moreOpen && (
        <Sheet title={t('nav.more')} onClose={closeMore}>
          <div className="more-links">
            <a className="button ghost wide" href="#/today" onClick={closeMore}>
              {t('more.metrics')}
            </a>
            <a className="button ghost wide" href="#/play" onClick={closeMore}>
              {t('more.play')}
            </a>
          </div>
          <div className="more-row">
            <span className="muted">{t('more.day')}</span>
            <div className="day-stepper" role="group" aria-label={t('home.demo')}>
              <button type="button" className="icon-btn" onClick={() => setDay(Math.max(first, day - 1))} disabled={day <= first} aria-label={t('home.prev')}>
                <Icon name="prev" size={20} />
              </button>
              <span className="day-num" title={inStory ? t('day.story', STORY_DAYS) : t('day.history', STORY_DAYS)}>{t('home.day', { n: day })}</span>
              <button type="button" className="icon-btn" onClick={() => setDay(Math.min(last, day + 1))} disabled={day >= last} aria-label={t('home.next')}>
                <Icon name="next" size={20} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  if (!playing && day >= last) setDay(first)
                  setPlaying(!playing)
                }}
                aria-label={playing ? t('home.pause') : t('home.play')}
                aria-pressed={playing}
              >
                <Icon name={playing ? 'pause' : 'play'} size={18} />
              </button>
            </div>
          </div>
          <div className="more-row">
            <ScenarioSelector scenarios={SCENARIOS} value={scenario.id} onChange={setScenarioId} />
          </div>
          <div className="more-row">
            <span className="muted">{t('more.language')}</span> <LanguageToggle />
          </div>
          <div className="more-row">
            <span className="muted">{t('theme.label')}</span> <ThemeToggle theme={theme} onChange={setTheme} />
          </div>
          <div className="more-row">
            <span className="muted">{t('more.figure')}</span>
            <div className="segmented" role="group" aria-label={t('more.figure')}>
              {(['female', 'male'] as const).map((k) => (
                <button key={k} type="button" aria-pressed={figure === k} onClick={() => setFigure(k)}>
                  {t(k === 'female' ? 'more.female' : 'more.male')}
                </button>
              ))}
            </div>
          </div>
          <p className="muted small">{t('more.who', { name: demo.data.persona.name, role: demo.data.persona.role })}</p>
          {record && record.events.length > 0 && (
            <p className="small">
              <strong>{t('more.log', { n: day })}</strong> <span lang="en">{record.events.join(' · ')}</span>
            </p>
          )}
          {/* Testing (only with ?test): clears every symptom and pain she logged (all days), nothing else. */}
          {TESTING && (
            <div className="more-row reset-row">
              {!confirmReset ? (
                <button type="button" className="button ghost" disabled={symptomCount === 0} onClick={() => setConfirmReset(true)}>
                  {t('more.resetSymptoms')}
                </button>
              ) : (
                <>
                  <span className="small">{t('more.resetConfirm', { n: symptomCount })}</span>
                  <button
                    type="button"
                    className="button danger"
                    onClick={() => {
                      setPainLog({})
                      setSymptomLog({})
                      setConfirmReset(false)
                    }}
                  >
                    {t('more.resetYes')}
                  </button>
                  <button type="button" className="button ghost" onClick={() => setConfirmReset(false)}>
                    {t('more.resetNo')}
                  </button>
                </>
            )}
            {symptomCount === 0 && <span className="muted small">{t('more.resetNone')}</span>}
          </div>
          )}
          {demo.errors.length > 0 && <p className="small warn">{t('data.issues', { n: demo.errors.length })}</p>}
          <p className="muted small">{t('footer')}</p>
        </Sheet>
      )}
    </div>
  )
}
