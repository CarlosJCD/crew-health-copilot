import { useRef, useState, type PointerEvent } from 'react'
import Body, { type ExtendedBodyPart } from 'react-muscle-highlighter'
import { FIGURE, partKey } from '../orbit/display'
import {
  BRUSH,
  intensityColor,
  MAX_DOTS,
  MAX_STROKES,
  VIEW_PARTS,
  zoneOf,
  type BodyView,
  type BrushSize,
  type PainDay,
  type PaintStroke,
  type Slug,
} from '../orbit/pain'
import { useI18n } from '../i18n/context'

interface Props {
  view: BodyView
  intensity: number
  size: BrushSize
  pain: PainDay
  onChange: (pain: PainDay) => void
}

const ALL_PARTS = new Set<string>([...VIEW_PARTS.front, ...VIEW_PARTS.back, 'hair'])
const round = (x: number) => Math.round(x * 1000) / 1000

/** What the figure library should color: whole zones (chosen from the list) and an outline on painted zones. */
function zoneHighlights(strokes: PaintStroke[]): ExtendedBodyPart[] {
  const whole = new Map<Slug, number>()
  const outlined = new Set<Slug>()
  for (const s of strokes) {
    for (const z of s.zones) {
      if (s.dots.length) outlined.add(z)
      else whole.set(z, Math.max(whole.get(z) ?? 0, s.intensity))
    }
  }
  return [...new Set([...whole.keys(), ...outlined])].map((slug) => ({
    slug,
    ...(whole.has(slug) ? { color: intensityColor(whole.get(slug)!) } : {}),
    ...(outlined.has(slug) ? { styles: { stroke: FIGURE.outline, strokeWidth: 5 } } : {}),
  }))
}

/**
 * She is not sure what hurts: she paints the area with her finger or the mouse. Only paint on the body
 * counts; ORBIT reads the zone under each dab. Keyboard path: choose a zone and paint it whole.
 */
export function PainPainter({ view, intensity, size, pain, onChange }: Props) {
  const { t } = useI18n()
  const box = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState<PaintStroke | null>(null)
  const [picked, setZone] = useState<Slug>(VIEW_PARTS[view][0])
  const zone = VIEW_PARTS[view].includes(picked) ? picked : VIEW_PARTS[view][0]
  const shown = [...pain.strokes, ...(current ? [current] : [])].filter((s) => s.view === view)

  /** Zone of the figure under the pointer (the paint layer ignores the pointer). */
  const zoneAt = (x: number, y: number): Slug | undefined => {
    for (const el of document.elementsFromPoint(x, y)) {
      if (box.current?.contains(el) && el instanceof SVGPathElement && ALL_PARTS.has(el.id)) return zoneOf(el.id as Slug)
    }
    return undefined
  }
  const where = (e: PointerEvent): [number, number] => {
    const r = box.current!.getBoundingClientRect()
    return [round((e.clientX - r.left) / r.width), round((e.clientY - r.top) / r.height)]
  }

  const start = (e: PointerEvent<HTMLDivElement>) => {
    const z = zoneAt(e.clientX, e.clientY)
    if (!z || pain.strokes.length >= MAX_STROKES) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setCurrent({ id: `${e.timeStamp}-${pain.strokes.length}`, view, intensity, size, dots: [where(e)], zones: [z] })
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!current || current.dots.length >= MAX_DOTS) return
    const p = where(e)
    const last = current.dots.at(-1)!
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < BRUSH[size] * 0.35) return
    const z = zoneAt(e.clientX, e.clientY)
    if (!z) return
    setCurrent({ ...current, dots: [...current.dots, p], zones: current.zones.includes(z) ? current.zones : [...current.zones, z] })
  }
  const end = () => {
    if (current) onChange({ ...pain, strokes: [...pain.strokes, current] })
    setCurrent(null)
  }
  const paintWhole = () => {
    if (pain.strokes.length >= MAX_STROKES) return
    onChange({ ...pain, strokes: [...pain.strokes, { id: `zone-${zone}-${pain.strokes.length}`, view, intensity, size, dots: [], zones: [zone] }] })
  }

  return (
    <div className="pain-mode">
      <p className="muted">{t('pain.paintHint')}</p>
      <div
        ref={box}
        className="pain-figure paintable"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        aria-label={t('pain.figure', { view: t(view === 'front' ? 'pain.front' : 'pain.back') })}
      >
        <Body gender="female" side={view} scale={1.3} data={zoneHighlights(shown)} defaultFill={FIGURE.fill} border={FIGURE.border} />
        <div className="paint-layer" aria-hidden="true">
          {shown.flatMap((s) =>
            s.dots.map(([x, y], i) => (
              <span
                key={`${s.id}-${i}`}
                className="paint-dot"
                style={{
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  width: `${BRUSH[s.size] * 100}%`,
                  background: `radial-gradient(circle, ${intensityColor(s.intensity)} 0 35%, transparent 70%)`,
                }}
              />
            )),
          )}
        </div>
      </div>
      <div className="actions">
        <label htmlFor="pain-zone">{t('pain.zone')}</label>
        <select id="pain-zone" value={zone} onChange={(e) => setZone(e.target.value as Slug)}>
          {VIEW_PARTS[view].map((slug) => (
            <option key={slug} value={slug}>
              {t(partKey(slug))}
            </option>
          ))}
        </select>
        <button type="button" className="button secondary" onClick={paintWhole}>
          {t('pain.paintZone')}
        </button>
      </div>
    </div>
  )
}
