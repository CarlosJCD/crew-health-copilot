import { useEffect, useState } from 'react'
import { loadSpaceWeather, summarize, type SpaceWeatherSnapshot } from '../data/spaceWeather'
import { useI18n } from '../i18n/context'

const HRP_HAZARDS_URL = 'https://www.nasa.gov/hrp/hazards/'

/** Radiation context: NASA DONKI snapshot plus the scenario's estimated mission dose (RAD, scenarios.json). */
export function SpaceWeatherPanel({ doseMSvDay }: { doseMSvDay?: number | null }) {
  const { t, lang, num } = useI18n()
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

  return (
    <section className="space-weather" aria-labelledby="sw-title">
      <h2 id="sw-title">{t('sw.title')}</h2>
      {snapshot ? <SnapshotBody snapshot={snapshot} date={date} /> : snapshot === undefined && <p>{t('sw.missing')}</p>}
      <p className="dose">
        {typeof doseMSvDay === 'number' ? t('sw.dose', { dose: num(doseMSvDay, 2) }) : t('sw.doseNone')}
      </p>
      <p className="disclaimer">
        {t('sw.context')}{' '}
        <a href={HRP_HAZARDS_URL} target="_blank" rel="noreferrer">
          {t('sw.hazardLink')}
        </a>
      </p>
    </section>
  )
}

function Stat({ value, label }: { value: number | null; label: string }) {
  const { t } = useI18n()
  return value === null ? (
    <span className="na">
      <strong aria-hidden="true">–</strong> {label} ({t('sw.unavailable')})
    </span>
  ) : (
    <span>
      <strong>{value}</strong> {label}
    </span>
  )
}

function SnapshotBody({ snapshot, date }: { snapshot: SpaceWeatherSnapshot; date: (iso: string) => string }) {
  const { t } = useI18n()
  const s = summarize(snapshot)
  return (
    <>
      <p className="sw-stats">
        <Stat value={s.flares} label={t('sw.flares')} />
        <Stat value={s.strongFlares} label={t('sw.strong')} />
        <Stat value={s.sep} label={t('sw.sep')} />
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
