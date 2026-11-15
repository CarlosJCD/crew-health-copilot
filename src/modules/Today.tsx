import { useMemo } from 'react'
import { DOMAIN_IDS, RULES, type Scenario } from '../orbit/config'
import { STORY_DAYS, type LoadedDemo } from '../orbit/demoData'
import { evaluateDay } from '../orbit/engine'
import { useI18n } from '../i18n/context'
import { DomainRing } from '../components/DomainRing'
import { OrbitCard } from '../components/OrbitCard'
import { StatePanel } from '../components/StatePanel'
import { SpaceWeatherPanel } from '../components/SpaceWeatherPanel'
import { DemoReplay } from '../components/DemoReplay'

interface Props {
  demo: LoadedDemo
  day: number
  onDayChange: (d: number) => void
  scenario: Scenario
  /** Indicator whose "Why?" opens on load (deep link `why=`). */
  openWhy?: string
}

/** Today: three rings, the ORBIT state and one card per indicator, replaying the demo story. */
export function Today({ demo, day, onDayChange, scenario, openWhy }: Props) {
  const { t } = useI18n()
  const { data } = demo
  const result = useMemo(() => evaluateDay(data, day), [data, day])
  const record = data.days.find((d) => d.day === day)
  const days = data.days.map((d) => d.day)
  const first = Math.max(STORY_DAYS.first, Math.min(...days))
  const last = Math.min(STORY_DAYS.last, Math.max(...days))

  return (
    <div className="today">
      <p className="persona">
        {t('persona.line', {
          name: data.persona.name,
          role: data.persona.role,
          day,
          length: data.persona.mission_length_days,
        })}
      </p>

      <DemoReplay day={day} range={{ first, last }} onChange={onDayChange} hint={demo.origin === 'file' ? t('day.hintFile') : t('day.hint')}>
        {record && record.events.length > 0 && (
          <p className="log" lang="en">
            <strong>{t('day.log')}</strong> {record.events.join(' · ')}
          </p>
        )}
      </DemoReplay>

      {demo.errors.length > 0 && (
        <details className="data-issues">
          <summary>{t('data.issues', { n: demo.errors.length })}</summary>
          <ul>
            {demo.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="summary-row">
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
      </div>

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
