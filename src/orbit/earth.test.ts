import { describe, expect, it } from 'vitest'
import { EPIC_FALLBACK, epicUrl, newestEpic } from './earth'

describe('Earth Window photo (NASA EPIC)', () => {
  it('builds the address of an EPIC photo from its name and date', () => {
    expect(epicUrl(EPIC_FALLBACK)).toBe('https://epic.gsfc.nasa.gov/archive/natural/2026/11/13/jpg/epic_1b_20261113002712.jpg')
  })

  it('takes the newest photo of the list', () => {
    const list = [
      { image: 'epic_1b_20261113002712', date: '2026-11-13 00:22:24', caption: 'x' },
      { image: 'epic_1b_20261113213345', date: '2026-11-13 21:29:00', caption: 'x' },
      { image: 'epic_1b_20261113112712', date: '2026-11-13 11:22:24', caption: 'x' },
    ]
    expect(newestEpic(list)?.image).toBe('epic_1b_20261113213345')
  })

  it('ignores an answer that is not a list of EPIC photos', () => {
    expect(newestEpic({ error: 'down' })).toBeUndefined()
    expect(newestEpic([])).toBeUndefined()
    // A name or date outside EPIC's format never becomes part of an address.
    expect(newestEpic([{ image: '../../evil', date: '2026-11-13 00:22:24' }, { image: 'epic_1b_1', date: 'tomorrow' }])).toBeUndefined()
  })
})
