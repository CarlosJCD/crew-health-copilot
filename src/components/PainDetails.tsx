import { contextLabel, qualityLabel } from '../orbit/display'
import {
  CONTEXTS,
  COURSE,
  INTENSITY,
  intensityColor,
  MAX_QUALITIES,
  QUALITIES,
  STARTED,
  verbalLabel,
  WORSE,
  type PainDetailsValue,
} from '../orbit/pain'
import { useI18n } from '../i18n/context'

interface Props {
  value: PainDetailsValue
  /** Each change starts from the latest value, so quick taps never undo each other. */
  onChange: (update: (value: PainDetailsValue) => PainDetailsValue) => void
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

/** Steps 2 to 6 of Psychology's report flow: what it feels like, how strong, when, what was happening, mechanics. */
export function PainDetails({ value, onChange }: Props) {
  const { t, lang } = useI18n()
  const set = (patch: Partial<PainDetailsValue>) => onChange((v) => ({ ...v, ...patch }))
  const pick = (key: 'qualities' | 'contexts', id: string, max = Infinity) =>
    onChange((v) => (v[key].includes(id) || v[key].length < max ? { ...v, [key]: toggle(v[key], id) } : v))
  const full = value.qualities.length >= MAX_QUALITIES

  return (
    <div className="pain-details">
      <fieldset>
        <legend>{t('pain.feel', { n: MAX_QUALITIES })}</legend>
        <div className="actions part-list">
          {QUALITIES.map((q) => {
            const on = value.qualities.includes(q.id)
            return (
              <button
                key={q.id}
                type="button"
                className="button secondary"
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => pick('qualities', q.id, MAX_QUALITIES)}
              >
                {qualityLabel(q.id, lang)}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend>
          <label htmlFor="pain-strength" className="pain-intensity">
            <span className="swatch" style={{ background: value.intensity ? intensityColor(value.intensity) : 'transparent' }} aria-hidden="true" />
            {t('pain.strength', { n: value.intensity, label: t(`pain.level.${verbalLabel(value.intensity)}`) })}
          </label>
        </legend>
        <input
          id="pain-strength"
          type="range"
          min={INTENSITY.min}
          max={INTENSITY.max}
          value={value.intensity}
          onChange={(e) => set({ intensity: Number(e.target.value) })}
        />
        <p className="hint">{t('pain.anchors')}</p>
      </fieldset>

      <fieldset>
        <legend>{t('pain.started')}</legend>
        <div className="actions">
          {STARTED.map((s) => (
            <button key={s} type="button" className="button secondary" aria-pressed={value.started === s} onClick={() => set({ started: s })}>
              {t(`pain.started.${s}`)}
            </button>
          ))}
        </div>
        <p className="pain-sub">{t('pain.course')}</p>
        <div className="actions">
          {COURSE.map((c) => (
            <button key={c} type="button" className="button secondary" aria-pressed={value.course === c} onClick={() => set({ course: c })}>
              {t(`pain.course.${c}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>{t('pain.context')}</legend>
        <div className="actions part-list">
          {CONTEXTS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="button secondary"
              aria-pressed={value.contexts.includes(c.id)}
              onClick={() => pick('contexts', c.id)}
            >
              {contextLabel(c.id, lang)}
            </button>
          ))}
        </div>
        <p className="hint">{t('pain.contextPrivate')}</p>
      </fieldset>

      <fieldset>
        <legend>{t('pain.worse')}</legend>
        <div className="actions">
          {WORSE.map((w) => (
            <button key={w} type="button" className="button secondary" aria-pressed={value.worse === w} onClick={() => set({ worse: w })}>
              {t(`pain.worse.${w}`)}
            </button>
          ))}
        </div>
        <p className="hint">{t('pain.forCmo')}</p>
      </fieldset>
    </div>
  )
}
