import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { delayText, type Scenario } from '../orbit/config'
import type { LoadedDemo } from '../orbit/demoData'
import { evaluateDay } from '../orbit/engine'
import {
  cmoShare,
  earliestReply,
  escalationPacket,
  queuePacket,
  weeklySummary,
  type Packet,
  type PacketDraft,
  type Recipient,
  type ShareSettings,
} from '../orbit/transmit'
import { useI18n } from '../i18n/context'
import type { StringKey } from '../i18n/strings'
import { painPacketLines, type PainDay } from '../orbit/pain'
import { Icon, type IconName } from '../components/Icon'
import { InfoTip } from '../components/InfoTip'
import { packetLineEs } from '../i18n/dynamic'
import { scenarioName } from '../orbit/display'

interface Props {
  demo: LoadedDemo
  day: number
  scenario: Scenario
  share: ShareSettings
  onShareChange: (s: ShareSettings) => void
  outbox: Packet[]
  onOutboxChange: (p: Packet[]) => void
  demoClock: boolean
  onDemoClockChange: (on: boolean) => void
  /** Her pain reports of the day: Body, so they go with the medical officer packet. */
  pain?: PainDay
}

const SPEED = 60 // demo clock: one minute passes in one second

/** Wall clock, read only in event handlers and timers. */
const clockNow = () => Date.now()

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const RECIPIENT_ICON: Record<Recipient, IconName> = { crew_medical_officer: 'medic', flight_surgeons: 'earth' }

/**
 * Transmit: who hears from her and how long it takes. The delay is drawn as a path (her ship, the medical
 * officer onboard, Earth), what leaves the device is three switches with icons, and each packet shows what
 * it says, who gets it, and then where it is (a bar while in transit, a check once delivered).
 */
