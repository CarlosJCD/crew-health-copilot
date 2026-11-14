// UI strings. English is the default: Orbit is presented in English (handoff) and judges review it
// in English. Rule texts ("Why?", rule, action) come from orbit-indicators.json, in English only.
// To add a language: add it to LANGS, then add a dictionary with every key of `en`
// (TypeScript fails the build if a key is missing) and the matching field in every `Localized` value.

export const LANGS = ['en', 'es'] as const
export type Lang = (typeof LANGS)[number]

/** Text that lives in data files (modules, scenario names). */
export type Localized = Record<Lang, string>

const en = {
  'lang.name': 'English',
  'lang.switchTo': 'Switch language',
  'net.online': 'Online',
  'net.offline': 'Offline mode',
  'nav.label': 'Modules',
  'footer': 'Prototype for NASA Space Apps Challenge 2026. Synthetic data, not a diagnostic tool. Orbit supports decisions; it does not diagnose.',

  'scenario.label': 'Mission',
  'scenario.delay': 'Signal delay to Earth: {delay}',

  'persona.line': '{name}, {role} · day {day} of {length} · synthetic data',
  'day.label': 'Mission day {n}',
  'day.hint': 'Demo replay: built-in story',
  'day.hintFile': 'Demo replay: data team file',
  'day.log': 'Mission log:',
  'data.issues': 'Dataset check for the data team: {n}',

  'domain.body': 'Body',
  'domain.mind': 'Mind',
  'domain.crew': 'Crew',
  'color.green': 'Green',
  'color.yellow': 'Yellow',
  'color.red': 'Red',
  'color.none': 'No data',
  'color.aria': '{domain}: {color}',
  'ring.flagged': 'Yellow or red: {list}',
  'ring.clear': 'All in your range',

  'state.GREEN': 'Green',
  'state.YELLOW': 'Yellow: self-care',
  'state.EARLY_SIGNAL': 'Early cross-domain signal',
  'state.RED_PHYSICAL': 'Red: needs a person',
  'state.RED_PSYCH': 'Red: you asked to talk',
  'state.days': 'Two or more domains in yellow for two days in a row.',
  'state.to': 'Who sees it:',
  'who.none': 'only you',
  'who.self': 'only you (self-care)',
  'who.crew_medical_officer': 'your crew medical officer',
  'who.astronaut_choice': 'the person you choose',
  'state.offer': 'You can choose to share it with your crew medical officer.',
  'state.ground': 'A packet goes to Earth and arrives in {delay}. A reply takes {reply} or more.',
  'state.groundLive': 'Ground support is available in near real time.',
  'state.boost': 'Open Boost',
  'state.disclaimer': 'Orbit supports decisions; it does not diagnose.',

  'card.why': 'Why?',
  'card.hide': 'Hide',
  'card.rule': 'Rule:',
  'card.action': 'What to do:',
  'card.risk': 'NASA HRP risk:',
  'card.sources': 'Sources:',
  'card.noSources': 'Source pending (Psychology 1).',
  'card.team': 'Team criterion, pending validation:',
  'card.usual': 'your usual {value}',
  'card.trend': '{label} trend',
  'card.englishOnly': 'Rule texts come from orbit-indicators.json.',

  'sw.title': 'Space weather (radiation context)',
  'sw.flares': 'solar flares',
  'sw.strong': 'M-class or stronger',
  'sw.sep': 'solar energetic particle events',
  'sw.window': 'In the {days} days up to {end}.',
  'sw.strongest': 'Strongest flare: {cls} on {date}.',
  'sw.source': 'Source:',
  'sw.updated': 'updated {date}',
  'sw.partial': 'partial download',
  'sw.unavailable': 'not downloaded',
  'sw.missing': 'No space-weather snapshot yet. It is downloaded from NASA DONKI each time the app is published.',
  'sw.context': 'Context only: this app does not measure radiation dose. Follow your mission radiation procedures.',
  'sw.hazardLink': 'NASA HRP: spaceflight hazards',
  'sw.dose': 'Estimated mission dose: {dose} mSv/day. Not a personal dose.',
  'sw.doseNone': 'Estimated mission dose: not shown for this scenario (not verified).',

  'placeholder.next': 'Coming next',
  'placeholder.owner': 'Owner: {owner}',
}

export type StringKey = keyof typeof en

