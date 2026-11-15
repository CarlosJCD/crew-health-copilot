import { describe, expect, it } from 'vitest'
import { BUILT_IN_DEMO, dayRange, LEGACY_DAY_OFFSET, loadDemoData, resolveDay, STORY_DAYS, validateDemoData } from './demoData'

const respond = (body: string, status = 200, type = 'application/json') =>
  (async () => new Response(body, { status, headers: { 'content-type': type } })) as unknown as typeof fetch

describe('validateDemoData', () => {
  it('accepts a file in the handoff format (the built-in story round-trips)', () => {
    const { data, errors } = validateDemoData(JSON.parse(JSON.stringify(BUILT_IN_DEMO)))
    expect(errors).toEqual([])
    expect(data?.days).toHaveLength(BUILT_IN_DEMO.days.length)
  })

  it('needs a persona baseline as [mean, sd]', () => {
    const bad = { ...BUILT_IN_DEMO, persona: { ...BUILT_IN_DEMO.persona, baseline: { ...BUILT_IN_DEMO.persona.baseline, hr: 58 } } }
    expect(validateDemoData(bad).errors.join('\n')).toMatch(/baseline\.hr must be \[mean, sd\]/)
  })

  it('drops days with impossible values and says why', () => {
    const days = [{ ...BUILT_IN_DEMO.days[0], sleep_h: 30 }, BUILT_IN_DEMO.days[1]]
    const { data, errors } = validateDemoData({ ...BUILT_IN_DEMO, days })
    expect(data?.days).toHaveLength(1)
    expect(errors[0]).toMatch(/sleep_h = 30 is outside the plausible range/)
  })
})

describe('loadDemoData', () => {
  it('uses the built-in story when the file is missing', async () => {
    expect((await loadDemoData(respond('Not found', 404, 'text/plain'))).origin).toBe('built-in')
  })

  it('uses the data team file when it is valid', async () => {
    expect((await loadDemoData(respond(JSON.stringify(BUILT_IN_DEMO)))).origin).toBe('file')
  })

  it('lets the day control reach every day of the file, while the demo story stays 23 to 30', async () => {
    const { dayRange, STORY_DAYS, BUILT_IN_DEMO } = await import('./demoData')
    expect(dayRange(BUILT_IN_DEMO)).toEqual({ first: 1, last: 30 })
    expect(STORY_DAYS).toEqual({ first: 23, last: 30 })
  })
})

describe('resolveDay (the day a link asks for)', () => {
  const range = dayRange(BUILT_IN_DEMO)

  it('keeps a day of the file', () => {
    expect(range).toEqual({ first: 1, last: 30 })
    expect(resolveDay(27, range)).toEqual({ day: 27 })
  })

  it('sends links of the first numbering (story 121 to 128) to the same story day', () => {
    expect(STORY_DAYS.first + LEGACY_DAY_OFFSET).toBe(121)
    expect(resolveDay(121, range)).toEqual({ day: 23, moved: 'legacy' })
    expect(resolveDay(125, range)).toEqual({ day: 27, moved: 'legacy' })
    expect(resolveDay(128, range)).toEqual({ day: 30, moved: 'legacy' })
    expect(resolveDay(107, range)).toEqual({ day: 9, moved: 'legacy' })
  })

  it('sends any other day outside the file to the nearest day it has', () => {
    expect(resolveDay(0, range)).toEqual({ day: 1, moved: 'clamped' })
    expect(resolveDay(400, range)).toEqual({ day: 30, moved: 'clamped' })
    expect(resolveDay(31, range)).toEqual({ day: 30, moved: 'clamped' })
  })
})
