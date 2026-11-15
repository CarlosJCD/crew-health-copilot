import Body, { type ExtendedBodyPart } from 'react-muscle-highlighter'
import { FIGURE, partKey, regionLabel } from '../orbit/display'
import { MARK_COLOR, muscleHighlights, toHerSide, toViewerSide, VIEW_PARTS, zoneOf, type BodySide, type BodyView, type MuscleMark, type PaintStroke, type Slug } from '../orbit/pain'
import { FIGURE_ASPECT, useFigure } from '../lib/figure'
import { useI18n } from '../i18n/context'
import type { StringKey } from '../i18n/strings'

interface Props {
  /** Zones she tapped or picked (with her side when she tapped one side). */
  marks: MuscleMark[]
  onMarks: (marks: MuscleMark[]) => void
  /** What she painted on the home figure, if she came from there. */
  strokes: PaintStroke[]
  onStrokes: (strokes: PaintStroke[]) => void
  /** Eyes and skin: regions the figure does not draw. */
  extra: string[]
  onExtra: (extra: string[]) => void
  /** The home figure's colors for the current theme, so both bodies look the same. */
  fill?: string
  border?: string
}

/** The list, grouped as she would look for it. Eyes and skin have no place on the figure. */
const GROUPS: { label: StringKey; items: string[] }[] = [
  { label: 'pain.group.head', items: ['head', 'eyes', 'neck'] },
  { label: 'pain.group.torso', items: ['chest', 'abs', 'obliques', 'trapezius', 'upper-back', 'lower-back'] },
  { label: 'pain.group.arms', items: ['deltoids', 'biceps', 'triceps', 'forearm', 'hands'] },
  { label: 'pain.group.legs', items: ['gluteal', 'adductors', 'quadriceps', 'hamstring', 'knees', 'tibialis', 'calves', 'ankles', 'feet'] },
  { label: 'pain.group.any', items: ['skin'] },
]
const OFF = new Set(['eyes', 'skin'])
const VIEWS: BodyView[] = ['front', 'back']

/**
 * Where it is: the body she knows from the home screen, front and back side by side, and the same places as
 * a list under it. Tapping the body or the list marks the same thing, and the body shows it. Tapping one side
 * of the body keeps her side; the list marks the whole zone.
 */
export function WherePicker({ marks, onMarks, strokes, onStrokes, extra, onExtra, fill = FIGURE.fill, border = FIGURE.border }: Props) {
  const { t, lang } = useI18n()
  const [figure] = useFigure()

  const painted = (slug: string) => strokes.some((s) => s.zones.includes(slug as Slug))
  const picked = (item: string) => (OFF.has(item) ? extra.includes(item) : marks.some((m) => m.slug === item) || painted(item))

  /** The list: on adds the whole zone (on the side of the body that has it), off removes it everywhere. */
  const toggleItem = (item: string) => {
    if (OFF.has(item)) {
      onExtra(extra.includes(item) ? extra.filter((x) => x !== item) : [...extra, item])
      return
    }
    const slug = item as Slug
    if (picked(item)) {
      onMarks(marks.filter((m) => m.slug !== slug))
      if (painted(item)) onStrokes(dropZone(strokes, slug))
      return
    }
    const view: BodyView = VIEW_PARTS.front.includes(slug) ? 'front' : 'back'
    onMarks([...marks, { slug, view }])
  }

  /** The body: a tap marks that zone on that side; tapping a marked zone again removes it. */
  const tap = (view: BodyView, part: ExtendedBodyPart, viewerSide?: BodySide) => {
    if (!part.slug) return
    const slug = zoneOf(part.slug)
    const side = viewerSide ? toHerSide(viewerSide, view) : undefined
    const hit = (m: MuscleMark) => m.slug === slug && m.view === view && (!m.side || !side || m.side === side)
    if (marks.some(hit)) onMarks(marks.filter((m) => !hit(m)))
    else if (painted(slug)) onStrokes(dropZone(strokes, slug))
    else onMarks([...marks, { slug, view, ...(side ? { side } : {}) }])
  }

  const highlights = (view: BodyView): ExtendedBodyPart[] => {
    const bySlug = new Map<string, ExtendedBodyPart>()
    for (const slug of VIEW_PARTS[view]) bySlug.set(slug, { slug, color: fill })
    for (const s of strokes.filter((s) => s.view === view)) {
      for (const z of s.zones) {
        const sides = new Set((s.parts ?? []).filter((p) => p.zone === z).map((p) => p.side))
        const one = sides.size === 1 && !sides.has(undefined) ? [...sides][0] : undefined
        bySlug.set(z, { slug: z, color: MARK_COLOR, ...(one ? { side: toViewerSide(one, view) } : {}) })
      }
    }
    for (const h of muscleHighlights(marks, view, MARK_COLOR)) bySlug.set(h.slug, h)
    return [...bySlug.values()]
  }

  return (
    <div className="where">
      <div className="where-figures" aria-hidden="true">
        {VIEWS.map((view) => (
          <figure key={view} className="where-figure">
            <div className="where-body" style={{ aspectRatio: FIGURE_ASPECT[figure][view] }}>
              <Body
                gender={figure}
                side={view}
                scale={1.6}
                data={highlights(view)}
                defaultFill={fill}
                border={border}
                onBodyPartPress={(part, viewerSide) => tap(view, part, viewerSide)}
              />
            </div>
            <figcaption>{t(view === 'front' ? 'pain.front' : 'pain.back')}</figcaption>
          </figure>
        ))}
      </div>

      <div className="where-list">
        {GROUPS.map((g) => (
          <div key={g.label} className="where-group" role="group" aria-label={t(g.label)}>
            <h4>{t(g.label)}</h4>
            <div className="where-chips">
              {g.items.map((item) => (
                <button key={item} type="button" className="where-chip" aria-pressed={picked(item)} onClick={() => toggleItem(item)}>
                  {OFF.has(item) ? regionLabel(item, lang) : t(partKey(item as Slug))}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Painted strokes without one zone (a stroke with no zone left goes). */
function dropZone(strokes: PaintStroke[], slug: Slug): PaintStroke[] {
  return strokes
    .map((s) => (s.zones.includes(slug) ? { ...s, zones: s.zones.filter((z) => z !== slug), parts: s.parts?.filter((p) => p.zone !== slug) } : s))
    .filter((s) => s.zones.length > 0)
}
