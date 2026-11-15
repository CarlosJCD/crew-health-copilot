// Handoff section 5: expected engine output for the demo story (days 23 to 30). Shared by the
// test of the built-in story and the test of the data team's public/data/demo-data.json.
import type { Color } from './config'
import type { OrbitState } from './engine'

const G: Color = 'green'
const Y: Color = 'yellow'

export const ACCEPTANCE: [day: number, state: OrbitState, body: Color, mind: Color, crew: Color, yellow: string[]][] = [
  [23, 'GREEN', G, G, G, []],
  [24, 'GREEN', G, G, G, []],
  [25, 'YELLOW', Y, G, G, ['sleep']],
  [26, 'YELLOW', Y, Y, Y, ['sleep', 'hr', 'checkin', 'pulse', 'contact']],
  [27, 'EARLY_SIGNAL', Y, Y, Y, ['sleep', 'hr', 'checkin', 'pulse', 'contact']],
  [28, 'YELLOW', G, Y, G, ['pulse']],
  [29, 'GREEN', G, G, G, []],
  [30, 'GREEN', G, G, G, []],
]
