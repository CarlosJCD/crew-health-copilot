import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_SCENARIO_ID, SCENARIOS } from './orbit/config'
import { applyCheckins, type Checkins } from './orbit/checkin'
import { BUILT_IN_DEMO, loadDemoData, STORY_DAYS, type LoadedDemo } from './orbit/demoData'
import { DEFAULT_SHARE, type Packet, type ShareSettings } from './orbit/transmit'
import { LanguageToggle } from './components/LanguageToggle'
import { ScenarioSelector } from './components/ScenarioSelector'
import { useStoredJson } from './hooks/useStoredJson'
import { useI18n } from './i18n/context'
import { Mind } from './modules/Mind'
import { Placeholder } from './modules/Placeholder'
import { Today } from './modules/Today'
import { Transmit } from './modules/Transmit'
import { DEFAULT_MODULE, MODULES } from './modules/registry'

export const APP_NAME = 'ORBIT'

/** Route from the hash: `#/today?day=125&why=temp` (deep links for the deck and the demo). */
function readRoute(): { id: string; day?: number; why?: string } {
  const [path, query = ''] = window.location.hash.replace(/^#\/?/, '').split('?')
  const params = new URLSearchParams(query)
  const day = Number(params.get('day'))
  return {
    id: MODULES.some((m) => m.id === path) ? path : DEFAULT_MODULE,
    day: params.has('day') && Number.isInteger(day) ? day : undefined,
    why: params.get('why') ?? undefined,
  }
}

export default function App() {
  const { t, tr } = useI18n()
  const [route, setRoute] = useState(readRoute)
  const [scenarioId, setScenarioId] = useStoredJson('orbit.scenario', DEFAULT_SCENARIO_ID)
  const [loaded, setLoaded] = useState<LoadedDemo>({ data: BUILT_IN_DEMO, origin: 'built-in', errors: [] })
  const [day, setDay] = useState(route.day ?? STORY_DAYS.first)
  const [online, setOnline] = useState(navigator.onLine)
  const [checkins, setCheckins] = useStoredJson<Checkins>('orbit.checkins', {})
  const [share, setShare] = useStoredJson<ShareSettings>('orbit.share', DEFAULT_SHARE)
  const [outbox, setOutbox] = useStoredJson<Packet[]>('orbit.outbox', [])
  const [demoClock, setDemoClock] = useStoredJson('orbit.demoClock', true)

  useEffect(() => {
    const onHash = () => {
      const r = readRoute()
      setRoute(r)
      if (r.day !== undefined) setDay(r.day)
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

  // Her check-in answers replace that day's values, so every module sees the same data.
  const demo = useMemo(() => ({ ...loaded, data: applyCheckins(loaded.data, checkins) }), [loaded, checkins])
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS.find((s) => s.id === DEFAULT_SCENARIO_ID)!
  const active = MODULES.find((m) => m.id === route.id) ?? MODULES[0]

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">◎</span>
          <span>{APP_NAME}</span>
          <span className={`net ${online ? 'on' : 'off'}`}>{online ? t('net.online') : t('net.offline')}</span>
        </div>
        <div className="topbar-controls">
          <ScenarioSelector scenarios={SCENARIOS} value={scenario.id} onChange={setScenarioId} />
          <LanguageToggle />
        </div>
      </header>

      <nav className="tabs" aria-label={t('nav.label')}>
        {MODULES.map((m) => (
          <a key={m.id} href={`#/${m.id}`} aria-current={m.id === active.id ? 'page' : undefined}>
            {tr(m.label)}
          </a>
        ))}
      </nav>

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
          />
        ) : active.id === 'mind' ? (
          <Mind demo={demo} day={day} checkins={checkins} onCheckinsChange={setCheckins} />
        ) : (
          <Placeholder module={active} />
        )}
      </main>

      <footer className="footer">{t('footer')}</footer>
    </div>
  )
}
