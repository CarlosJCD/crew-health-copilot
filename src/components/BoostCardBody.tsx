import { useState } from 'react'
import { DISPLAY, type BoostCard } from '../orbit/boost'
import { useI18n } from '../i18n/context'

/**
 * A Boost card as Psychology wrote it: title, time, what to do, and on demand why, confidence and sources.
 * `time={false}` hides the time line (the medical-officer card has no time to spend).
 */
export function BoostCardBody({ card, time = true }: { card: BoostCard; time?: boolean }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  return (
    <>
      <h3 lang="en">{card.title_en}</h3>
      {time && (
        <p className="muted">
          {card.minutes > 0 ? t('boost.minutes', { n: card.minutes }) : t('boost.instant')}
          {card.priority && !DISPLAY.hide_priority_label_in_ui && ` · ${card.priority}`}
        </p>
      )}
      <p lang="en">{card.what_en}</p>
      <button type="button" className="link" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? t('card.hide') : t('card.why')}
      </button>
      {open && (
        <div className="details">
          <p className="why" lang="en">{card.why_en}</p>
          {card.confidence_en && (
            <p>
              <strong>{t('boost.confidence')}</strong> <span lang="en">{card.confidence_en}</span>
            </p>
          )}
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
      )}
    </>
  )
}
