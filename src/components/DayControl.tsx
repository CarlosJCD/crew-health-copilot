import { dayRange, STORY_DAYS, type LoadedDemo } from '../orbit/demoData'
import { useI18n } from '../i18n/context'
import { L } from '../i18n/content'

interface Props {
  demo: LoadedDemo
  day: number
  onDayChange: (d: number) => void
}

/** Persona line, the day control (every day of the file; the demo story is 23 to 30) with the mission log, and dataset problems. */
export function DayControl({ demo, day, onDayChange }: Props) {
  const { t, lang } = useI18n()
  const { data } = demo
  const record = data.days.find((d) => d.day === day)
  const { first, last } = dayRange(data)
  const inStory = day >= STORY_DAYS.first && day <= STORY_DAYS.last

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
        <span className="hint">
          {demo.origin === 'file' ? t('day.hintFile') : t('day.hint')} ·{' '}
          {inStory ? t('day.story', STORY_DAYS) : t('day.history', STORY_DAYS)}
        </span>
        {record && record.events.length > 0 && (
          <p className="log">
            <strong>{t('day.log')}</strong> {record.events.map((e) => L(e, lang)).join(' · ')}
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
