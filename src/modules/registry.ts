// Module list drives the navigation. Each planned module names its owner so
// the team can work in parallel without touching the same files.

export interface ModuleInfo {
  id: string
  label: string
  summary: string
  owner: string
  planned: string[]
}

export const MODULES: ModuleInfo[] = [
  {
    id: 'today',
    label: 'Today',
    summary: 'Trends and traffic-light status for every indicator, against your own pre-flight normal.',
    owner: 'Engineering',
    planned: [],
  },
  {
    id: 'body',
    label: 'Body',
    summary: 'Interactive human figure: tap a body system to see its function, status and why it changes in space.',
    owner: 'Data science + Engineering',
    planned: ['Clickable SVG body by system', 'Hazard links (radiation, gravity, closed environment)'],
  },
  {
    id: 'mind',
    label: 'Mind',
    summary: 'Daily mood, stress and fatigue check-in, plus cognitive signal from mini-games in check mode.',
    owner: 'Psychology 1',
    planned: ['One-tap evening check-in', 'Reaction-time trend vs personal baseline'],
  },
  {
    id: 'crew',
    label: 'Crew & Family',
    summary: 'Asynchronous messages and recorded check-ins with the support network, showing the real signal delay.',
    owner: 'Psychology 2',
    planned: ['Message queue with delay countdown', 'Crew cohesion pulse'],
  },
  {
    id: 'recharge',
    label: 'Recharge',
    summary: 'Leisure and coping: original mini-games (free play), breathing, music, plants, journaling.',
    owner: 'Psychology 1 + 2',
    planned: ['Two original mini-games (free play vs check mode)', 'Coping menu feasible on board'],
  },
  {
    id: 'routine',
    label: 'Routine',
    summary: 'Measurement reminders and small health quests that fit the mission timeline.',
    owner: 'Engineering',
    planned: ['Daily schedule of prompts', 'Streaks without punishing missed days'],
  },
]

export const DEFAULT_MODULE = 'today'
