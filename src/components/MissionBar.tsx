import type { Scenario } from '../data/types'
import { useI18n } from '../i18n/context'
import { missionDayCode } from '../lib/missionDay'

interface Props {
  scenarios: Scenario[]
  value: string
  onChange: (id: string) => void
  day: number
}

/** Mission, mission day and signal delay to Earth, always visible in the header. */
export function MissionBar({ scenarios, value, onChange, day }: Props) {
  const { t, tr } = useI18n()
  const current = scenarios.find((s) => s.id === value)
  return (
    <div className="mission">
      <div className="mission-field">
        <label className="overline" htmlFor="scenario">
          {t('scenario.label')}
        </label>
        <select id="scenario" value={value} onChange={(e) => onChange(e.target.value)}>
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {tr(s.name)}
            </option>
          ))}
        </select>
      </div>
      <div className="mission-field">
        <span className="overline">{t('mission.day')}</span>
        <span className="value mono" title={day < 0 ? t('day.pre', { n: day }) : t('day.mission', { n: day })}>
          {missionDayCode(day, true)}
        </span>
      </div>
      {current && (
        <div className="mission-field">
          <span className="overline">{t('mission.signal')}</span>
          <span className="value mono" title={current.delaySource.verified ? tr(current.delaySource.label) : t('mission.unverified')}>
            {tr(current.oneWayDelay)}
            {!current.delaySource.verified && ' *'}
          </span>
        </div>
      )}
    </div>
  )
}
