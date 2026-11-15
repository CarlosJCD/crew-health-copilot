import { useMemo, useState, type ReactNode } from 'react'
import {
  BOOST_DISCLAIMER,
  boostPlan,
  CARDS,
  DESIGN_BASIS,
  DISPLAY,
  downrankedCards,
  type BoostCard,
  type BoostDay,
  type BoostLog,
} from '../orbit/boost'
import { TANK_SIZE, type CareSummary } from '../orbit/care'
import { getIndicator } from '../orbit/config'
import type { LoadedDemo } from '../orbit/demoData'
import { evaluateDay } from '../orbit/engine'
import { useI18n } from '../i18n/context'
import { CardWhy } from '../components/BoostCardBody'
import { CareIcon } from '../components/CareIcon'
import { ViewEarth } from '../components/EarthView'
import { Icon } from '../components/Icon'
import { InfoTip } from '../components/InfoTip'
import { PrivateNoteSheet, type Notes } from '../components/PrivateNote'
import { Sheet } from '../components/Sheet'
import { Play } from './Play'
import { L } from '../i18n/content'

interface Props {
  demo: LoadedDemo
  day: number
  log: BoostLog
  onLogChange: (log: BoostLog) => void
  /** The protective-factors tank (all care actions so far). */
  care: CareSummary
  /** Her private notes by day (the "Private note" card opens them). */
  notes: Notes
  onNotesChange: (notes: Notes) => void
  /** Constellations boards finished on this device (the "Play Constellations together" card opens the game). */
  boardsDone: number
  onBoardDone: () => void
}

const EMPTY: BoostDay = { chosen: [], helped: {} }

/**
 * Care (Boost): protective actions for the day. She chooses up to 2; nothing is chosen for her.
 * Built to be read at a glance: every option is an icon, a title and its time; the whole tile chooses it,
 * and how to do it appears once chosen (or under ⓘ). A person comes first on a red day.
 */
