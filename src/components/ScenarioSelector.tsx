import { delayText, type Scenario } from '../orbit/config'
import { scenarioName } from '../orbit/display'
import { missionDayCode } from '../lib/missionDay'
import { useI18n } from '../i18n/context'

interface Props {
  scenarios: Scenario[]
  value: string
  onChange: (id: string) => void
  /** Mission day shown in the demo. */
  day: number
}

/** Mission bar in the header: mission, mission day and one-way signal delay to Earth, always visible. */
export function ScenarioSelector({ scenarios, value, onChange, day }: Props) {
  const { t, tr, lang } = useI18n()
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
              {tr(scenarioName(s))}
            </option>
          ))}
        </select>
      </div>
      <div className="mission-field">
        <span className="overline">{t('mission.day')}</span>
        <span className="value mono" title={t('day.label', { n: day })}>
          {missionDayCode(day, true)}
        </span>
      </div>
      {current && (
        <div className="mission-field">
          <span className="overline">{t('mission.signal')}</span>
          <span className="value mono" title={current.ground_contact}>
            {delayText(current.one_way_delay_s)[lang]}
          </span>
        </div>
      )}
    </div>
  )
}
