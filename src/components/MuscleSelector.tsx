import { useState } from 'react'
import Body from 'react-muscle-highlighter'
import { FIGURE, partKey } from '../orbit/display'
import {
  INTENSITY_COLORS,
  muscleHighlights,
  musclesOf,
  NOT_MUSCLES,
  toHerSide,
  toggleMuscle,
  type BodyView,
  type MuscleMark,
  type PainDay,
} from '../orbit/pain'
import { useI18n } from '../i18n/context'

interface Props {
  view: BodyView
  intensity: number
  pain: PainDay
  onChange: (pain: PainDay) => void
}

/** She is sure the pain is muscular: she taps the muscle (and side) on the figure, or picks it from the list. */
export function MuscleSelector({ view, intensity, pain, onChange }: Props) {
  const { t } = useI18n()
  const [note, setNote] = useState('')
  const marked = (slug: MuscleMark['slug']) => pain.muscles.some((m) => m.slug === slug && m.view === view)

  // The list picks the whole muscle (both sides); tapping again removes every mark of that muscle.
  const toggleWhole = (slug: MuscleMark['slug']) => {
    setNote('')
    onChange(
      marked(slug)
        ? { ...pain, muscles: pain.muscles.filter((m) => !(m.slug === slug && m.view === view)) }
        : { ...pain, muscles: [...pain.muscles, { slug, view, intensity }] },
    )
  }

  return (
    <div className="pain-mode">
      <p className="muted">{t('pain.tapMuscle')}</p>
      <div className="pain-figure">
        <Body
          gender="female"
          side={view}
          scale={1.3}
          data={muscleHighlights(pain.muscles, view)}
          colors={INTENSITY_COLORS}
          defaultFill={FIGURE.fill}
          border={FIGURE.border}
          onBodyPartPress={(part, viewerSide) => {
            if (!part.slug) return
            if (NOT_MUSCLES.includes(part.slug)) {
              setNote(t('pain.notMuscle', { part: t(partKey(part.slug)) }))
              return
            }
            setNote('')
            const side = viewerSide ? toHerSide(viewerSide, view) : undefined
            onChange(toggleMuscle(pain, { slug: part.slug, side, view, intensity }))
          }}
        />
      </div>
      {note && <p role="status">{note}</p>}
      <div className="actions part-list" role="group" aria-label={t('pain.muscles')}>
        {musclesOf(view).map((slug) => (
          <button key={slug} type="button" className="button secondary" aria-pressed={marked(slug)} onClick={() => toggleWhole(slug)}>
            {t(partKey(slug))}
          </button>
        ))}
      </div>
    </div>
  )
}
