import { useState } from 'react'
import type { IndicatorDef, Measurement } from '../data/types'
import { useI18n } from '../i18n/context'
import { computeBaseline, evaluate, STATUS_SYMBOL, zScore } from '../lib/status'
import { Sparkline } from './Sparkline'

interface Props {
  def: IndicatorDef
  rows: Measurement[]
  day: number
}

/** Traffic-light card: status is shown with color AND a shape AND a word, so it reads without color. */
export function IndicatorCard({ def, rows, day }: Props) {
  const { t, tr, unit, num } = useI18n()
  const [open, setOpen] = useState(false)
  const baseline = computeBaseline(rows)
  const visible = rows.filter((r) => r.day <= day)
  const current = rows.find((r) => r.day === day)
  const previous = rows.find((r) => r.day === day - 1)
  const status = evaluate(def, current?.value, baseline, previous?.value)
  const statusLabel = t(`status.${status}`)
  const d = def.decimals ?? 0
  const delta = current && baseline ? current.value - baseline.mean : undefined
  const z = current && baseline ? zScore(current.value, baseline) : undefined
  const label = tr(def.label)
  const source = def.bandsSource

  return (
    <article className={`card status-${status}`}>
      <header className="card-head">
        <h3>{label}</h3>
        <span className="badge" aria-label={t('status.aria', { status: statusLabel })}>
          <span aria-hidden="true">{STATUS_SYMBOL[status]}</span> {statusLabel}
        </span>
      </header>

      <p className="value">
        {current ? num(current.value, d) : '–'}
        <span className="unit"> {unit(def.unit)}</span>
      </p>

      {delta !== undefined && baseline && (
        <p className="delta">
          {t('card.vsBaseline', {
            delta: `${delta >= 0 ? '+' : ''}${num(delta, d)}`,
            mean: num(baseline.mean, d),
          })}
          {z !== undefined && Math.abs(z) >= 1 ? ` · ${t('card.sd', { z: num(Math.abs(z), 1) })}` : ''}
        </p>
      )}

      <Sparkline
        values={visible.map((r) => ({ day: r.day, value: r.value }))}
        baseline={baseline}
        currentDay={day}
        ariaLabel={t('card.trend', { label })}
      />

      <p className="next-step">{t(`action.${status}`)}</p>

      <button className="link" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? t('card.hide') : t('card.why')}
      </button>
      {open && (
        <div className="details">
          <p>{tr(def.explainer)}</p>
          <p>
            <strong>{t('card.how')}</strong> {tr(def.method)}
          </p>
          <p className={source.verified ? 'source' : 'source pending'}>
            <strong>{t('card.source')}</strong>{' '}
            {source.url ? (
              <a href={source.url} target="_blank" rel="noreferrer">
                {tr(source.label)}
              </a>
            ) : (
              tr(source.label)
            )}
            {/* Pending placeholders already say so; flag only real citations not yet checked. */}
            {!source.verified && source.url && ` ${t('card.unverified')}`}
          </p>
        </div>
      )}
    </article>
  )
}
