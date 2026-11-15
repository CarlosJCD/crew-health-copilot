import type { Status } from '../data/types'
import { useI18n } from '../i18n/context'
import { STATUS_SYMBOL } from '../lib/status'

/** Status as shape + word + color, so it reads without color. */
export function StatusPill({ status, big = false }: { status: Status; big?: boolean }) {
  const { t } = useI18n()
  const label = t(`status.${status}`)
  return (
    <span className={`pill status-${status}${big ? ' big' : ''}`} aria-label={t('status.aria', { status: label })}>
      <span aria-hidden="true">{STATUS_SYMBOL[status]}</span>
      <span aria-hidden="true">{label}</span>
    </span>
  )
}
