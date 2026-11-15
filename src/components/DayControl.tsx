import { STORY_DAYS, type LoadedDemo } from '../orbit/demoData'
import { useI18n } from '../i18n/context'

interface Props {
  demo: LoadedDemo
  day: number
  onDayChange: (d: number) => void
}

/** Persona line, the demo day control (days 121 to 128) with the mission log, and dataset problems. */
export function DayControl({ demo, day, onDayChange }: Props) {
  const { t } = useI18n()
  const { data } = demo
  const record = data.days.find((d) => d.day === day)
  const days = data.days.map((d) => d.day)
  const first = Math.max(STORY_DAYS.first, Math.min(...days))
  const last = Math.min(STORY_DAYS.last, Math.max(...days))

  return (
    <>
      <p className="persona">
        {t('persona.line', {
          name: data.persona.name,
          role: data.persona.role,
          day,
          length: data.persona.mission_length_days,
        })}
      </p>

      <div className="day-control">
        <label htmlFor="day">{t('day.label', { n: day })}</label>
        <input id="day" type="range" min={first} max={last} value={day} onChange={(e) => onDayChange(Number(e.target.value))} />
        <span className="hint">{demo.origin === 'file' ? t('day.hintFile') : t('day.hint')}</span>
        {record && record.events.length > 0 && (
          <p className="log" lang="en">
            <strong>{t('day.log')}</strong> {record.events.join(' · ')}
          </p>
        )}
      </div>

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
    </>
  )
}
