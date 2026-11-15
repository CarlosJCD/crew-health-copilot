import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/context'
import type { StringKey } from '../i18n/strings'
import { Icon, type IconName } from './Icon'
import { Logo } from './Logo'

interface Props {
  /** The demo astronaut (persona of the data file). */
  persona: { name: string; role: string }
  onClose: () => void
}

const LOOP = ['observe', 'read', 'boost', 'iterate', 'transmit'] as const
const HAZARDS: { id: string; icon: IconName }[] = [
  { id: 'radiation', icon: 'bolt' },
  { id: 'isolation', icon: 'lock' },
  { id: 'distance', icon: 'earth' },
  { id: 'gravity', icon: 'gravity' },
  { id: 'environment', icon: 'habitat' },
]
const STATES: { id: string; shape: string; color: string }[] = [
  { id: 'green', shape: '●', color: 'var(--nominal)' },
  { id: 'yellow', shape: '▲', color: 'var(--watch)' },
  { id: 'early', shape: '▲', color: 'var(--watch)' },
  { id: 'red', shape: '■', color: 'var(--act)' },
]
const MODULES: { id: string; icon: IconName; label: StringKey }[] = [
  { id: 'today', icon: 'body', label: 'nav.home' },
  { id: 'care', icon: 'care', label: 'nav.care' },
  { id: 'mind', icon: 'mind', label: 'nav.mind' },
  { id: 'transmit', icon: 'send', label: 'nav.send' },
  { id: 'more', icon: 'more', label: 'nav.more' },
]

/**
 * The first-visit introduction: what ORBIT is, the ORBIT loop, the domains and NASA's five hazards, the states
 * of the day, each module, and what stays private. Six short pages; it can be skipped and reopened from More.
 */
