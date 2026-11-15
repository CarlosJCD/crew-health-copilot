import { useState } from 'react'
import Body from 'react-muscle-highlighter'
import type { SymptomLog } from '../orbit/body'
import { FIGURE, partKey } from '../orbit/display'
import { HEAT, heatColor, heatOn, type ZoneHeat } from '../orbit/heat'
import { BRUSH, INTENSITY_COLORS, toViewerSide, type BodyView, type PainLog } from '../orbit/pain'
import { useI18n } from '../i18n/context'
import { useFigure } from '../lib/figure'
import { symptomEs } from '../i18n/dynamic'

interface Props {
  day: number
  painLog: PainLog
  symptomLog: SymptomLog
}

/**
 * Heat map of the symptoms she logged on the body: warm where she logged recently, cooling day by day
 * unless she logs that zone again. Display only; the engine does not use it.
 */
export function SymptomHeatmap({ day, painLog, symptomLog }: Props) {
  const { t, lang } = useI18n()
  const [figure] = useFigure()
  const [view, setView] = useState<BodyView>('front')
  const other: BodyView = view === 'front' ? 'back' : 'front'
  const heat = heatOn(day, view, painLog, symptomLog)
  const otherWarm = heatOn(day, other, painLog, symptomLog).zones.length
  const sideName = (v: BodyView) => t(v === 'front' ? 'pain.front' : 'pain.back')
  const ago = (d: number) => (day - d === 0 ? t('heat.today') : day - d === 1 ? t('heat.agoOne') : t('heat.ago', { n: day - d }))
  const what = (z: ZoneHeat) => z.what.map((w) => (w === 'pain' ? t('heat.pain', { n: z.intensity }) : w)).join(', ')

  return (
    <div className="heat">
      <div className="actions" role="group" aria-label={t('pain.view')}>
        {(['front', 'back'] as const).map((v) => (
          <button key={v} type="button" className="button secondary" aria-pressed={view === v} onClick={() => setView(v)}>
            {sideName(v)}
          </button>
        ))}
      </div>

      <div className="pain-figure heat-figure" role="img" aria-label={t('heat.figure', { view: sideName(view) })}>
        <Body
          gender={figure}
          side={view}
          scale={1.4}
          data={heat.zones.map((z) => ({ slug: z.zone, color: heatColor(z.warmth), ...(z.side ? { side: toViewerSide(z.side, view) } : {}) }))}
          defaultFill={FIGURE.fill}
          border={FIGURE.border}
        />
        <div className="paint-layer" aria-hidden="true">
          {heat.dots.filter((d) => (d.figure ?? 'female') === figure).map((d) => (
            <span
              key={d.key}
              className="paint-dot"
              style={{
                left: `${d.x * 100}%`,
                top: `${d.y * 100}%`,
                width: `${BRUSH[d.size] * 100}%`,
                opacity: 0.35 + 0.6 * d.warmth,
                background: `radial-gradient(circle, ${heatColor(d.warmth)} 0 35%, transparent 70%)`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="heat-legend" aria-hidden="true">
        <span>{t('heat.recent')}</span>
        <span className="heat-bar" style={{ background: `linear-gradient(90deg, ${[...INTENSITY_COLORS].reverse().join(', ')}, ${FIGURE.fill})` }} />
        <span>{t('heat.older')}</span>
      </div>
      <p className="hint">{t('heat.legend', { n: HEAT.halfLifeDays })}</p>

      {heat.zones.length === 0 ? (
        <p className="muted">{t('heat.empty', { n: HEAT.windowDays })}</p>
      ) : (
        <>
          <p className="heat-list-title">{t('heat.list')}</p>
          <ul className="heat-list">
            {heat.zones.map((z) => (
              <li key={z.zone}>
                <span className="swatch" style={{ background: heatColor(z.warmth) }} aria-hidden="true" />
                {t('heat.item', {
                  zone: `${t(partKey(z.zone))}${z.side ? ` (${t(z.side === 'left' ? 'pain.left' : 'pain.right')})` : ''}`,
                  what: what(z),
                  day: z.day,
                  ago: ago(z.day),
                })}
              </li>
            ))}
          </ul>
        </>
      )}

      {otherWarm > 0 && (
        <button type="button" className="button secondary" onClick={() => setView(other)}>
          {t('heat.other', { side: sideName(other), n: otherWarm })}
        </button>
      )}

      {heat.noPlace.length > 0 && (
        <p className="muted">
          {t('heat.noPlace')}{' '}
          <span>{heat.noPlace.map((s) => `${symptomEs(s.symptom, lang)} (${s.day})`).join(', ')}</span>
        </p>
      )}
    </div>
  )
}
