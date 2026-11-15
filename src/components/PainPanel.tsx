import { useState } from 'react'
import { qualityLabel, regionLabel } from '../orbit/display'
import {
  alarmCheckFor,
  alarmsInText,
  BRUSH,
  CO2_SOURCE,
  EMPTY_DETAILS,
  nerveLike,
  OFF_FIGURE,
  painDay,
  painSymptoms,
  symptomsFor,
  isPain,
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
import { VOCABULARY } from '../orbit/body'
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
  /** Area she already painted on the home figure: the flow starts at "what does it feel like". */
  painted?: PaintStroke[]
  /** Called once a report is saved (the home figure clears its new paint). */
  onSaved?: () => void
  /** "Done" after saving: closes the panel. */
  onDone?: () => void
  /** The brush lives on the home figure: here the area is picked from a list instead (no second brush). */
  brush?: boolean
}

type Step = 'where' | 'what' | 'details' | 'safety' | 'done'

/** Id of a new report (wall clock, read only in event handlers). */
const newEventId = () => `ev-${Date.now()}`
type Mode = 'exact' | 'area'

/**
 * "Does something hurt?" Psychology's report flow (pain-spec.json): where (exact muscle or painted area,
 * side, front or back), then what it feels like, how strong, when, what was happening and whether moving or
 * pressing makes it worse. Pain in the head, eyes or chest asks the alarm question before saving.
 */
