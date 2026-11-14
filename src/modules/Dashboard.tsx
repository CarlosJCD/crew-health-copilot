import { useMemo } from 'react'
import type { Domain, Measurement, Scenario, Status } from '../data/types'
import { INDICATORS } from '../data/indicators'
import { useI18n } from '../i18n/context'
import { MISSION_DAYS } from '../data/sample'
import { computeBaseline, evaluate } from '../lib/status'
import { IndicatorCard } from '../components/IndicatorCard'
import { EscalationPanel } from '../components/EscalationPanel'

interface Props {
  measurements: Measurement[]
  day: number
  onDayChange: (d: number) => void
  scenario: Scenario
}

const DOMAINS: Domain[] = ['biological', 'cognitive-emotional', 'social', 'protective']

export function Dashboard({ measurements, day, onDayChange, scenario }: Props) {
  const { t, tr } = useI18n()
  const byIndicator = useMemo(() => {
    const map = new Map<string, Measurement[]>()
    for (const m of measurements) {
      const list = map.get(m.indicatorId) ?? []
      list.push(m)
      map.set(m.indicatorId, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.day - b.day)
    return map
  }, [measurements])

  // Cross-domain early signal: how many domains have at least one indicator off-nominal today.
  const flagged = useMemo(() => {
    const domains = new Set<Domain>()
    const ids: string[] = []
    for (const def of INDICATORS) {
      const rows = byIndicator.get(def.id) ?? []
      const v = rows.find((r) => r.day === day)?.value
      const prev = rows.find((r) => r.day === day - 1)?.value
      const s: Status = evaluate(def, v, computeBaseline(rows), prev)
      if (s === 'watch' || s === 'act') {
        domains.add(def.domain)
        ids.push(def.id)
      }
    }
    return { domains, ids }
  }, [byIndicator, day])

  return (
    <div className="dashboard">
      <div className="day-control">
        <label htmlFor="day">
          {day < 0 ? t('day.pre', { n: day }) : t('day.mission', { n: day })}
        </label>
        <input
          id="day"
          type="range"
          min={MISSION_DAYS.first}
          max={MISSION_DAYS.last}
          value={day}
          onChange={(e) => onDayChange(Number(e.target.value))}
        />
        <span className="hint">{t('day.hint')}</span>
      </div>

      {flagged.domains.size >= 2 && (
        <section className="signal" role="status">
          <h2>{t('signal.title', { n: flagged.domains.size })}</h2>
          <p>
            {t('signal.body', {
              list: INDICATORS.filter((d) => flagged.ids.includes(d.id))
                .map((d) => tr(d.label).toLowerCase())
                .join(', '),
            })}
          </p>
        </section>
      )}

      {DOMAINS.map((domain) => {
        const defs = INDICATORS.filter((d) => d.domain === domain)
        if (!defs.length) return null
        return (
          <section key={domain} className="domain">
            <h2>{t(`domain.${domain}`)}</h2>
            <div className="grid">
              {defs.map((def) => (
                <IndicatorCard key={def.id} def={def} rows={byIndicator.get(def.id) ?? []} day={day} />
              ))}
            </div>
          </section>
        )
      })}

      <EscalationPanel scenario={scenario} />
    </div>
  )
}
