import { CARDS, DISPLAY, type BoostPlan } from '../orbit/boost'
import { regionLabel } from '../orbit/display'
import type { PainEvent, PainLog } from '../orbit/pain'
import { todaySuggestions, triggerLabel, type Because, type Reminder } from '../orbit/plan'
import { useI18n } from '../i18n/context'
import type { StringKey } from '../i18n/strings'
import { SuggestionCard } from './SuggestionCard'

interface Props {
  day: number
  plan: BoostPlan
  reminders: Reminder[]
  painLog: PainLog
  chosen: string[]
  onToggle: (cardId: string) => void
  /** Takes her to "Does something hurt?" to log a pain again. */
  onPainAgain: () => void
}

const REMINDER: Record<Exclude<Reminder['id'], 'pain_again'>, { text: StringKey; href: string }> = {
  safety: { text: 'plan.safety', href: '#/boost' },
  checkin: { text: 'plan.checkin', href: '#/mind' },
  pulse: { text: 'plan.pulse', href: '#/mind' },
  did_it_help: { text: 'plan.didItHelp', href: '#/boost' },
}

/** "For today", next to the body: what she has not logged yet, and the self-care she can choose. */
export function TodayPlan({ day, plan, reminders, painLog, chosen, onToggle, onPainAgain }: Props) {
  const { t, lang } = useI18n()
  const { red, items } = todaySuggestions(plan, day, painLog)
  const where = (e: PainEvent) => e.regions.map((r) => regionLabel(r, lang)).join(', ')
  const because = (b: Because) =>
    b.kind === 'trigger' ? triggerLabel(b.trigger) : t('plan.becausePain', { where: where(b.event).toLowerCase(), day: b.day })

  return (
    <section className="card plan-today" aria-labelledby="plan-title">
      <h2 id="plan-title">{t('plan.title')}</h2>

      <h3>{t('plan.reminders')}</h3>
      {reminders.length === 0 ? (
        <p className="muted">{t('plan.none')}</p>
      ) : (
        <ul className="reminders">
          {reminders.map((r) =>
            r.id === 'pain_again' ? (
              <li key={`pain-${r.day}-${r.event.id}`}>
                <span>{t('plan.painAgain', { where: where(r.event), day: r.day })}</span>
                <button type="button" className="button secondary" onClick={onPainAgain}>
                  {t('plan.go')}
                </button>
              </li>
            ) : (
              <li key={r.id}>
                <span>
                  {t(REMINDER[r.id].text)}
                  {r.id === 'did_it_help' && (
                    <span className="muted" lang="en">
                      {' '}
                      ({r.cards.map((id) => CARDS[id]?.title_en ?? id).join(', ')})
                    </span>
                  )}
                </span>
                <a className="button secondary" href={REMINDER[r.id].href}>
                  {t('plan.go')}
                </a>
              </li>
            ),
          )}
        </ul>
      )}

      <h3>{t('plan.suggested')}</h3>
      {red && <p className="alarm-text">{t('plan.redFirst')}</p>}
      {items.length === 0 ? (
        <p className="muted">{t('plan.empty')}</p>
      ) : (
        <div className="suggestions">
          {items.map((s) => (
            <SuggestionCard
              key={s.card.id}
              card={s.card}
              because={s.because.map(because)}
              chosen={chosen.includes(s.card.id)}
              full={chosen.length >= DISPLAY.max_choices}
              onToggle={() => onToggle(s.card.id)}
            />
          ))}
        </div>
      )}
      {/* On a red day there is nothing to choose: the medical officer comes first. */}
      {!red && <p className="hint">{t('plan.disclaimer', { n: DISPLAY.max_choices })}</p>}
    </section>
  )
}
