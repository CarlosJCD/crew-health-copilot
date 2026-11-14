import { describe, expect, it } from 'vitest'
import { INDICATORS } from './indicators'
import { generateSample, loadMeasurements } from './sample'
import { evaluateDay } from '../lib/status'

const respond = (body: string, init: ResponseInit & { type?: string } = {}) =>
  (async () =>
    new Response(body, {
      status: init.status ?? 200,
      headers: { 'content-type': init.type ?? 'application/json' },
    })) as unknown as typeof fetch

describe('loadMeasurements', () => {
  it('falls back to the generator when the file is missing (404)', async () => {
    const r = await loadMeasurements(respond('Not found', { status: 404, type: 'text/plain' }))
    expect(r.origin).toBe('generated')
    expect(r.errors).toEqual([])
  })

  it('treats an HTML answer (dev-server fallback) as missing', async () => {
    const r = await loadMeasurements(respond('<!doctype html>', { type: 'text/html' }))
    expect(r.origin).toBe('generated')
  })

  it('reports invalid JSON and falls back', async () => {
    const r = await loadMeasurements(respond('[{oops'))
    expect(r.origin).toBe('generated')
    expect(r.errors[0]).toMatch(/not valid JSON/)
  })

  it('uses a valid file and keeps only the first astronaut', async () => {
    const row = { day: 0, indicatorId: 'sleep', value: 7, unit: 'h', source: 'synthetic' }
    const body = JSON.stringify([
      { ...row, astronautId: 'a1' },
      { ...row, astronautId: 'a2' },
    ])
    const r = await loadMeasurements(respond(body))
    expect(r.origin).toBe('file')
    expect(r.rows.map((x) => x.astronautId)).toEqual(['a1'])
    expect(r.errors[0]).toMatch(/2 astronauts/)
  })
})

// Contract for the demo story told by the placeholder data. If the data team's dataset
// replaces it, keep an equivalent test for the new story.
describe('placeholder demo story', () => {
  const data = generateSample()
  const statusOn = (day: number) =>
    INDICATORS.map((def) => ({ def, s: evaluateDay(def, data.filter((r) => r.indicatorId === def.id), day).status }))
  const flaggedDomains = (day: number) =>
    new Set(statusOn(day).filter((x) => x.s === 'watch' || x.s === 'act').map((x) => x.def.domain)).size

  it('is deterministic', () => {
    expect(generateSample()).toEqual(data)
  })

  it('covers every indicator and stays inside the plausible ranges', () => {
    for (const def of INDICATORS) {
      const values = data.filter((r) => r.indicatorId === def.id).map((r) => r.value)
      expect(values.length, def.id).toBeGreaterThan(0)
      for (const v of values) expect(v >= def.plausible.min && v <= def.plausible.max, `${def.id} ${v}`).toBe(true)
    }
  })

  it('raises no alert before mission day 9', () => {
    for (let day = -6; day <= 8; day++) expect(flaggedDomains(day), `day ${day}`).toBe(0)
  })

  it('shows a cross-domain signal by mission day 11', () => {
    expect(flaggedDomains(11)).toBeGreaterThanOrEqual(2)
  })
})
