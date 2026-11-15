import type { Baseline } from '../lib/status'
import { missionDayCode } from '../lib/missionDay'

interface Props {
  values: { day: number; value: number }[]
  baseline?: Baseline
  currentDay: number
  ariaLabel: string
  /** Compact version for list rows: no band, no axis. */
  mini?: boolean
}

const W = 160
const H = 40
const PAD = 3

/** Tiny dependency-free trend line with the personal baseline band (mean ± 1 SD) and a day axis. */
export function Sparkline({ values, baseline, currentDay, ariaLabel, mini = false }: Props) {
  if (values.length < 2) return null
  const days = values.map((p) => p.day)
  const nums = values.map((p) => p.value)
  if (baseline && !mini) nums.push(baseline.mean + baseline.sd, baseline.mean - baseline.sd)
  const minX = Math.min(...days)
  const maxX = Math.max(...days)
  const minY = Math.min(...nums)
  const maxY = Math.max(...nums)
  const x = (d: number) => PAD + ((d - minX) / (maxX - minX || 1)) * (W - 2 * PAD)
  const y = (v: number) => H - PAD - ((v - minY) / (maxY - minY || 1)) * (H - 2 * PAD)
  const path = values.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.value).toFixed(1)}`).join('')
  const current = values.find((p) => p.day === currentDay)
  const showLaunch = minX < 0 && maxX >= 0

  const svg = (
    <svg
      className={mini ? 'sparkline mini' : 'sparkline'}
      viewBox={`0 0 ${W} ${H}`}
      role={mini ? undefined : 'img'}
      aria-label={mini ? undefined : ariaLabel}
      aria-hidden={mini ? true : undefined}
    >
      {baseline && !mini && (
        <rect
          className="sparkline-band"
          x={PAD}
          width={W - 2 * PAD}
          y={y(baseline.mean + baseline.sd)}
          height={Math.max(1, y(baseline.mean - baseline.sd) - y(baseline.mean + baseline.sd))}
        />
      )}
      {showLaunch && !mini && <line className="sparkline-launch" x1={x(0)} x2={x(0)} y1={0} y2={H} />}
      <path className="sparkline-line" d={path} />
      {current && <circle className="sparkline-dot" cx={x(current.day)} cy={y(current.value)} r={mini ? 6 : 3.4} />}
    </svg>
  )
  if (mini) return svg

  const launchPct = (x(0) / W) * 100
  return (
    <div className="spark">
      {svg}
      <div className="spark-axis" aria-hidden="true">
        <span className="first">{missionDayCode(minX)}</span>
        {showLaunch && launchPct > 14 && launchPct < 80 && (
          <span className="launch" style={{ left: `${launchPct}%` }}>
            L
          </span>
        )}
        <span className="last">{missionDayCode(maxX)}</span>
      </div>
    </div>
  )
}
