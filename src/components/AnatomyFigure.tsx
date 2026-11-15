import type { KeyboardEvent } from 'react'
import type { Color } from '../orbit/config'
import { getRegion, type RegionId, type View } from '../orbit/regions'
import { useI18n } from '../i18n/context'
import { ANATOMY, anchor, type Shape } from './anatomy'

export type Layer = 'status' | 'bone' | 'fluid' | 'symptoms'

interface Props {
  view: View
  layer: Layer
  colors: Record<RegionId, Color>
  selected: RegionId
  onSelect: (id: RegionId) => void
  /** Days with a symptom per region (symptoms layer). */
  counts: Partial<Record<RegionId, number>>
}

function ShapeEl({ s }: { s: Shape }) {
  if ('e' in s) return <ellipse cx={s.e[0]} cy={s.e[1]} rx={s.e[2]} ry={s.e[3]} />
  if ('r' in s) return <rect x={s.r[0]} y={s.r[1]} width={s.r[2]} height={s.r[3]} rx={s.r[4]} />
  return <path d={s.p} />
}

/** Fluid-shift arrows for the fluids layer (context: fluids move toward the head). */
const ARROWS = [
  [40, 420, 300],
  [180, 420, 300],
  [40, 280, 160],
  [180, 280, 160],
].map(([x, y0, y1]) => `M${x},${y0} L${x},${y1} M${x - 5},${y1 + 7} L${x},${y1} L${x + 5},${y1 + 7}`)

/** One view of the body map. Every region is a button; the list next to it is the accessible equivalent. */
export function AnatomyFigure({ view, layer, colors, selected, onSelect, counts }: Props) {
  const { t, tr } = useI18n()
  const key = (id: RegionId) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(id)
    }
  }

  return (
    <svg viewBox="0 0 220 470" className={`anatomy layer-${layer}`} role="group" aria-label={t(view === 'front' ? 'body.front' : 'body.back')}>
      <defs>
        <pattern id={`hatch-${view}`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" className="hatch-line" />
        </pattern>
      </defs>
      {ANATOMY[view].map((part, i) => {
        if (!part.region) {
          return (
            <g key={`dec-${i}`} className="anat-dec" aria-hidden="true">
              {part.shapes.map((s, j) => (
                <ShapeEl key={j} s={s} />
              ))}
            </g>
          )
        }
        const region = getRegion(part.region)
        const id = part.region
        const c = colors[id]
        const cls = [
          'anat-r',
          `color-${c}`,
          region.muscle ? 'is-muscle' : '',
          `fluid-${region.fluid}`,
          counts[id] ? 'has-symptom' : '',
          selected === id ? 'selected' : '',
        ].join(' ')
        return (
          <g
            key={id}
            className={cls}
            role="button"
            tabIndex={0}
            aria-pressed={selected === id}
            aria-label={t('body.regionAria', { region: tr(region.label), color: t(`color.${c}`) })}
            onClick={() => onSelect(id)}
            onKeyDown={key(id)}
          >
            {part.shapes.map((s, j) => (
              <ShapeEl key={j} s={s} />
            ))}
            {layer === 'bone' && region.context.includes('bone') && (
              <g className="anat-hatch" fill={`url(#hatch-${view})`} aria-hidden="true">
                {part.shapes.map((s, j) => (
                  <ShapeEl key={j} s={s} />
                ))}
              </g>
            )}
          </g>
        )
      })}
      {layer === 'fluid' && ARROWS.map((d) => <path key={d} className="anat-arrow" d={d} aria-hidden="true" />)}
      {layer === 'symptoms' &&
        (Object.entries(counts) as [RegionId, number][]).map(([id, n]) => {
          const at = getRegion(id).views.includes(view) ? anchor(view, id) : undefined
          return (
            at && (
              <g key={id} className="anat-pin" aria-hidden="true">
                <circle cx={at[0]} cy={at[1]} r="8" />
                <text x={at[0]} y={at[1] + 3.5}>
                  {n}
                </text>
              </g>
            )
          )
        })}
      <text x="110" y="466" className="anat-cap" aria-hidden="true">
        {t(view === 'front' ? 'body.front' : 'body.back').toUpperCase()}
      </text>
    </svg>
  )
}
