import { useState } from 'react'
import type { IndicatorDef, Measurement } from '../data/types'
import { computeBaseline, evaluate, STATUS_TEXT, zScore } from '../lib/status'
import { Sparkline } from './Sparkline'

interface Props {
  def: IndicatorDef
  rows: Measurement[]
  day: number
}

/** Traffic-light card: status is shown with color AND a shape AND a word, so it reads without color. */
export function IndicatorCard({ def, rows, day }: Props) {
  const [open, setOpen] = useState(false)
  const baseline = computeBaseline(rows)
  const visible = rows.filter((r) => r.day <= day)
  const current = rows.find((r) => r.day === day)
  const previous = rows.find((r) => r.day === day - 1)
  const status = evaluate(def, current?.value, baseline, previous?.value)
  const text = STATUS_TEXT[status]
  const d = def.decimals ?? 0
  const delta = current && baseline ? current.value - baseline.mean : undefined
  const z = current && baseline ? zScore(current.value, baseline) : undefined

  return (
    <article className={`card status-${status}`}>
      <header className="card-head">
        <h3>{def.label}</h3>
        <span className="badge" aria-label={`Status: ${text.label}`}>
          <span aria-hidden="true">{text.symbol}</span> {text.label}
        </span>
      </header>

      <p className="value">
        {current ? current.value.toFixed(d) : '–'}
        <span className="unit"> {def.unit}</span>
      </p>

      {delta !== undefined && baseline && (
        <p className="delta">
          {delta >= 0 ? '+' : ''}
          {delta.toFixed(d)} vs your pre-flight normal ({baseline.mean.toFixed(d)})
          {z !== undefined && Math.abs(z) >= 1 ? ` · ${Math.abs(z).toFixed(1)} SD` : ''}
        </p>
      )}

      <Sparkline
        values={visible.map((r) => ({ day: r.day, value: r.value }))}
        baseline={baseline}
        currentDay={day}
        label={def.label}
      />

      <p className="next-step">{text.action}</p>

      <button className="link" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? 'Hide details' : 'Why this matters'}
      </button>
      {open && (
        <div className="details">
          <p>{def.explainer}</p>
          <p>
            <strong>How to measure:</strong> {def.method}
          </p>
          <p className={def.bandsSource.verified ? 'source' : 'source pending'}>
            <strong>Source:</strong>{' '}
            {def.bandsSource.url ? (
              <a href={def.bandsSource.url} target="_blank" rel="noreferrer">
                {def.bandsSource.label}
              </a>
            ) : (
              def.bandsSource.label
            )}
            {!def.bandsSource.verified && ' (unverified)'}
          </p>
        </div>
      )}
    </article>
  )
}
