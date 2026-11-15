// Handoff section 5: expected engine output for the demo story (days 121 to 128). Shared by the
// test of the built-in story and the test of the data team's public/data/demo-data.json.
import type { Color } from './config'
import type { OrbitState } from './engine'

const G: Color = 'green'
const Y: Color = 'yellow'

export const ACCEPTANCE: [day: number, state: OrbitState, body: Color, mind: Color, crew: Color, yellow: string[]][] = [
  [121, 'GREEN', G, G, G, []],
  [122, 'GREEN', G, G, G, []],
  [123, 'YELLOW', Y, G, G, ['sleep']],
  [124, 'YELLOW', Y, Y, Y, ['sleep', 'hr', 'checkin', 'pulse', 'contact']],
  [125, 'EARLY_SIGNAL', Y, Y, Y, ['sleep', 'hr', 'checkin', 'pulse', 'contact']],
  [126, 'YELLOW', G, Y, G, ['pulse']],
  [127, 'GREEN', G, G, G, []],
  [128, 'GREEN', G, G, G, []],
]
