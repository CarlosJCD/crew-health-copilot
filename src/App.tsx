import { useEffect, useState } from 'react'
import type { Measurement } from './data/types'
import { DEFAULT_SCENARIO_ID, SCENARIOS } from './data/scenarios'
import { loadMeasurements, MISSION_DAYS } from './data/sample'
import { LanguageToggle } from './components/LanguageToggle'
import { ScenarioSelector } from './components/ScenarioSelector'
import { useI18n } from './i18n/context'
import { Dashboard } from './modules/Dashboard'
import { Placeholder } from './modules/Placeholder'
import { DEFAULT_MODULE, MODULES } from './modules/registry'

// Working title. Final name is decided in Phase 4; change it here only.
export const APP_NAME = 'Crew Health Copilot'

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
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [day, setDay] = useState(MISSION_DAYS.last)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onHash = () => setModuleId(readHash())
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('hashchange', onHash)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    loadMeasurements().then(setMeasurements)
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
        <div className="brand">
          <span className="logo" aria-hidden="true">◐</span>
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
          <Dashboard measurements={measurements} day={day} onDayChange={setDay} scenario={scenario} />
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
