import { describe, expect, it } from 'vitest'
import { isRedFlag } from './body'
import { BUILT_IN_DEMO } from './demoData'
import { evaluateDay } from './engine'
import {
  applyPain,
  checkPainVocabulary,
  EMPTY_PAIN,
  INTENSITY_COLORS,
  muscleHighlights,
  muscleSymptom,
  musclesOf,
  painSymptoms,
  toggleMuscle,
  toHerSide,
  zoneSymptom,
  type PainDay,
  type PaintStroke,
} from './pain'

const stroke = (zones: PaintStroke['zones'], dots: PaintStroke['dots'] = [[0.5, 0.5]]): PaintStroke => ({
  id: zones.join('+'),
  view: 'front',
  intensity: 6,
  size: 'm',
  dots,
  zones,
})

describe('pain on the body map', () => {
  it('only produces symptoms of the fixed vocabulary of the rules file', () => {
    expect(checkPainVocabulary()).toEqual([])
  })

  it('muscle mode: back muscles are back pain, the rest joint or muscle pain, the chest stays an alarm', () => {
    expect(muscleSymptom('lower-back')).toBe('back pain')
    expect(muscleSymptom('trapezius')).toBe('back pain')
    expect(muscleSymptom('quadriceps')).toBe('joint or muscle pain')
    expect(muscleSymptom('chest')).toBe('chest pain')
    expect(isRedFlag(muscleSymptom('chest'))).toBe(true)
  })

  it('paint mode: head, chest, belly and back map to their own symptom; hair counts as head', () => {
    expect(zoneSymptom('head')).toBe('headache')
    expect(zoneSymptom('hair')).toBe('headache')
    expect(zoneSymptom('chest')).toBe('chest pain')
    expect(zoneSymptom('abs')).toBe('stomach pain')
    expect(zoneSymptom('obliques')).toBe('stomach pain')
    expect(zoneSymptom('upper-back')).toBe('back pain')
    expect(zoneSymptom('knees')).toBe('joint or muscle pain')
  })

  it('muscle mode does not offer zones that are not muscles', () => {
    expect(musclesOf('front')).not.toContain('head')
    expect(musclesOf('front')).not.toContain('knees')
    expect(musclesOf('back')).toContain('lower-back')
  })

  it('her side is the opposite of the viewer side from the front, the same from the back', () => {
    expect(toHerSide('left', 'front')).toBe('right')
    expect(toHerSide('left', 'back')).toBe('left')
  })

  it('toggling the same muscle twice leaves nothing; one side colors only that side', () => {
    const mark = { slug: 'biceps' as const, side: 'left' as const, view: 'front' as const, intensity: 4 }
    const once = toggleMuscle(EMPTY_PAIN, mark)
    expect(once.muscles).toHaveLength(1)
    expect(toggleMuscle(once, mark).muscles).toHaveLength(0)
    // Her left biceps is on the viewer's right from the front.
    expect(muscleHighlights(once.muscles, 'front')).toEqual([{ slug: 'biceps', intensity: 4, side: 'right' }])
    const both = toggleMuscle(once, { ...mark, side: 'right', intensity: 7 })
    expect(muscleHighlights(both.muscles, 'front')).toEqual([{ slug: 'biceps', intensity: 7 }])
    expect(muscleHighlights(both.muscles, 'back')).toEqual([])
  })

  it('a day of pain lists each symptom once', () => {
    const day: PainDay = {
      muscles: [{ slug: 'lower-back', side: 'left', view: 'back', intensity: 5 }],
      strokes: [stroke(['upper-back', 'lower-back'], []), stroke(['knees'])],
    }
    expect(painSymptoms(day)).toEqual(['back pain', 'joint or muscle pain'])
  })

  it('feeds the engine: chest pain painted on day 121 turns the day red, back pain alone does not', () => {
    const chest = applyPain(BUILT_IN_DEMO, { 121: { muscles: [], strokes: [stroke(['chest'])] } })
    expect(evaluateDay(chest, 121).state).toBe('RED_PHYSICAL')
    const back = applyPain(BUILT_IN_DEMO, { 121: { muscles: [], strokes: [stroke(['lower-back'])] } })
    expect(evaluateDay(back, 121).indicators.symptoms.color).toBe('green')
    expect(evaluateDay(back, 121).state).toBe(evaluateDay(BUILT_IN_DEMO, 121).state)
  })

  it('back pain on three days in a row turns the symptoms rule yellow (more than 2 days)', () => {
    const day = { muscles: [], strokes: [stroke(['lower-back'])] }
    const data = applyPain(BUILT_IN_DEMO, { 121: day, 122: day, 123: day })
    expect(evaluateDay(data, 123).indicators.symptoms.color).toBe('yellow')
  })

  it('an empty log leaves the data untouched', () => {
    expect(applyPain(BUILT_IN_DEMO, {})).toBe(BUILT_IN_DEMO)
    expect(INTENSITY_COLORS).toHaveLength(10)
  })
})
