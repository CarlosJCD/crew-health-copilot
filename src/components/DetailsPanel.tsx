import { useEffect, useRef } from 'react'
import type { SourceRef } from '../data/types'
import { useI18n } from '../i18n/context'
import { describeChange } from './describe'
import type { IndicatorItem } from './IndicatorCard'
import { StatusPill } from './StatusPill'

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

/**
 * Side panel (bottom sheet on phones) with everything behind a card: why it matters, the exact
 * numbers (normal, SD, cut-offs), how to measure, and the sources with their verification state.
 * Uses <dialog> so focus, Escape and the backdrop are handled by the browser.
 */
export function DetailsPanel({ item, day, onClose }: { item?: IndicatorItem; day: number; onClose: () => void }) {
  const i18n = useI18n()
  const { t, tr, unit, num } = i18n
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (item && !dialog.open) dialog.showModal()
    if (!item && dialog.open) dialog.close()
  }, [item])

  const body = () => {
    if (!item) return null
    const { def, rows, ev, status } = item
    const d = def.decimals ?? 0
    const u = unit(def.unit)
    const current = rows.find((r) => r.day === day)
    const change = current ? describeChange(def, ev, day, i18n) : undefined
    const shifted = day >= 0 && def.inflightShift !== 0
    const category = ev.category
    return (
      <div className="details-body">
        <div className="details-top">
          <h2 id="details-title">{tr(def.label)}</h2>
          <button type="button" className="close" onClick={onClose} aria-label={t('dlg.close')}>
            ✕
          </button>
        </div>
        <StatusPill status={status} />
        <p>
          <strong>{t('dlg.why')}</strong> {tr(def.explainer)}
        </p>
        <dl className="kv">
          <dt>{t('dlg.today')}</dt>
          <dd>{current ? `${num(current.value, d)} ${u}` : t('status.no-data')}</dd>
          <dt>{t('dlg.normal')}</dt>
          <dd>
            {ev.baseline
              ? t('dlg.normalValue', { mean: `${num(ev.baseline.mean, d)} ${u}`, sd: num(ev.baseline.sd, d || 1), n: ev.baseline.n })
              : t('dlg.noBaseline')}
          </dd>
          {shifted && ev.expected !== undefined && (
            <>
              <dt>{t('dlg.expected')}</dt>
              <dd>{`${num(ev.expected, d)} ${u}`}</dd>
            </>
          )}
          {def.smoothN > 1 && ev.observed !== undefined && current && (
            <>
              <dt>{t('dlg.average')}</dt>
              <dd>{t('dlg.averageValue', { value: `${num(ev.observed, d)} ${u}`, n: def.smoothN })}</dd>
            </>
          )}
          {change && (
            <>
              <dt>{t('dlg.change')}</dt>
              <dd>{change.text}</dd>
            </>
          )}
          {ev.z !== undefined && current && (
            <>
              <dt>{t('dlg.deviation')}</dt>
              <dd>
                {t('dlg.deviationValue', {
                  z: `${ev.z >= 0 ? '+' : '−'}${num(Math.abs(ev.z), 1)}`,
                  watch: num(def.baselineSd.watch, 1),
                  act: num(def.baselineSd.act, 1),
                })}
              </dd>
            </>
          )}
          {category && current && (
            <>
              <dt>{t('dlg.range')}</dt>
              <dd>{tr(category.label)}</dd>
            </>
          )}
        </dl>
        <p>
          <strong>{t('dlg.how')}</strong> {tr(def.method)}
        </p>
        <div className="sources">
          {category && (
            <p>
              <span className="overline">{t('dlg.cutoff')}</span>{' '}
              {category.quote && <q lang="en">{category.quote}</q>} <Source source={category.source} />
            </p>
          )}
          <span className="overline">{t('dlg.sources')}</span>
          <ul>
            {def.sources.map((s, i) => (
              <li key={i}>
                <Source source={s} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <dialog
      ref={ref}
      className={`details-dialog status-${item?.status ?? 'no-data'}`}
      aria-labelledby="details-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose() // click on the backdrop
      }}
    >
      {body()}
    </dialog>
  )
}
