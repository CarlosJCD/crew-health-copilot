import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/context'
import { missionDayCode } from '../lib/missionDay'

interface Props {
  day: number
  range: { first: number; last: number }
  onChange: (day: number) => void
  fromFile: boolean
}

const STEP_MS = 700

/**
 * Demo-only control for judges: replays the synthetic mission day by day. Framed and labelled as a
 * demo so it is not mistaken for something the crew would use.
 */
export function DemoReplay({ day, range, onChange, fromFile }: Props) {
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

  const span = range.last - range.first || 1
  const launchPct = ((0 - range.first) / span) * 100
  const showLaunch = range.first < 0 && range.last >= 0
  const long = day < 0 ? t('day.pre', { n: day }) : t('day.mission', { n: day })

  return (
    <div className="demo-bar">
      <span className="demo-tag">{t('demo.tag')}</span>
      <button type="button" className="play" onClick={toggle} aria-label={running ? t('demo.pause') : t('demo.play')}>
        <span aria-hidden="true">{running ? '❚❚' : '▶'}</span>
      </button>
      <div className="timeline">
        <label htmlFor="day" className="sr-only">
          {t('demo.slider')}
        </label>
        {showLaunch && <span className="launch-tick" style={{ left: `${launchPct}%` }} aria-hidden="true" />}
        <input
          id="day"
          type="range"
          min={range.first}
          max={range.last}
          value={day}
          aria-valuetext={long}
          onChange={(e) => {
            setPlaying(false)
            onChange(Number(e.target.value))
          }}
        />
        <span className="tl-label" style={{ left: 0 }} aria-hidden="true">
          {missionDayCode(range.first)} · {t('demo.baseline')}
        </span>
        {showLaunch && launchPct > 30 && launchPct < 75 && (
          <span className="tl-label launch-label" style={{ left: `${launchPct}%`, transform: 'translateX(-50%)' }} aria-hidden="true">
            L · {t('demo.launch')}
          </span>
        )}
        <span className="tl-label" style={{ right: 0 }} aria-hidden="true">
          {missionDayCode(range.last)}
        </span>
      </div>
      <span className="hint">{fromFile ? t('day.hintFile') : t('day.hint')}</span>
    </div>
  )
}
