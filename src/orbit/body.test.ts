import { describe, expect, it } from 'vitest'
import { applySymptoms, FIXED_SYMPTOMS, isRedFlag, SYSTEMS, systemColor, systemRisks } from './body'
import { RULES } from './config'
import { BUILT_IN_DEMO } from './demoData'
import { evaluateDay } from './engine'

const system = (id: string) => SYSTEMS.find((s) => s.id === id)!

describe('body systems', () => {
  it('are the six of the product structure and use only indicators of the rules file', () => {
    expect(SYSTEMS.map((s) => s.id)).toEqual(['brain', 'eyes', 'heart', 'musculoskeletal', 'immune', 'gut'])
    const ids = new Set(RULES.indicators.map((i) => i.id))
    for (const s of SYSTEMS) for (const id of s.indicators) expect(ids.has(id), `${s.id}: ${id}`).toBe(true)
  })

  it('use the fixed vocabulary of the rules file: 15 buttons, every system has some, 5 alarm signs', () => {
    expect(FIXED_SYMPTOMS).toHaveLength(15)
    for (const s of SYSTEMS) expect(s.symptoms.length, s.id).toBeGreaterThan(0)
    expect(SYSTEMS.flatMap((s) => s.symptoms).sort()).toEqual([...FIXED_SYMPTOMS].sort())
    expect(FIXED_SYMPTOMS.filter(isRedFlag).sort()).toEqual(['chest pain', 'fainting', 'severe headache', 'shortness of breath', 'vision change'])
    expect(isRedFlag('dizziness')).toBe(false)
  })

  it('take their HRP risk from the indicators (eyes: SANS)', () => {
    expect(systemRisks(system('heart'))).toEqual(['Risk of Cardiovascular Adaptations'])
    expect(systemRisks(system('eyes'))[0]).toMatch(/SANS/)
  })

  it('color: day 124 heart is yellow (resting heart rate), eyes stay green', () => {
    const r = evaluateDay(BUILT_IN_DEMO, 124)
    expect(systemColor(system('heart'), r, [])).toBe('yellow')
    expect(systemColor(system('eyes'), r, [])).toBe('green')
  })
})

describe('logging a symptom on the body map', () => {
  it('adds it to the day so the engine sees it: an alarm sign turns the day red (physical)', () => {
    const data = applySymptoms(BUILT_IN_DEMO, { 121: ['vision change'] })
    const r = evaluateDay(data, 121)
    expect(r.state).toBe('RED_PHYSICAL')
    expect(systemColor(system('eyes'), r, ['vision change'])).toBe('red')
  })

  it('dizziness with a resting heart rate under 60 is red; on its own it is not an alarm', () => {
    const low = { ...BUILT_IN_DEMO, days: BUILT_IN_DEMO.days.map((d) => (d.day === 121 ? { ...d, hr: 55 } : d)) }
    expect(evaluateDay(applySymptoms(low, { 121: ['dizziness'] }), 121).indicators.hr.color).toBe('red')
    expect(evaluateDay(applySymptoms(BUILT_IN_DEMO, { 121: ['dizziness'] }), 121).indicators.symptoms.color).toBe('green')
  })

  it('leaves the data untouched when nothing was logged', () => {
    expect(applySymptoms(BUILT_IN_DEMO, {})).toBe(BUILT_IN_DEMO)
  })
})
