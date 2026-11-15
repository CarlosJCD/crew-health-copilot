import { useEffect, useState, type CSSProperties } from 'react'
import { getIndicator, num } from '../orbit/config'
import { CHECKIN_ITEMS, TALK_OPTIONS, type Checkin, type CheckinItem, type Checkins, type TalkTo } from '../orbit/checkin'
import type { LoadedDemo } from '../orbit/demoData'
import { PULSE_SPEC, type PulseSession } from '../orbit/pulse'
import { Icon } from '../components/Icon'
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

/**
 * Mind: the daily check-in (4 sliders, 0 to 10, under a minute), "I want to talk to someone today" and pulse mode.
 * Built to be read at a glance by a tired astronaut: each slider says in words what 0 and 10 mean (higher is
 * better for mood but worse for stress), marks her usual, and the rule texts sit behind "How ORBIT reads this".
 */
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

  // Links that come for one thing ("Pulse mode", "Choose who") open Mind on that card, not on the check-in.
  useEffect(() => {
    const focus = /[?&]focus=(pulse|talk)\b/.exec(window.location.hash)?.[1]
    if (focus) document.getElementById(`${focus}-card`)?.scrollIntoView({ block: 'start' })
  }, [])

  const pulseRecord = record?.pulse_ms
  const pulseDone = pulseSessions.some((x) => x.day === day)
  const dirty = !saved || CHECKIN_ITEMS.some((i) => saved[i] !== draft[i])

  return (
    <div className="mind">
      <header className="mind-head">
        <h1>{t('mind.pageTitle')}</h1>
        <p className="muted">{t('mind.private')}</p>
      </header>

      {/* 1. The daily check-in: four questions, each with its own words at both ends and her usual marked. */}
      <section className="checkin" aria-labelledby="checkin-title">
        <div className="mind-card-head">
          <h2 id="checkin-title">{t('mind.checkinTitle')}</h2>
          <span className={`mind-badge${saved ? ' done' : ''}`}>
            {saved && <Icon name="check" size={14} />}
            {saved ? t('mind.savedBadge') : t('mind.oneMin')}
          </span>
        </div>
        <p className="mind-prompt">{t('mind.prompt')}</p>
        {CHECKIN_ITEMS.map((item: CheckinItem) => {
          const usual = base[item][0]
          return (
            <div key={item} className="ci-row">
              <div className="ci-head">
                <label htmlFor={`ci-${item}`}>{t(`mind.${item}`)}</label>
                <InfoTip label={t('mind.tip.label', { item: t(`mind.${item}`) })}>
                  {t(`mind.tip.${item}`)} {t(`mind.tip.${worseRule(item).dir}`, { usual, n: worseRule(item).n })}
                </InfoTip>
                <output htmlFor={`ci-${item}`} className="ci-value" aria-hidden="true">
                  {draft[item]}
                </output>
              </div>
              <div className="ci-track" style={{ '--u': usual / 10 } as CSSProperties}>
                <input
                  id={`ci-${item}`}
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  aria-describedby={`ci-${item}-ends`}
                  aria-valuetext={`${draft[item]} · ${t(`mind.lo.${item}`)} 0, ${t(`mind.hi.${item}`)} 10 · ${t('mind.usualOf', { n: usual })}`}
                  value={draft[item]}
                  onChange={(e) => {
                    setDraft({ ...draft, [item]: Number(e.target.value) })
                    setDone(false)
                  }}
                />
                <span className="ci-usual" aria-hidden="true" title={t('mind.usualOf', { n: usual })} />
              </div>
              <div id={`ci-${item}-ends`} className="ci-ends">
                <span>0 · {t(`mind.lo.${item}`)}</span>
                <span>{t(`mind.hi.${item}`)} · 10</span>
              </div>
            </div>
          )
        })}
        <p className="ci-legend muted">
          <span className="ci-usual-key" aria-hidden="true" /> {t('mind.usual')}
        </p>
        <button type="button" className={`button wide${dirty ? '' : ' secondary'}`} onClick={() => save(draft)}>
          {dirty ? t('mind.save', { day }) : t('mind.savedBadge')}
        </button>
        {done && (
          <p role="status" className="mind-status">
            <Icon name="check" size={16} /> <span>{t('mind.saved')} <a href="#/body">{t('mind.seeToday')}</a></span>
          </p>
        )}
        <details className="mind-more">
          <summary>{t('mind.howRead')}</summary>
          <p lang="en">{getIndicator('checkin').why_en}</p>
          {saved && (
            <button type="button" className="link" onClick={reset}>
              {t('mind.reset')}
            </button>
          )}
        </details>
      </section>

      {/* 2. Asking to talk: one tap, with the undo right there. */}
      <section id="talk-card" className="talk" aria-labelledby="talk-title">
        <div className="mind-card-head">
          <h2 id="talk-title">{t('mind.talkTitle')}</h2>
        </div>
        <p className="muted">{t('mind.talkIntro')}</p>
        {saved?.talk_to ? (
          <div className="talk-chosen" role="status">
            <p>
              <span className="talk-red" aria-hidden="true">■ </span>
              {t('mind.talkChosen')} <strong>{t(`mind.talk.${saved.talk_to}`)}</strong>
            </p>
            <div className="talk-actions">
              {(saved.talk_to === 'crew_medical_officer' || saved.talk_to === 'psych_conference') && (
                <a className="button" href="#/transmit">
                  {t('boost.openTransmit')}
                </a>
              )}
              <button type="button" className="link" onClick={() => talk(undefined)}>
                {t('mind.talkCancel')}
              </button>
            </div>
          </div>
        ) : (
          <ul className="talk-list">
            {TALK_OPTIONS.map((o) => (
              <li key={o}>
                <button type="button" className="talk-option" onClick={() => talk(o)}>
                  <span>{t(`mind.talk.${o}`)}</span>
                  <Icon name="next" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. Pulse mode: one sentence, one button; the details are one tap away. */}
      <section id="pulse-card" className="pulse-note" aria-labelledby="pulse-title">
        <div className="mind-card-head">
          <h2 id="pulse-title">{t('mind.pulseTitle')}</h2>
          <span className={`mind-badge${pulseDone ? ' done' : ''}`}>
            {pulseDone && <Icon name="check" size={14} />}
            {pulseDone ? t('mind.doneBadge') : t('mind.threeMin')}
          </span>
        </div>
        <PulseTask
          day={day}
          baselineMs={base.pulse_ms[0]}
          sessions={pulseSessions}
          onSessionsChange={onPulseSessionsChange}
        />
        <details className="mind-more">
          <summary>{t('mind.pulseAbout')}</summary>
          <p lang="en">{getIndicator('pulse').why_en}</p>
          <p className="muted" lang="en">
            {PULSE_SPEC.same_time_of_day_en} {PULSE_SPEC.note_en}
          </p>
          {pulseRecord && <p className="muted">{t('mind.pulseToday', { ms: pulseRecord })}</p>}
        </details>
      </section>
    </div>
  )
}
