import { useState } from 'react'
import { DISPLAY, type BoostCard } from '../orbit/boost'
import { useI18n } from '../i18n/context'
import { ViewEarth } from './EarthView'
import { useContent } from '../i18n/content'

/**
 * A Boost card as Psychology wrote it: title, time, what to do, and on demand why and sources. Once she
 * chooses Earth Window, the card shows "View image", which opens the photo of Earth in a pop-up.
 * `time={false}` hides the time line (the medical-officer card has no time to spend).
 */
export function BoostCardBody({ card, time = true, chosen = false }: { card: BoostCard; time?: boolean; chosen?: boolean }) {
  const { t } = useI18n()
  const c = useContent()
  const [open, setOpen] = useState(false)
  return (
    <>
      <h3>{c(card.title_en)}</h3>
      {time && (
        <p className="muted">
          {card.minutes > 0 ? t('boost.minutes', { n: card.minutes }) : t('boost.instant')}
          {card.priority && !DISPLAY.hide_priority_label_in_ui && ` · ${card.priority}`}
        </p>
      )}
      <p>{c(card.what_en)}</p>
      {card.id === 'earth_window' && chosen && <ViewEarth title={c(card.title_en)} />}
      <button type="button" className="link" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? t('card.hide') : t('card.why')}
      </button>
      {open && <CardWhy card={card} />}
    </>
  )
}

/** Why the card is offered, and its sources. */
export function CardWhy({ card }: { card: BoostCard }) {
  const { t } = useI18n()
  const c = useContent()
  return (
    <div className="details">
      <p className="why">{c(card.why_en)}</p>
      <p>
        <strong>{t('card.sources')}</strong>{' '}
        {card.sources.map((s, i) => (
          <span key={s.cite}>
            {i > 0 && ' · '}
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.cite}
              </a>
            ) : (
              s.cite
            )}
          </span>
        ))}
      </p>
    </div>
  )
}
