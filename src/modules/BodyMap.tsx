import { useMemo } from 'react'
import type { SymptomLog } from '../orbit/body'
import { boostPlan, DISPLAY, downrankedCards, type BoostLog } from '../orbit/boost'
import type { CareSummary } from '../orbit/care'
import type { Checkins } from '../orbit/checkin'
import type { Scenario } from '../orbit/config'
import type { LoadedDemo } from '../orbit/demoData'
import { evaluateDay } from '../orbit/engine'
import type { PainDay, PainLog } from '../orbit/pain'
import { remindersFor } from '../orbit/plan'
import type { PulseSession } from '../orbit/pulse'
import { useI18n } from '../i18n/context'
import { CareTank } from '../components/CareTank'
import { DayControl } from '../components/DayControl'
import { PainPanel } from '../components/PainPanel'
import { StatePanel } from '../components/StatePanel'
import { SymptomHeatmap } from '../components/SymptomHeatmap'
import { TodayPlan } from '../components/TodayPlan'

interface Props {
  demo: LoadedDemo
  day: number
  onDayChange: (d: number) => void
  scenario: Scenario
  /** Symptoms logged with the old per-system buttons (still shown on the heat map). */
  log: SymptomLog
  /** What she logged on the body, every day (the heat map needs the history). */
  painLog: PainLog
  onPainChange: (pain: PainDay) => void
  /** For the reminders and the self-care she chooses (same log as Boost). */
  checkins: Checkins
  pulseSessions: PulseSession[]
  boostLog: BoostLog
  onBoostLogChange: (log: BoostLog) => void
  /** Protective factors used (the care tank). */
  care: CareSummary
}

/**
 * Today, the first screen. Astronauts have little medical background and little time, so it shows only
 * what they act on: today's state, the protective-factors tank, the heat map of what she logged on her
 * body with "For today" beside it, and logging what she feels where she feels it. The numbers live one
 * tap away in Metrics.
 */
export function BodyMap(props: Props) {
  const { demo, day, onDayChange, scenario, log, painLog, onPainChange, checkins, pulseSessions, boostLog, onBoostLogChange, care } = props
  const { t } = useI18n()
  const { data } = demo
  const result = useMemo(() => evaluateDay(data, day), [data, day])
  const record = data.days.find((d) => d.day === day)

  // Boost's plan for the day, the reminders, and her choices (shared with Boost).
  const plan = useMemo(
    () => boostPlan(result, record, data.persona, downrankedCards(boostLog), data.days.filter((d) => d.day <= day)),
    [result, record, data, boostLog, day],
  )
  const reminders = remindersFor({ day, checkins, pulseSessions, boostLog, painLog, plan })
  const boostToday = boostLog[day] ?? { chosen: [], helped: {} }
  const toggleCard = (id: string) => {
    const chosen = boostToday.chosen.includes(id)
      ? boostToday.chosen.filter((c) => c !== id)
      : boostToday.chosen.length < DISPLAY.max_choices
        ? [...boostToday.chosen, id]
        : boostToday.chosen
    onBoostLogChange({ ...boostLog, [day]: { ...boostToday, chosen } })
  }
  const goToLog = () => document.getElementById('pain-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="body-home">
      <DayControl demo={demo} day={day} onDayChange={onDayChange} />
      <StatePanel result={result} scenario={scenario} />
      <p className="see-metrics">
        <a className="button secondary" href="#/today">
          {t('body.seeMetrics')}
        </a>
      </p>
      <CareTank care={care} />

      <div className="bodymap">
        <section className="bodymap-figure" aria-labelledby="heat-title">
          <h2 id="heat-title">{t('heat.title', { day })}</h2>
          <SymptomHeatmap day={day} painLog={painLog} symptomLog={log} />
          <button type="button" className="button" onClick={goToLog}>
            {t('heat.log')}
          </button>
        </section>

        <div className="bodymap-side">
          <TodayPlan
            day={day}
            plan={plan}
            reminders={reminders}
            painLog={painLog}
            chosen={boostToday.chosen}
            onToggle={toggleCard}
            onPainAgain={goToLog}
          />
        </div>
      </div>

      <PainPanel day={day} pain={painLog[day]} onChange={onPainChange} chosen={boostToday.chosen} onToggleCard={toggleCard} />
    </div>
  )
}