export function Intro({ persona, onClose }: Props) {
  const { t } = useI18n()
  const [page, setPage] = useState(0)
  const card = useRef<HTMLDivElement>(null)
  const pages = PAGES.length
  const last = page === pages - 1

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    card.current?.focus()
    return () => prev?.focus?.()
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setPage((p) => Math.min(pages - 1, p + 1))
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(0, p - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, pages])
  // A new page starts at its top.
  useEffect(() => {
    card.current?.querySelector('.intro-body')?.scrollTo(0, 0)
  }, [page])

  const Page = PAGES[page]
  return (
    <div className="intro-backdrop">
      <div className="intro" role="dialog" aria-modal="true" aria-labelledby="intro-title" tabIndex={-1} ref={card}>
        <div className="intro-top">
          <span className="intro-count">{t('intro.count', { n: page + 1, total: pages })}</span>
          {!last && (
            <button type="button" className="link intro-skip" onClick={onClose}>
              {t('intro.skip')}
            </button>
          )}
        </div>
        <div className="intro-body">
          <Page persona={persona} />
        </div>
        <div className="intro-foot">
          <div className="intro-dots" aria-hidden="true">
            {PAGES.map((_, i) => (
              <span key={i} className={i === page ? 'on' : undefined} />
            ))}
          </div>
          <div className="intro-buttons">
            {page > 0 && (
              <button type="button" className="button secondary" onClick={() => setPage(page - 1)}>
                {t('intro.back')}
              </button>
            )}
            <button type="button" className="button" onClick={() => (last ? onClose() : setPage(page + 1))}>
              {last ? t('intro.start') : t('intro.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** One row: an icon or a mark, a name and one line. */
function Row({ mark, title, children }: { mark: ReactNode; title: ReactNode; children: ReactNode }) {
  return (
    <li className="intro-row">
      <span className="intro-mark">{mark}</span>
      <span>
        <strong>{title}</strong>
        <span className="intro-line">{children}</span>
      </span>
    </li>
  )
}

type PageProps = { persona: Props['persona'] }

const PAGES: ((p: PageProps) => ReactNode)[] = [
  function Welcome() {
    const { t } = useI18n()
    return (
      <div className="intro-welcome">
        <Logo />
        <h2 id="intro-title" className="intro-wordmark">
          ORBIT
        </h2>
        <p className="intro-tagline">{t('intro.tagline')}</p>
        <p>{t('intro.what')}</p>
        <ul className="intro-chips">
          <li>{t('intro.chip.challenge')}</li>
          <li>{t('intro.chip.offline')}</li>
          <li>{t('intro.chip.baseline')}</li>
        </ul>
      </div>
    )
  },
  function Loop() {
    const { t } = useI18n()
    return (
      <>
        <h2 id="intro-title">{t('intro.loopTitle')}</h2>
        <p className="intro-lead">{t('intro.loopLead')}</p>
        <ol className="intro-list">
          {LOOP.map((s) => (
            <Row key={s} mark={<span className="intro-letter">{s[0].toUpperCase()}</span>} title={t(`orbit.${s}`)}>
              {t(`intro.loop.${s}`)}
            </Row>
          ))}
        </ol>
      </>
    )
  },
  function Domains() {
    const { t } = useI18n()
    return (
      <>
        <h2 id="intro-title">{t('intro.domainsTitle')}</h2>
        <p className="intro-lead">{t('intro.domainsLead')}</p>
        <ul className="intro-domains">
          {(['body', 'mind', 'crew'] as const).map((d) => (
            <li key={d}>
              <Icon name={d === 'crew' ? 'crew' : d} size={22} />
              <strong>{t(`domain.${d}`)}</strong>
              <span>{t(`intro.domain.${d}`)}</span>
            </li>
          ))}
        </ul>
        <h3 className="intro-sub">{t('intro.hazardsTitle')}</h3>
        <ul className="intro-list">
          {HAZARDS.map((h) => (
            <Row key={h.id} mark={<Icon name={h.icon} size={20} />} title={t(`intro.hazard.${h.id}` as StringKey)}>
              {t(`intro.hazardDo.${h.id}` as StringKey)}
            </Row>
          ))}
        </ul>
      </>
    )
  },
  function States() {
    const { t } = useI18n()
    return (
      <>
        <h2 id="intro-title">{t('intro.statesTitle')}</h2>
        <p className="intro-lead">{t('intro.statesLead')}</p>
        <ul className="intro-list">
          {STATES.map((s) => (
            <Row
              key={s.id}
              mark={
                <span className="intro-shape" style={{ color: s.color }}>
                  {s.shape}
                </span>
              }
              title={<span style={{ color: s.color }}>{t(`intro.state.${s.id}` as StringKey)}</span>}
            >
              {t(`intro.stateDo.${s.id}` as StringKey)}
            </Row>
          ))}
        </ul>
      </>
    )
  },
  function Modules() {
    const { t } = useI18n()
    return (
      <>
        <h2 id="intro-title">{t('intro.modulesTitle')}</h2>
        <p className="intro-lead">{t('intro.modulesLead')}</p>
        <ul className="intro-list">
          {MODULES.map((m) => (
            <Row key={m.id} mark={<Icon name={m.icon} size={20} />} title={t(m.label)}>
              {t(`intro.module.${m.id}` as StringKey)}
            </Row>
          ))}
        </ul>
      </>
    )
  },
  function Privacy({ persona }) {
    const { t } = useI18n()
    return (
      <>
        <h2 id="intro-title">{t('intro.privacyTitle')}</h2>
        <ul className="intro-list">
          <Row mark={<Icon name="lock" size={20} />} title={t('intro.private.device')}>
            {t('intro.private.deviceDo')}
          </Row>
          <Row mark={<Icon name="medic" size={20} />} title={t('intro.private.body')}>
            {t('intro.private.bodyDo')}
          </Row>
          <Row mark={<Icon name="mind" size={20} />} title={t('intro.private.choice')}>
            {t('intro.private.choiceDo')}
          </Row>
        </ul>
        <div className="intro-demo">
          <p>
            <strong>{t('intro.demoTitle')}</strong>
          </p>
          <p>{t('intro.demo', { name: persona.name, role: persona.role })}</p>
          <p className="muted">{t('intro.notDiag')}</p>
        </div>
      </>
    )
  },
]
