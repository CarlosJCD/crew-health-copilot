import { useEffect, useState } from 'react'
import { loadSpaceWeather, summarize, type SpaceWeatherSnapshot } from '../data/spaceWeather'
import { useI18n } from '../i18n/context'

const HRP_HAZARDS_URL = 'https://www.nasa.gov/hrp/hazards/'

/** Context panel for the space-radiation hazard, fed by the NASA DONKI snapshot. */
export function SpaceWeatherPanel() {
  const { t, lang } = useI18n()
  const [snapshot, setSnapshot] = useState<SpaceWeatherSnapshot | undefined | null>(null)

  useEffect(() => {
    loadSpaceWeather().then(setSnapshot)
  }, [])

  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })

  if (snapshot === null) return null // still loading

  return (
    <section className="space-weather" aria-labelledby="sw-title">
      <h2 id="sw-title">{t('sw.title')}</h2>
      {snapshot ? (
        <SnapshotBody snapshot={snapshot} date={date} />
      ) : (
        <p>{t('sw.missing')}</p>
      )}
      <p className="disclaimer">
        {t('sw.context')}{' '}
        <a href={HRP_HAZARDS_URL} target="_blank" rel="noreferrer">
          {t('sw.hazardLink')}
        </a>
      </p>
    </section>
  )
}

function SnapshotBody({ snapshot, date }: { snapshot: SpaceWeatherSnapshot; date: (iso: string) => string }) {
  const { t } = useI18n()
  const s = summarize(snapshot)
  return (
    <>
      <p className="sw-stats">
        <span>
          <strong>{s.flares}</strong> {t('sw.flares')}
        </span>
        <span>
          <strong>{s.strongFlares}</strong> {t('sw.strong')}
        </span>
        <span>
          <strong>{s.sep}</strong> {t('sw.sep')}
        </span>
      </p>
      <p>
        {t('sw.window', { days: snapshot.windowDays, end: date(snapshot.endDate) })}
        {s.strongest?.classType && <> {t('sw.strongest', { cls: s.strongest.classType, date: date(s.strongest.time) })}</>}
      </p>
      <p className="source">
        {t('sw.source')}{' '}
        <a href={snapshot.source.url} target="_blank" rel="noreferrer">
          NASA DONKI
        </a>{' '}
        · {t('sw.updated', { date: date(snapshot.fetchedAt) })}
        {snapshot.complete === false && ` · ${t('sw.partial')}`}
      </p>
    </>
  )
}
