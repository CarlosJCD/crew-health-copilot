import type { IndicatorDef, Measurement } from '../data/types'
import { useI18n } from '../i18n/context'
import type { Evaluation } from '../lib/status'
import { describeChange } from './describe'
import { DeviationMeter } from './DeviationMeter'
import { Sparkline } from './Sparkline'
import { StatusPill } from './StatusPill'

export interface IndicatorItem {
  def: IndicatorDef
  rows: Measurement[]
  ev: Evaluation
  status: Evaluation['status']
}

interface CardProps {
  item: IndicatorItem
  day: number
  onDetails: (id: string) => void
}

/** Full card for an indicator at Watch or Act: value, one plain sentence, deviation meter, trend, next step. */
export function IndicatorCard({ item, day, onDetails }: CardProps) {
  const i18n = useI18n()
  const { t, tr, unit, num } = i18n
  const { def, rows, ev, status } = item
  const current = rows.find((r) => r.day === day)
  const label = tr(def.label)
  const change = current ? describeChange(def, ev, day, i18n) : undefined

  return (
    <article className={`card status-${status}`}>
      <header className="card-head">
        <h3>{label}</h3>
        <StatusPill status={status} />
      </header>
      <p className="value">
        <span className="value-num">{current ? num(current.value, def.decimals ?? 0) : '–'}</span>
        <span className="unit">{unit(def.unit)}</span>
      </p>
      {change && (
        <p className="delta">
          <span className="dir" aria-hidden="true">
            {change.dir}
          </span>
          {change.text}
        </p>
      )}
      {current && ev.z !== undefined && <DeviationMeter z={ev.z} cutoffs={def.baselineSd} worseWhen={def.worseWhen} />}
      <Sparkline
        values={rows.filter((r) => r.day <= day).map((r) => ({ day: r.day, value: r.value }))}
        baseline={ev.baseline}
        currentDay={day}
        ariaLabel={t('card.trend', { label })}
      />
      <p className="next-step">{t(`action.${status}`)}</p>
      <button type="button" className="link" onClick={() => onDetails(def.id)} aria-haspopup="dialog">
        {t('card.details')} ›
      </button>
    </article>
  )
}

/** Nominal and no-data indicators of a domain, one row each, so they do not take a full card. */
export function IndicatorList({ items, day, onDetails }: { items: IndicatorItem[]; day: number; onDetails: (id: string) => void }) {
  const { t, tr, unit, num } = useI18n()
  const allNominal = items.every((i) => i.status === 'nominal')
  return (
    <article className="card card-list">
      <header className="card-head">
        <h3>{t(allNominal ? 'list.nominal' : 'list.mixed')}</h3>
        <span className="pill status-nominal" aria-hidden="true">
          ● {items.filter((i) => i.status === 'nominal').length}
        </span>
      </header>
      <ul>
        {items.map(({ def, rows, ev, status }) => {
          const current = rows.find((r) => r.day === day)
          const label = tr(def.label)
          return (
            <li key={def.id}>
              <button
                type="button"
                className={`list-row status-${status}`}
                onClick={() => onDetails(def.id)}
                aria-haspopup="dialog"
                aria-label={`${label}: ${current ? `${num(current.value, def.decimals ?? 0)} ${unit(def.unit)}` : ''} ${t(`status.${status}`)}`}
              >
                <span className="row-name">
                  {status === 'no-data' && <span className="shape" aria-hidden="true">○ </span>}
                  {label}
                </span>
                <span className="row-val">
                  {current ? num(current.value, def.decimals ?? 0) : '–'} <small>{unit(def.unit)}</small>
                </span>
                <Sparkline
                  mini
                  values={rows.filter((r) => r.day <= day).map((r) => ({ day: r.day, value: r.value }))}
                  baseline={ev.baseline}
                  currentDay={day}
                  ariaLabel=""
                />
              </button>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
