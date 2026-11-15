import { describe, expect, it } from 'vitest'
import { FIXED_SYMPTOMS } from './body'
import { HEAT, heatOn, SYMPTOM_ZONES, warmth } from './heat'
import { VIEW_PARTS, type PainLog, type Slug } from './pain'

const painted = (day: number, zones: Slug[], intensity = 10, dots: [number, number][] = [[0.5, 0.4]]): PainLog => ({
  [day]: {
    events: [
      {
        id: `e${day}`,
        muscles: [],
        strokes: [{ id: `s${day}`, view: 'front', size: 'm', dots, zones }],
        regions: ['abdomen'],
        qualities: [],
        intensity,
        contexts: [],
        alarms: [],
      },
    ],
  },
})
const muscle = (slug: Slug, side: 'left' | 'right', intensity: number): PainLog[string] => ({
  events: [{ id: `m-${slug}-${side}`, muscles: [{ slug, side, view: 'front' }], strokes: [], regions: ['leg'], qualities: [], intensity, contexts: [], alarms: [] }],
})

describe('symptom heat map', () => {
  it('warmth halves every half-life without a new log', () => {
    expect(warmth(10, 0)).toBe(1)
    expect(warmth(10, HEAT.halfLifeDays)).toBeCloseTo(0.5)
    expect(warmth(10, 2 * HEAT.halfLifeDays)).toBeCloseTo(0.25)
    expect(warmth(6, 0)).toBeCloseTo(0.6)
    expect(warmth(10, -1)).toBe(0)
  })

  it('a zone cools down day by day and goes cold after a few days', () => {
    const log = painted(121, ['abs'])
    expect(heatOn(121, 'front', log, {}).zones[0]).toMatchObject({ zone: 'abs', warmth: 1, day: 121 })
    expect(heatOn(123, 'front', log, {}).zones[0].warmth).toBeCloseTo(0.5)
    expect(heatOn(128, 'front', log, {}).zones).toEqual([])
  })

  it('logging the same zone again makes it warm again', () => {
    const log = { ...painted(121, ['abs']), ...painted(124, ['abs'], 8) }
    const z = heatOn(124, 'front', log, {}).zones[0]
    expect(z).toMatchObject({ zone: 'abs', day: 124, intensity: 8 })
    expect(z.warmth).toBeCloseTo(0.8)
  })

  it('does not show logs from days after the one on screen', () => {
    expect(heatOn(120, 'front', painted(121, ['abs']), {}).zones).toEqual([])
  })

  it('painted dots cool with their stroke and stay on the view they were painted on', () => {
    const log = painted(121, ['abs'], 10, [[0.5, 0.4], [0.52, 0.45]])
    expect(heatOn(123, 'front', log, {}).dots.map((d) => d.warmth)).toEqual([0.5, 0.5])
    expect(heatOn(123, 'back', log, {}).dots).toEqual([])
  })

  it('symptom buttons warm their zone at a 5 of 10; back pain shows on the back view only', () => {
    const front = heatOn(122, 'front', {}, { 122: ['headache', 'back pain'] })
    expect(front.zones.map((z) => z.zone)).toEqual(['head'])
    expect(front.zones[0].warmth).toBeCloseTo(HEAT.buttonIntensity / 10)
    const back = heatOn(122, 'back', {}, { 122: ['headache', 'back pain'] })
    expect(back.zones.map((z) => z.zone).sort()).toEqual(['hair', 'lower-back', 'upper-back'])
  })

  it('symptoms with no place on the figure are listed apart while they are warm', () => {
    expect(heatOn(122, 'front', {}, { 121: ['skin rash'] }).noPlace).toEqual([{ symptom: 'skin rash', day: 121 }])
    expect(heatOn(130, 'front', {}, { 121: ['skin rash'] }).noPlace).toEqual([])
  })

  it('only places vocabulary symptoms on zones the figure draws', () => {
    const drawn = new Set([...VIEW_PARTS.front, ...VIEW_PARTS.back])
    for (const [symptom, zones] of Object.entries(SYMPTOM_ZONES)) {
      expect(FIXED_SYMPTOMS, symptom).toContain(symptom)
      for (const z of zones) expect(drawn.has(z), `${symptom}: ${z}`).toBe(true)
    }
  })

  it('keeps her side when every warm log of a muscle was on that side', () => {
    const one: PainLog = { 125: muscle('quadriceps', 'right', 9) }
    expect(heatOn(125, 'front', one, {}).zones[0]).toMatchObject({ zone: 'quadriceps', side: 'right' })
    const both: PainLog = { ...one, 124: muscle('quadriceps', 'left', 9) }
    expect(heatOn(125, 'front', both, {}).zones[0].side).toBeUndefined()
  })

  it('lists pain in the eyes or skin apart, since the figure has no zone for them', () => {
    const log: PainLog = { 125: { events: [{ id: 'x', muscles: [], strokes: [], regions: ['skin'], qualities: [], intensity: 4, contexts: [], alarms: [] }] } }
    expect(heatOn(125, 'front', log, {}).noPlace).toEqual([{ symptom: 'pain in skin (any area)', day: 125 }])
  })

  it('lists a symptom without pain in the eyes by its own name', () => {
    const log: PainLog = { 125: { events: [{ id: 'y', muscles: [], strokes: [], regions: ['eyes'], qualities: [], intensity: 4, contexts: [], alarms: [], pain: false, symptoms: ['eye irritation'] }] } }
    expect(heatOn(125, 'front', log, {}).noPlace).toEqual([{ symptom: 'eye irritation', day: 125 }])
  })
  it('a stroke painted on one half warms only that half', () => {
    const log = painted(120, ['knees'])
    log[120].events[0].strokes[0].parts = [{ zone: 'knees', side: 'left' }]
    expect(heatOn(120, 'front', log, {}).zones.find((z) => z.zone === 'knees')?.side).toBe('left')
    const both = painted(120, ['knees'])
    both[120].events[0].strokes[0].parts = [{ zone: 'knees', side: 'left' }, { zone: 'knees', side: 'right' }]
    expect(heatOn(120, 'front', both, {}).zones.find((z) => z.zone === 'knees')?.side).toBeUndefined()
  })
})