export function Transmit({ demo, day, scenario, share, onShareChange, outbox, onOutboxChange, demoClock, onDemoClockChange, pain }: Props) {
  const { t, lang } = useI18n()
  const [now, setNow] = useState(clockNow)
  const speed = demoClock ? SPEED : 1
  const inTransit = outbox.some((p) => p.arrivesAt > now || earliestReply(p, scenario, speed) > now)

  useEffect(() => {
    if (!inTransit) return
    const timer = setInterval(() => setNow(clockNow()), 1000)
    return () => clearInterval(timer)
  }, [inTransit])

  const result = useMemo(() => evaluateDay(demo.data, day), [demo.data, day])
  const record = demo.data.days.find((d) => d.day === day)
  const live = scenario.one_way_delay_s < 60
  const clock = (ms: number) => new Date(ms).toLocaleTimeString(lang === 'es' ? 'es-MX' : 'en-US', { hour: 'numeric', minute: '2-digit' })
  const sentPacket = (kind: PacketDraft['kind']) => outbox.find((p) => p.kind === kind && p.day === day)
  const send = (draft: PacketDraft) => {
    const at = clockNow()
    setNow(at)
    onOutboxChange([queuePacket(draft, scenario, at, speed), ...outbox])
  }

  const drafts: { draft: PacketDraft; label: StringKey; note: StringKey; suggested: boolean }[] = [
    { draft: cmoShare(result, share, painPacketLines(pain, share.mind)), label: 'tx.cmo', note: 'tx.cmoNote', suggested: result.state === 'EARLY_SIGNAL' },
    { draft: weeklySummary(demo.data, day, share), label: 'tx.weekly', note: 'tx.weeklyNote', suggested: !!record?.screen },
  ]
  const escalation = escalationPacket(result)
  if (escalation) drafts.unshift({ draft: escalation, label: 'tx.escalation', note: 'tx.escalationNote', suggested: true })

  const status = (p: Packet) => <PacketStatus packet={p} now={now} live={live} replyAt={earliestReply(p, scenario, speed)} clock={clock} />

  return (
    <div className="transmit">
      <header className="tx-head">
        <h1>{t('tx.title')}</h1>
        <SignalPath scenario={scenario} live={live} />
      </header>

      <section className="tx-card tx-share" aria-labelledby="tx-privacy">
        <h2 id="tx-privacy" className="tx-section-title">
          {t('tx.privacy')}
        </h2>
        <div className="tx-share-row">
          <span className="tx-domain">
            <Icon name="body" size={20} />
          </span>
          <span className="tx-share-name">{t('domain.body')}</span>
          <span className="tx-always">
            <Icon name="lock" size={14} /> {t('tx.always')}
          </span>
          <InfoTip label={t('tx.alwaysTip')}>
            {t('tx.body')} {t('tx.bodyNote')}
          </InfoTip>
        </div>
        {(['mind', 'crew'] as const).map((d) => (
          <label key={d} className="tx-share-row">
            <span className="tx-domain">
              <Icon name={d === 'mind' ? 'mind' : 'crew'} size={20} />
            </span>
            <span className="tx-share-name">
              {t(`domain.${d}`)}
              <span className="sr-only"> · {t('tx.optional')}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="tx-switch"
              checked={share[d]}
              onChange={(e) => onShareChange({ ...share, [d]: e.target.checked })}
            />
          </label>
        ))}
        <p className="tx-never">
          <Icon name="lock" size={16} />
          <span>{t('tx.never')}</span>
        </p>
      </section>

      <section className="tx-packets" aria-labelledby="tx-today">
        <h2 id="tx-today" className="tx-section-title">
          {t('tx.today', { day })}
        </h2>
        <div className="tx-grid">
          {drafts.map(({ draft, label, note, suggested }) => {
            const sent = sentPacket(draft.kind)
            const earth = draft.to === 'flight_surgeons'
            return (
              <article key={draft.kind} className={`tx-packet${suggested && !sent ? ' suggested' : ''}${draft.kind === 'escalation' ? ' red' : ''}`}>
                <div className="tx-packet-head">
                  <span className="tx-who-icon">
                    <Icon name={RECIPIENT_ICON[draft.to]} size={20} />
                  </span>
                  <span className="tx-who">
                    <strong>{t(`tx.who.${draft.to}`)}</strong>
                    <span className="muted">{t(earth ? 'tx.earth' : 'tx.onboard')}</span>
                  </span>
                  <span className="tx-eta">
                    <Icon name={earth && !live ? 'clock' : 'bolt'} size={14} />{' '}
                    {earth && !live ? delayText(scenario.one_way_delay_s)[lang] : t('tx.atOnce')}
                  </span>
                </div>
                {suggested && !sent && <span className="tx-suggested">{t('tx.suggested')}</span>}
                <div className="tx-preview">
                  <p>{packetLineEs(draft.title, lang)}</p>
                  <ul>
                    {draft.lines.map((l) => (
                      <li key={l}>{packetLineEs(l, lang)}</li>
                    ))}
                  </ul>
                </div>
                {sent ? (
                  status(sent)
                ) : (
                  <>
                    <button type="button" className="button wide" onClick={() => send(draft)}>
                      <Icon name="send" size={18} /> {t(label)}
                    </button>
                    <p className="tx-note">{t(note)}</p>
                  </>
                )}
                {draft.kind === 'escalation' && <p className="tx-wait">{t('tx.wait')}</p>}
              </article>
            )
          })}
        </div>
      </section>

      <section className="tx-card tx-outbox" aria-labelledby="tx-outbox">
        <div className="tx-outbox-head">
          <h2 id="tx-outbox" className="tx-section-title">
            {t('tx.outbox')}
          </h2>
          {outbox.length > 0 && (
            <button type="button" className="link" onClick={() => onOutboxChange([])}>
              {t('tx.clear')}
            </button>
          )}
        </div>
        {outbox.length === 0 ? (
          <p className="muted tx-empty">{t('tx.empty')}</p>
        ) : (
          <ul>
            {outbox.map((p) => (
              <li key={p.id}>
                <span className="tx-who-icon small">
                  <Icon name={RECIPIENT_ICON[p.to]} size={16} />
                </span>
                <div>
                  <strong>{packetLineEs(p.title, lang)}</strong>
                  {status(p)}
                </div>
              </li>
            ))}
          </ul>
        )}
        <label className="tx-demo-clock">
          <input type="checkbox" role="switch" className="tx-switch small" checked={demoClock} onChange={(e) => onDemoClockChange(e.target.checked)} />
          <span>{t('tx.demoClock')}</span>
        </label>
      </section>
    </div>
  )
}

