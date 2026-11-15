// Entry for the standalone engine bundle used by the data team's human simulator
// (same exports as their src/entry-engine.ts). Built by scripts/build-engine-bundle.mjs.
export { evaluateDay, EVALUATED, worstColor, STATE_ESCALATION, pulseBaseline, inARow } from '../src/orbit/engine'
export { RULES, SCENARIOS, DOMAIN_IDS, checkRules } from '../src/orbit/config'
export { validateDemoData, BUILT_IN_DEMO, plausibleRange, NUMERIC_FIELDS } from '../src/orbit/demoData'
