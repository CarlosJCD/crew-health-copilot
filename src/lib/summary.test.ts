import { describe, expect, it } from 'vitest'
import { countStatuses, shareText, splitByAttention, summarizeDomains, worstOf } from './summary'

describe('countStatuses / worstOf', () => {
  it('counts each status and picks the worst one present', () => {
    const c = countStatuses(['nominal', 'watch', 'act', 'watch', 'no-data'])
    expect(c).toEqual({ act: 1, watch: 2, nominal: 1, 'no-data': 1 })
    expect(worstOf(c)).toBe('act')
    expect(worstOf(countStatuses(['nominal', 'no-data']))).toBe('nominal')
    expect(worstOf(countStatuses(['no-data']))).toBe('no-data')
  })
})

describe('summarizeDomains', () => {
  it('keeps the requested domain order and drops empty domains', () => {
    const out = summarizeDomains(
      [
        { domain: 'social', status: 'watch' },
        { domain: 'biological', status: 'nominal' },
        { domain: 'biological', status: 'act' },
      ],
      ['biological', 'cognitive-emotional', 'social'],
    )
    expect(out.map((d) => [d.domain, d.worst])).toEqual([
      ['biological', 'act'],
      ['social', 'watch'],
    ])
  })
})

describe('splitByAttention', () => {
  it('puts Act before Watch, keeps catalog order, and sends the rest to the list', () => {
    const items = [
      { id: 'sleep', status: 'watch' as const },
      { id: 'hr', status: 'act' as const },
      { id: 'sbp', status: 'nominal' as const },
      { id: 'mass', status: 'watch' as const },
      { id: 'spo2', status: 'no-data' as const },
    ]
    const { attention, rest } = splitByAttention(items)
    expect(attention.map((i) => i.id)).toEqual(['hr', 'sleep', 'mass'])
    expect(rest.map((i) => i.id)).toEqual(['sbp', 'spo2'])
  })
})

describe('shareText', () => {
  it('lists the groups that have lines and ends with the footer', () => {
    const text = shareText(
      ['App · Mars transit · MD 14', 'Overall status: Act'],
      [
        { title: 'Act', lines: [{ label: 'Resting heart rate', value: '66 bpm', detail: '8 bpm above your normal (57)' }] },
        { title: 'Watch', lines: [] },
      ],
      'None',
      'Not a diagnosis.',
    )
    expect(text).toBe(
      'App · Mars transit · MD 14\nOverall status: Act\n\nAct\n- Resting heart rate: 66 bpm (8 bpm above your normal (57))\n\nNot a diagnosis.',
    )
  })
  it('says so when nothing is at Watch or Act', () => {
    expect(shareText(['H'], [{ title: 'Act', lines: [] }], 'None', 'F')).toBe('H\n\nNone\n\nF')
  })
})
