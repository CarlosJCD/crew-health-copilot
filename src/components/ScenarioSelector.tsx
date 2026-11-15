import { delayText, type Scenario } from '../orbit/config'
import { scenarioName } from '../orbit/display'
import { useI18n } from '../i18n/context'

interface Props {
  scenarios: Scenario[]
  value: string
  onChange: (id: string) => void
}

export function ScenarioSelector({ scenarios, value, onChange }: Props) {
  const { t, tr, lang } = useI18n()
  const current = scenarios.find((s) => s.id === value)
  return (
    <div className="scenario">
      <label htmlFor="scenario">{t('scenario.label')}</label>
      <select id="scenario" value={value} onChange={(e) => onChange(e.target.value)}>
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {tr(scenarioName(s))}
          </option>
        ))}
      </select>
      {current && (
        <span className="delay" title={current.ground_contact}>
          {t('scenario.delay', { delay: delayText(current.one_way_delay_s)[lang] })}
        </span>
      )}
    </div>
  )
}
