import { describe, expect, it } from 'vitest'
import { getIndicator } from '../data/indicators'
import type { I18n } from '../i18n/context'
import { DICTIONARIES, format, UNITS } from '../i18n/strings'
import { describeChange } from './describe'

const en: I18n = {
  lang: 'en',
  setLang: () => {},
  t: (key, vars) => format(DICTIONARIES.en[key], vars),
  tr: (v) => v.en,
  unit: (u) => UNITS.en[u] ?? u,
  num: (n, d = 0) => n.toFixed(d),
}
const def = (id: string) => getIndicator(id)!
const baseline = (mean: number) => ({ mean, sd: 3, n: 7 })

describe('describeChange', () => {
  it('says how far today is from the personal normal, with the unit', () => {
    const c = describeChange(def('hr'), { status: 'act', observed: 66, expected: 57, baseline: baseline(57) }, 14, en)
    expect(c).toEqual({ dir: '▲', text: '9 bpm above your normal (57)' })
  })

  it('names the smoothing window and drops "/10" units', () => {
    const mood = def('mood')
    const c = describeChange(mood, { status: 'watch', observed: 5.6, expected: 7.4, baseline: baseline(7.4) }, 14, en)
    expect(c?.text).toBe(`Average of last ${mood.smoothN}: 1.8 below your normal (7.4)`)
  })

  it('compares with the expected in-flight normal when the catalog shifts it', () => {
    const sbp = def('sbp')
    expect(sbp.inflightShift).not.toBe(0)
    const c = describeChange(sbp, { status: 'nominal', observed: 108, expected: 109, baseline: baseline(117) }, 14, en)
    expect(c?.text).toBe('1 mmHg below your expected in-flight normal (109)')
  })

  it('uses the % change for indicators evaluated on it', () => {
    const c = describeChange(def('body_mass'), { status: 'watch', changePct: -1.2, observed: 69.2, baseline: baseline(70) }, 14, en)
    expect(c).toEqual({ dir: '▼', text: '1.2% below pre-flight (70.0 kg)' })
  })

  it('says "same" when the rounded difference is zero, and nothing without a baseline', () => {
    expect(describeChange(def('spo2'), { status: 'nominal', observed: 98.2, expected: 98, baseline: baseline(98) }, 14, en)?.text).toBe(
      'Same as your normal (98)',
    )
    expect(describeChange(def('hr'), { status: 'no-data' }, 14, en)).toBeUndefined()
  })
})
