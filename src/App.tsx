import { useEffect, useState } from 'react'
import { DEFAULT_SCENARIO_ID, SCENARIOS } from './data/scenarios'
import { loadMeasurements, MISSION_DAYS, type LoadedData } from './data/sample'
import { dayRange } from './data/validate'
import { LanguageToggle } from './components/LanguageToggle'
import { Logo } from './components/Logo'
import { MissionBar } from './components/MissionBar'
import { ThemeToggle } from './components/ThemeToggle'
import { useTheme } from './lib/theme'
import { useI18n } from './i18n/context'
import { Dashboard } from './modules/Dashboard'
import { Placeholder } from './modules/Placeholder'
import { DEFAULT_MODULE, MODULES } from './modules/registry'

// Product name: ORBIT = Observe, Read, Boost, Iterate, Transmit. Change it here only.
export const APP_NAME = 'ORBIT'
const APP_EXPANSION = 'Observe · Read · Boost · Iterate · Transmit'

function readHash(): string {
  const id = window.location.hash.replace(/^#\/?/, '')
  return MODULES.some((m) => m.id === id) ? id : DEFAULT_MODULE
}

function usePersistentState(key: string, initial: string) {
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? initial)
  useEffect(() => localStorage.setItem(key, value), [key, value])
  return [value, setValue] as const
}

export default function App() {
  const { t, tr } = useI18n()
  const [moduleId, setModuleId] = useState(readHash)
  const [scenarioId, setScenarioId] = usePersistentState('scenario', DEFAULT_SCENARIO_ID)
  const [data, setData] = useState<LoadedData>({ rows: [], origin: 'generated', errors: [] })
  const [day, setDay] = useState(MISSION_DAYS.last)
  const [online, setOnline] = useState(navigator.onLine)
  const [theme, setTheme] = useTheme()

  useEffect(() => {
    const onHash = () => setModuleId(readHash())
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('hashchange', onHash)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    loadMeasurements().then((loaded) => {
      setData(loaded)
      setDay(dayRange(loaded.rows)?.last ?? MISSION_DAYS.last)
      if (loaded.errors.length) console.warn('Dataset problems:', loaded.errors)
    })
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]
  const active = MODULES.find((m) => m.id === moduleId) ?? MODULES[0]

  return (
    <div className="app">
      <header className="topbar">
        {/* Wordmark V2: the logo ring is the O of ORBIT. */}
        <div className="wordmark" role="img" aria-label={APP_NAME} title={APP_EXPANSION}>
          <Logo />
          <span aria-hidden="true">{APP_NAME.slice(1)}</span>
        </div>
        <MissionBar scenarios={SCENARIOS} value={scenario.id} onChange={setScenarioId} day={day} />
        <div className="topbar-end">
          <span className={`net ${online ? 'on' : 'off'}`}>● {online ? t('net.online') : t('net.offline')}</span>
          <ThemeToggle theme={theme} onChange={setTheme} />
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
          <Dashboard appName={APP_NAME} data={data} day={day} onDayChange={setDay} scenario={scenario} />
        ) : (
          <Placeholder module={active} />
        )}
      </main>

      <footer className="footer">
        {t('footer')}
      </footer>
    </div>
  )
}
