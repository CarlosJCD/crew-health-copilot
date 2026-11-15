import type { BoostCard } from '../orbit/boost'

// Line icons for the Boost cards (24 px grid, stroke follows the text color), so each option can be
// recognized before reading it. Decorative: the card title next to the icon carries the meaning.
const PATHS: Record<string, string> = {
  // Self-care
  breathe: 'M4 9h10a3 3 0 1 0-3-3M4 13h14a3 3 0 1 1-3 3M4 17h6',
  sleep_window: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z',
  caffeine_cutoff: 'M5 9h11v4.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 13.5V9Zm11 1.5h1.5a2.5 2.5 0 0 1 0 5H16M4 4l16 16',
  wind_down: 'M3 18h18M7 18a5 5 0 0 1 10 0M12 4v6m-3-2.5L12 10l3-2.5',
  bed_is_for_sleep: 'M3 18V7m0 7h18v4M7 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM11 10h7.5a2.5 2.5 0 0 1 2.5 2.5V14',
  strategic_nap: 'M5 6h6l-6 7h6M14 12h5l-5 6h5',
  micro_break: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4v4l3 2',
  music: 'M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm0 0V5.5l11-2v12m0 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  mindful_minute: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 6a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z',
  one_valued_thing: 'm12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z',
  move: 'M6.5 8v8M3.5 10v4M17.5 8v8M20.5 10v4M6.5 12h11',
  private_note: 'M5 3.5h9.5L19 8v12.5H5ZM14.5 3.5V8H19M8.5 12.5h7M8.5 16h4.5',
  fast_sugar: 'M12 3.5s5.5 6.2 5.5 10a5.5 5.5 0 0 1-11 0c0-3.8 5.5-10 5.5-10Z',
  cool_down: 'M10 4.5a2 2 0 1 1 4 0v8.8a4 4 0 1 1-4 0ZM12 9v6.5',
  reschedule_exercise: 'M4 6h16v14H4ZM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4',
  // Connect
  earth_window: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3Z',
  message_home: 'M3.5 6.5h17v11h-17Zm0 0 8.5 6.5 8.5-6.5',
  family_puzzle: 'M5 8h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v4H5v-4a2 2 0 1 0 0-4Z',
  crew_game: 'm5 17 4-6 5 3 5-8M5 15.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm4-6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm5 3a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm5-8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z',
  crew_talk: 'M4 5h11v8H9l-3 3v-3H4Zm11 4h5v8h-2v3l-3-3h-5v-4',
  // Check first
  recheck_hr: 'M3 12h4l2-4 3 8 2-4h7',
  recheck_bp: 'M4 16a8 8 0 1 1 16 0M12 16l4-5M4 16h16',
  context_check: 'M9.5 6h10.5M9.5 12h10.5M9.5 18h10.5M4.5 6h.5M4.5 12h.5M4.5 18h.5',
  // People first
  cmo_now: 'M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5Z',
  talk_now: 'M4 5h16v11H9.5L5 20v-4H4Z',
  shelter: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6Z',
}

/** When a card has no icon of its own, its kind gives one. */
const BY_KIND: Record<BoostCard['kind'], string> = {
  self_care: 'M12 20s-7-4.4-7-9.5A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.5C19 15.6 12 20 12 20Z',
  connect: PATHS.talk_now,
  check: PATHS.context_check,
  escalate: PATHS.cmo_now,
}

export function CareIcon({ card, size = 24 }: { card: BoostCard; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[card.id] ?? BY_KIND[card.kind]} />
    </svg>
  )
}
