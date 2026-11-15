import { describe, expect, it } from 'vitest'
import { KNOWLEDGE, KNOWLEDGE_ERRORS, parseKnowledge } from './knowledge'

// Guards the data team's reference catalog (src/data/knowledge.json). ORBIT reads its plausible
// ranges to check demo-data.json; alert colors come from orbit-indicators.json.

describe('knowledge.json', () => {
  it('fits the contract the app reads', () => {
    expect(KNOWLEDGE_ERRORS).toEqual([])
  })

  it('resolves every source code it cites', () => {
    const codes = new Set(KNOWLEDGE.sources.map((s) => s.code))
    expect(KNOWLEDGE.categories.map((c) => c.source).filter((c) => !codes.has(c))).toEqual([])
  })
})

describe('parseKnowledge', () => {
  it('drops entries that break the contract and says why', () => {
    const { knowledge, errors } = parseKnowledge({
      indicators: [{ id: 'x', name: 'X', unit: 'u', direction: 'up', evaluate_on: 'valor' }],
      clinical_categories: [],
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
