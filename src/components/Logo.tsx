// Concept A, "domain ring": four arcs for the app's four domains (body, mind, connection,
// protective habits) and a pulse crossing the ring like a trajectory. Original mark, not derived
// from any NASA insignia. Drawn with assistance from Claude (Anthropic); see README, "Use of SI".
// The arcs follow the text color; the pulse uses --brand-red, the only place red appears outside "Act".

const ARCS = [
  'M8.524 27.010A24 24 0 0 1 27.010 8.524', // body (top left)
  'M36.990 8.524A24 24 0 0 1 55.476 27.010', // mind (top right)
  'M55.476 36.990A24 24 0 0 1 36.990 55.476', // connection (bottom right)
  'M27.010 55.476A24 24 0 0 1 8.524 36.990', // protective habits (bottom left)
]
const PULSE = 'M3 32H20L24.5 23.5L30 42L35.5 16L40 32H61'

export function Logo({ title }: { title?: string }) {
  return (
    <svg
      className="logo"
      viewBox="0 0 64 64"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g fill="none" strokeWidth={6}>
        {ARCS.map((d) => (
          <path key={d} className="logo-arc" d={d} />
        ))}
      </g>
      <path className="logo-pulse" d={PULSE} fill="none" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
