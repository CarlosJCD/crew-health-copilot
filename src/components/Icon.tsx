// Simple line icons drawn for ORBIT (24 px grid, stroke follows the text color). Decorative: the label
// next to each icon carries the meaning, so they are hidden from screen readers.
const PATHS = {
  body: 'M12 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-5 6.5h10M12 10v5m0 0-3 6m3-6 3 6M7 10l-1.5 5M17 10l1.5 5',
  care: 'M12 20s-7-4.4-7-9.5A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.5C19 15.6 12 20 12 20Z',
  mind: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-5 8h2.5l1.5-3 2 6 1.5-3H17',
  send: 'M4 12 20 4l-5 16-3-7-8-1Zm8 1 8-9',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  prev: 'm15 6-6 6 6 6',
  next: 'm9 6 6 6-6 6',
  play: 'M8 5.5v13l10-6.5-10-6.5Z',
  pause: 'M9 6v12M15 6v12',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4v4l2.5 1.5',
  medic: 'M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5Z',
  earth: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3Z',
  crew: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9a6 6 0 0 1 12 0M16 11a2.5 2.5 0 1 0 0-5M21 20a5.5 5.5 0 0 0-3.5-5.1',
  lock: 'M6 11h12v9H6Zm2.5 0V8a3.5 3.5 0 0 1 7 0v3',
  bolt: 'M13 3 5 13.5h6L10 21l8-10.5h-6Z',
  note: 'M5 3.5h9.5L19 8v12.5H5ZM14.5 3.5V8H19M8.5 12.5h7M8.5 16h4.5',
  stars: 'm5 17 4-6 5 3 5-8M5 15.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm4-6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm5 3a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm5-8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z',
  info: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 7.5V16m0-8h.01',
  signal: 'M5 18v-2M9.5 18v-5M14 18v-8M18.5 18V6',
  nosignal: 'M5 18v-2M9.5 18v-5M14 18v-3M18.5 18v-3M4 4l16 16',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'more' ? 3.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