const es: Record<StringKey, string> = {
  'lang.name': 'Español',
  'lang.switchTo': 'Cambiar idioma',
  'net.online': 'En línea',
  'net.offline': 'Sin conexión',
  'nav.label': 'Módulos',
  'footer': 'Prototipo para el NASA Space Apps Challenge 2026. Datos sintéticos, no es una herramienta de diagnóstico. Orbit apoya decisiones; no diagnostica.',

  'scenario.label': 'Misión',
  'scenario.delay': 'Retraso de señal a la Tierra: {delay}',

  'persona.line': '{name}, {role} · día {day} de {length} · datos sintéticos',
  'day.label': 'Día de misión {n}',
  'day.hint': 'Recorrido de demostración: historia integrada',
  'day.hintFile': 'Recorrido de demostración: archivo del equipo de datos',
  'day.log': 'Bitácora:',
  'data.issues': 'Revisión del dataset para el equipo de datos: {n}',

  'domain.body': 'Cuerpo',
  'domain.mind': 'Mente',
  'domain.crew': 'Tripulación',
  'color.green': 'Verde',
  'color.yellow': 'Amarillo',
  'color.red': 'Rojo',
  'color.none': 'Sin datos',
  'color.aria': '{domain}: {color}',
  'ring.flagged': 'En amarillo o rojo: {list}',
  'ring.clear': 'Todo dentro de tu rango',

  'state.GREEN': 'Verde',
  'state.YELLOW': 'Amarillo: autocuidado',
  'state.EARLY_SIGNAL': 'Señal temprana entre dominios',
  'state.RED_PHYSICAL': 'Rojo: necesita a una persona',
  'state.RED_PSYCH': 'Rojo: pediste hablar con alguien',
  'state.days': 'Dos o más dominios en amarillo dos días seguidos.',
  'state.to': 'Quién lo ve:',
  'who.none': 'solo tú',
  'who.self': 'solo tú (autocuidado)',
  'who.crew_medical_officer': 'tu oficial médico de la tripulación',
  'who.astronaut_choice': 'la persona que tú elijas',
  'state.offer': 'Puedes elegir compartirlo con tu oficial médico de la tripulación.',
  'state.ground': 'Sale un paquete a la Tierra y llega en {delay}. La respuesta tarda {reply} o más.',
  'state.groundLive': 'Hay apoyo de Tierra casi en tiempo real.',
  'state.boost': 'Abrir Boost',
  'state.disclaimer': 'Orbit apoya decisiones; no diagnostica.',

  'card.why': '¿Por qué?',
  'card.hide': 'Ocultar',
  'card.rule': 'Regla:',
  'card.action': 'Qué hacer:',
  'card.risk': 'Riesgo HRP de NASA:',
  'card.sources': 'Fuentes:',
  'card.noSources': 'Fuente pendiente (Psicología 1).',
  'card.team': 'Criterio del equipo, pendiente de validar:',
  'card.usual': 'tu normal {value}',
  'card.trend': 'Tendencia de {label}',
  'card.englishOnly': 'Los textos de las reglas están en inglés (orbit-indicators.json).',

  'sw.title': 'Clima espacial (contexto de radiación)',
  'sw.flares': 'fulguraciones solares',
  'sw.strong': 'de clase M o mayor',
  'sw.sep': 'eventos de partículas solares energéticas',
  'sw.window': 'En los {days} días hasta el {end}.',
  'sw.strongest': 'Fulguración más intensa: {cls} el {date}.',
  'sw.source': 'Fuente:',
  'sw.updated': 'actualizado el {date}',
  'sw.partial': 'descarga parcial',
  'sw.unavailable': 'sin descargar',
  'sw.missing': 'Aún no hay datos de clima espacial. Se descargan de NASA DONKI cada vez que se publica la app.',
  'sw.context': 'Solo contexto: esta app no mide la dosis de radiación. Sigue los procedimientos de radiación de tu misión.',
  'sw.hazardLink': 'NASA HRP: peligros del vuelo espacial',
  'sw.dose': 'Dosis estimada de la misión: {dose} mSv/día. No es una dosis personal.',
  'sw.doseNone': 'Dosis estimada de la misión: no se muestra en este escenario (sin verificar).',

  'placeholder.next': 'Lo que sigue',
  'placeholder.owner': 'Responsable: {owner}',
}

export const DICTIONARIES: Record<Lang, Record<StringKey, string>> = { en, es }

/** Units that read differently per language; anything not listed is shown as is. */
export const UNITS: Record<Lang, Record<string, string>> = {
  en: {},
  es: { msgs: 'msjs' },
}

export function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}
