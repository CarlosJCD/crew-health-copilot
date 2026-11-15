import { useEffect, useMemo, useState } from 'react'
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
  type ShareSettings,
} from '../orbit/transmit'
import { useI18n } from '../i18n/context'
import type { StringKey } from '../i18n/strings'
import { painPacketLines, type PainDay } from '../orbit/pain'

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

/** Outbox with the mission's signal delay, and the switches for what leaves the device. */
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
  const delay = delayText(scenario.one_way_delay_s)[lang]
  const reply = delayText(scenario.one_way_delay_s * 2)[lang]
  const clock = (ms: number) => new Date(ms).toLocaleTimeString(lang === 'es' ? 'es-MX' : 'en-US')
  const sent = (kind: PacketDraft['kind']) => outbox.some((p) => p.kind === kind && p.day === day)
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

  return (
    <div className="transmit">
      <section className="tx-delay">
        <h2>{t('tx.title')}</h2>
        <p>{live ? t('tx.live', { scenario: scenario.label_en }) : t('tx.delay', { scenario: scenario.label_en, delay, reply })}</p>
        <p className="muted">
          {t('tx.first')} {t(scenario.first_responder === 'ground_and_cmo' ? 'tx.firstGround' : 'tx.firstCmo')} ·{' '}
          <span lang="en">{scenario.ground_contact}</span>
        </p>
        <label className="switch-row">
          <input type="checkbox" role="switch" checked={demoClock} onChange={(e) => onDemoClockChange(e.target.checked)} />
          {t('tx.demoClock')}
        </label>
      </section>

      <section className="tx-privacy" aria-labelledby="tx-privacy">
        <h2 id="tx-privacy">{t('tx.privacy')}</h2>
        <label className="switch-row">
          <input type="checkbox" role="switch" checked disabled />
          <span>
            <strong>{t('tx.body')}</strong> <span className="muted">{t('tx.bodyNote')}</span>
          </span>
        </label>
        <label className="switch-row">
          <input type="checkbox" role="switch" checked={share.mind} onChange={(e) => onShareChange({ ...share, mind: e.target.checked })} />
          <span>
            <strong>{t('tx.mind')}</strong> <span className="muted">{t('tx.optional')}</span>
          </span>
        </label>
        <label className="switch-row">
          <input type="checkbox" role="switch" checked={share.crew} onChange={(e) => onShareChange({ ...share, crew: e.target.checked })} />
          <span>
            <strong>{t('tx.crew')}</strong> <span className="muted">{t('tx.optional')}</span>
          </span>
        </label>
        <p className="muted">{t('tx.never')}</p>
      </section>

      <section aria-labelledby="tx-today">
        <h2 id="tx-today">{t('tx.today', { day })}</h2>
        <div className="grid">
          {drafts.map(({ draft, label, note, suggested }) => (
            <article key={draft.kind} className={`card packet${suggested ? ' suggested' : ''}`}>
              {suggested && <span className="tag">{t('tx.suggested')}</span>}
              <h3 lang="en">{draft.title}</h3>
              <p className="muted">{t(`tx.to.${draft.to}`)}</p>
              <ul lang="en">
                {draft.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <p className="muted">{t(note)}</p>
              <button type="button" className="button" disabled={sent(draft.kind)} onClick={() => send(draft)}>
                {sent(draft.kind) ? t('tx.queued') : t(label)}
              </button>
              {draft.kind === 'escalation' && <p>{t('tx.wait')}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="tx-outbox" aria-labelledby="tx-outbox">
        <h2 id="tx-outbox">{t('tx.outbox')}</h2>
        {outbox.length === 0 ? (
          <p className="muted">{t('tx.empty')}</p>
        ) : (
          <ul>
            {outbox.map((p) => {
              const replyAt = earliestReply(p, scenario, speed)
              return (
                <li key={p.id}>
                  <strong lang="en">{p.title}</strong> · {t(`tx.to.${p.to}`)}
                  <br />
                  {p.arrivesAt > now ? (
                    <span className="in-transit">{t('tx.transit', { time: mmss(p.arrivesAt - now) })}</span>
                  ) : (
                    <span>{t('tx.delivered', { time: clock(p.arrivesAt) })}</span>
                  )}
                  {p.to === 'flight_surgeons' && !live && (
                    <span className="muted"> · {replyAt > now ? t('tx.replyIn', { time: mmss(replyAt - now) }) : t('tx.replyAt', { time: clock(replyAt) })}</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {outbox.length > 0 && (
          <button type="button" className="link" onClick={() => onOutboxChange([])}>
            {t('tx.clear')}
          </button>
        )}
      </section>
    </div>
  )
}
