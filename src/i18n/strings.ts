// UI strings. English is the default because Space Apps judges review the project in English.
// To add a language: add it to LANGS, then add a dictionary with every key of `en`
// (TypeScript fails the build if a key is missing) and the matching field in every `Localized` value.

export const LANGS = ['en', 'es'] as const
export type Lang = (typeof LANGS)[number]

/** Text that lives in data files (indicators, scenarios, modules). */
export type Localized = Record<Lang, string>

const en = {
  'lang.name': 'English',
  'lang.switchTo': 'Switch language',
  'net.online': 'Online',
  'net.offline': 'Offline mode',
  'nav.label': 'Modules',
  'footer': 'Prototype for NASA Space Apps Challenge 2026. Synthetic data. Decision support, not a diagnosis.',

  'scenario.label': 'Mission',
  'scenario.delay': 'Signal delay to Earth: {delay}',
  'scenario.unverified': 'Pending verification (science team)',

  'day.pre': 'Pre-flight day {n}',
  'day.mission': 'Mission day {n}',
  'day.hint': 'Demo replay with synthetic data',
  'day.hintFile': 'Demo replay with the team dataset (synthetic)',
  'data.issues': 'Dataset check for the data team: {n}',

  'signal.title': 'Early signal across {n} areas',
  'signal.body':
    'Changes in {list} are showing up together. Patterns like this are easier to turn around early. Open Mind and Recharge for suggested steps.',

  'domain.biological': 'Body',
  'domain.cognitive-emotional': 'Mind',
  'domain.social': 'Connection',
  'domain.protective': 'Protective habits',

  'status.nominal': 'Nominal',
  'status.watch': 'Watch',
  'status.act': 'Act',
  'status.no-data': 'No data',
  'status.aria': 'Status: {status}',
  'action.nominal': 'Keep your routine.',
  'action.watch': 'Try a self-care step and re-check tomorrow.',
  'action.act': 'Follow the escalation path below.',
  'action.no-data': 'Log a measurement to see your status.',

  'card.vsBaseline': '{delta} vs your pre-flight normal ({mean})',
  'card.sd': '{z} SD',
  'card.why': 'Why this matters',
  'card.hide': 'Hide details',
  'card.how': 'How to measure:',
  'card.source': 'Source:',
  'card.unverified': '(unverified)',
  'card.trend': '{label} trend',

  'esc.title': 'Escalation path',
  'esc.now': 'Recommended now',
  'esc.self': 'Self-care.',
  'esc.selfBody': 'Follow the suggested step and re-measure.',
  'esc.cmo': 'Crew Medical Officer.',
  'esc.cmoBody': 'Share the card on board.',
  'esc.ground': 'Flight surgeons on Earth.',
  'esc.groundDelayed': 'A reply can take {n}+ min round trip. Act on board first; the summary is queued for the ground.',
  'esc.groundLive': 'Near real-time contact is available.',
  'esc.disclaimer': 'Decision support only. This tool does not diagnose.',

  'sw.title': 'Space weather (radiation context)',
  'sw.flares': 'solar flares',
  'sw.strong': 'M-class or stronger',
  'sw.sep': 'solar energetic particle events',
  'sw.window': 'In the {days} days up to {end}.',
  'sw.strongest': 'Strongest flare: {cls} on {date}.',
  'sw.source': 'Source:',
  'sw.updated': 'updated {date}',
  'sw.partial': 'partial download',
  'sw.missing': 'No space-weather snapshot yet. It is downloaded from NASA DONKI each time the app is published.',
  'sw.context': 'Context only: this app does not measure radiation dose. Follow your mission radiation procedures.',
  'sw.hazardLink': 'NASA HRP: spaceflight hazards',

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
  'footer': 'Prototipo para el NASA Space Apps Challenge 2026. Datos sintéticos. Apoyo a decisiones, no un diagnóstico.',

  'scenario.label': 'Misión',
  'scenario.delay': 'Retraso de señal a la Tierra: {delay}',
  'scenario.unverified': 'Pendiente de verificar (equipo científico)',

  'day.pre': 'Día previo al vuelo {n}',
  'day.mission': 'Día de misión {n}',
  'day.hint': 'Recorrido de demostración con datos sintéticos',
  'day.hintFile': 'Recorrido de demostración con el dataset del equipo (sintético)',
  'data.issues': 'Revisión del dataset para el equipo de datos: {n}',

  'signal.title': 'Señal temprana en {n} áreas',
  'signal.body':
    'Hay cambios al mismo tiempo en {list}. Estos patrones son más fáciles de revertir si se atienden pronto. Abre Mente y Recarga para ver pasos sugeridos.',

  'domain.biological': 'Cuerpo',
  'domain.cognitive-emotional': 'Mente',
  'domain.social': 'Conexión',
  'domain.protective': 'Hábitos protectores',

  'status.nominal': 'Normal',
  'status.watch': 'Vigilar',
  'status.act': 'Actuar',
  'status.no-data': 'Sin datos',
  'status.aria': 'Estado: {status}',
  'action.nominal': 'Mantén tu rutina.',
  'action.watch': 'Prueba un paso de autocuidado y vuelve a medir mañana.',
  'action.act': 'Sigue la ruta de escalamiento de abajo.',
  'action.no-data': 'Registra una medición para ver tu estado.',

  'card.vsBaseline': '{delta} frente a tu normal previo al vuelo ({mean})',
  'card.sd': '{z} DE',
  'card.why': 'Por qué importa',
  'card.hide': 'Ocultar detalles',
  'card.how': 'Cómo medir:',
  'card.source': 'Fuente:',
  'card.unverified': '(sin verificar)',
  'card.trend': 'Tendencia de {label}',

  'esc.title': 'Ruta de escalamiento',
  'esc.now': 'Recomendado ahora',
  'esc.self': 'Autocuidado.',
  'esc.selfBody': 'Sigue el paso sugerido y vuelve a medir.',
  'esc.cmo': 'Oficial médico de la tripulación.',
  'esc.cmoBody': 'Comparte la tarjeta a bordo.',
  'esc.ground': 'Cirujanos de vuelo en Tierra.',
  'esc.groundDelayed':
    'Una respuesta puede tardar {n} min o más, ida y vuelta. Actúa primero a bordo; el resumen queda en cola para Tierra.',
  'esc.groundLive': 'Hay contacto casi en tiempo real.',
  'esc.disclaimer': 'Solo apoyo a decisiones. Esta herramienta no diagnostica.',

  'sw.title': 'Clima espacial (contexto de radiación)',
  'sw.flares': 'fulguraciones solares',
  'sw.strong': 'de clase M o mayor',
  'sw.sep': 'eventos de partículas solares energéticas',
  'sw.window': 'En los {days} días hasta el {end}.',
  'sw.strongest': 'Fulguración más intensa: {cls} el {date}.',
  'sw.source': 'Fuente:',
  'sw.updated': 'actualizado el {date}',
  'sw.partial': 'descarga parcial',
  'sw.missing': 'Aún no hay datos de clima espacial. Se descargan de NASA DONKI cada vez que se publica la app.',
  'sw.context': 'Solo contexto: esta app no mide la dosis de radiación. Sigue los procedimientos de radiación de tu misión.',
  'sw.hazardLink': 'NASA HRP: peligros del vuelo espacial',

  'placeholder.next': 'Lo que sigue',
  'placeholder.owner': 'Responsable: {owner}',
}

export const DICTIONARIES: Record<Lang, Record<StringKey, string>> = { en, es }

/** Units that read differently per language; anything not listed is shown as is. */
export const UNITS: Record<Lang, Record<string, string>> = {
  en: {},
  es: { 'msgs/wk': 'msjs/sem' },
}

export function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}
