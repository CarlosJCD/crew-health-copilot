import { describe, expect, it } from 'vitest'
import { SYSTEMS } from './body'
import { list } from './config'
import { BUILT_IN_DEMO } from './demoData'
import { evaluateDay } from './engine'
import {
  ALARM_CHECK,
  alarmCheckFor,
  alarmsInText,
  applyPain,
  CONTEXTS,
  EMPTY_PAIN,
  MAX_QUALITIES,
  nerveLike,
  OFF_FIGURE,
  painDay,
  painPacketLines,
  painSymptoms,
  painSystem,
  QUALITIES,
  REGIONS,
  regionOfZone,
  toggleMuscle,
  toHerSide,
  verbalLabel,
  VIEW_PARTS,
  whereOf,
  type PainDay,
  type PainEvent,
} from './pain'

const event = (patch: Partial<PainEvent>): PainEvent => ({
  id: 'e1',
  muscles: [],
  strokes: [],
  regions: ['lower_back'],
  qualities: ['aching'],
  intensity: 6,
  contexts: [],
  alarms: [],
  ...patch,
})
const day = (...events: PainEvent[]): PainDay => ({ events })

describe("pain-spec.json (Psychology's pain spec, read as is)", () => {
  it('has the regions, words and contexts the report flow uses', () => {
    expect(REGIONS).toHaveLength(14)
    expect(QUALITIES).toHaveLength(9)
    expect(CONTEXTS).toHaveLength(9)
    expect(MAX_QUALITIES).toBe(3)
    expect(CONTEXTS.find((c) => c.id === 'stress')?.domain).toBe('mind')
  })

  it('maps every region to one of the six body systems', () => {
    const keys = new Set(['brain_mood', 'eyes', 'heart_vessels', 'bone_muscle', 'immune_skin', 'gut'])
    for (const r of REGIONS) expect(keys.has(r.system), r.id).toBe(true)
    expect(SYSTEMS).toHaveLength(6)
  })

  it('maps every zone of the figure to a region of the spec; eyes and skin are off the figure', () => {
    const ids = new Set(REGIONS.map((r) => r.id))
    for (const view of ['front', 'back'] as const) for (const z of VIEW_PARTS[view]) expect(ids.has(regionOfZone(z, view)), z).toBe(true)
    for (const r of OFF_FIGURE) expect(ids.has(r)).toBe(true)
    expect(regionOfZone('deltoids', 'front')).toBe('shoulder')
    expect(regionOfZone('trapezius', 'front')).toBe('neck')
    expect(regionOfZone('trapezius', 'back')).toBe('upper_back')
    expect(regionOfZone('quadriceps', 'front')).toBe('leg')
    expect(regionOfZone('hair', 'back')).toBe('head')
  })

  it('asks only about alarm signs of orbit-indicators.json', () => {
    const flags = list('symptoms', 'red_flags')
    for (const words of Object.values(ALARM_CHECK)) for (const w of words) expect(flags).toContain(w)
    expect(alarmCheckFor(['lower_back'])).toEqual([])
    expect(alarmCheckFor(['head', 'eyes'])).toEqual(['severe headache', 'vision change'])
  })
})

describe('a pain report', () => {
  it('uses NRS 0 to 10 with the verbal label of the spec', () => {
    expect([0, 2, 5, 7, 10].map(verbalLabel)).toEqual(['none', 'mild', 'moderate', 'severe', 'severe'])
  })

  it('knows her side: from the front, the viewer left is her right', () => {
    expect(toHerSide('left', 'front')).toBe('right')
    expect(toHerSide('left', 'back')).toBe('left')
  })

  it('says where: regions and side, and no side for regions that have none', () => {
    const left = toggleMuscle([], { slug: 'biceps', side: 'left', view: 'front' })
    expect(whereOf(left, [], [])).toEqual({ regions: ['arm'], side: 'left' })
    const both = toggleMuscle(left, { slug: 'biceps', side: 'right', view: 'front' })
    expect(whereOf(both, [], []).side).toBe('both')
    expect(whereOf([], [{ id: 's', view: 'front', size: 'm', dots: [[0.5, 0.3]], zones: ['chest'] }], ['skin'])).toEqual({ regions: ['chest', 'skin'] })
    // Painted on one half only: that side, even when the dots sit near the middle of the figure.
    const knee = { id: 'k', view: 'front' as const, size: 'm' as const, dots: [[0.49, 0.7]] as [number, number][], zones: ['knees' as const], parts: [{ zone: 'knees' as const, side: 'right' as const }] }
    expect(whereOf([], [knee], [])).toEqual({ regions: ['leg'], side: 'right' })
    expect(toggleMuscle(left, left[0])).toEqual([])
  })

  it('shows the nerve note with 3 or more nerve-like words, never as an alarm', () => {
    expect(nerveLike(['tingling', 'numb', 'burning'])).toBe(true)
    expect(nerveLike(['tingling', 'numb', 'aching'])).toBe(false)
  })

  it('stands for one symptom per region, plus the alarm signs she confirmed', () => {
    expect(painSymptoms(day(event({}), event({ id: 'e2', regions: ['lower_back', 'hip'] })))).toEqual(['pain in lower back', 'pain in hip or pelvis'])
    expect(painSymptoms(day(event({ regions: ['chest'], alarms: ['chest pain'] })))).toEqual(['pain in chest', 'chest pain'])
    expect(painSymptoms(day(event({ intensity: 0 })))).toEqual([])
    expect(painSystem('pain in lower back')).toBe('bone_muscle')
    expect(painSystem('headache')).toBeUndefined()
  })

  it('reads an old or malformed day as empty', () => {
    expect(painDay({ muscles: [], strokes: [] })).toEqual(EMPTY_PAIN)
    expect(painDay(undefined)).toEqual(EMPTY_PAIN)
  })
})

