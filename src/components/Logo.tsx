// Concept A, "domain ring": three arcs for ORBIT's three domains (body, mind, crew) and a pulse
// crossing the ring like a trajectory. Original mark, not derived from any NASA insignia. Drawn with
// assistance from Claude (Anthropic); see README, "Use of SI". The arcs follow the text color; the pulse
// uses --brand-red, the only place red appears outside "Act".

const ARCS = [
  'M23.792 9.447A24 24 0 0 1 55.635 27.832', // body (top)
  'M55.635 36.168A24 24 0 0 1 23.792 54.553', // mind (bottom right)
  'M16.573 50.385A24 24 0 0 1 16.573 13.615', // crew (left)
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
