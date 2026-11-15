import { useEffect, useState } from 'react'
import { EPIC_API, EPIC_FALLBACK, epicUrl, newestEpic, type EpicImage } from '../orbit/earth'
import { useI18n } from '../i18n/context'

/** Waits this long for EPIC's list before showing the fixed photo. */
const API_TIMEOUT_MS = 6000

/**
 * The photo of the Earth Window card: the newest EPIC photo of Earth, or a fixed EPIC photo if the list
 * does not arrive. If the photo itself cannot load (no network), the card shows no photo.
 */
export function EarthPhoto() {
  const { t } = useI18n()
  const [photo, setPhoto] = useState<EpicImage | null>(null)
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    let live = true
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => ctrl.abort(), API_TIMEOUT_MS)
    fetch(EPIC_API, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : undefined))
      .then((list) => newestEpic(list) ?? EPIC_FALLBACK)
      .catch(() => EPIC_FALLBACK)
      .then((p) => {
        window.clearTimeout(timer)
        if (live) setPhoto(p)
      })
    return () => {
      live = false
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [])

  if (broken) return null
  const when = photo?.date.slice(0, 16)
  return (
    <figure className="earth-photo">
      {photo ? (
        <img
          key={photo.image}
          src={epicUrl(photo)}
          alt={t('earth.alt', { when: when ?? '' })}
          width={1080}
          height={1080}
          decoding="async"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="earth-wait" aria-hidden="true" />
      )}
      {photo && <figcaption>{t('earth.credit', { when: when ?? '' })}</figcaption>}
    </figure>
  )
}
