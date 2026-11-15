// Spanish for everything the app shows: the texts of the team's data files (rules, Boost library, pulse, pain,
// game, scenarios, demo story) and the sentences the code builds from them. If a data file gains a text, this
// test names it so its Spanish can be added to content-es.json.
import { describe, expect, it } from 'vitest'
import indicators from '../orbit/orbit-indicators.json'
import library from '../orbit/boost/orbit-boost-library.json'
import cards from '../orbit/boost/boost-cards.json'
import pulse from '../orbit/pulse-spec.json'
import pain from '../orbit/pain-spec.json'
import constellations from '../orbit/constellations.json'
import scenarios from '../orbit/scenarios.json'
import { BUILT_IN_DEMO } from '../orbit/demoData'
import { evaluateDay } from '../orbit/engine'
import { TRIGGERS } from '../orbit/boost'
import { triggerLabel } from '../orbit/plan'
import { cmoShare, escalationPacket, weeklySummary } from '../orbit/transmit'
import { hasSpanish, L } from './content'
import { packetLineEs, reasonEs, triggerEs } from './dynamic'

/** Keys whose texts are shown: `*_en`, HRP risk names, symptom words, ground contact and the state texts. */
const SHOWN = (k: string) => k.endsWith('_en') || ['hrp_risk', 'text', 'ground_contact', 'en'].includes(k)

function texts(o: unknown, out: string[] = [], key = ''): string[] {
  if (typeof o === 'string') {
    if (SHOWN(key) && /[A-Za-z]/.test(o)) out.push(o.trim())
  } else if (Array.isArray(o)) {
    for (const x of o) texts(x, out, key)
  } else if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) texts(v, out, k)
  }
  return out
}

const FILES = { indicators, library, cards, pulse, pain, constellations, scenarios }
const english = (s: string) => /\b(the|and|your|you|with|of|in|to|is|are|or|for)\b/i.test(s)

describe('Spanish content', () => {
  for (const [name, data] of Object.entries(FILES)) {
    it(`has Spanish for every text shown from ${name}`, () => {
      const missing = [...new Set(texts(data))].filter((s) => !hasSpanish(s))
      expect(missing).toEqual([])
    })
  }

  it('has Spanish for the events of the demo story', () => {
    const missing = BUILT_IN_DEMO.days.flatMap((d) => d.events).filter((e) => !hasSpanish(e))
    expect(missing).toEqual([])
  })

  it('translates every reason the engine gives on the story and history days', () => {
    const left: string[] = []
    for (const d of BUILT_IN_DEMO.days) {
      for (const r of Object.values(evaluateDay(BUILT_IN_DEMO, d.day).indicators)) {
        const es = reasonEs(r.reason, 'es')
        if (r.reason && es === r.reason && english(r.reason)) left.push(r.reason)
      }
    }
    expect([...new Set(left)]).toEqual([])
  })

  it('translates every line of the Transmit packets', () => {
    const left: string[] = []
    const share = { mind: true, crew: true }
    for (const d of BUILT_IN_DEMO.days) {
      const r = evaluateDay(BUILT_IN_DEMO, d.day)
      const packets = [cmoShare(r, share), cmoShare(r, { mind: false, crew: false }), weeklySummary(BUILT_IN_DEMO, d.day, share), escalationPacket(r)]
      for (const p of packets) {
        if (!p) continue
        for (const line of [p.title, ...p.lines]) {
          if (packetLineEs(line, 'es') === line && english(line)) left.push(line)
        }
      }
    }
    expect([...new Set(left)]).toEqual([])
  })

  it('translates the "Because:" label of every Boost trigger', () => {
    const left = TRIGGERS.map((t) => triggerLabel(t.trigger)).filter((l) => triggerEs(l, 'es') === l)
    expect(left).toEqual([])
  })

  it('leaves English as it is', () => {
    expect(L('Breathe', 'en')).toBe('Breathe')
    expect(reasonEs('5.3 h: 1.2 h below your usual 6.5 h.', 'en')).toBe('5.3 h: 1.2 h below your usual 6.5 h.')
    expect(reasonEs('5.3 h: 1.2 h below your usual 6.5 h.', 'es')).toBe('5.3 h: 1.2 h menos que tu normal de 6.5 h.')
  })
})
