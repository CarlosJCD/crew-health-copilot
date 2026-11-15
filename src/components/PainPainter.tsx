import { useEffect, useRef, useState, type PointerEvent } from 'react'
import Body, { type ExtendedBodyPart } from 'react-muscle-highlighter'
import { FIGURE, partKey } from '../orbit/display'
import type { DotHeat } from '../orbit/heat'
import { BRUSH, DAB_SPACING, MARK_COLOR, MAX_DOTS, MAX_STROKES, toHerSide, toViewerSide, VIEW_PARTS, zoneOf, type BodySide, type BodyView, type BrushSize, type PaintStroke, type Slug } from '../orbit/pain'
import { FIGURE_ASPECT, useFigure } from '../lib/figure'
import { useI18n } from '../i18n/context'

interface Props {
  view: BodyView
  size: BrushSize
  strokes: PaintStroke[]
  onChange: (strokes: PaintStroke[]) => void
}

const ALL_PARTS = new Set<string>([...VIEW_PARTS.front, ...VIEW_PARTS.back, 'hair'])
const round = (x: number) => Math.round(x * 1000) / 1000
/** Light fill under fresh paint, only on the painted half. */
const PAINT_FILL = 'rgba(124, 196, 255, 0.32)'
const onBody = (t: EventTarget | null): t is SVGPathElement => t instanceof SVGPathElement && ALL_PARTS.has(t.id)

/**
 * What the figure library should color for the new paint: whole zones chosen from the list, and a light
 * fill on the painted half of each painted zone (both halves only when she painted both).
 */
