import { useRef, useState, type PointerEvent } from 'react'
import Body, { type ExtendedBodyPart } from 'react-muscle-highlighter'
import { FIGURE, partKey } from '../orbit/display'
import type { DotHeat } from '../orbit/heat'
import { BRUSH, MARK_COLOR, MAX_DOTS, MAX_STROKES, VIEW_PARTS, zoneOf, type BodyView, type BrushSize, type PaintStroke, type Slug } from '../orbit/pain'
import { useI18n } from '../i18n/context'

interface Props {
  view: BodyView
  size: BrushSize
  strokes: PaintStroke[]
  onChange: (strokes: PaintStroke[]) => void
}

const ALL_PARTS = new Set<string>([...VIEW_PARTS.front, ...VIEW_PARTS.back, 'hair'])
const round = (x: number) => Math.round(x * 1000) / 1000

/** What the figure library should color: whole zones (chosen from the list) and an outline on painted zones. */
function zoneHighlights(strokes: PaintStroke[]): ExtendedBodyPart[] {
  const whole = new Set<Slug>()
  const outlined = new Set<Slug>()
  for (const s of strokes) for (const z of s.zones) (s.dots.length ? outlined : whole).add(z)
  return [...new Set([...whole, ...outlined])].map((slug) => ({
    slug,
    ...(whole.has(slug) ? { color: MARK_COLOR } : {}),
    ...(outlined.has(slug) ? { styles: { stroke: FIGURE.outline, strokeWidth: 5 } } : {}),
  }))
}

interface SurfaceProps {
  view: BodyView
  size: BrushSize
  strokes: PaintStroke[]
  onChange: (strokes: PaintStroke[]) => void
  scale?: number
  className?: string
  label: string
  /** What is already on the body under the new paint (the heat map on the home screen). */
  base?: ExtendedBodyPart[]
  baseDots?: (DotHeat & { color: string })[]
  fill?: string
  border?: string
}

/** The figure she paints on with her finger or the mouse. Only paint on the body counts; ORBIT reads the zone under each dab. */
export function PaintSurface({ view, size, strokes, onChange, scale = 1.3, className = 'pain-figure', label, base = [], baseDots = [], fill = FIGURE.fill, border = FIGURE.border }: SurfaceProps) {
  const box = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState<PaintStroke | null>(null)
  const shown = [...strokes, ...(current ? [current] : [])].filter((s) => s.view === view)

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
    if (!z || strokes.length >= MAX_STROKES) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setCurrent({ id: `${e.timeStamp}-${strokes.length}`, view, size, dots: [where(e)], zones: [z] })
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
    if (current) onChange([...strokes, current])
    setCurrent(null)
  }

  // New paint goes on top of what is already there (same zone: the new mark wins).
  const bySlug = new Map<string, ExtendedBodyPart>()
  for (const p of [...base, ...zoneHighlights(shown)]) bySlug.set(`${p.slug}-${p.side ?? ''}`, { ...bySlug.get(`${p.slug}-${p.side ?? ''}`), ...p })

  return (
    <div
      ref={box}
      className={`${className} paintable`}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label={label}
    >
      <Body gender="female" side={view} scale={scale} data={[...bySlug.values()]} defaultFill={fill} border={border} />
      <div className="paint-layer" aria-hidden="true">
        {baseDots.map((d) => (
          <span
            key={d.key}
            className="paint-dot"
            style={{
              left: `${d.x * 100}%`,
              top: `${d.y * 100}%`,
              width: `${BRUSH[d.size] * 100}%`,
              opacity: 0.35 + 0.6 * d.warmth,
              background: `radial-gradient(circle, ${d.color} 0 35%, transparent 70%)`,
            }}
          />
        ))}
        {shown.flatMap((s) =>
          s.dots.map(([x, y], i) => (
            <span
              key={`${s.id}-${i}`}
              className="paint-dot new"
              style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                width: `${BRUSH[s.size] * 100}%`,
                background: `radial-gradient(circle, ${MARK_COLOR} 0 35%, transparent 70%)`,
              }}
            />
          )),
        )}
      </div>
    </div>
  )
}

/**
 * She is not sure what hurts: she paints the area with her finger or the mouse.
 * Keyboard path: choose a zone and paint it whole.
 */
export function PainPainter({ view, size, strokes, onChange }: Props) {
  const { t } = useI18n()
  const [picked, setZone] = useState<Slug>(VIEW_PARTS[view][0])
  const zone = VIEW_PARTS[view].includes(picked) ? picked : VIEW_PARTS[view][0]
  const paintWhole = () => {
    if (strokes.length >= MAX_STROKES) return
    onChange([...strokes, { id: `zone-${zone}-${strokes.length}`, view, size, dots: [], zones: [zone] }])
  }

  return (
    <div className="pain-mode">
      <p className="muted">{t('pain.paintHint')}</p>
      <PaintSurface
        view={view}
        size={size}
        strokes={strokes}
        onChange={onChange}
        label={t('pain.figure', { view: t(view === 'front' ? 'pain.front' : 'pain.back') })}
      />
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