export function Boost({ demo, day, log, onLogChange, care, notes, onNotesChange, boardsDone, onBoardDone }: Props) {
  const { t, lang } = useI18n()
  const { data } = demo
  const result = useMemo(() => evaluateDay(data, day), [data, day])
  const record = data.days.find((d) => d.day === day)
  const today = log[day] ?? EMPTY
  const plan = useMemo(
    () => boostPlan(result, record, data.persona, downrankedCards(log), data.days.filter((d) => d.day <= day)),
    [result, record, data, log, day],
  )
  const yesterday = log[day - 1]
  const max = DISPLAY.max_choices
  const save = (next: BoostDay) => onLogChange({ ...log, [day]: next })
  const toggle = (id: string) => {
    const chosen = today.chosen.includes(id)
      ? today.chosen.filter((c) => c !== id)
      : today.chosen.length < max
        ? [...today.chosen, id]
        : today.chosen
    save({ ...today, chosen })
  }
  const rate = (id: string, answer: string, which: BoostDay = today, target = day) =>
    onLogChange({ ...log, [target]: { ...which, helped: { ...which.helped, [id]: answer } } })
  const askedYes = today.safety === 'yes'
  const full = today.chosen.length >= max
  const [noteOpen, setNoteOpen] = useState(false)
  const [gameOpen, setGameOpen] = useState(false)
  /** Cards she can do right here once chosen: write the note, play the game. */
  const doIt = (c: BoostCard): ReactNode =>
    c.id === 'private_note' ? (
      <button type="button" className="button wide" onClick={() => setNoteOpen(true)}>
        <Icon name="note" size={18} /> {notes[day] ? t('note.edit') : t('note.open')}
      </button>
    ) : c.id === 'earth_window' ? (
      <ViewEarth title={L(c.title_en, lang)} />
    ) : c.id === 'crew_game' ? (
      <button type="button" className="button wide" onClick={() => setGameOpen(true)}>
        <Icon name="stars" size={18} /> {t('game.open')}
      </button>
    ) : undefined

  return (
    <div className="boost">
      <header className="care-head">
        <div className="care-head-row">
          <h1>{plan.red ? t('care.redTitle') : t('care.pick', { n: max })}</h1>
          {plan.offered.length > 0 && !askedYes && <ChosenSlots ids={today.chosen} max={max} />}
        </div>
        <p className="muted">{plan.red ? t('boost.red') : t('care.yours')}</p>
        {/* Why the limit: Psychology's design basis, and an honest note that the number itself is a design choice. */}
        {!plan.red && plan.offered.length > 0 && (
          <details className="care-why">
            <summary>{t('boost.whyTwoTitle', { n: max })}</summary>
            <p>{t('boost.whyTwo', { n: max })}</p>
            <p className="choose-basis">
              {t('boost.whyTwoBasis')}{' '}
              {DESIGN_BASIS.map((s, i) => (
                <span key={s.cite}>
                  {i > 0 && ' · '}
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.cite}
                  </a>
                </span>
              ))}
            </p>
          </details>
        )}
        <TankLine care={care} />
      </header>

      {plan.escalate.length > 0 && (
        <section className="care-section" aria-label={t('care.redTitle')}>
          {plan.escalate.map((c) => (
            <CareTile key={c.id} card={c} mode="escalate" action={<EscalateAction card={c} />} />
          ))}
        </section>
      )}

      {yesterday && yesterday.chosen.length > 0 && (
        <section className="care-section care-followup" aria-labelledby="followup">
          <h2 id="followup" className="care-section-title">
            {t('boost.followup')}
          </h2>
          {yesterday.chosen.map((id) =>
            CARDS[id] ? (
              <div key={id} className="care-followup-row">
                <span className="care-icon small">
                  <CareIcon card={CARDS[id]} size={18} />
                </span>
                <strong>{L(CARDS[id].title_en, lang)}</strong>
                <HelpChips value={yesterday.helped[id]} onRate={(o) => rate(id, o, yesterday, day - 1)} />
              </div>
            ) : null,
          )}
        </section>
      )}

      {plan.safetyQuestion && today.safety === 'no' && (
        <section className="care-section care-safety-done" aria-labelledby="safety">
          <Icon name="check" size={18} />
          <h2 id="safety">
            {t('boost.safety')}: <strong>{t('boost.no')}</strong>
          </h2>
          <button type="button" className="link" onClick={() => save({ ...today, safety: undefined })}>
            {t('care.change')}
          </button>
        </section>
      )}

      {plan.safetyQuestion && today.safety !== 'no' && (
        <section className="care-section care-safety" aria-labelledby="safety">
          <h2 id="safety" className="care-section-title">
            <span className="care-safety-mark" aria-hidden="true">
              ▲
            </span>{' '}
            {t('boost.safety')}
          </h2>
          <p className="care-safety-q">
            {L(plan.safetyQuestion.text_en, lang)}
          </p>
          <div className="care-yesno">
            <button type="button" className="button secondary" aria-pressed={askedYes} onClick={() => save({ ...today, safety: 'yes' })}>
              {t('boost.yes')}
            </button>
            <button type="button" className="button secondary" aria-pressed={false} onClick={() => save({ ...today, safety: 'no' })}>
              {t('boost.no')}
            </button>
          </div>
          {askedYes && CARDS[plan.safetyQuestion.if_yes] && (
            <CareTile card={CARDS[plan.safetyQuestion.if_yes]} mode="escalate" action={<EscalateAction card={CARDS[plan.safetyQuestion.if_yes]} />} />
          )}
        </section>
      )}

      {!askedYes && plan.checkFirst.length > 0 && (
        <section className="care-section" aria-labelledby="check-first">
          <h2 id="check-first" className="care-section-title">
            {t('boost.checkFirst')}
          </h2>
          <div className="care-grid">
            {plan.checkFirst.map((c) => (
              <CareTile key={c.id} card={c} mode="step" />
            ))}
          </div>
        </section>
      )}

      {!askedYes && plan.offered.length > 0 && (
        <section className="care-section" aria-label={t('care.pick', { n: max })}>
          {(plan.checkFirst.length > 0 || plan.escalate.length > 0) && <h2 className="care-section-title">{t('care.then')}</h2>}
          <div className="care-grid">
            {plan.offered.map((c) => {
              const chosen = today.chosen.includes(c.id)
              return (
                <CareTile
                  key={c.id}
                  card={c}
                  mode="pick"
                  chosen={chosen}
                  disabled={!chosen && full}
                  onToggle={() => toggle(c.id)}
                  helped={today.helped[c.id]}
                  onRate={(o) => rate(c.id, o)}
                  action={doIt(c)}
                  done={c.id === 'private_note' && !!notes[day]}
                />
              )
            })}
          </div>
          {full && <p className="care-full muted">{t('care.full', { n: max })}</p>}
        </section>
      )}

      <p className="fineprint care-disclaimer">
        {L(BOOST_DISCLAIMER, lang)}
      </p>

      {noteOpen && <PrivateNoteSheet day={day} notes={notes} onChange={onNotesChange} onClose={() => setNoteOpen(false)} />}
      {gameOpen && (
        <Sheet title={t('play.title')} onClose={() => setGameOpen(false)}>
          <Play completed={boardsDone} onComplete={onBoardDone} heading={false} />
        </Sheet>
      )}
    </div>
  )
}

/** Two slots next to the title that fill with the icons she chose. */
function ChosenSlots({ ids, max }: { ids: string[]; max: number }) {
  const { t } = useI18n()
  return (
    <div className="care-slots" role="img" aria-label={t('care.slots', { chosen: ids.length, n: max })}>
      {Array.from({ length: max }, (_, i) => {
        const card = CARDS[ids[i]]
        return (
          <span key={i} className={`care-slot${card ? ' filled' : ''}`}>
            {card && <CareIcon card={card} size={18} />}
          </span>
        )
      })}
    </div>
  )
}

