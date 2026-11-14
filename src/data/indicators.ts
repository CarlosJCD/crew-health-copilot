import type { IndicatorDef, SourceRef } from './types'

// Every threshold carries a source. Anything not yet checked by the science team
// stays `verified: false` and the UI says so. Do not mark a source as verified
// unless someone on the team has opened it.
const pending: SourceRef = { label: 'Threshold pending verification (Phase 3 matrix)', verified: false }

const jones2022: SourceRef = {
  label: 'Jones et al. (2022), Sleep 45(3): ISS astronauts, sleep < 6 h linked to slower response speed',
  url: 'https://doi.org/10.1093/sleep/zsac006',
  verified: true,
}

export const INDICATORS: IndicatorDef[] = [
  // Biological
  {
    id: 'sleep',
    label: 'Sleep',
    unit: 'h',
    domain: 'biological',
    hazards: ['isolation', 'environment'],
    method: 'Wearable or sleep log',
    explainer: 'Sleep supports mood, focus and recovery. Short nights add up over a mission.',
    bands: { watchBelow: 6, actBelow: 5 },
    bandsSource: jones2022,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'low',
    decimals: 1,
  },
  {
    id: 'hr',
    label: 'Resting heart rate',
    unit: 'bpm',
    domain: 'biological',
    hazards: ['gravity', 'environment'],
    method: 'Wearable or chest strap, on waking',
    explainer: 'A resting rate well above your usual can mean poor recovery, stress or illness.',
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'high',
  },
  {
    id: 'sbp',
    label: 'Blood pressure (systolic)',
    unit: 'mmHg',
    domain: 'biological',
    hazards: ['gravity'],
    method: 'Arm cuff, seated, same time each day',
    explainer: 'Fluids shift toward the head in microgravity. Track changes against your own normal.',
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
  },
  {
    id: 'glucose',
    label: 'Blood glucose (fasting)',
    unit: 'mg/dL',
    domain: 'biological',
    hazards: ['environment', 'gravity'],
    method: 'Finger-stick glucometer, before breakfast',
    explainer: 'Inactivity and diet changes can affect how your body handles sugar.',
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
  },
  {
    id: 'temp',
    label: 'Body temperature',
    unit: '°C',
    domain: 'biological',
    hazards: ['environment', 'radiation'],
    method: 'Thermometer, on waking',
    explainer: 'Immune changes in flight can make infections more likely. A rise is an early clue.',
    bandsSource: pending,
    baselineSd: { watch: 2, act: 3 },
    worseWhen: 'high',
    decimals: 1,
  },
  // Cognitive-emotional
  {
    id: 'mood',
    label: 'Mood',
    unit: '/10',
    domain: 'cognitive-emotional',
    hazards: ['isolation', 'distance'],
    method: 'One-tap self-report, evening',
    explainer: 'Low days happen. A run of them is worth acting on early, before it grows.',
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'low',
  },
  {
    id: 'stress',
    label: 'Perceived stress',
    unit: '/10',
    domain: 'cognitive-emotional',
    hazards: ['isolation', 'distance'],
    method: 'One-tap self-report, evening',
    explainer: 'Stress that stays high for days affects sleep, focus and immunity.',
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'high',
  },
  {
    id: 'rt',
    label: 'Reaction time',
    unit: 'ms',
    domain: 'cognitive-emotional',
    hazards: ['isolation', 'gravity'],
    method: '3-minute vigilance mini-game (check mode)',
    explainer: 'Slower reactions often show fatigue before you feel it. Compared only with yourself.',
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'high',
  },
  // Social
  {
    id: 'contact',
    label: 'Contact with family and friends',
    unit: 'msgs/wk',
    domain: 'social',
    hazards: ['isolation', 'distance'],
    method: 'Counted automatically from the Crew & Family module',
    explainer: 'Staying connected protects mood. A drop in contact is a gentle nudge, not a warning.',
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'low',
  },
  // Protective
  {
    id: 'exercise',
    label: 'Exercise',
    unit: 'min',
    domain: 'protective',
    hazards: ['gravity'],
    method: 'Logged from exercise device or by hand',
    explainer: 'Exercise protects bone, muscle and heart in low gravity, and lifts mood.',
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'low',
  },
]

export const DOMAIN_LABELS: Record<IndicatorDef['domain'], string> = {
  biological: 'Body',
  'cognitive-emotional': 'Mind',
  social: 'Connection',
  protective: 'Protective habits',
}

export function getIndicator(id: string): IndicatorDef | undefined {
  return INDICATORS.find((i) => i.id === id)
}
