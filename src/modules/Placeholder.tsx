import type { ModuleInfo } from './registry'

/** Stand-in page for modules still being built. Replace per module. */
export function Placeholder({ module }: { module: ModuleInfo }) {
  return (
    <section className="placeholder">
      <h2>{module.label}</h2>
      <p>{module.summary}</p>
      <h3>Coming next</h3>
      <ul>
        {module.planned.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <p className="owner">Owner: {module.owner}</p>
    </section>
  )
}
