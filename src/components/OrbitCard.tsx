import { useEffect, useRef, useState } from 'react'
import { getIndicator } from '../orbit/config'
import { COLOR_SYMBOL } from '../orbit/display'
import type { DayRecord, DemoData, MeanSd, NumericField } from '../orbit/demoData'
import type { IndicatorResult } from '../orbit/engine'
import { useI18n } from '../i18n/context'
import { Sparkline } from './Sparkline'

interface View {
  /** Today's value as text, or undefined when there is no reading. */
  value: (d: DayRecord, h: DayRecord[]) => string | undefined
  unit?: string
  /** Field drawn in the trend line. */
  series?: NumericField
  /** Personal baseline [mean, sd] for the band and the "your usual" note. */
  baseline?: (data: DemoData) => MeanSd | undefined
  /** Band half-width in SDs (pulse uses 2 SD, its yellow line). */
  bandSd?: number
  /** Text for "your usual" when it is not just the baseline mean (blood pressure). */
  usual?: (data: DemoData) => string
}

const n = (x: number | null | undefined, decimals = 0) => (typeof x === 'number' ? x.toFixed(decimals) : undefined)
const weekly = (h: DayRecord[], pick: (d: DayRecord) => string | undefined) => {
  const day = h.at(-1)?.day ?? 0
  const last = [...h].reverse().find((d) => pick(d) !== undefined)
  return last && day - last.day < 7 ? `${pick(last)}${last.day === day ? '' : ` (day ${last.day})`}` : undefined
}

const VIEWS: Record<string, View> = {
  sleep: { value: (d) => n(d.sleep_h, 1), unit: 'h', series: 'sleep_h', baseline: (x) => x.persona.baseline.sleep_h },
  hr: { value: (d) => n(d.hr), unit: 'bpm', series: 'hr', baseline: (x) => x.persona.baseline.hr },
  bp: {
    value: (d) => (typeof d.sbp === 'number' && typeof d.dbp === 'number' ? `${d.sbp}/${d.dbp}` : undefined),
    unit: 'mmHg',
    series: 'sbp',
    baseline: (x) => x.persona.baseline.sbp,
    usual: (x) => `${x.persona.baseline.sbp[0]}/${x.persona.baseline.dbp[0]}`,
  },
  temp: { value: (d) => n(d.temp, 1), unit: '°C', series: 'temp', baseline: (x) => x.persona.baseline.temp },
  glucose: { value: (_d, h) => weekly(h, (d) => n(d.glucose)), unit: 'mg/dL', series: 'glucose' },
  exercise: {
    value: (d) => n(d.exercise_min),
    unit: 'min',
    series: 'exercise_min',
    baseline: (x) => [x.persona.baseline.exercise_prescription_min, 0],
  },
  symptoms: { value: (d) => (d.symptoms.length ? d.symptoms.join(', ') : 'none') },
  checkin: {
    value: (d) =>
      typeof d.mood === 'number' ? `mood ${d.mood} · stress ${d.stress ?? '–'} · fatigue ${d.fatigue ?? '–'}` : undefined,
    series: 'mood',
    baseline: (x) => x.persona.baseline.mood,
  },
  screen: { value: (_d, h) => weekly(h, (d) => (d.screen ? `PHQ-2 ${d.screen.phq2} · GAD-2 ${d.screen.gad2}` : undefined)) },
  pulse: { value: (d) => n(d.pulse_ms), unit: 'ms', series: 'pulse_ms', baseline: (x) => x.persona.baseline.pulse_ms, bandSd: 2 },
  crew_climate: { value: (d) => n(d.crew_climate), unit: '/10', series: 'crew_climate', baseline: (x) => x.persona.baseline.crew_climate },
  contact: { value: (d) => n(d.contact), unit: 'msgs', series: 'contact', baseline: (x) => x.persona.baseline.contact },
}

interface Props {
  id: string
  result: IndicatorResult
  data: DemoData
  day: number
  /** Open "Why?" and scroll to this card on load (deep link). */
  openWhy?: boolean
}

/** Traffic-light card: color AND shape AND word, so it reads without color. */
export function OrbitCard({ id, result, data, day, openWhy = false }: Props) {
  const { t, unit, lang } = useI18n()
  const [open, setOpen] = useState(openWhy)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (openWhy) ref.current?.scrollIntoView({ block: 'nearest' })
  }, [openWhy])
  const def = getIndicator(id)
  const view = VIEWS[id]
  const h = data.days.filter((d) => d.day <= day)
  const today = h.at(-1)?.day === day ? h.at(-1) : undefined
  const value = today && view ? view.value(today, h) : undefined
  const base = view?.baseline?.(data)
  const series = view?.series
  const points = series
    ? h.filter((d) => typeof d[series] === 'number').map((d) => ({ day: d.day, value: d[series] as number }))
    : []
  const colorWord = t(`color.${result.color}`)
  const teamParams = def.team_criterion

  return (
    <article ref={ref} className={`card color-${result.color}`}>
      <header className="card-head">
        <h3>{def.label_en}</h3>
        <span className="badge" aria-label={t('color.aria', { domain: def.label_en, color: colorWord })}>
          <span aria-hidden="true">{COLOR_SYMBOL[result.color]}</span> {colorWord}
        </span>
      </header>

      <p className={value && value.length > 9 ? 'value small' : 'value'}>
        {value ?? '–'}
        {value && view?.unit && <span className="unit"> {unit(view.unit)}</span>}
      </p>
      {base && view?.unit && base[1] > 0 && (
        <p className="delta">{t('card.usual', { value: `${view.usual?.(data) ?? base[0]} ${unit(view.unit)}` })}</p>
      )}
      <p className="reason">{result.reason}</p>
      {id === 'exercise' && today && typeof today.exercise_min === 'number' && (
        <div
          className="progress"
          role="img"
          aria-label={t('care.exercise', { pct: Math.round((100 * today.exercise_min) / data.persona.baseline.exercise_prescription_min) })}
        >
          <span style={{ width: `${Math.min(100, (100 * today.exercise_min) / data.persona.baseline.exercise_prescription_min)}%` }} />
        </div>
      )}

      {points.length > 1 && (
        <Sparkline
          values={points}
          band={base && base[1] > 0 ? { mean: base[0], spread: base[1] * (view?.bandSd ?? 1) } : undefined}
          currentDay={day}
          ariaLabel={t('card.trend', { label: def.label_en })}
        />
      )}

      <button className="link" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? t('card.hide') : t('card.why')}
      </button>
      {open && (
        <div className="details">
          <p className="why" lang="en">{def.why_en}</p>
          <p>
            <strong>{t('card.rule')}</strong> <span lang="en">{def.rule_en}</span>
          </p>
          <p>
            <strong>{t('card.action')}</strong> <span lang="en">{def.action_en}</span>
          </p>
          <p>
            <strong>{t('card.risk')}</strong>{' '}
            <a href={def.hrp_url} target="_blank" rel="noreferrer">
              {def.hrp_risk}
            </a>
          </p>
          <p>
            <strong>{t('card.sources')}</strong>{' '}
            {def.sources.length
              ? def.sources.map((s, i) => (
                  <span key={s.cite}>
                    {i > 0 && ' · '}
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.cite}
                      </a>
                    ) : (
                      s.cite
                    )}
                  </span>
                ))
              : t('card.noSources')}
          </p>
          {teamParams.length > 0 && (
            <p className="team">
              <strong>{t('card.team')}</strong> {teamParams.join(', ')}
            </p>
          )}
          {lang === 'es' && <p className="note">{t('card.englishOnly')}</p>}
        </div>
      )}
    </article>
  )
}