/** The delay as a path: her ship, the medical officer onboard (first), Earth after the one-way delay. */
function SignalPath({ scenario, live }: { scenario: Scenario; live: boolean }) {
  const { t, lang } = useI18n()
  const delay = delayText(scenario.one_way_delay_s)[lang]
  const reply = delayText(scenario.one_way_delay_s * 2)[lang]
  const groundFirst = scenario.first_responder === 'ground_and_cmo'
  return (
    <div className="tx-path" role="group" aria-label={live ? t('tx.live', { scenario: scenarioName(scenario)[lang] }) : t('tx.delay', { scenario: scenarioName(scenario)[lang], delay, reply })}>
      <p className="tx-path-label">
        {scenarioName(scenario)[lang]}
      </p>
      <div className="tx-path-track" aria-hidden="true">
        <span className="tx-node">
          <span className="tx-node-icon">
            <Icon name="body" size={20} />
          </span>
          <span>{t('tx.you')}</span>
        </span>
        <span className="tx-link short" />
        <span className="tx-node first">
          <span className="tx-node-icon">
            <Icon name="medic" size={20} />
          </span>
          <span>{t('tx.cmoShort')}</span>
        </span>
        <span className={`tx-link${live ? ' short' : ' long'}`}>
          <span className="tx-link-label">{live ? t('tx.liveShort') : delay}</span>
        </span>
        <span className={`tx-node${groundFirst ? ' first' : ''}`}>
          <span className="tx-node-icon">
            <Icon name="earth" size={20} />
          </span>
          <span>{t('tx.earth')}</span>
        </span>
      </div>
      <p className="tx-first">
        <span className="tx-first-dot" aria-hidden="true" />
        <span>
          {t('tx.first')} {t(groundFirst ? 'tx.firstGround' : 'tx.firstCmo')}
        </span>
      </p>
      {!live && (
        <p className="tx-reply">
          <Icon name="clock" size={14} />
          <span>{t('tx.replyLine', { reply })}</span>
        </p>
      )}
    </div>
  )
}

/** Where a sent packet is: a bar and a countdown in transit, a check and the time once delivered. */
function PacketStatus({ packet, now, live, replyAt, clock }: { packet: Packet; now: number; live: boolean; replyAt: number; clock: (ms: number) => string }) {
  const { t } = useI18n()
  const moving = packet.arrivesAt > now
  const span = Math.max(1, packet.arrivesAt - packet.queuedAt)
  const done = Math.min(1, Math.max(0, (now - packet.queuedAt) / span))
  return (
    <div className={`tx-status${moving ? ' moving' : ' done'}`} role="status">
      {moving ? (
        <>
          <div className="tx-bar" style={{ '--p': done } as CSSProperties}>
            <span />
          </div>
          <p>{t('tx.transit', { time: mmss(packet.arrivesAt - now) })}</p>
        </>
      ) : (
        <p>
          <Icon name="check" size={16} /> {t('tx.delivered', { time: clock(packet.arrivesAt) })}
          {packet.to === 'flight_surgeons' && !live && (
            <span className="muted"> · {replyAt > now ? t('tx.replyIn', { time: mmss(replyAt - now) }) : t('tx.replyAt', { time: clock(replyAt) })}</span>
          )}
        </p>
      )}
    </div>
  )
}
