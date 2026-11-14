import { describe, expect, it } from 'vitest'
import { KNOWLEDGE, KNOWLEDGE_ERRORS, parseKnowledge } from './knowledge'
import { KNOWLEDGE_EN } from './knowledge.en'
import { INDICATORS, UNMODELED_INDICATORS } from './indicators'
import { SCENARIOS } from './scenarios'

// Guards the data team's catalog (src/data/knowledge.json). When one of these fails after
// replacing the file, the message says what to fix and where.

describe('knowledge.json', () => {
  it('fits the contract the app reads', () => {
    expect(KNOWLEDGE_ERRORS).toEqual([])
  })

  it('has an app model entry (domain, hazards, explainer) for every indicator: see indicators.ts', () => {
    expect(UNMODELED_INDICATORS).toEqual([])
    expect(INDICATORS.length).toBe(KNOWLEDGE.indicators.length)
  })

  it('has an English translation for every catalog text the app shows: see knowledge.en.ts', () => {
    const shown = [
      ...KNOWLEDGE.indicators.flatMap((i) => [i.name, i.how_measured, i.frequency]),
      ...KNOWLEDGE.categories.map((c) => c.category),
    ].filter(Boolean)
    expect(shown.filter((es) => !(es in KNOWLEDGE_EN))).toEqual([])
  })

  it('resolves every source code it cites', () => {
    const codes = new Set(KNOWLEDGE.sources.map((s) => s.code))
    const cited = KNOWLEDGE.categories.map((c) => c.source)
    expect(cited.filter((c) => !codes.has(c))).toEqual([])
  })

  it('gives a delay for every app scenario', () => {
    for (const s of SCENARIOS) expect(s.oneWayDelay.en, s.id).not.toBe('')
    expect(SCENARIOS.find((s) => s.id === 'mars-transit')?.worstRoundTripMin).toBeCloseTo(44.6, 1)
  })
})

describe('parseKnowledge', () => {
  it('drops entries that break the contract and says why', () => {
    const { knowledge, errors } = parseKnowledge({
      indicators: [{ id: 'x', name: 'X', unit: 'u', direction: 'up', evaluate_on: 'valor' }],
      clinical_categories: [
        { indicator: 'nope', order: 1, category: 'A', status: 'verde', min: null, max: 1, confirm_n: 1 },
      ],
      sources: [],
      physics: {},
    })
    expect(knowledge.indicators).toEqual([])
    expect(errors.join('\n')).toMatch(/direction/)
  })

  it('reports overlapping categories', () => {
    const ind = {
      id: 'x', name: 'X', unit: 'u', direction: 'both', evaluate_on: 'valor', how_measured: '', sources: '',
      sd_floor: 1, plausible_min: 0, plausible_max: 10, smooth_n: 1, confirm_n: 1, expected_inflight_shift: null,
    }
    const cat = (min: number | null, max: number | null) =>
      ({ indicator: 'x', order: 1, category: `${min}-${max}`, status: 'verde', min, max, confirm_n: 1 })
    const { errors } = parseKnowledge({ indicators: [ind], clinical_categories: [cat(null, 5), cat(4, null)], sources: [] })
    expect(errors.join('\n')).toMatch(/overlap/)
  })
})
