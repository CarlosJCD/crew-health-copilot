import { useState } from 'react'
import { getIndicator, num } from '../orbit/config'
import { CHECKIN_ITEMS, TALK_OPTIONS, type Checkin, type CheckinItem, type Checkins, type TalkTo } from '../orbit/checkin'
import type { LoadedDemo } from '../orbit/demoData'
import type { PulseSession } from '../orbit/pulse'
import { InfoTip } from '../components/InfoTip'
import { PulseTask } from '../components/PulseTask'
import { useI18n } from '../i18n/context'

interface Props {
  demo: LoadedDemo
  day: number
  checkins: Checkins
  onCheckinsChange: (c: Checkins) => void
  pulseSessions: PulseSession[]
  onPulseSessionsChange: (s: PulseSession[]) => void
}

/**
 * Which way is worse for each check-in item, and how many points from her usual turn its card yellow
 * (read from orbit-indicators.json: checkin.worse_direction and yellow_worse_than_baseline_points).
 */
function worseRule(item: CheckinItem): { dir: 'lower' | 'higher'; n: number } {
  if (item === 'crew_climate') return { dir: 'lower', n: num('crew_climate', 'yellow_worse_than_baseline_points') }
  const dirs = (getIndicator('checkin').params.worse_direction ?? {}) as Record<string, string>
  return { dir: dirs[item] === 'down' ? 'lower' : 'higher', n: num('checkin', 'yellow_worse_than_baseline_points') }
}

/** Daily check-in: 4 sliders (0 to 10), under a minute, plus "I want to talk to someone today". Each item has a "?" that explains it. */
export function Mind({ demo, day, checkins, onCheckinsChange, pulseSessions, onPulseSessionsChange }: Props) {
  const { t } = useI18n()
  const record = demo.data.days.find((d) => d.day === day)
  const base = demo.data.persona.baseline
  const saved = checkins[day]
  const initial = (): Checkin => ({
    mood: record?.mood ?? base.mood[0],
    stress: record?.stress ?? base.stress[0],
    fatigue: record?.fatigue ?? base.fatigue[0],
    crew_climate: record?.crew_climate ?? base.crew_climate[0],
    talk_to: saved?.talk_to,
  })
  const [draft, setDraft] = useState<Checkin>(initial)
  const [draftDay, setDraftDay] = useState(day)
  const [done, setDone] = useState(false)
  if (draftDay !== day) {
    // The day control moved: start from that day's values.
    setDraftDay(day)
    setDraft(initial())
    setDone(false)
  }

  const save = (next: Checkin) => {
    onCheckinsChange({ ...checkins, [day]: next })
    setDraft(next)
    setDone(true)
  }
  const reset = () => {
    const rest = { ...checkins }
    delete rest[day]
    onCheckinsChange(rest)
    setDone(false)
    setDraftDay(Number.NaN) // reload the demo values on the next render
  }
  const talk = (to: TalkTo | undefined) => save({ ...draft, talk_to: to })

  return (
    <div className="mind">
      <section className="checkin" aria-labelledby="checkin-title">
        <h2 id="checkin-title">{t('mind.title', { day })}</h2>
        <p className="muted">{t('mind.intro')}</p>
        <p className="why" lang="en">{getIndicator('checkin').why_en}</p>
        {/* One scale line for the four sliders; her usual for each one is in its "?". */}
        <p id="ci-scale" className="muted scale-all">{t('mind.scaleAll')}</p>
        {CHECKIN_ITEMS.map((item: CheckinItem) => (
          <div key={item} className="slider-row">
            <div className="slider-head">
              <label htmlFor={`ci-${item}`}>
                <strong>{t(`mind.${item}`)}</strong> <span className="value-pill">{draft[item]}</span>
              </label>
              <InfoTip label={t('mind.tip.label', { item: t(`mind.${item}`) })}>
                {t(`mind.tip.${item}`)} {t(`mind.tip.${worseRule(item).dir}`, { usual: base[item][0], n: worseRule(item).n })}
              </InfoTip>
            </div>
            <input
              id={`ci-${item}`}
              type="range"
              min={0}
              max={10}
              step={1}
              aria-describedby="ci-scale"
              value={draft[item]}
              onChange={(e) => {
                setDraft({ ...draft, [item]: Number(e.target.value) })
                setDone(false)
              }}
            />
          </div>
        ))}
        <div className="actions">
          <button type="button" className="button" onClick={() => save(draft)}>
            {t('mind.save', { day })}
          </button>
          {saved && (
            <button type="button" className="link" onClick={reset}>
              {t('mind.reset')}
            </button>
          )}
        </div>
        {done && (
          <p role="status">
            {t('mind.saved')} <a href="#/body">{t('mind.seeToday')}</a>
          </p>
        )}
      </section>

      <section className="talk" aria-labelledby="talk-title">
        <h2 id="talk-title">{t('mind.talkTitle')}</h2>
        <p className="muted">{t('mind.talkIntro')}</p>
        {saved?.talk_to ? (
          <>
            <p role="status">
              <strong>{t('mind.talkChosen')}</strong> {t(`mind.talk.${saved.talk_to}`)}
            </p>
            <button type="button" className="link" onClick={() => talk(undefined)}>
              {t('mind.talkCancel')}
            </button>
          </>
        ) : (
          <div className="actions">
            {TALK_OPTIONS.map((o) => (
              <button key={o} type="button" className="button secondary" onClick={() => talk(o)}>
                {t(`mind.talk.${o}`)}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="pulse-note">
        <h2>{getIndicator('pulse').label_en}</h2>
        <p className="why" lang="en">{getIndicator('pulse').why_en}</p>
        {record?.pulse_ms && <p className="muted">{t('mind.pulseToday', { ms: record.pulse_ms })}</p>}
        <PulseTask
          day={day}
          baselineMs={base.pulse_ms[0]}
          sessions={pulseSessions}
          onSessionsChange={onPulseSessionsChange}
        />
      </section>
    </div>
  )
}
