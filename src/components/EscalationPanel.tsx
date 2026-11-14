import type { Scenario } from '../data/types'

/** Escalation ladder adapted to the communication delay of the selected mission. */
export function EscalationPanel({ scenario }: { scenario: Scenario }) {
  const delayed = scenario.worstRoundTripMin >= 5
  return (
    <section className="escalation" aria-labelledby="esc-title">
      <h2 id="esc-title">If something is red</h2>
      <ol>
        <li>
          <strong>Self-care.</strong> Follow the suggested step and re-measure.
        </li>
        <li>
          <strong>Crew Medical Officer.</strong> Share the card on board.
        </li>
        <li>
          <strong>Flight surgeons on Earth.</strong>{' '}
          {delayed
            ? `A reply can take ${scenario.worstRoundTripMin}+ min round trip. Act on board first; the summary is queued for the ground.`
            : 'Near real-time contact is available.'}
        </li>
      </ol>
      <p className="disclaimer">Decision support only. This tool does not diagnose.</p>
    </section>
  )
}
