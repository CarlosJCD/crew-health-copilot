import { useEffect, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/context'
import { missionDayCode } from '../lib/missionDay'

interface Props {
  day: number
  range: { first: number; last: number }
  onChange: (day: number) => void
  /** Where the demo data comes from. */
  hint: string
  /** Mission log of the day, under the timeline. */
  children?: ReactNode
}

const STEP_MS = 1200

/**
 * Demo-only control for judges: replays the story day by day. Framed and labelled as a demo so it is
 * not mistaken for something the crew would use.
 */
export function DemoReplay({ day, range, onChange, hint, children }: Props) {
  const { t } = useI18n()
  const [playing, setPlaying] = useState(false)
  // The replay stops by itself on the last day.
  const running = playing && day < range.last

  useEffect(() => {
    if (!running) return
    const id = setTimeout(() => onChange(day + 1), STEP_MS)
    return () => clearTimeout(id)
  }, [running, day, onChange])

  const toggle = () => {
    if (running) return setPlaying(false)
    if (day >= range.last) onChange(range.first)
    setPlaying(true)
  }

  return (
    <div className="demo-bar">
      <span className="demo-tag">{t('demo.tag')}</span>
      <button type="button" className="play" onClick={toggle} aria-label={running ? t('demo.pause') : t('demo.play')}>
        <span aria-hidden="true">{running ? '❚❚' : '▶'}</span>
      </button>
      <div className="timeline">
        <label htmlFor="day" className="sr-only">
          {t('day.label', { n: day })}
        </label>
        <input
          id="day"
          type="range"
          min={range.first}
          max={range.last}
          value={day}
          aria-valuetext={t('day.label', { n: day })}
          onChange={(e) => {
            setPlaying(false)
            onChange(Number(e.target.value))
          }}
        />
        <span className="tl-label" style={{ left: 0 }} aria-hidden="true">
          {missionDayCode(range.first)}
        </span>
        <span className="tl-label" style={{ right: 0 }} aria-hidden="true">
          {missionDayCode(range.last)}
        </span>
      </div>
      <span className="hint">{hint}</span>
      {children}
    </div>
  )
}
