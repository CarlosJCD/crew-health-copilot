import type { Scenario } from '../data/types'
import { useI18n } from '../i18n/context'

interface Props {
  scenarios: Scenario[]
  value: string
  onChange: (id: string) => void
}

export function ScenarioSelector({ scenarios, value, onChange }: Props) {
  const { t, tr } = useI18n()
  const current = scenarios.find((s) => s.id === value)
  return (
    <div className="scenario">
      <label htmlFor="scenario">{t('scenario.label')}</label>
      <select id="scenario" value={value} onChange={(e) => onChange(e.target.value)}>
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {tr(s.name)}
          </option>
        ))}
      </select>
      {current && (
        <span className="delay" title={tr(current.delaySource.label)}>
          {t('scenario.delay', { delay: tr(current.oneWayDelay) })}
          {!current.delaySource.verified && ' *'}
        </span>
      )}
    </div>
  )
}
