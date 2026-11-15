import { describe, expect, it } from 'vitest'
import { ACCEPTANCE } from './acceptance'
import { validateDemoData } from './demoData'
import { evaluateDay } from './engine'

// The data team's public/data/demo-data.json (the file the published app loads). If it is
// missing, these tests are skipped and the app uses its built-in story.
const files = import.meta.glob('../../public/data/demo-data.json', { eager: true, import: 'default' })
const raw = Object.values(files)[0]

describe.skipIf(!raw)('data team demo-data.json', () => {
  const { data, errors } = validateDemoData(raw)

  it('passes the app validator with no problems', () => {
    expect(errors).toEqual([])
    expect(data?.days.length).toBeGreaterThan(0)
  })

  it.each(ACCEPTANCE)('day %i is %s (handoff section 5)', (day, state, body, mind, crew, yellow) => {
    const r = evaluateDay(data!, day)
    expect(r.state).toBe(state)
    expect(r.domains).toEqual({ body, mind, crew })
    expect([...r.flagged].sort()).toEqual([...yellow].sort())
  })

  it('keeps the days before the story green', () => {
    for (const d of data!.days.filter((x) => x.day < 23)) expect(evaluateDay(data!, d.day).state, `day ${d.day}`).toBe('GREEN')
  })
})