/** The protective-factors tank in one line; the rest is under its "?". */
function TankLine({ care }: { care: CareSummary }) {
  const { t, lang } = useI18n()
  const fill = care.level / TANK_SIZE
  return (
    <div className="care-tank-line">
      <svg viewBox="0 0 12 20" className="care-tank-svg" aria-hidden="true">
        <rect x="1" y="1" width="10" height="18" rx="3" className="tank-shell" />
        <rect x="2.5" y={2.5 + 15 * (1 - fill)} width="7" height={15 * fill} rx="2" className="tank-fill" />
      </svg>
      <strong>{t('care.tankShort', { n: care.level, size: TANK_SIZE })}</strong>
      {care.helped.length > 0 && (
        <span className="care-helped">
          <span className="muted">{t('care.helpedShort')}</span>
          {care.helped.slice(0, 3).map((id) =>
            CARDS[id] ? (
              <span key={id} className="care-icon tiny" title={L(CARDS[id].title_en, lang)}>
                <CareIcon card={CARDS[id]} size={14} />
                <span className="sr-only">{L(CARDS[id].title_en, lang)}</span>
              </span>
            ) : null,
          )}
        </span>
      )}
      <InfoTip label={t('care.tankTip')}>
        {care.actions === 0 ? (
          t('care.empty')
        ) : (
          <>
            {care.actions === 1 ? t('care.actionOne') : t('care.actions', { n: care.actions })} ·{' '}
            {care.days === 1 ? t('care.dayOne') : t('care.days', { n: care.days })}.{' '}
          </>
        )}{' '}
        <span>{L(getIndicator('protective').why_en, lang)}</span>
      </InfoTip>
    </div>
  )
}

/** The one thing to do on a card that needs a person. */
function EscalateAction({ card }: { card: BoostCard }) {
  const { t } = useI18n()
  return (
    <a className="button wide" href={card.id === 'talk_now' ? '#/mind?focus=talk' : '#/transmit'}>
      {card.id === 'talk_now' ? t('state.choose') : t('boost.openTransmit')}
    </a>
  )
}

/** "Did it help?" as four small chips. */
function HelpChips({ value, onRate }: { value?: string; onRate: (answer: string) => void }) {
  const { t, lang } = useI18n()
  return (
    <div className="care-chips" role="group" aria-label={t('boost.didItHelp')}>
      {DISPLAY.did_it_help.options_en.map((o) => (
        <button key={o} type="button" className="care-chip" aria-pressed={value === o} onClick={() => onRate(o)}>
          {L(o, lang)}
        </button>
      ))}
    </div>
  )
}

interface TileProps {
  card: BoostCard
  /** pick: she can choose it; step: do this first; escalate: a person first. */
  mode: 'pick' | 'step' | 'escalate'
  chosen?: boolean
  disabled?: boolean
  onToggle?: () => void
  helped?: string
  onRate?: (answer: string) => void
  action?: ReactNode
  /** Already done today (the note is written): a small tick under the title. */
  done?: boolean
}

/**
 * One option: icon, title and time. In "pick" mode the whole head is the choose button, with a circle that
 * fills when chosen; what to do shows once chosen, or under ⓘ together with why and the sources.
 */
function CareTile({ card, mode, chosen = false, disabled = false, onToggle, helped, onRate, action, done = false }: TileProps) {
  const { t, lang } = useI18n()
  const [info, setInfo] = useState(false)
  const time = card.minutes > 0 ? t('boost.minutes', { n: card.minutes }) : t('boost.instant')
  const head = (
    <>
      <span className="care-icon">
        <CareIcon card={card} />
      </span>
      <span className="care-tile-text">
        <strong>{L(card.title_en, lang)}</strong>
        {mode !== 'escalate' && (
          <span className="care-time">
            <Icon name="clock" size={14} /> {time}
            {done && (
              <span className="care-done">
                {' · '}
                <Icon name="check" size={14} /> {t('note.written')}
              </span>
            )}
          </span>
        )}
      </span>
    </>
  )
  const showWhat = mode !== 'pick' || chosen || info
  // In "pick" mode the action (write the note, open the game) comes once she has chosen the card.
  const act = mode === 'pick' && !chosen ? undefined : action
  return (
    <article className={`care-tile ${mode}${chosen ? ' chosen' : ''}${disabled ? ' off' : ''}`}>
      <div className="care-tile-head">
        {mode === 'pick' ? (
          <button type="button" className="care-tile-pick" aria-pressed={chosen} disabled={disabled} onClick={onToggle}>
            {head}
            <span className="care-info-space" aria-hidden="true" />
            <span className="care-check" aria-hidden="true">
              {chosen && <Icon name="check" size={18} />}
            </span>
          </button>
        ) : (
          <div className="care-tile-static">{head}</div>
        )}
        <button
          type="button"
          className="icon-btn care-info"
          aria-expanded={info}
          aria-label={t('care.info', { title: L(card.title_en, lang) })}
          onClick={() => setInfo((o) => !o)}
        >
          <Icon name="info" size={20} />
        </button>
      </div>
      {(showWhat || act) && (
        <div className="care-tile-body">
          {showWhat && <p>{L(card.what_en, lang)}</p>}
          {info && <CardWhy card={card} />}
          {act}
          {mode === 'pick' && chosen && onRate && (
            <div className="care-help">
              <span className="care-help-label">{t('boost.didItHelp')}</span>
              <HelpChips value={helped} onRate={onRate} />
            </div>
          )}
        </div>
      )}
    </article>
  )
}
