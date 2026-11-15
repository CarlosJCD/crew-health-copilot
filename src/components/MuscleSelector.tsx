import { useState } from 'react'
import Body from 'react-muscle-highlighter'
import { FIGURE, partKey } from '../orbit/display'
import { MARK_COLOR, muscleHighlights, musclesOf, NOT_MUSCLES, toHerSide, toggleMuscle, type BodyView, type MuscleMark } from '../orbit/pain'
import { useI18n } from '../i18n/context'
import { useFigure } from '../lib/figure'

interface Props {
  view: BodyView
  marks: MuscleMark[]
  onChange: (marks: MuscleMark[]) => void
}

/** She can point to the exact spot: she taps the muscle (and side) on the figure, or picks it from the list. */
export function MuscleSelector({ view, marks, onChange }: Props) {
  const { t } = useI18n()
  const [figure] = useFigure()
  const [note, setNote] = useState('')
  const marked = (slug: MuscleMark['slug']) => marks.some((m) => m.slug === slug && m.view === view)

  // The list picks the whole muscle (both sides); picking it again removes every mark of that muscle here.
  const toggleWhole = (slug: MuscleMark['slug']) => {
    setNote('')
    onChange(marked(slug) ? marks.filter((m) => !(m.slug === slug && m.view === view)) : [...marks, { slug, view }])
  }

  return (
    <div className="pain-mode">
      <p className="muted">{t('pain.tapMuscle')}</p>
      <div className="pain-figure">
        <Body
          gender={figure}
          side={view}
          scale={1.3}
          data={muscleHighlights(marks, view, MARK_COLOR)}
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
            onChange(toggleMuscle(marks, { slug: part.slug, view, ...(side ? { side } : {}) }))
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
