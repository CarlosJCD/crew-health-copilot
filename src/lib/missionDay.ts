// Short mission-day codes used in the header, the demo timeline and the trend axes.
// Before launch: L−7 (days to launch, with a true minus sign). From launch day: MD 014.

/** `pad` keeps the width fixed (MD 004, MD 014) so the header does not jump while replaying. */
export function missionDayCode(day: number, pad = false): string {
  if (day < 0) return `L−${-day}`
  return `MD ${pad ? String(day).padStart(3, '0') : day}`
}
