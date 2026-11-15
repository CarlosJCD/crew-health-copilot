import { useMemo, useState } from 'react'
import { isRedFlag, SYSTEMS, systemColor, systemRisks, type SymptomLog, type SystemId } from '../orbit/body'
import { getIndicator, type Color } from '../orbit/config'
import { COLOR_SYMBOL } from '../orbit/display'
import type { LoadedDemo } from '../orbit/demoData'
import { evaluateDay } from '../orbit/engine'
import {
  getRegion,
  loggedIn,
  logInRegion,
  placesOf,
  REGIONS,
  regionColor,
  symptomDays,
  unlogInRegion,
  type RegionId,
  type SymptomPlaces,
} from '../orbit/regions'
import { AnatomyFigure, type Layer } from '../components/AnatomyFigure'
import { useI18n } from '../i18n/context'

interface Props {
  demo: LoadedDemo
  day: number
  log: SymptomLog
  onLogChange: (log: SymptomLog) => void
  places: SymptomPlaces
  onPlacesChange: (places: SymptomPlaces) => void
}

const LAYERS: Layer[] = ['status', 'bone', 'fluid', 'symptoms']
const HRP_RISKS_URL = 'https://www.nasa.gov/hrp/risks/'

/**
 * Body map: 17 regions, front and back, with four layers (status, muscle and bone, fluids, symptoms).
 * A region shows the state of its systems; context layers never change a state. Symptoms use the
 * fixed vocabulary of the rules file and remember the region where they were felt.
 */
