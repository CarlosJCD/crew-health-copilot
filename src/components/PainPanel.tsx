import { useState } from 'react'
import { isRedFlag } from '../orbit/body'
import { partKey } from '../orbit/display'
import { BRUSH, EMPTY_PAIN, INTENSITY, intensityColor, painSymptoms, type BodyView, type BrushSize, type PainDay } from '../orbit/pain'
import { useI18n } from '../i18n/context'
import { MuscleSelector } from './MuscleSelector'
import { PainPainter } from './PainPainter'

interface Props {
  day: number
  pain: PainDay | undefined
  onChange: (pain: PainDay) => void
}

type Mode = 'muscle' | 'paint'

/**
 * "Does something hurt?" One question first: is she sure it is muscle pain? Yes = pick the muscle;
 * not sure = paint where it hurts. Both end in the fixed symptom vocabulary, shown under the figure.
 */
export function PainPanel({ day, pain = EMPTY_PAIN, onChange }: Props) {
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode | null>(null)
  const [view, setView] = useState<BodyView>('front')
  const [intensity, setIntensity] = useState(INTENSITY.start)
  const [size, setSize] = useState<BrushSize>('m')
  const symptoms = painSymptoms(pain)
  const sideText = (s?: 'left' | 'right') => (s ? ` (${t(s === 'left' ? 'pain.left' : 'pain.right')})` : '')
  const any = pain.muscles.length > 0 || pain.strokes.length > 0

  return (
    <section className="pain card" aria-labelledby="pain-title">
      <h2 id="pain-title">{t('pain.title')}</h2>
      <p>{t('pain.ask')}</p>
      <div className="actions" role="group" aria-label={t('pain.ask')}>
        <button type="button" className="button secondary" aria-pressed={mode === 'muscle'} onClick={() => setMode('muscle')}>
          {t('pain.muscle')}
        </button>
        <button type="button" className="button secondary" aria-pressed={mode === 'paint'} onClick={() => setMode('paint')}>
          {t('pain.paint')}
        </button>
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
            <label htmlFor="pain-intensity" className="pain-intensity">
              <span className="swatch" style={{ background: intensityColor(intensity) }} aria-hidden="true" />
              {t('pain.intensity', { n: intensity })}
            </label>
            <input
              id="pain-intensity"
              type="range"
              min={INTENSITY.min}
              max={INTENSITY.max}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
            />
            <p className="hint">{t('pain.scale')}</p>
            {mode === 'paint' && (
              <div className="actions" role="group" aria-label={t('pain.brush')}>
                {(Object.keys(BRUSH) as BrushSize[]).map((s) => (
                  <button key={s} type="button" className="button secondary" aria-pressed={size === s} onClick={() => setSize(s)}>
                    {t(`pain.brush.${s}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {mode === 'muscle' ? (
            <MuscleSelector view={view} intensity={intensity} pain={pain} onChange={onChange} />
          ) : (
            <PainPainter view={view} intensity={intensity} size={size} pain={pain} onChange={onChange} />
          )}
        </div>
      )}

      {any && (
        <div role="status" className="pain-summary">
          <p>
            <strong>{t('pain.marked', { day })}</strong>{' '}
            {pain.muscles.map((m, i) => {
              const label = `${t(partKey(m.slug))}${sideText(m.side)} · ${m.intensity}/10`
              return (
                <button
                  key={`m-${m.slug}-${m.side ?? 'both'}-${m.view}`}
                  type="button"
                  className="chip"
                  aria-label={t('pain.remove', { s: label })}
                  onClick={() => onChange({ ...pain, muscles: pain.muscles.filter((_, k) => k !== i) })}
                >
                  {label} ✕
                </button>
              )
            })}
            {pain.strokes.map((s, i) => {
              const label = `${t('pain.painted', { zones: s.zones.map((z) => t(partKey(z))).join(', ') })} · ${s.intensity}/10`
              return (
                <button
                  key={s.id}
                  type="button"
                  className="chip"
                  aria-label={t('pain.remove', { s: label })}
                  onClick={() => onChange({ ...pain, strokes: pain.strokes.filter((_, k) => k !== i) })}
                >
                  {label} ✕
                </button>
              )
            })}
          </p>
          <p>
            <strong>{t('pain.loggedAs')}</strong> <span lang="en">{symptoms.join(', ')}</span>
          </p>
          {symptoms.some(isRedFlag) && (
            <p className="alarm-text">
              {t('body.redNow')} <a href="#/transmit">{t('boost.openTransmit')}</a>
            </p>
          )}
          <div className="actions">
            {pain.strokes.length > 0 && (
              <button type="button" className="button secondary" onClick={() => onChange({ ...pain, strokes: pain.strokes.slice(0, -1) })}>
                {t('pain.undo')}
              </button>
            )}
            <button type="button" className="button secondary" onClick={() => onChange(EMPTY_PAIN)}>
              {t('pain.clear')}
            </button>
          </div>
        </div>
      )}
      <p className="muted">{t('pain.private')}</p>
    </section>
  )
}
