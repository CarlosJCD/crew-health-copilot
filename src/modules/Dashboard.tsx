import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import type { Domain, Measurement, Scenario } from '../data/types'
import type { LoadedData } from '../data/sample'
import { dayRange } from '../data/validate'
import { INDICATORS } from '../data/indicators'
import { useI18n } from '../i18n/context'
import { MISSION_DAYS } from '../data/sample'
import { evaluateDay } from '../lib/status'
import { escalationPlan, overallStatus } from '../lib/escalation'
import { countStatuses, shareText, splitByAttention, summarizeDomains, type ShareLine } from '../lib/summary'
import { missionDayCode } from '../lib/missionDay'
import { IndicatorCard, IndicatorList, type IndicatorItem } from '../components/IndicatorCard'
import { DetailsPanel } from '../components/DetailsPanel'
import { DemoReplay } from '../components/DemoReplay'
import { EscalationPanel } from '../components/EscalationPanel'
import { SpaceWeatherPanel } from '../components/SpaceWeatherPanel'
import { StatusSummary } from '../components/StatusSummary'
import { describeChange } from '../components/describe'

interface Props {
  appName: string
  data: LoadedData
  day: number
  onDayChange: (d: number) => void
  scenario: Scenario
}

const DOMAINS: Domain[] = ['biological', 'cognitive-emotional', 'social', 'protective']

export function Dashboard({ appName, data, day, onDayChange, scenario }: Props) {
  const i18n = useI18n()
  const { t, tr, unit, num } = i18n
  const [detailsId, setDetailsId] = useState<string>()
  const measurements = data.rows
  const range = dayRange(measurements) ?? MISSION_DAYS

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

  const items: IndicatorItem[] = useMemo(
    () =>
      INDICATORS.map((def) => {
        const rows = byIndicator.get(def.id) ?? []
        const ev = evaluateDay(def, rows, day)
        return { def, rows, ev, status: ev.status }
      }),
    [byIndicator, day],
  )

  const statuses = items.map((i) => i.status)
  const counts = countStatuses(statuses)
  const overall = overallStatus(statuses)
  const domains = summarizeDomains(
    items.map((i) => ({ domain: i.def.domain, status: i.status })),
    DOMAINS,
  )
  // Cross-domain early signal: how many domains have at least one indicator off-nominal today.
  const flaggedDomains = domains.filter((d) => d.counts.act + d.counts.watch > 0).length
  const plan = escalationPlan(statuses, scenario)
  const dayLong = day < 0 ? t('day.pre', { n: day }) : t('day.mission', { n: day })

  const line = (i: IndicatorItem): ShareLine => {
    const current = i.rows.find((r) => r.day === day)
    return {
      label: tr(i.def.label),
      value: current ? `${num(current.value, i.def.decimals ?? 0)} ${unit(i.def.unit)}` : '–',
      detail: describeChange(i.def, i.ev, day, i18n)?.text ?? t(`status.${i.status}`),
    }
  }
  const share = shareText(
    [
      t('share.header', { app: appName, mission: tr(scenario.name), day: missionDayCode(day) }),
      t('share.overall', { status: t(`status.${overall}`) }),
    ],
    [
      { title: t('status.act'), lines: items.filter((i) => i.status === 'act').map(line) },
      { title: t('status.watch'), lines: items.filter((i) => i.status === 'watch').map(line) },
    ],
    t('share.none'),
    t('esc.disclaimer'),
  )

  const jump = useCallback((domain: Domain) => {
    document.getElementById(`domain-${domain}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="dashboard">
      <DemoReplay day={day} range={range} onChange={onDayChange} fromFile={data.origin === 'file'} />

      {data.errors.length > 0 && (
        <details className="data-issues">
          <summary>{t('data.issues', { n: data.errors.length })}</summary>
          <ul>
            {data.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="summary-row">
        <StatusSummary
          dayLabel={dayLong}
          overall={overall}
          counts={counts}
          domains={domains}
          flaggedDomains={flaggedDomains}
          onJump={jump}
        />
        <EscalationPanel plan={plan} shareText={share}>
          <SpaceWeatherPanel />
        </EscalationPanel>
      </div>

      <div className="domains">
        {DOMAINS.map((domain) => {
          const domainItems = items.filter((i) => i.def.domain === domain)
          if (!domainItems.length) return null
          const { attention, rest } = splitByAttention(domainItems)
          const tiles = attention.length + (rest.length ? 1 : 0)
          const summary = domains.find((d) => d.domain === domain)
          return (
            <section
              key={domain}
              id={`domain-${domain}`}
              className="domain"
              aria-labelledby={`domain-title-${domain}`}
              style={{ '--span': Math.min(4, tiles), '--span-md': Math.min(2, tiles) } as CSSProperties}
            >
              <div className="domain-head">
                <h2 id={`domain-title-${domain}`}>{t(`domain.${domain}`)}</h2>
                {summary && (
                  <span className="counts">
                    {summary.counts.act > 0 && <span>■ {summary.counts.act} {t('status.act').toLowerCase()}</span>}
                    {summary.counts.watch > 0 && <span>▲ {summary.counts.watch} {t('status.watch').toLowerCase()}</span>}
                    {summary.counts.nominal > 0 && <span>● {summary.counts.nominal} {t('status.nominal').toLowerCase()}</span>}
                    {summary.counts['no-data'] > 0 && <span>○ {summary.counts['no-data']} {t('status.no-data').toLowerCase()}</span>}
                  </span>
                )}
              </div>
              {attention.map((item) => (
                <IndicatorCard key={item.def.id} item={item} day={day} onDetails={setDetailsId} />
              ))}
              {rest.length > 0 && <IndicatorList items={rest} day={day} onDetails={setDetailsId} />}
            </section>
          )
        })}
      </div>

      <DetailsPanel item={items.find((i) => i.def.id === detailsId)} day={day} onClose={() => setDetailsId(undefined)} />
    </div>
  )
}
