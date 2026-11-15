import { useEffect, useState } from 'react'
import { getIndicator } from '../orbit/config'
import { COLOR_SYMBOL } from '../orbit/display'
import { isModel, loadSepReplay, type SepReplay as Replay } from '../data/spaceWeather'
import { useI18n } from '../i18n/context'
import { L } from '../i18n/content'

/**
 * Replays the real solar particle event of May 9, 2024 (NASA DONKI) in the radiation layer.
 * Rule from orbit-indicators.json (radiation): yellow while an event is active, never red;
 * shelter is an operational decision. Context only: it does not change the Body, Mind or Crew rings.
 */
export function SepReplay() {
  const { t, lang } = useI18n()
  const [replay, setReplay] = useState<Replay | undefined>()
  const [active, setActive] = useState(false)
  useEffect(() => {
    loadSepReplay().then(setReplay)
  }, [])
  if (!replay) return null

  const radiation = getIndicator('radiation')
  const first = replay.sep.find((e) => e.time.startsWith('2024-05-09')) ?? replay.sep[0]
  const storm = replay.sep.filter((e) => e.time >= first.time && e.time < '2024-05-14')
  const when = (iso: string) =>
    new Date(iso).toLocaleString(lang === 'es' ? 'es-MX' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
    })

  return (
    <div className="sep-replay">
      <h3>{t('sep.title')}</h3>
      <p>{t('sep.intro', { n: replay.sep.length })}</p>
      <button type="button" className="button secondary" aria-pressed={active} onClick={() => setActive((a) => !a)}>
        {active ? t('sep.stop') : t('sep.start')}
      </button>
      {active && (
        <div className="replay-box color-yellow" role="status">
          <p className="replay-status">
            <span aria-hidden="true">{COLOR_SYMBOL.yellow}</span> <strong>{t('sep.status')}</strong>{' '}
            {t('sep.since', { time: when(first.time) })}
          </p>
          <p>
            <strong>{t('card.action')}</strong> {L(radiation.action_en, lang)}
          </p>
          <p className="muted">{L(radiation.rule_en, lang)}</p>
          <ol className="replay-list">
            {storm.map((e) => (
              <li key={e.id}>
                {when(e.time)} UTC · <span lang="en">{e.instruments.join(', ')}</span>
                {isModel(e) && <span className="muted"> ({t('sep.model')})</span>}{' '}
                {e.link && (
                  <a href={e.link} target="_blank" rel="noreferrer">
                    DONKI
                  </a>
                )}
              </li>
            ))}
          </ol>
          <p className="muted">{t('sep.note')}</p>
        </div>
      )}
    </div>
  )
}
