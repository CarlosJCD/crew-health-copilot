import { useState } from 'react'
import { getIndicator } from '../orbit/config'
import { CHECKIN_ITEMS, type Checkin, type CheckinItem, type Checkins, type TalkTo } from '../orbit/checkin'
import type { LoadedDemo } from '../orbit/demoData'
import { useI18n } from '../i18n/context'

interface Props {
  demo: LoadedDemo
  day: number
  checkins: Checkins
  onCheckinsChange: (c: Checkins) => void
}

/** Daily check-in: 4 sliders (0 to 10), under a minute, plus "I want to talk to someone today". */
export function Mind({ demo, day, checkins, onCheckinsChange }: Props) {
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
        {CHECKIN_ITEMS.map((item: CheckinItem) => (
          <div key={item} className="slider-row">
            <label htmlFor={`ci-${item}`}>
              <strong>{t(`mind.${item}`)}</strong> <span className="value-pill">{draft[item]}</span>
            </label>
            <input
              id={`ci-${item}`}
              type="range"
              min={0}
              max={10}
              step={1}
              value={draft[item]}
              onChange={(e) => {
                setDraft({ ...draft, [item]: Number(e.target.value) })
                setDone(false)
              }}
            />
            <span className="muted">{t('mind.scale', { usual: base[item][0] })}</span>
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
            {t('mind.saved')} <a href="#/today">{t('mind.seeToday')}</a>
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
            <button type="button" className="button secondary" onClick={() => talk('crew_medical_officer')}>
              {t('mind.talk.crew_medical_officer')}
            </button>
            <button type="button" className="button secondary" onClick={() => talk('psych_conference')}>
              {t('mind.talk.psych_conference')}
            </button>
          </div>
        )}
      </section>

      <section className="pulse-note">
        <h2>{getIndicator('pulse').label_en}</h2>
        <p className="why" lang="en">{getIndicator('pulse').why_en}</p>
        <p className="muted">
          {record?.pulse_ms ? t('mind.pulseToday', { ms: record.pulse_ms }) : ''} {t('mind.pulseNext')}
        </p>
      </section>
    </div>
  )
}
