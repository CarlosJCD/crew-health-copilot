import type { Scenario } from '../data/types'

interface Props {
  scenarios: Scenario[]
  value: string
  onChange: (id: string) => void
}

export function ScenarioSelector({ scenarios, value, onChange }: Props) {
  const current = scenarios.find((s) => s.id === value)
  return (
    <div className="scenario">
      <label htmlFor="scenario">Mission</label>
      <select id="scenario" value={value} onChange={(e) => onChange(e.target.value)}>
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {current && (
        <span className="delay" title={current.delaySource.label}>
          Signal delay to Earth: {current.oneWayDelay}
          {!current.delaySource.verified && ' *'}
        </span>
      )}
    </div>
  )
}
