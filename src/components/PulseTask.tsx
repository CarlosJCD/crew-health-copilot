import { useCallback, useEffect, useRef, useState } from 'react'
import { fill, isPractice, nextInterval, PULSE, PULSE_SPEC, scoreSession, type PulseResult, type PulseSession, type Trial } from '../orbit/pulse'
import { useI18n } from '../i18n/context'
import { useContent } from '../i18n/content'

const TRIAL_RUN_MS = 30_000

type Phase = 'wait' | 'stimulus' | 'feedback' | 'early'

/** The running task: tap anywhere (or Space) when the millisecond counter appears. */
function PulseRun({ durationMs, onFinish, onStop }: { durationMs: number; onFinish: (r: PulseResult) => void; onStop: () => void }) {
  const { t } = useI18n()
  const [phase, setPhase] = useState<Phase>('wait')
  const [shown, setShown] = useState(0)
  const [left, setLeft] = useState(durationMs)
  const trials = useRef<Trial[]>([])
  const onset = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const raf = useRef<number | undefined>(undefined)
  const phaseRef = useRef<Phase>('wait')
  const areaRef = useRef<HTMLDivElement>(null)

  const go = (p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }
  const clear = () => {
    window.clearTimeout(timer.current)
    if (raf.current) cancelAnimationFrame(raf.current)
  }
  const tick = useCallback(() => {
    setShown(Math.round(performance.now() - onset.current))
    raf.current = requestAnimationFrame(tick)
  }, [])
  const schedule = useCallback(() => {
    go('wait')
    timer.current = window.setTimeout(() => {
      onset.current = performance.now()
      setShown(0)
      go('stimulus')
      raf.current = requestAnimationFrame(tick)
    }, nextInterval())
  }, [tick])

  const respond = useCallback(() => {
    const p = phaseRef.current
    if (p === 'stimulus') {
      const rt = performance.now() - onset.current
      clear()
      trials.current.push({ rtMs: rt })
      setShown(Math.round(rt))
      go('feedback')
      timer.current = window.setTimeout(schedule, PULSE.feedbackMs)
    } else if (p === 'wait') {
      clear()
      trials.current.push({ early: true })
      go('early')
      timer.current = window.setTimeout(schedule, PULSE.feedbackMs)
    }
  }, [schedule])

  useEffect(() => {
    const start = performance.now()
    areaRef.current?.focus()
    schedule()
    const clock = window.setInterval(() => setLeft(Math.max(0, durationMs - (performance.now() - start))), 250)
    const end = window.setTimeout(() => {
      clear()
      onFinish(scoreSession(trials.current))
    }, durationMs)
    return () => {
      clear()
      window.clearInterval(clock)
      window.clearTimeout(end)
    }
    // Runs once per task; the callbacks are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const s = Math.ceil(left / 1000)
  return (
    <div className="pulse-run">
      <div
        ref={areaRef}
        className={`pulse-area ${phase}`}
        role="button"
        tabIndex={0}
        aria-label={t('pulse.tap')}
        onPointerDown={(e) => {
          e.preventDefault()
          respond()
        }}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            respond()
          }
        }}
      >
        <div className="pulse-box" aria-live="off">
          {phase === 'stimulus' || phase === 'feedback' ? <span className="pulse-counter">{shown}</span> : null}
          {phase === 'early' && <span className="pulse-early">{t('pulse.early')}</span>}
        </div>
        <p className="muted">{t('pulse.tap')}</p>
      </div>
      <div className="pulse-foot">
        <span className="muted">{t('pulse.left', { time: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` })}</span>
        <button type="button" className="link" onClick={onStop}>
          {t('pulse.stop')}
        </button>
      </div>
    </div>
  )
}

interface Props {
  day: number
  /** Her usual median reaction time (persona baseline), if known. */
  baselineMs?: number
  sessions: PulseSession[]
  onSessionsChange: (s: PulseSession[]) => void
}

type Mode = 'idle' | 'running' | 'trial'

/** Pulse mode card in Mind: intro, start, skip, and the message after a session (texts from pulse-spec.json). */
export function PulseTask({ day, baselineMs, sessions, onSessionsChange }: Props) {
  const { t } = useI18n()
  const c = useContent()
  const [mode, setMode] = useState<Mode>('idle')
  const [message, setMessage] = useState<{ lines: string[] } | undefined>()
  const today = sessions.filter((s) => s.day === day)

  const finish = (result: PulseResult) => {
    if (mode === 'trial') {
      setMessage({ lines: [t('pulse.trialDone', { n: result.valid })] })
      setMode('idle')
      return
    }
    const practice = isPractice(sessions, baselineMs !== undefined)
    const at = Date.now()
    onSessionsChange([...sessions, { id: `pulse-${day}-${at}`, day, at, practice, result }])
    const counted = sessions.filter((s) => s.result.median_ms !== null).length + (result.median_ms !== null ? 1 : 0)
    const lines =
      result.median_ms === null
        ? [t('pulse.noResult', { n: PULSE.minValid })]
        : practice
          ? [fill(c(PULSE_SPEC.after_practice_session_en), { n: counted })]
          : [fill(c(PULSE_SPEC.after_session_en), { median_ms: result.median_ms, baseline_ms: baselineMs ?? '–' })]
    lines.push(t('pulse.details', { lapses: result.lapses, early: result.false_starts }))
    setMessage({ lines })
    setMode('idle')
  }

  if (mode !== 'idle') {
    return (
      <PulseRun
        durationMs={mode === 'trial' ? TRIAL_RUN_MS : PULSE.durationMs}
        onFinish={finish}
        onStop={() => {
          setMode('idle')
          setMessage(undefined)
        }}
      />
    )
  }

  return (
    <div className="pulse-intro">
      <p>{c(PULSE_SPEC.intro_en)}</p>
      <button type="button" className="button wide" onClick={() => (setMessage(undefined), setMode('running'))}>
        {t('pulse.start')}
      </button>
      <div className="pulse-alt">
        <button type="button" className="button secondary" onClick={() => (setMessage(undefined), setMode('trial'))}>
          {t('pulse.trial')}
        </button>
        <button type="button" className="link" onClick={() => setMessage({ lines: [c(PULSE_SPEC.after_skip_en)] })}>
          {t('pulse.skip')}
        </button>
      </div>
      {message && (
        <div role="status" className="pulse-message">
          {message.lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      )}
      {today.length > 0 && (
        <p className="muted">
          {t('pulse.todayCount', { n: today.length })}{' '}
          <button type="button" className="link" onClick={() => onSessionsChange(sessions.filter((s) => s.day !== day))}>
            {t('pulse.reset')}
          </button>
        </p>
      )}
    </div>
  )
}
