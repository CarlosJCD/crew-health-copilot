import { useMemo } from 'react'
import { DOMAIN_IDS, RULES, type Scenario } from '../orbit/config'
import type { LoadedDemo } from '../orbit/demoData'
import { evaluateDay } from '../orbit/engine'
import { useI18n } from '../i18n/context'
import { DayControl } from '../components/DayControl'
import { DomainRing } from '../components/DomainRing'
import { OrbitCard } from '../components/OrbitCard'
import { StatePanel } from '../components/StatePanel'
import { SpaceWeatherPanel } from '../components/SpaceWeatherPanel'

interface Props {
  demo: LoadedDemo
  day: number
  onDayChange: (d: number) => void
  scenario: Scenario
  /** Indicator whose "Why?" opens on load (deep link `why=`). */
  openWhy?: string
}

/** Metrics (route `today`): three rings, the ORBIT state and one card per indicator, replaying the demo story. */
export function Today({ demo, day, onDayChange, scenario, openWhy }: Props) {
  const { t } = useI18n()
  const { data } = demo
  const result = useMemo(() => evaluateDay(data, day), [data, day])

  return (
    <div className="today">
      <DayControl demo={demo} day={day} onDayChange={onDayChange} />

      <div className="rings">
        {DOMAIN_IDS.map((d) => (
          <DomainRing
            key={d}
            domain={d}
            color={result.domains[d]}
            flagged={result.flagged.filter((id) => RULES.domains[d].includes(id))}
          />
        ))}
      </div>

      <StatePanel result={result} scenario={scenario} />

      {DOMAIN_IDS.map((d) => (
        <section key={d} className="domain" aria-labelledby={`domain-${d}`}>
          <h2 id={`domain-${d}`}>{t(`domain.${d}`)}</h2>
          <div className="grid">
            {RULES.domains[d]
              .filter((id) => result.indicators[id])
              .map((id) => (
                <OrbitCard key={id} id={id} result={result.indicators[id]} data={data} day={day} openWhy={openWhy === id} />
              ))}
          </div>
        </section>
      ))}

      <SpaceWeatherPanel doseMSvDay={scenario.dose_mSv_day} />
    </div>
  )
}
