import { useState } from 'react'
import { qualityLabel, regionLabel } from '../orbit/display'
import {
  alarmCheckFor,
  BRUSH,
  CO2_SOURCE,
  EMPTY_DETAILS,
  nerveLike,
  OFF_FIGURE,
  painDay,
  painSymptoms,
  verbalLabel,
  whereOf,
  type BodySide,
  type BodyView,
  type BrushSize,
  type MuscleMark,
  type PainDay,
  type PainDetailsValue,
  type PainEvent,
  type PaintStroke,
} from '../orbit/pain'
import { DISPLAY } from '../orbit/boost'
import { painSuggestions } from '../orbit/plan'
import { useI18n } from '../i18n/context'
import { SuggestionCard } from './SuggestionCard'
import { MuscleSelector } from './MuscleSelector'
import { PainDetails } from './PainDetails'
import { PainPainter } from './PainPainter'

interface Props {
  day: number
  pain: PainDay | undefined
  onChange: (pain: PainDay) => void
  /** Self-care she chose today (same choice as in Boost and "For today"). */
  chosen: string[]
  onToggleCard: (cardId: string) => void
}

type Step = 'where' | 'details' | 'safety'

/** Id of a new report (wall clock, read only in event handlers). */
const newEventId = () => `ev-${Date.now()}`
type Mode = 'exact' | 'area'

/**
 * "Does something hurt?" Psychology's report flow (pain-spec.json): where (exact muscle or painted area,
 * side, front or back), then what it feels like, how strong, when, what was happening and whether moving or
 * pressing makes it worse. Pain in the head, eyes or chest asks the alarm question before saving.
 */