export function BodyMap({ demo, day, log, onLogChange, places, onPlacesChange }: Props) {
  const { t, tr } = useI18n()
  const [selected, setSelected] = useState<RegionId>('chest')
  const [layer, setLayer] = useState<Layer>('status')
  const { data } = demo
  const result = useMemo(() => evaluateDay(data, day), [data, day])
  const symptomsToday = data.days.find((d) => d.day === day)?.symptoms ?? []
  const logged = log[day] ?? []
  const systemColors = Object.fromEntries(SYSTEMS.map((s) => [s.id, systemColor(s, result, symptomsToday)])) as Record<SystemId, Color>
  const colors = Object.fromEntries(REGIONS.map((g) => [g.id, regionColor(g, result, symptomsToday)])) as Record<RegionId, Color>
  const counts = useMemo(() => symptomDays(data, places, day), [data, places, day])
  const region = getRegion(selected)
  const systems = SYSTEMS.filter((s) => region.systems.includes(s.id))
  const indicators = [...new Set(systems.flatMap((s) => s.indicators))]
  const risks = [...new Set(systems.flatMap(systemRisks))]
  const notes = [...region.context, ...(region.fluid >= 2 && !region.context.includes('fluid') ? (['fluid'] as const) : [])]
  const here = (s: string) => loggedIn(s, selected, day, log, places)

  const apply = (next: { log: SymptomLog; places: SymptomPlaces }) => {
    if (next.log !== log) onLogChange(next.log)
    if (next.places !== places) onPlacesChange(next.places)
  }
  const toggle = (s: string) =>
    apply(here(s) ? unlogInRegion(s, selected, day, log, places) : logInRegion(s, selected, day, log, places))
  const removeAll = (s: string) => {
    onLogChange({ ...log, [day]: logged.filter((x) => x !== s) })
    const dayPlaces = { ...(places[day] ?? {}) }
    delete dayPlaces[s]
    onPlacesChange({ ...places, [day]: dayPlaces })
  }
  const where = (s: string) =>
    placesOf(s, day, places)
      .map((g) => tr(getRegion(g).label))
      .join(', ')

  return (
    <div className="bodymap">
      <section className="bodymap-figure" aria-labelledby="body-title">
        <div className="anat-head">
          <h2 id="body-title">{t('body.title', { day })}</h2>
          <div className="segmented" role="group" aria-label={t('body.layers')}>
            {LAYERS.map((l) => (
              <button key={l} type="button" aria-pressed={layer === l} onClick={() => setLayer(l)}>
                {t(`body.layer.${l}`)}
              </button>
            ))}
          </div>
        </div>
        <p className="systems-line" aria-label={t('body.systemsAria')}>
          {SYSTEMS.map((s) => (
            <span key={s.id} className={`sys color-${systemColors[s.id]}`}>
              <span aria-hidden="true">{COLOR_SYMBOL[systemColors[s.id]]}</span> {t(`body.${s.id}`)}
            </span>
          ))}
        </p>
        <div className="anat-figs" aria-label={t('body.figure')}>
          <AnatomyFigure view="front" layer={layer} colors={colors} selected={selected} onSelect={setSelected} counts={counts} />
          <AnatomyFigure view="back" layer={layer} colors={colors} selected={selected} onSelect={setSelected} counts={counts} />
        </div>
        <p className="anat-legend">{t(`body.legend.${layer}`)}</p>
      </section>

      <section className={`bodymap-detail card color-${colors[selected]}`} aria-live="polite">
        <header className="card-head">
          <h2>{tr(region.label)}</h2>
          <span className="badge">
            <span aria-hidden="true">{COLOR_SYMBOL[colors[selected]]}</span> {t(`color.${colors[selected]}`)}
          </span>
        </header>

        {systems.length > 0 ? (
          <p className="muted">
            {t('body.systems')} {systems.map((s) => t(`body.${s.id}`)).join(' · ')}
          </p>
        ) : (
          <p className="muted">{t('body.noData')}</p>
        )}

        {indicators.length > 0 && (
          <>
            <h3>{t('body.watches')}</h3>
            <ul className="watch-list">
              {indicators.map((id) => {
                const def = getIndicator(id)
                const res = result.indicators[id]
                return (
                  <li key={id}>
                    <strong lang="en">{def.label_en}</strong> · {t(`color.${res?.color ?? 'none'}`)}
                    <br />
                    <span lang="en">{res?.reason}</span>
                    <br />
                    <span className="muted">
                      {t('body.how')} <span lang="en">{def.input}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        {risks.length > 0 && (
          <p>
            <strong>{t('card.risk')}</strong>{' '}
            {risks.map((risk, i) => (
              <span key={risk}>
                {i > 0 && ' · '}
                <a href={HRP_RISKS_URL} target="_blank" rel="noreferrer" lang="en">
                  {risk}
                </a>
              </span>
            ))}
          </p>
        )}

        {notes.length > 0 && (
          <div className="context-notes">
            <h3>{t('body.context')}</h3>
            <ul>
              {notes.map((n) => (
                <li key={n}>
                  {t(`body.ctx.${n}`)} <span className="pending">{t('body.pending')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {region.symptoms.length > 0 && (
          <>
            <h3>{t('body.logHere')}</h3>
            <div className="actions symptom-buttons">
              {region.symptoms.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`button secondary${isRedFlag(s) ? ' alarm' : ''}`}
                  aria-pressed={here(s)}
                  onClick={() => toggle(s)}
                  lang="en"
                >
                  {isRedFlag(s) && <span aria-hidden="true">■ </span>}
                  {s}
                </button>
              ))}
            </div>
            <p className="muted">{t('body.alarmNote')}</p>
          </>
        )}

        {logged.length > 0 && (
          <div role="status">
            <p>
              <strong>{t('body.logged', { day })}</strong>
            </p>
            <p>
              {logged.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => removeAll(s)} aria-label={t('body.remove', { s })}>
                  <span lang="en">{s}</span>
                  {where(s) && <span className="muted"> · {where(s)}</span>} ✕
                </button>
              ))}
            </p>
            {logged.some(isRedFlag) && (
              <p>
                {t('body.redNow')} <a href="#/boost">{t('body.openBoost')}</a> · <a href="#/transmit">{t('boost.openTransmit')}</a>
              </p>
            )}
          </div>
        )}
      </section>
      <section className="bodymap-list" aria-label={t('body.regionsList')}>
        <ul className="system-list region-list">
          {REGIONS.map((g) => (
            <li key={g.id}>
              <button type="button" className={`system-btn color-${colors[g.id]}`} aria-pressed={selected === g.id} onClick={() => setSelected(g.id)}>
                <span aria-hidden="true">{COLOR_SYMBOL[colors[g.id]]}</span> {tr(g.label)}
                {counts[g.id] ? <span className="muted"> · {t('body.symptomDays', { n: counts[g.id]! })}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
