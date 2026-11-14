import type { Baseline } from '../lib/status'

interface Props {
  values: { day: number; value: number }[]
  baseline?: Baseline
  currentDay: number
  label: string
}

const W = 160
const H = 40
const PAD = 3

/** Tiny dependency-free trend line with the personal baseline band (mean ± 1 SD) shaded. */
export function Sparkline({ values, baseline, currentDay, label }: Props) {
  if (values.length < 2) return null
  const days = values.map((p) => p.day)
  const nums = values.map((p) => p.value)
  if (baseline) nums.push(baseline.mean + baseline.sd, baseline.mean - baseline.sd)
  const minX = Math.min(...days)
  const maxX = Math.max(...days)
  const minY = Math.min(...nums)
  const maxY = Math.max(...nums)
  const x = (d: number) => PAD + ((d - minX) / (maxX - minX || 1)) * (W - 2 * PAD)
  const y = (v: number) => H - PAD - ((v - minY) / (maxY - minY || 1)) * (H - 2 * PAD)
  const path = values.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.value).toFixed(1)}`).join('')
  const current = values.find((p) => p.day === currentDay)

  return (
    <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} trend`}>
      {baseline && (
        <rect
          className="sparkline-band"
          x={PAD}
          width={W - 2 * PAD}
          y={y(baseline.mean + baseline.sd)}
          height={Math.max(1, y(baseline.mean - baseline.sd) - y(baseline.mean + baseline.sd))}
        />
      )}
      <line className="sparkline-launch" x1={x(0)} x2={x(0)} y1={0} y2={H} />
      <path className="sparkline-line" d={path} />
      {current && <circle className="sparkline-dot" cx={x(current.day)} cy={y(current.value)} r={3} />}
    </svg>
  )
}