export function PainPanel({ day, pain, onChange, chosen, onToggleCard }: Props) {
  const { t, lang } = useI18n()
  const [step, setStep] = useState<Step>('where')
  const [mode, setMode] = useState<Mode | null>(null)
  const [view, setView] = useState<BodyView>('front')
  const [size, setSize] = useState<BrushSize>('m')
  const [muscles, setMuscles] = useState<MuscleMark[]>([])
  const [strokes, setStrokes] = useState<PaintStroke[]>([])
  const [extra, setExtra] = useState<string[]>([])
  const [details, setDetails] = useState<PainDetailsValue>(EMPTY_DETAILS)
  const [alarms, setAlarms] = useState<string[]>([])
  const today = painDay(pain)
  const where = whereOf(muscles, strokes, extra)
  const checks = alarmCheckFor(where.regions)

  const sideText = (side?: BodySide | 'both') => (side ? ` (${t(side === 'left' ? 'pain.left' : side === 'right' ? 'pain.right' : 'pain.both')})` : '')
  const whereText = (e: Pick<PainEvent, 'regions' | 'side'>) => e.regions.map((r) => regionLabel(r, lang)).join(', ') + sideText(e.side)

  const reset = () => {
    setStep('where')
    setMode(null)
    setMuscles([])
    setStrokes([])
    setExtra([])
    setDetails(EMPTY_DETAILS)
    setAlarms([])
  }
  const save = (confirmed: string[]) => {
    const event: PainEvent = { id: newEventId(), muscles, strokes, ...where, ...details, alarms: confirmed }
    onChange({ events: [...today.events, event] })
    reset()
  }

  return (
    <section className="pain card" aria-labelledby="pain-title">
      <h2 id="pain-title">{t('pain.title')}</h2>
      <p className="muted">{t('pain.noCause')}</p>

      {step === 'where' && (
        <>
          <h3>{t('pain.where')}</h3>
          <p>{t('pain.ask')}</p>
          <div className="actions" role="group" aria-label={t('pain.ask')}>
            <button type="button" className="button secondary" aria-pressed={mode === 'exact'} onClick={() => setMode('exact')}>
              {t('pain.muscle')}
            </button>
            <button type="button" className="button secondary" aria-pressed={mode === 'area'} onClick={() => setMode('area')}>
              {t('pain.paint')}
            </button>
          </div>
          <div className="actions" role="group" aria-label={t('pain.offFigure')}>
            <span className="muted">{t('pain.offFigure')}</span>
            {OFF_FIGURE.map((r) => (
              <button
                key={r}
                type="button"
                className="button secondary"
                aria-pressed={extra.includes(r)}
                onClick={() => setExtra((x) => (x.includes(r) ? x.filter((y) => y !== r) : [...x, r]))}
              >
                {regionLabel(r, lang)}
              </button>
            ))}
          </div>

          {mode && (
            <div className="pain-work">
              <div className="pain-controls">
                <div className="actions" role="group" aria-label={t('pain.view')}>
                  {(['front', 'back'] as const).map((v) => (
                    <button key={v} type="button" className="button secondary" aria-pressed={view === v} onClick={() => setView(v)}>
                      {t(v === 'front' ? 'pain.front' : 'pain.back')}
                    </button>
                  ))}
                </div>
                {mode === 'area' && (
                  <div className="actions" role="group" aria-label={t('pain.brush')}>
                    {(Object.keys(BRUSH) as BrushSize[]).map((s) => (
                      <button key={s} type="button" className="button secondary" aria-pressed={size === s} onClick={() => setSize(s)}>
                        {t(`pain.brush.${s}`)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {mode === 'exact' ? (
                <MuscleSelector view={view} marks={muscles} onChange={setMuscles} />
              ) : (
                <PainPainter view={view} size={size} strokes={strokes} onChange={setStrokes} />
              )}
            </div>
          )}

          {where.regions.length > 0 && <p role="status">{t('pain.whereIs', { where: whereText(where) })}</p>}
          <div className="actions">
            <button type="button" className="button" disabled={!where.regions.length} onClick={() => setStep('details')}>
              {t('pain.next')}
            </button>
            {(muscles.length > 0 || strokes.length > 0 || extra.length > 0) && (
              <button type="button" className="button secondary" onClick={reset}>
                {t('pain.clearMarks')}
              </button>
            )}
          </div>
        </>
      )}

      {step === 'details' && (
        <>
          <p>
            <strong>{t('pain.whereIs', { where: whereText(where) })}</strong>
          </p>
          <PainDetails value={details} onChange={setDetails} />
          <div className="actions">
            <button type="button" className="button secondary" onClick={() => setStep('where')}>
              {t('pain.prev')}
            </button>
            <button type="button" className="button" onClick={() => (checks.length ? setStep('safety') : save([]))}>
              {t('pain.save')}
            </button>
          </div>
        </>
      )}

      {step === 'safety' && (
        <div role="alertdialog" aria-labelledby="pain-safety" className="pain-safety">
          <p id="pain-safety">
            <strong>{t('pain.safety')}</strong>
          </p>
          <div className="actions">
            {checks.map((s) => (
              <button
                key={s}
                type="button"
                className="button secondary alarm"
                aria-pressed={alarms.includes(s)}
                onClick={() => setAlarms((a) => (a.includes(s) ? a.filter((x) => x !== s) : [...a, s]))}
                lang="en"
              >
                <span aria-hidden="true">■ </span>
                {s}
              </button>
            ))}
          </div>
          <div className="actions">
            <button type="button" className="button secondary" onClick={() => save([])}>
              {t('pain.none')}
            </button>
            <button type="button" className="button" disabled={!alarms.length} onClick={() => save(alarms)}>
              {t('pain.save')}
            </button>
          </div>
        </div>
      )}

      {today.events.length > 0 && (
        <div role="status" className="pain-summary">
          <p>
            <strong>{t('pain.events', { day })}</strong>
          </p>
          <ul className="pain-events">
            {today.events.map((e, i) => {
              const label = `${whereText(e)} · ${e.intensity}/10 ${t(`pain.level.${verbalLabel(e.intensity)}`)}`
              const words = e.qualities.map((q) => qualityLabel(q, lang)).join(', ')
              return (
                <li key={e.id}>
                  <span>
                    {label}
                    {words && ` · ${words}`}
                  </span>{' '}
                  <button
                    type="button"
                    className="chip"
                    aria-label={t('pain.remove', { s: label })}
                    onClick={() => onChange({ events: today.events.filter((_, k) => k !== i) })}
                  >
                    ✕
                  </button>
                  {e.alarms.length > 0 && <p className="alarm-text">{t('body.redNow')} <a href="#/transmit">{t('boost.openTransmit')}</a></p>}
                  {e.alarms.length === 0 && nerveLike(e.qualities) && <p className="hint">{t('pain.nerve')}</p>}
                  {i === today.events.length - 1 && <PainSuggestions event={e} chosen={chosen} onToggle={onToggleCard} />}
                  {e.regions.includes('head') && (
                    <p className="hint">
                      {t('pain.co2')}{' '}
                      {CO2_SOURCE.url && (
                        <a href={CO2_SOURCE.url} target="_blank" rel="noreferrer">
                          {t('pain.source')}: {CO2_SOURCE.cite.split(',').slice(0, 2).join(',')}
                        </a>
                      )}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
          <p>
            <strong>{t('pain.loggedAs')}</strong> <span lang="en">{painSymptoms(today).join(', ')}</span>
          </p>
          <div className="actions">
            <button type="button" className="button secondary" onClick={() => onChange({ events: [] })}>
              {t('pain.clear')}
            </button>
          </div>
        </div>
      )}
      <p className="muted">{t('pain.private')}</p>
    </section>
  )
}

/** Right after she logs a pain: the self-care that matches it, or what to do if there is none. */
function PainSuggestions({ event, chosen, onToggle }: { event: PainEvent; chosen: string[]; onToggle: (id: string) => void }) {
  const { t } = useI18n()
  const cards = painSuggestions(event)
  if (!cards.length) return <p className="hint">{t('pain.noCard')}</p>
  return (
    <div className="pain-suggest">
      <p>
        <strong>{t('pain.suggest')}</strong>
      </p>
      <div className="suggestions">
        {cards.map((c) => (
          <SuggestionCard
            key={c.id}
            card={c}
            chosen={chosen.includes(c.id)}
            full={chosen.length >= DISPLAY.max_choices}
            onToggle={() => onToggle(c.id)}
          />
        ))}
      </div>
    </div>
  )
}