function paintHighlights(strokes: PaintStroke[], view: BodyView): ExtendedBodyPart[] {
  const whole = new Set<Slug>()
  const halves = new Map<Slug, Set<'left' | 'right' | 'both'>>()
  for (const s of strokes) {
    if (!s.dots.length) for (const z of s.zones) whole.add(z)
    else if (s.parts?.length) for (const p of s.parts) halves.set(p.zone, (halves.get(p.zone) ?? new Set()).add(p.side ? toViewerSide(p.side, view) : 'both'))
    else for (const z of s.zones) halves.set(z, (halves.get(z) ?? new Set()).add('both'))
  }
  const out: ExtendedBodyPart[] = []
  for (const [slug, sides] of halves) {
    if (whole.has(slug)) continue
    const one = sides.size === 1 && !sides.has('both') ? ([...sides][0] as 'left' | 'right') : undefined
    out.push({ slug, color: PAINT_FILL, ...(one ? { side: one } : {}) })
  }
  for (const slug of whole) out.push({ slug, color: MARK_COLOR })
  return out
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

/**
 * The figure she paints on with her finger, a pen or the mouse. Only paint on the body counts; ORBIT reads
 * the zone and the half (left or right) under each dab. While the finger is on the body the page does not scroll.
 */
export function PaintSurface({ view, size, strokes, onChange, scale = 1.3, className = 'pain-figure', label, base = [], baseDots = [], fill = FIGURE.fill, border = FIGURE.border }: SurfaceProps) {
  const [figure] = useFigure()
  const box = useRef<HTMLDivElement>(null)
  /** The stroke being drawn lives in a ref so fast pointer events never read a stale copy. */
  const live = useRef<{ stroke: PaintStroke; lifted: boolean } | null>(null)
  const [current, setCurrent] = useState<PaintStroke | null>(null)
  const mine = (s: PaintStroke) => s.view === view && (!s.dots.length || (s.figure ?? 'female') === figure)
  const shown = [...strokes, ...(current ? [current] : [])].filter(mine)

  // A touch that lands on the body paints instead of scrolling; the wheel does not scroll over the body either.
  useEffect(() => {
    const el = box.current
    if (!el) return
    const touchStart = (e: TouchEvent) => {
      if (onBody(e.target)) e.preventDefault()
    }
    const touchMove = (e: TouchEvent) => {
      if (live.current) e.preventDefault()
    }
    const wheel = (e: WheelEvent) => {
      if (onBody(e.target) || live.current) e.preventDefault()
    }
    el.addEventListener('touchstart', touchStart, { passive: false })
    el.addEventListener('touchmove', touchMove, { passive: false })
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('touchstart', touchStart)
      el.removeEventListener('touchmove', touchMove)
      el.removeEventListener('wheel', wheel)
    }
  }, [])

  // The library names its drawing after the model ("female-body-front"); the box carries the real label.
  useEffect(() => {
    box.current?.querySelector('svg')?.setAttribute('aria-hidden', 'true')
  })

  /** Her side of a body path: the figure draws each two-sided zone as a left and a right path. */
  const sideOf = (path: SVGPathElement): BodySide | undefined => {
    const same = [...box.current!.querySelectorAll<SVGPathElement>(`path[id="${path.id}"]`)]
    if (same.length < 2) return undefined
    const mid = (r: DOMRect) => (r.left + r.right) / 2
    const centers = same.map((p) => mid(p.getBoundingClientRect()))
    const axis = (Math.min(...centers) + Math.max(...centers)) / 2
    const c = mid(path.getBoundingClientRect())
    if (Math.abs(c - axis) < 2) return undefined
    return toHerSide(c < axis ? 'left' : 'right', view)
  }
  /** Zone and half of the figure under the pointer (the paint layer ignores the pointer). */
  const partAt = (x: number, y: number) => {
    for (const el of document.elementsFromPoint(x, y)) {
      if (box.current?.contains(el) && onBody(el)) return { zone: zoneOf(el.id as Slug), side: sideOf(el) }
    }
    return undefined
  }
  const where = (x: number, y: number): [number, number] => {
    const r = box.current!.getBoundingClientRect()
    return [round((x - r.left) / r.width), round((y - r.top) / r.height)]
  }
  const addPart = (s: PaintStroke, p: { zone: Slug; side?: BodySide }) => {
    if (!s.zones.includes(p.zone)) s.zones = [...s.zones, p.zone]
    const parts = s.parts ?? []
    if (!parts.some((q) => q.zone === p.zone && q.side === p.side)) s.parts = [...parts, p]
  }

  const start = (e: PointerEvent<HTMLDivElement>) => {
    let p = partAt(e.clientX, e.clientY)
    // On the thin line between two muscles: take the nearest part within half a brush.
    if (!p) {
      const r = (box.current!.getBoundingClientRect().width * BRUSH[size]) / 2
      search: for (const k of [0.5, 1]) {
        for (let a = 0; a < 8; a++) {
          p = partAt(e.clientX + Math.cos((a * Math.PI) / 4) * r * k, e.clientY + Math.sin((a * Math.PI) / 4) * r * k)
          if (p) break search
        }
      }
    }
    if (!p || strokes.length >= MAX_STROKES) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const stroke: PaintStroke = { id: `${Math.round(e.timeStamp)}-${strokes.length}`, view, size, figure, dots: [where(e.clientX, e.clientY)], zones: [], parts: [] }
    addPart(stroke, p)
    live.current = { stroke, lifted: false }
    setCurrent({ ...stroke })
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const l = live.current
    if (!l) return
    const step = BRUSH[size] * DAB_SPACING
    const events = e.nativeEvent.getCoalescedEvents?.() ?? []
    let changed = false
    for (const ev of events.length ? events : [e.nativeEvent]) {
      if (l.stroke.dots.length >= MAX_DOTS) break
      const p = partAt(ev.clientX, ev.clientY)
      // Off the body: lift the brush, and start again where she comes back on.
      if (!p) {
        l.lifted = true
        continue
      }
      const [x, y] = where(ev.clientX, ev.clientY)
      const [lx, ly] = l.stroke.dots.at(-1)!
      const dist = Math.hypot(x - lx, y - ly)
      if (dist < step) continue
      // Crossing the thin gaps between muscles keeps the line; a real jump off the body starts a new one.
      if (l.lifted && dist < BRUSH[size] * 1.5) l.lifted = false
      const n = l.lifted ? 1 : Math.min(Math.floor(dist / step), MAX_DOTS - l.stroke.dots.length)
      const dots = l.stroke.dots.slice()
      for (let i = 1; i <= n; i++) dots.push([round(lx + ((x - lx) * i) / n), round(ly + ((y - ly) * i) / n)])
      if (l.lifted) dots[dots.length - 1] = [x, y]
      l.stroke.dots = dots
      l.lifted = false
      addPart(l.stroke, p)
      changed = true
    }
    if (changed) setCurrent({ ...l.stroke })
  }
  const end = () => {
    const l = live.current
    live.current = null
    if (l) onChange([...strokes, l.stroke])
    setCurrent(null)
  }

  // New paint goes on top of what is already there (same zone: the new paint wins).
  const bySlug = new Map<string, ExtendedBodyPart>()
  for (const p of [...base, ...paintHighlights(shown, view)]) bySlug.set(p.slug!, p)
  // The models carry their own grays for some parts (the male face is light): every part takes the figure's fill.
  for (const slug of VIEW_PARTS[view]) if (!bySlug.has(slug)) bySlug.set(slug, { slug, color: fill })

  return (
    <div
      ref={box}
      className={`${className} paintable`}
      style={{ aspectRatio: FIGURE_ASPECT[figure][view] }}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      role="img"
      aria-label={label}
    >
      <Body gender={figure} side={view} scale={scale} data={[...bySlug.values()]} defaultFill={fill} border={border} />
      <div className="paint-layer" aria-hidden="true">
        {baseDots
          .filter((d) => (d.figure ?? 'female') === figure)
          .map((d) => (
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
export function PainPainter({ view, size, strokes, onChange, brush = true }: Props & { brush?: boolean }) {
  const { t } = useI18n()
  const [picked, setZone] = useState<Slug>(VIEW_PARTS[view][0])
  const zone = VIEW_PARTS[view].includes(picked) ? picked : VIEW_PARTS[view][0]
  const paintWhole = () => {
    if (strokes.length >= MAX_STROKES) return
    onChange([...strokes, { id: `zone-${zone}-${strokes.length}`, view, size, dots: [], zones: [zone] }])
  }

  return (
    <div className="pain-mode">
      {brush && (
        <>
          <p className="muted">{t('pain.paintHint')}</p>
          <PaintSurface
            view={view}
            size={size}
            strokes={strokes}
            onChange={onChange}
            label={t('pain.figure', { view: t(view === 'front' ? 'pain.front' : 'pain.back') })}
          />
        </>
      )}
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