describe('pain and the engine', () => {
  it('chest pain is red only if she confirms an alarm sign', () => {
    const quiet = applyPain(BUILT_IN_DEMO, { 23: day(event({ regions: ['chest'] })) })
    expect(evaluateDay(quiet, 23).state).not.toBe('RED_PHYSICAL')
    const alarm = applyPain(BUILT_IN_DEMO, { 23: day(event({ regions: ['chest'], alarms: ['chest pain'] })) })
    expect(evaluateDay(alarm, 23).state).toBe('RED_PHYSICAL')
  })

  it('a pain in the same region on 3 days in a row turns the symptoms rule yellow (more than 2 days)', () => {
    const d = day(event({}))
    expect(evaluateDay(applyPain(BUILT_IN_DEMO, { 23: d, 24: d }), 24).indicators.symptoms.color).toBe('green')
    expect(evaluateDay(applyPain(BUILT_IN_DEMO, { 23: d, 24: d, 25: d }), 25).indicators.symptoms.color).toBe('yellow')
  })

  it('an empty log leaves the data untouched', () => {
    expect(applyPain(BUILT_IN_DEMO, {})).toBe(BUILT_IN_DEMO)
  })
})

describe('pain for the crew medical officer', () => {
  const e = event({ side: 'left', started: '1_2_days', course: 'comes_and_goes', worse: 'yes', contexts: ['exercise', 'stress'] })

  it('sends where, how strong, the words, timing and mechanics, never a cause', () => {
    const [line] = painPacketLines(day(e), false)
    expect(line).toBe('Pain: Lower back (left), 6/10 moderate; Aching; started 1 to 2 days ago, comes and goes; worse on move or press: yes; context: during or after exercise.')
  })

  it('keeps the stress context private unless she shares Mind', () => {
    expect(painPacketLines(day(e), false)[0]).not.toContain('stressful')
    expect(painPacketLines(day(e), true)[0]).toContain('stressful moment today')
  })
})

describe('symptoms logged where she feels them', () => {
  it('offers only vocabulary symptoms that are neither pain words nor alarm signs, on real regions', async () => {
    const { REGION_SYMPTOMS, symptomsFor, isAlarm } = await import('./pain')
    const { FIXED_SYMPTOMS } = await import('./body')
    const ids = new Set(REGIONS.map((r) => r.id))
    for (const [r, words] of Object.entries(REGION_SYMPTOMS)) {
      expect(ids.has(r), r).toBe(true)
      for (const w of words) {
        expect(FIXED_SYMPTOMS).toContain(w)
        expect(isAlarm(w)).toBe(false)
      }
    }
    expect(symptomsFor(['head', 'abdomen'])).toEqual(['dizziness', 'nausea'])
    expect(symptomsFor(['leg'])).toEqual([])
  })

  it('a report can be a symptom without pain, and the engine sees the symptom itself', () => {
    const nausea = event({ regions: ['abdomen'], pain: false, symptoms: ['nausea'] })
    expect(painSymptoms(day(nausea))).toEqual(['nausea'])
    expect(painSymptoms(day(event({ regions: ['head'], symptoms: ['dizziness'] })))).toEqual(['pain in head', 'dizziness'])
    expect(painPacketLines(day(nausea), false)[0]).toMatch(/^Symptom: Belly; symptoms: nausea/)
  })

  it('a symptom she writes herself travels like the others: the engine logs it and the packet carries it', () => {
    const tingling = event({ regions: ['leg'], pain: false, symptoms: ['tingling in the toes'] })
    expect(painSymptoms(day(tingling))).toEqual(['tingling in the toes'])
    const r = evaluateDay(applyPain(BUILT_IN_DEMO, { 23: day(tingling) }), 23).indicators.symptoms
    expect(r.color).toBe('green')
    expect(r.reason).toMatch(/tingling in the toes/)
    expect(painPacketLines(day(tingling), false)[0]).toMatch(/symptoms: tingling in the toes/)
  })

  it('a symptom she writes that is an alarm sign only turns the day red once she confirms it', () => {
    // "chest pain" written on the belly, without confirming it in the safety question: not red.
    const written = event({ regions: ['abdomen'], pain: false, symptoms: ['chest pain'] })
    expect(painSymptoms(day(written))).toEqual([])
    expect(evaluateDay(applyPain(BUILT_IN_DEMO, { 23: day(written) }), 23).indicators.symptoms.color).not.toBe('red')
    // Confirmed in the safety question: red, as before.
    const confirmed = { ...written, alarms: ['chest pain'] }
    expect(painSymptoms(day(confirmed))).toEqual(['chest pain'])
    expect(evaluateDay(applyPain(BUILT_IN_DEMO, { 23: day(confirmed) }), 23).indicators.symptoms.color).toBe('red')
  })

  it('her own words that sound like an alarm sign add it to the safety question, in English or Spanish', () => {
    expect(alarmsInText(['severe chest pain'])).toEqual(['chest pain'])
    expect(alarmsInText(["can't breathe well"])).toEqual(['shortness of breath'])
    expect(alarmsInText(['passed out for a second'])).toEqual(['fainting'])
    expect(alarmsInText(['blurry sight'])).toEqual(['vision change'])
    expect(alarmsInText(['dolor de cabeza fuerte', 'me falta el aire'])).toEqual(['shortness of breath', 'severe headache'])
    expect(alarmsInText(['tingling in the toes', 'itching'])).toEqual([])
    // Every alarm sign the words point to is one of the engine's red flags.
    for (const flag of alarmsInText(['chest', 'breath', 'faint', 'vision', 'headache'])) expect(list('symptoms', 'red_flags')).toContain(flag)
  })
})
