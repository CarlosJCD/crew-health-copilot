import { useI18n } from '../i18n/context'
import type { ModuleInfo } from './registry'

/** Stand-in page for modules still being built. Replace per module. */
export function Placeholder({ module }: { module: ModuleInfo }) {
  const { t, tr } = useI18n()
  return (
    <section className="placeholder">
      <h2>{tr(module.label)}</h2>
      <p>{tr(module.summary)}</p>
      <h3>{t('placeholder.next')}</h3>
      <ul>
        {module.planned.map((p) => (
          <li key={p.en}>{tr(p)}</li>
        ))}
      </ul>
      <p className="owner">{t('placeholder.owner', { owner: tr(module.owner) })}</p>
    </section>
  )
}
