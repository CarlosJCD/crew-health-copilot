// Earth Window (Boost card earth_window): the newest full-disk photo of Earth from NASA's EPIC camera on
// the DSCOVR spacecraft, read from EPIC's public API (no key needed, open to any site). If the API does not
// answer, the card shows a fixed EPIC photo; with no network at all the card shows no photo.

export const EPIC_API = 'https://epic.gsfc.nasa.gov/api/natural'

export interface EpicImage {
  /** File name without extension, as the API gives it ("epic_1b_20261113002712"). */
  image: string
  /** UTC date and time of the photo ("2026-11-13 00:22:24"). */
  date: string
}

/** A real EPIC photo (November 13, 2026), shown when the API does not answer. */
export const EPIC_FALLBACK: EpicImage = { image: 'epic_1b_20261113002712', date: '2026-11-13 00:22:24' }

/** Address of an EPIC photo (the JPEG of the natural-color archive, about 230 KB). */
export function epicUrl({ image, date }: EpicImage): string {
  const [y, m, d] = date.slice(0, 10).split('-')
  return `https://epic.gsfc.nasa.gov/archive/natural/${y}/${m}/${d}/jpg/${image}.jpg`
}

const isEpicImage = (x: unknown): x is EpicImage => {
  const e = x as Partial<EpicImage> | null
  // Only names and dates in EPIC's own format become part of an address.
  return !!e && typeof e.image === 'string' && /^epic_\w+$/.test(e.image) && typeof e.date === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(e.date)
}

/** The newest photo in the API's answer, or undefined if the answer is not a list of EPIC photos. */
export function newestEpic(list: unknown): EpicImage | undefined {
  if (!Array.isArray(list)) return undefined
  return list.filter(isEpicImage).sort((a, b) => b.date.localeCompare(a.date))[0]
}
