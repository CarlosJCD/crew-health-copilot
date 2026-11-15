import type { IndicatorDef } from '../data/types'
import type { I18n } from '../i18n/context'
import type { Evaluation } from '../lib/status'

export interface Change {
  /** ▲ above, ▼ below, = same as the reference. */
  dir: '▲' | '▼' | '='
  text: string
}

/**
 * One plain sentence comparing the value the rules looked at with the person's own normal, e.g.
 * "8 bpm above your normal (57)". Replaces "+8 vs your pre-flight normal (57) · 2.8 SD" on the card;
 * the SD stays in the details panel and in the deviation meter.
 */
export function describeChange(def: IndicatorDef, ev: Evaluation, day: number, { t, num, unit }: I18n): Change | undefined {
  const d = def.decimals ?? 0
  const u = unit(def.unit)
  if (def.evaluateOn === 'changePct' && ev.changePct !== undefined && ev.baseline) {
    const pct = Number(ev.changePct.toFixed(1))
    const mean = `${num(ev.baseline.mean, d)} ${u}`
    if (pct === 0) return { dir: '=', text: t('card.pctSame', { mean }) }
    return { dir: pct > 0 ? '▲' : '▼', text: t(pct > 0 ? 'card.pctAbove' : 'card.pctBelow', { pct: num(Math.abs(pct), 1), mean }) }
  }
  if (ev.observed === undefined || ev.expected === undefined) return undefined
  const diff = Number((ev.observed - ev.expected).toFixed(d))
  const shifted = day >= 0 && def.inflightShift !== 0
  const mean = num(ev.expected, d)
  // Scores like "/10" read better without the unit: "1.8 below your normal".
  const delta = u.startsWith('/') ? num(Math.abs(diff), d) : `${num(Math.abs(diff), d)} ${u}`
  const prefix = def.smoothN > 1 ? `${t('card.avgOf', { n: def.smoothN })} ` : ''
  if (diff === 0) return { dir: '=', text: prefix + t(shifted ? 'card.sameExpected' : 'card.same', { mean }) }
  const key = diff > 0 ? (shifted ? 'card.aboveExpected' : 'card.above') : shifted ? 'card.belowExpected' : 'card.below'
  return { dir: diff > 0 ? '▲' : '▼', text: prefix + t(key, { delta, mean }) }
}
