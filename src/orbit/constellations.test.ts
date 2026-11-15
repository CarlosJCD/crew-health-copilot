import { describe, expect, it } from 'vitest'
import { BOARDS, checkBoards, closest, groupOf, shuffled } from './constellations'

describe('constellations.json', () => {
  it('has 2 boards of 4 groups of 4 tiles, each group with a fact, a hint and a source', () => {
    expect(BOARDS).toHaveLength(2)
    expect(checkBoards()).toEqual([])
  })
})

describe('game rules', () => {
  const board = BOARDS[0]
  it('recognises a group whatever the order of the tiles', () => {
    expect(groupOf(board, ['Callisto', 'Io', 'Ganymede', 'Europa'])?.name_en).toBe('Moons of Jupiter')
    expect(groupOf(board, ['Callisto', 'Io', 'Ganymede', 'Titan'])).toBeUndefined()
    expect(closest(board, ['Callisto', 'Io', 'Ganymede', 'Titan'])).toBe(3)
  })

  it('shuffles the same way every time, keeping all 16 tiles', () => {
    expect(shuffled(board)).toEqual(shuffled(board))
    expect([...shuffled(board)].sort()).toEqual(board.groups.flatMap((g) => g.tiles).sort())
  })
})
