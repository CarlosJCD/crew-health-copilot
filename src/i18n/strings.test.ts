import { describe, expect, it } from 'vitest'
import { DICTIONARIES, format, LANGS, type Localized } from './strings'
import { MODULES } from '../modules/registry'
import { SCENARIOS } from '../orbit/config'
import { scenarioName } from '../orbit/display'

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('UI dictionaries', () => {
  it('have a non-empty text for every key in every language', () => {
    for (const lang of LANGS) {
      for (const [key, value] of Object.entries(DICTIONARIES[lang])) {
        expect(value.trim(), `${lang}:${key}`).not.toBe('')
      }
    }
  })

  it('use the same {placeholders} in every language', () => {
    for (const [key, en] of Object.entries(DICTIONARIES.en)) {
      for (const lang of LANGS) {
        const other = DICTIONARIES[lang][key as keyof typeof DICTIONARIES.en]
        expect(placeholders(other), `${lang}:${key}`).toEqual(placeholders(en))
      }
    }
  })
})

describe('data-file texts', () => {
  const all: [string, Localized][] = [
    ...MODULES.flatMap((m) => [
      [`${m.id}.label`, m.label],
      [`${m.id}.summary`, m.summary],
      [`${m.id}.owner`, m.owner],
      ...m.planned.map((p, i) => [`${m.id}.planned.${i}`, p] as [string, Localized]),
    ] as [string, Localized][]),
    ...SCENARIOS.map((s) => [`scenario.${s.id}`, scenarioName(s)] as [string, Localized]),
  ]

  it('are translated into every language', () => {
    for (const [where, text] of all) {
      for (const lang of LANGS) expect(text[lang]?.trim(), `${where} (${lang})`).toBeTruthy()
    }
  })
})

describe('format', () => {
  it('fills known placeholders and leaves unknown ones', () => {
    expect(format('Day {n} of {total}', { n: 3 })).toBe('Day 3 of {total}')
  })
})
