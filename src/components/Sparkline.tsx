import { missionDayCode } from '../lib/missionDay'

interface Props {
  values: { day: number; value: number }[]
  /** Personal baseline band: mean ± spread. */
  band?: { mean: number; spread: number }
  currentDay: number
  ariaLabel: string
}

const W = 160
const H = 40
const PAD = 3

/** Tiny dependency-free trend line with the personal baseline band shaded. */
export function Sparkline({ values, band, currentDay, ariaLabel }: Props) {
  if (values.length < 2) return null
  const days = values.map((p) => p.day)
  const nums = values.map((p) => p.value)
  if (band) nums.push(band.mean + band.spread, band.mean - band.spread)
  const minX = Math.min(...days)
  const maxX = Math.max(...days)
  const minY = Math.min(...nums)
  const maxY = Math.max(...nums)
  const x = (d: number) => PAD + ((d - minX) / (maxX - minX || 1)) * (W - 2 * PAD)
  const y = (v: number) => H - PAD - ((v - minY) / (maxY - minY || 1)) * (H - 2 * PAD)
  const path = values.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.value).toFixed(1)}`).join('')
  const current = values.find((p) => p.day === currentDay)

  return (
    <div className="spark">
    <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      {band && (
        <rect
          className="sparkline-band"
          x={PAD}
          width={W - 2 * PAD}
          y={y(band.mean + band.spread)}
          height={Math.max(1, y(band.mean - band.spread) - y(band.mean + band.spread))}
        />
      )}
      <path className="sparkline-line" d={path} />
      {current && <circle className="sparkline-dot" cx={x(current.day)} cy={y(current.value)} r={3.4} />}
    </svg>
      <div className="spark-axis" aria-hidden="true">
        <span className="first">{missionDayCode(minX)}</span>
        <span className="last">{missionDayCode(maxX)}</span>
      </div>
    </div>
  )
}
