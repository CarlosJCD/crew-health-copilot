import type { Color, DomainId } from '../orbit/config'
import { getIndicator } from '../orbit/config'
import { useI18n } from '../i18n/context'
import { COLOR_SYMBOL } from '../orbit/display'
import { useContent } from '../i18n/content'

interface Props {
  domain: DomainId
  color: Color
  /** Indicator ids of this domain in yellow or red. */
  flagged: string[]
}

const R = 34
const C = 2 * Math.PI * R

/** One of the three Today rings (Body, Mind, Crew): color, shape and word. */
export function DomainRing({ domain, color, flagged }: Props) {
  const { t } = useI18n()
  const c = useContent()
  const name = t(`domain.${domain}`)
  const word = t(`color.${color}`)
  return (
    <figure className={`ring color-${color}`} aria-label={t('color.aria', { domain: name, color: word })}>
      <svg viewBox="0 0 90 90" aria-hidden="true">
        <circle className="ring-track" cx="45" cy="45" r={R} />
        <circle className="ring-value" cx="45" cy="45" r={R} strokeDasharray={`${C} ${C}`} />
        <text x="45" y="43" className="ring-symbol">{COLOR_SYMBOL[color]}</text>
        <text x="45" y="60" className="ring-word">{word}</text>
      </svg>
      <figcaption>
        <strong>{name}</strong>
        <span>
          {flagged.length
            ? t('ring.flagged', { list: flagged.map((id) => c(getIndicator(id).label_en)).join(', ') })
            : t('ring.clear')}
        </span>
      </figcaption>
    </figure>
  )
}
