import type { BoostCard } from '../orbit/boost'
import { useI18n } from '../i18n/context'
import { BoostCardBody } from './BoostCardBody'

interface Props {
  card: BoostCard
  /** Why it is suggested, already in words. */
  because?: string[]
  chosen: boolean
  /** She already chose the maximum. */
  full: boolean
  onToggle: () => void
}

/** A self-care card she can choose right where it is suggested (same choice as in Boost). */
export function SuggestionCard({ card, because = [], chosen, full, onToggle }: Props) {
  const { t } = useI18n()
  return (
    <article className={`card boost-card suggestion${chosen ? ' chosen' : ''}`}>
      <BoostCardBody card={card} chosen={chosen} />
      {because.length > 0 && (
        <p className="hint">
          {t('plan.because')} {because.join(' · ')}
        </p>
      )}
      {card.kind === 'escalate' ? (
        <a className="button" href="#/transmit">
          {t('boost.openTransmit')}
        </a>
      ) : (
        <button type="button" className="button" aria-pressed={chosen} disabled={!chosen && full} onClick={onToggle}>
          {chosen ? t('plan.chosen') : t('plan.choose')}
        </button>
      )}
    </article>
  )
}
