import type { Domain, Status } from '../data/types'
import { useI18n } from '../i18n/context'
import { STATUS_SYMBOL } from '../lib/status'
import type { DomainSummary, StatusCounts } from '../lib/summary'
import { StatusPill } from './StatusPill'

interface Props {
  dayLabel: string
  overall: Status
  counts: StatusCounts
  domains: DomainSummary[]
  /** Domains with at least one indicator at Watch or Act. */
  flaggedDomains: number
  onJump: (domain: Domain) => void
}

const ORDER: Status[] = ['act', 'watch', 'nominal']

/** Top of Today: overall status, counts per domain and the cross-domain early signal. */
export function StatusSummary({ dayLabel, overall, counts, domains, flaggedDomains, onJump }: Props) {
  const { t } = useI18n()
  const plural = (n: number, one: Parameters<typeof t>[0], other: Parameters<typeof t>[0]) => t(n === 1 ? one : other, { n })

  let headline: string
  let rest = ''
  if (counts.act) {
    headline = plural(counts.act, 'sum.act.one', 'sum.act.other')
    rest = t('sum.rest', { watch: counts.watch, nominal: counts.nominal })
  } else if (counts.watch) {
    headline = plural(counts.watch, 'sum.watch.one', 'sum.watch.other')
    rest = t('sum.restWatch', { nominal: counts.nominal })
  } else if (counts.nominal) {
    headline = t('sum.allNominal', { n: counts.nominal })
  } else {
    headline = t('sum.noData')
  }
  if (counts['no-data'] && (counts.act || counts.watch || counts.nominal)) rest += ` ${t('sum.missing', { n: counts['no-data'] })}`

  return (
    <section className="panel summary" aria-labelledby="summary-title">
      <p className="overline">{t('sum.today', { day: dayLabel })}</p>
      <div className="summary-head">
        <StatusPill status={overall} big />
        <h2 id="summary-title">
          {headline} {rest && <span>{rest.trim()}</span>}
        </h2>
      </div>
      <ul className="domain-tiles">
        {domains.map(({ domain, counts: c, worst }) => {
          const name = t(`domain.${domain}`)
          const total = c.act + c.watch + c.nominal + c['no-data']
          return (
            <li key={domain}>
              <button
                type="button"
                className={`domain-tile status-${worst}`}
                onClick={() => onJump(domain)}
                aria-label={`${t('sum.jump', { domain: name })}. ${t('sum.counts', { act: c.act, watch: c.watch, nominal: c.nominal, none: c['no-data'] })}`}
              >
                <span className="domain-tile-top">
                  {name}
                  <span className="shape" aria-hidden="true">
                    {STATUS_SYMBOL[worst]}
                  </span>
                </span>
                <span className="status-bar" aria-hidden="true">
                  {ORDER.filter((s) => c[s]).map((s) => (
                    <i key={s} className={`status-${s}`} style={{ flex: c[s] / total }} />
                  ))}
                </span>
                <span className="counts" aria-hidden="true">
                  {ORDER.map((s) => (
                    <span key={s}>
                      {STATUS_SYMBOL[s]} {c[s]}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {flaggedDomains >= 2 && (
        <div className="signal" role="status">
          <span className="shape status-watch" aria-hidden="true">
            ▲
          </span>
          <p>
            <b>{t('signal.title', { n: flaggedDomains })}</b> {t('signal.body')}
          </p>
          <span className="signal-links">
            <a className="btn" href="#/mind">
              {t('signal.mind')}
            </a>
            <a className="btn" href="#/recharge">
              {t('signal.recharge')}
            </a>
          </span>
        </div>
      )}
    </section>
  )
}
