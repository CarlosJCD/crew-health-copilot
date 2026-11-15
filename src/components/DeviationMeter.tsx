import type { IndicatorDef } from '../data/types'
import { useI18n } from '../i18n/context'

interface Props {
  /** SDs from the person's (expected) normal. */
  z: number
  cutoffs: IndicatorDef['baselineSd']
  worseWhen: IndicatorDef['worseWhen']
}

/**
 * Where today sits against the person's own normal: centre = normal, amber from the Watch cut-off,
 * red from the Act cut-off, only on the side(s) where a change is a concern. Shows "2.8 SD" without
 * asking the reader to know what an SD is.
 */
export function DeviationMeter({ z, cutoffs, worseWhen }: Props) {
  const { t, num } = useI18n()
  const span = Math.max(3, cutoffs.act + 0.5)
  const pos = (v: number) => ((Math.max(-span, Math.min(span, v)) + span) / (2 * span)) * 100
  const sides = worseWhen === 'both' ? [1, -1] : worseWhen === 'high' ? [1] : [-1]
  const zones = sides.flatMap((s) => [
    { kind: 'watch', from: s * cutoffs.watch, to: s * cutoffs.act },
    { kind: 'act', from: s * cutoffs.act, to: s * span },
  ])
  const label = t('meter.aria', {
    z: num(Math.abs(z), 1),
    dir: t(z >= 0 ? 'meter.above' : 'meter.below'),
    watch: num(cutoffs.watch, 1),
    act: num(cutoffs.act, 1),
  })
  return (
    <div className="meter" role="img" aria-label={label}>
      <div className="meter-track">
        {zones.map((zone) => {
          const a = pos(Math.min(zone.from, zone.to))
          const b = pos(Math.max(zone.from, zone.to))
          return <span key={`${zone.kind}${zone.from}`} className={`meter-zone ${zone.kind}`} style={{ left: `${a}%`, width: `${b - a}%` }} />
        })}
      </div>
      <span className="meter-mid" />
      <span className="meter-mark" style={{ left: `${pos(z)}%` }} />
      <span className="meter-label" aria-hidden="true">
        {t('meter.label')}
      </span>
    </div>
  )
}
