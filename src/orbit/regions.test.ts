import { describe, expect, it } from 'vitest'
import { applySymptoms, FIXED_SYMPTOMS, SYSTEMS, VOCABULARY } from './body'
import { BUILT_IN_DEMO } from './demoData'
import { evaluateDay } from './engine'
import { getRegion, loggedIn, logInRegion, placesOf, REGIONS, regionColor, regionsForSymptom, symptomDays, unlogInRegion } from './regions'

const SYSTEM_VOCAB: Record<string, string> = {
  brain: 'brain_mood',
  eyes: 'eyes',
  heart: 'heart_vessels',
  musculoskeletal: 'bone_muscle',
  immune: 'immune_skin',
  gut: 'gut',
}

describe('body regions', () => {
  it('are 17, unique, translated, and every one is drawn in at least one view', () => {
    expect(REGIONS).toHaveLength(17)
    expect(new Set(REGIONS.map((g) => g.id)).size).toBe(17)
    for (const g of REGIONS) {
      expect(g.label.en && g.label.es, g.id).toBeTruthy()
      expect(g.views.length, g.id).toBeGreaterThan(0)
    }
  })

  it('only use the six systems, and only offer symptoms of those systems', () => {
    const ids = new Set(SYSTEMS.map((s) => s.id))
    for (const g of REGIONS) {
      for (const s of g.systems) expect(ids.has(s), `${g.id}: ${s}`).toBe(true)
      const allowed = VOCABULARY.filter((v) => g.systems.some((s) => SYSTEM_VOCAB[s] === v.system)).map((v) => v.text)
      for (const s of g.symptoms) expect(allowed, `${g.id}: ${s}`).toContain(s)
    }
  })

  it('keep every one of the 15 fixed symptoms reachable', () => {
    for (const s of FIXED_SYMPTOMS) expect(regionsForSymptom(s).length, s).toBeGreaterThan(0)
  })

  it('show the worst color of their systems, and no data where ORBIT has none', () => {
    const r = evaluateDay(BUILT_IN_DEMO, 124)
    expect(regionColor(getRegion('chest'), r, [])).toBe('yellow') // resting heart rate
    expect(regionColor(getRegion('eyes'), r, [])).toBe('green')
    expect(regionColor(getRegion('kidneys'), r, [])).toBe('none')
  })
})

describe('symptoms with a place', () => {
  it('a symptom with one possible region needs no tag; a shared one needs it', () => {
    expect(placesOf('chest pain', 121, {})).toEqual(['chest'])
    expect(placesOf('joint or muscle pain', 121, {})).toEqual([])
  })

  it('a button is pressed only when the symptom was logged that day in that region', () => {
    expect(loggedIn('chest pain', 'chest', 121, {}, {})).toBe(false) // nothing logged: no alarm shown
    const { log, places } = logInRegion('joint or muscle pain', 'calves', 121, {}, {})
    expect(loggedIn('joint or muscle pain', 'calves', 121, log, places)).toBe(true)
    expect(loggedIn('joint or muscle pain', 'thighs', 121, log, places)).toBe(false)
    expect(loggedIn('joint or muscle pain', 'calves', 122, log, places)).toBe(false)
  })

  it('logging in a region feeds the engine as before and remembers where', () => {
    const { log, places } = logInRegion('joint or muscle pain', 'calves', 121, {}, {})
    expect(log).toEqual({ 121: ['joint or muscle pain'] })
    expect(placesOf('joint or muscle pain', 121, places)).toEqual(['calves'])
    const data = applySymptoms(BUILT_IN_DEMO, log)
    expect(data.days.find((d) => d.day === 121)?.symptoms).toContain('joint or muscle pain')
  })

  it('removing it from the last region removes it from the day', () => {
    let s = logInRegion('skin rash', 'shins', 121, {}, {})
    s = logInRegion('skin rash', 'feet', 121, s.log, s.places)
    s = unlogInRegion('skin rash', 'shins', 121, s.log, s.places)
    expect(s.log[121]).toEqual(['skin rash'])
    s = unlogInRegion('skin rash', 'feet', 121, s.log, s.places)
    expect(s.log[121]).toEqual([])
  })

  it('counts days with a symptom per region over the last 7 days', () => {
    let s = logInRegion('back pain', 'lowerback', 122, {}, {})
    s = logInRegion('back pain', 'lowerback', 124, s.log, s.places)
    s = logInRegion('nausea', 'abdomen', 110, s.log, s.places) // outside the window
    const data = applySymptoms(BUILT_IN_DEMO, s.log)
    expect(symptomDays(data, s.places, 125)).toEqual({ lowerback: 2 })
  })
})