export function PainPanel({ day, pain, onChange, chosen, onToggleCard, painted = [], onSaved, onDone, brush = true }: Props) {
  const { t, lang } = useI18n()
  const [step, setStep] = useState<Step>(painted.length ? 'what' : 'where')
  const [mode, setMode] = useState<Mode | null>(painted.length ? 'area' : null)
  const [view, setView] = useState<BodyView>(painted[0]?.view ?? 'front')
  const [size, setSize] = useState<BrushSize>('m')
  const [muscles, setMuscles] = useState<MuscleMark[]>([])
  const [strokes, setStrokes] = useState<PaintStroke[]>(painted)
  const [extra, setExtra] = useState<string[]>([])
  const [details, setDetails] = useState<PainDetailsValue>(EMPTY_DETAILS)
  const [alarms, setAlarms] = useState<string[]>([])
  /** What she feels in that zone: pain and/or the symptoms of the zone. */
  const [feels, setFeels] = useState<{ pain: boolean; symptoms: string[] }>({ pain: false, symptoms: [] })
  /** A symptom she writes in her own words, besides the fixed options. */
  const [other, setOther] = useState('')
  const typed = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, MAX_TYPED)
  const addOther = (): string[] => {
    const s = typed(other)
    setOther('')
    if (!s || feels.symptoms.includes(s)) return feels.symptoms
    const symptoms = [...feels.symptoms, s]
    setFeels((f) => ({ ...f, symptoms }))
    return symptoms
  }
  const today = painDay(pain)
  const where = whereOf(muscles, strokes, extra)
  // Alarm signs to ask about: those of the regions (head, eyes, chest) and those her own words may describe.
  const typedAlarms = alarmsInText(feels.symptoms)
  const checks = [...new Set([...alarmCheckFor(where.regions), ...typedAlarms])]

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
    setFeels({ pain: false, symptoms: [] })
    setOther('')
  }
  const save = (confirmed: string[]) => {
    const described = feels.pain ? details : { ...details, qualities: [], worse: undefined }
    const event: PainEvent = { id: newEventId(), muscles, strokes, ...where, ...described, alarms: confirmed, pain: feels.pain, symptoms: feels.symptoms }
    onChange({ events: [...today.events, event] })
    reset()
    setStep('done')
    onSaved?.()
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
              {t(brush ? 'pain.paint' : 'pain.zonePick')}
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
                {mode === 'area' && brush && (
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
                <PainPainter view={view} size={size} strokes={strokes} onChange={setStrokes} brush={brush} />
              )}
            </div>
          )}

          {where.regions.length > 0 && <p role="status">{t('pain.whereIs', { where: whereText(where) })}</p>}
          <div className="actions">
            <button type="button" className="button" disabled={!where.regions.length} onClick={() => setStep('what')}>
              {t('pain.nextWhat')}
            </button>
            {(muscles.length > 0 || strokes.length > 0 || extra.length > 0) && (
              <button type="button" className="button secondary" onClick={reset}>
                {t('pain.clearMarks')}
              </button>
            )}
          </div>
        </>
      )}

      {step === 'what' && (
        <>
          <p>
            <strong>{t('pain.whereIs', { where: whereText(where) })}</strong>
          </p>
          <h3>{t('pain.what')}</h3>
          <div className="actions part-list" role="group" aria-label={t('pain.what')}>
            <button type="button" className="button secondary" aria-pressed={feels.pain} onClick={() => setFeels((f) => ({ ...f, pain: !f.pain }))}>
              {t('pain.painOption')}
            </button>
            {symptomsFor(where.regions).map((s) => (
              <button
                key={s}
                type="button"
                className="button secondary"
                aria-pressed={feels.symptoms.includes(s)}
                onClick={() => setFeels((f) => ({ ...f, symptoms: f.symptoms.includes(s) ? f.symptoms.filter((x) => x !== s) : [...f.symptoms, s] }))}
                lang="en"
              >
                {cap(s)}
              </button>
            ))}
            {/* What she wrote herself: shown as chips she can tap again to remove. */}
            {feels.symptoms
              .filter((s) => !symptomsFor(where.regions).includes(s))
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  className="button secondary"
                  aria-pressed="true"
                  aria-label={t('pain.otherRemove', { s })}
                  onClick={() => setFeels((f) => ({ ...f, symptoms: f.symptoms.filter((x) => x !== s) }))}
                >
                  {cap(s)} ✕
                </button>
              ))}
          </div>
          <form
            className="pain-other"
            onSubmit={(e) => {
              e.preventDefault()
              addOther()
            }}
          >
            <label htmlFor="pain-other">{t('pain.otherLabel')}</label>
            <div className="pain-other-row">
              <input
                id="pain-other"
                type="text"
                list="pain-vocabulary"
                value={other}
                maxLength={MAX_TYPED}
                placeholder={t('pain.otherPlaceholder')}
                autoComplete="off"
                onChange={(e) => setOther(e.target.value)}
              />
              <button type="submit" className="button secondary" disabled={!typed(other)}>
                {t('pain.otherAdd')}
              </button>
            </div>
            {/* The fixed vocabulary as she types, so the same symptom is written the same way every day. */}
            <datalist id="pain-vocabulary">
              {VOCAB_SUGGESTIONS.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </form>
          <p className="hint">{t('pain.whatHint')}</p>
          <div className="actions">
            <button type="button" className="button secondary" onClick={() => setStep('where')}>
              {t('pain.prev')}
            </button>
            <button
              type="button"
              className="button"
              disabled={!feels.pain && !feels.symptoms.length && !typed(other)}
              onClick={() => {
                // Text left in the box counts too, without pressing "Add".
                if (typed(other)) addOther()
                setStep('details')
              }}
            >
              {t('pain.next')}
            </button>
          </div>
        </>
      )}

      {step === 'details' && (
        <>
          <p>
            <strong>{t('pain.whereIs', { where: whereText(where) })}</strong>
            {feels.symptoms.length > 0 && <span> · {feels.symptoms.map(cap).join(', ')}</span>}
          </p>
          <PainDetails value={details} onChange={setDetails} pain={feels.pain} />
          <div className="actions">
            <button type="button" className="button secondary" onClick={() => setStep('what')}>
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
          {typedAlarms.length > 0 && (
            <p className="hint">
              {t('pain.safetyTyped', { s: feels.symptoms.filter((s) => alarmsInText([s]).length).map(cap).join(', ') })}
            </p>
          )}
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
                {cap(s)}
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

      {step === 'done' && (
        <div className="pain-done">
          <p role="status">
            <strong>✓ {t('pain.savedOk')}</strong>
          </p>
          <div className="actions">
            {onDone && (
              <button type="button" className="button" onClick={onDone}>
                {t('pain.done')}
              </button>
            )}
            <button type="button" className="button secondary" onClick={() => setStep('where')}>
              {t('pain.another')}
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
              // A symptom without pain has no intensity of her own: none is shown.
              const label = isPain(e) ? `${whereText(e)} · ${e.intensity}/10 ${t(`pain.level.${verbalLabel(e.intensity)}`)}` : whereText(e)
              const words = [...e.qualities.map((q) => qualityLabel(q, lang)), ...(e.symptoms ?? []).map(cap)].join(', ')
              const kind = isPain(e) ? '' : `${t('pain.symptomOnly')} · `
              return (
                <li key={e.id}>
                  <span>
                    {kind}
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
          {painSymptoms(today).length > 0 && (
            <p>
              <strong>{t('pain.loggedAs')}</strong> <span lang="en">{painSymptoms(today).join(', ')}</span>
            </p>
          )}
          <div className="actions">
            <button type="button" className="button secondary" onClick={() => onChange({ events: [] })}>
              {t('pain.clear')}
            </button>
          </div>
        </div>
      )}
      <p className="pain-serious">
        {t('pain.serious')} <a href="#/transmit">{t('pain.seriousLink')}</a>
      </p>
      <p className="muted">{t('pain.private')}</p>
    </section>
  )
}

/** Longest symptom she can write herself. */
const MAX_TYPED = 60

/** Suggestions while she writes: the vocabulary without the alarm signs (those are asked in the safety question). */
const VOCAB_SUGGESTIONS = VOCABULARY.filter((v) => !v.red_flag).map((v) => v.text)

/** Symptom words of the vocabulary are lower case; shown with a capital first letter. */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

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
