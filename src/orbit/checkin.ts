// Daily check-in (Mind module): 4 sliders from 0 to 10, under a minute. Answers stay on the device;
// they replace that day's values in the demo data, so Today and the engine use them at once.
import type { DemoData } from './demoData'

export const CHECKIN_ITEMS = ['mood', 'stress', 'fatigue', 'crew_climate'] as const
export type CheckinItem = (typeof CHECKIN_ITEMS)[number]

/** Who she chose to talk to (checkin.action_en in orbit-indicators.json). */
export type TalkTo = 'crew_medical_officer' | 'psych_conference'

export type Checkin = Record<CheckinItem, number> & { talk_to?: TalkTo }

/** Check-ins by mission day. */
export type Checkins = Record<string, Checkin>

export function applyCheckins(data: DemoData, checkins: Checkins): DemoData {
  if (!Object.keys(checkins).length) return data
  return {
    ...data,
    days: data.days.map((d) => {
      const c = checkins[d.day]
      return c
        ? { ...d, mood: c.mood, stress: c.stress, fatigue: c.fatigue, crew_climate: c.crew_climate, talk_request: !!c.talk_to }
        : d
    }),
  }
}
