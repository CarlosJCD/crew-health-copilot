// Constellations, free mode (Psychology 1, constellations.json, unchanged): group 16 tiles into 4 sets
// with NASA planetary data. Leisure only: no timer, no score, nothing is measured.
import boards from './constellations.json'

export interface Group {
  name_en: string
  tiles: string[]
  fact_en: string
  hint_en: string
  source: string
  more_sources: string[]
}

export interface Board {
  board: string
  intro_en: string
  groups: Group[]
}

export const BOARDS = boards as Board[]

/** Problems in constellations.json the game would trip over. Tests require this to be empty. */
export function checkBoards(list: Board[] = BOARDS): string[] {
  const errors: string[] = []
  for (const b of list) {
    if (b.groups.length !== 4) errors.push(`${b.board}: needs 4 groups.`)
    const tiles = b.groups.flatMap((g) => g.tiles)
    if (tiles.length !== 16) errors.push(`${b.board}: needs 16 tiles.`)
    if (new Set(tiles.map((t) => t.toLowerCase())).size !== tiles.length) errors.push(`${b.board}: a tile appears twice.`)
    for (const g of b.groups) if (!g.source || !g.fact_en || !g.hint_en) errors.push(`${b.board} / ${g.name_en}: needs a fact, a hint and a source.`)
  }
  return errors
}

/** The group the 4 selected tiles make, if they make one. */
export function groupOf(board: Board, selected: string[]): Group | undefined {
  if (selected.length !== 4) return undefined
  return board.groups.find((g) => selected.every((t) => g.tiles.includes(t)))
}

/** Largest number of selected tiles that belong to the same group (for a gentle nudge). */
export function closest(board: Board, selected: string[]): number {
  return Math.max(0, ...board.groups.map((g) => selected.filter((t) => g.tiles.includes(t)).length))
}

/** Deterministic shuffle so the board looks the same on every visit (and in screenshots). */
export function shuffled(board: Board): string[] {
  let seed = [...board.board].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7)
  const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) % 10000) / 10000
  const tiles = board.groups.flatMap((g) => g.tiles)
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[tiles[i], tiles[j]] = [tiles[j], tiles[i]]
  }
  return tiles
}
