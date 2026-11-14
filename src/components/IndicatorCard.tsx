import { useState } from 'react'
import type { IndicatorDef, Measurement, SourceRef } from '../data/types'
import { useI18n } from '../i18n/context'
import { evaluateDay, STATUS_SYMBOL } from '../lib/status'
import { Sparkline } from './Sparkline'

interface Props {
  def: IndicatorDef
  rows: Measurement[]
  day: number
}

function Source({ source }: { source: SourceRef }) {
  const { t, tr } = useI18n()
  return (
    <span className={source.verified ? 'source' : 'source pending'}>
      {source.url ? (
        <a href={source.url} target="_blank" rel="noreferrer">
          {tr(source.label)}
        </a>
      ) : (
        tr(source.label)
      )}
      {/* Pending placeholders already say so; flag only real citations not yet checked. */}
      {!source.verified && source.url && ` ${t('card.unverified')}`}
    </span>
  )
}

/** Traffic-light card: status is shown with color AND a shape AND a word, so it reads without color. */
export function IndicatorCard({ def, rows, day }: Props) {
  const { t, tr, unit, num } = useI18n()
  const [open, setOpen] = useState(false)
  const ev = evaluateDay(def, rows, day)
  const { status, baseline, observed, expected, z, category } = ev
  const visible = rows.filter((r) => r.day <= day)
  const current = rows.find((r) => r.day === day)
  const statusLabel = t(`status.${status}`)
  const d = def.decimals ?? 0
  const u = unit(def.unit)
  const label = tr(def.label)
  const signed = (x: number, decimals: number) => {
    const r = Number(x.toFixed(decimals))
    return r === 0 ? num(0, decimals) : `${r > 0 ? '+' : ''}${num(r, decimals)}`
  }
  const shifted = day >= 0 && def.inflightShift !== 0

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
        <span className="unit"> {u}</span>
      </p>

      {current && observed !== undefined && def.smoothN > 1 && (
        <p className="delta">{t('card.avg', { n: def.smoothN, value: `${num(observed, d)} ${u}` })}</p>
      )}

      {current && def.evaluateOn === 'changePct' && ev.changePct !== undefined && (
        <p className="delta">{t('card.change', { pct: signed(ev.changePct, 1) })}</p>
      )}

      {current && observed !== undefined && expected !== undefined && (
        <p className="delta">
          {t(shifted ? 'card.vsExpected' : 'card.vsBaseline', {
            delta: signed(observed - expected, d),
            mean: num(expected, d),
          })}
          {z !== undefined && Math.abs(z) >= 1 ? ` · ${t('card.sd', { z: num(Math.abs(z), 1) })}` : ''}
        </p>
      )}

      {current && category && <p className="category">{t('card.category', { label: tr(category.label) })}</p>}

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
          {category && (
            <p>
              <strong>{t('card.cutoff')}</strong> {category.quote && <q lang="en">{category.quote}</q>}{' '}
              <Source source={category.source} />
            </p>
          )}
          <p>
            <strong>{t('card.sources')}</strong>{' '}
            {def.sources.map((s, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                <Source source={s} />
              </span>
            ))}
          </p>
        </div>
      )}
    </article>
  )
}
