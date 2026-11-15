// Spanish for the sentences the code builds in English with numbers inside: the engine's reason on each card,
// the "Because:" of a suggestion, the lines of the Transmit packets and the symptom "pain in <region>".
// The engine and the packet builders stay in English (their tests read English); these templates translate what
// is shown. Anything that matches no template is shown as it is.
import { RULES } from '../orbit/config'
import { CONTEXTS, QUALITIES, REGIONS } from '../orbit/pain'
import { contextLabel, qualityLabel, regionLabel } from '../orbit/display'
import { L } from './content'
import type { Lang } from './strings'

type Rule = [RegExp, (m: RegExpMatchArray) => string]

const COLOR_ES: Record<string, string> = { green: 'verde', yellow: 'amarillo', red: 'rojo', none: 'sin datos' }
const ITEM_ES: Record<string, string> = { mood: 'ánimo', stress: 'estrés', fatigue: 'fatiga', crew_climate: 'clima de la tripulación' }
const DOMAIN_ES: Record<string, string> = { Body: 'Cuerpo', Mind: 'Mente', Crew: 'Tripulación' }
const day = (s?: string) => (s ? s.replace(/\(day (\d+)\)/, '(día $1)') : '')

/**
 * Known names inside a sentence (indicator names, symptom words, pain regions, words and contexts), replaced by
 * their Spanish, longest first so "Mood, stress and fatigue" wins over a shorter name inside it.
 */
let names: [string, string][] | null = null
function knownNames(): [string, string][] {
  if (names) return names
  const pairs = new Map<string, string>()
  for (const i of RULES.indicators) pairs.set(i.label_en, L(i.label_en, 'es'))
  for (const r of REGIONS) {
    pairs.set(r.label_en, regionLabel(r.id, 'es'))
    pairs.set(r.label_en.toLowerCase(), regionLabel(r.id, 'es').toLowerCase())
  }
  for (const q of QUALITIES) pairs.set(q.label_en, qualityLabel(q.id, 'es'))
  for (const c of CONTEXTS) {
    pairs.set(c.label_en, contextLabel(c.id, 'es'))
    pairs.set(c.label_en.toLowerCase(), contextLabel(c.id, 'es').toLowerCase())
  }
  pairs.set(RULES.convergence.label_en, L(RULES.convergence.label_en, 'es'))
  names = [...pairs].filter(([en, es]) => en && es && en !== es).sort((a, b) => b[0].length - a[0].length)
  return names
}
function names2es(text: string): string {
  let out = text
  for (const [en, es] of knownNames()) out = out.split(en).join(es)
  return out
}
/** A list of symptom words ("severe headache, dizziness"): each one in Spanish. */
const symptoms = (list: string) => list.split(', ').map((s) => symptomEs(s, 'es')).join(', ')

const REASONS: Rule[] = [
  [/^No reading today\.$/, () => 'Sin lectura hoy.'],
  [/^No reading this week\.$/, () => 'Sin lectura esta semana.'],
  [/^No weekly check this week\.$/, () => 'Sin chequeo semanal esta semana.'],
  [/^No symptoms logged\.$/, () => 'Sin síntomas registrados.'],
  [/^You asked to talk to someone today\.$/, () => 'Pediste hablar con alguien hoy.'],
  [/^Contact dropped by half or more compared with the previous two weeks\.$/, () => 'El contacto bajó a la mitad o menos frente a las dos semanas anteriores.'],
  [/^([\d.]+) h or less for (\d+) nights in a row\.$/, (m) => `${m[1]} h o menos durante ${m[2]} noches seguidas.`],
  [/^([\d.]+) h: ([\d.]+) h below your usual ([\d.]+) h\.$/, (m) => `${m[1]} h: ${m[2]} h menos que tu normal de ${m[3]} h.`],
  [/^([\d.]+) h, within your usual range \(([\d.]+) h\)\.$/, (m) => `${m[1]} h, dentro de tu rango normal (${m[2]} h).`],
  [/^(\d+) or more points worse than usual: (.+)\.$/, (m) =>
    `${m[1]} puntos o más peor que tu normal: ${m[2].replace(/\b(mood|stress|fatigue)\b/g, (w) => ITEM_ES[w]).replace(/\(usual /g, '(normal ')}.`],
  [/^Within (\d+) points of your usual\.$/, (m) => `A ${m[1]} puntos o menos de tu normal.`],
  [/^([\d.]+): (\d+) or more points below your usual ([\d.]+)\.$/, (m) => `${m[1]}: ${m[2]} puntos o más por debajo de tu normal de ${m[3]}.`],
  [/^([\d.]+), close to your usual ([\d.]+)\.$/, (m) => `${m[1]}, cerca de tu normal de ${m[2]}.`],
  [/^PHQ-2 (\d+), GAD-2 (\d+) \(day (\d+)\)\.$/, (m) => `PHQ-2 ${m[1]}, GAD-2 ${m[2]} (día ${m[3]}).`],
  [/^PHQ-2 (\d+), GAD-2 (\d+), (\d+) weeks in a row: ORBIT offers an earlier private conference\.$/, (m) =>
    `PHQ-2 ${m[1]}, GAD-2 ${m[2]}, ${m[3]} semanas seguidas: ORBIT ofrece adelantar una conferencia privada.`],
  [/^PHQ-2 (\d+), GAD-2 (\d+): worth talking to someone \(not a diagnosis\)\.$/, (m) =>
    `PHQ-2 ${m[1]}, GAD-2 ${m[2]}: vale la pena hablar con alguien (no es un diagnóstico).`],
  [/^Slower than ([\d.]+) ms in (\d+) of the last (\d+) sessions\.$/, (m) => `Más lento que ${m[1]} ms en ${m[2]} de las últimas ${m[3]} sesiones.`],
  [/^(\d+) of the last (\d+) sessions slower than ([\d.]+) ms\.$/, (m) => `${m[1]} de las últimas ${m[2]} sesiones más lentas que ${m[3]} ms.`],
  [/^(.+), confirmed on a second reading\.$/, (m) => `${m[1]}, confirmada en una segunda lectura.`],
  [/^(.+): repeat the reading to confirm\.$/, (m) => `${m[1]}: repite la lectura para confirmar.`],
  [/^(\d+\/\d+ mmHg), under 120\/80\.$/, (m) => `${m[1]}, por debajo de 120/80.`],
  [/^(.+): elevated or stage 1 range\.$/, (m) => `${m[1]}: rango elevado o de etapa 1.`],
  [/^Over (\d+) bpm at rest on repeated days\.$/, (m) => `Más de ${m[1]} lpm en reposo en días repetidos.`],
  [/^Under (\d+) bpm with dizziness or fainting\.$/, (m) => `Menos de ${m[1]} lpm con mareo o desmayo.`],
  [/^(\d+) bpm: (\d+) above your usual (\d+)\.$/, (m) => `${m[1]} lpm: ${m[2]} por encima de tu normal de ${m[3]}.`],
  [/^(\d+) bpm, near your usual (\d+)\.$/, (m) => `${m[1]} lpm, cerca de tu normal de ${m[2]}.`],
  [/^([\d.]+) °C with symptoms, ([\d.]+) °C above your in-flight normal\.$/, (m) => `${m[1]} °C con síntomas, ${m[2]} °C por encima de tu normal en vuelo.`],
  [/^([\d.]+) °C: ([\d.]+) °C above your in-flight normal of ([\d.]+) °C\.$/, (m) => `${m[1]} °C: ${m[2]} °C por encima de tu normal en vuelo de ${m[3]} °C.`],
  [/^([\d.]+) °C is normal for you in flight \(([\d.]+) °C\), even if it would count as fever on Earth\.$/, (m) =>
    `${m[1]} °C es normal para ti en vuelo (${m[2]} °C), aunque en la Tierra contaría como fiebre.`],
  [/^(\d+) mg\/dL( \(day \d+\))?: level 2 hypoglycemia range\.$/, (m) => `${m[1]} mg/dL${day(m[2])}: rango de hipoglucemia de nivel 2.`],
  [/^(\d+) mg\/dL or more on (\d+) occasions\.$/, (m) => `${m[1]} mg/dL o más en ${m[2]} ocasiones.`],
  [/^(\d+) mg\/dL( \(day \d+\))?, in the 70 to 99 range\.$/, (m) => `${m[1]} mg/dL${day(m[2])}, en el rango de 70 a 99.`],
  [/^(\d+) mg\/dL( \(day \d+\))?: repeat to confirm\.$/, (m) => `${m[1]} mg/dL${day(m[2])}: repite para confirmar.`],
  [/^(\d+) mg\/dL( \(day \d+\))?: outside 70 to 99\.$/, (m) => `${m[1]} mg/dL${day(m[2])}: fuera de 70 a 99.`],
  [/^(\d+) of (\d+) min planned: under (\d+) %\.$/, (m) => `${m[1]} de ${m[2]} min planeados: menos del ${m[3]} %.`],
  [/^(\d+) of (\d+) min planned\.$/, (m) => `${m[1]} de ${m[2]} min planeados.`],
  [/^(\d+) days in a row without contact\.$/, (m) => `${m[1]} días seguidos sin contacto.`],
  [/^(\d+) messages in the previous 24 h\.$/, (m) => `${m[1]} mensajes en las 24 h anteriores.`],
  [/^(.+): goes straight to your medical officer\.$/, (m) => `${symptoms(m[1])}: va directo a tu oficial médico.`],
  [/^(.+) for more than (\d+) days\.$/, (m) => `${symptoms(m[1])} durante más de ${m[2]} días.`],
  [/^Logged: (.+)\.$/, (m) => `Registrado: ${symptoms(m[1])}.`],
]

function apply(rules: Rule[], text: string): string | undefined {
  for (const [re, f] of rules) {
    const m = text.match(re)
    if (m) return f(m)
  }
  return undefined
}

/** The engine's reason on a card ("5.3 h: 1.2 h below your usual 6.5 h."). */
export function reasonEs(reason: string, lang: Lang): string {
  if (lang !== 'es' || !reason) return reason
  return apply(REASONS, reason) ?? L(reason, lang)
}

/** A symptom word of the vocabulary, a symptom she wrote, or "pain in <region>". */
export function symptomEs(symptom: string, lang: Lang): string {
  if (lang !== 'es') return symptom
  const pain = symptom.match(/^pain in (.+)$/)
  if (pain) {
    const r = REGIONS.find((x) => x.label_en.toLowerCase() === pain[1].toLowerCase())
    return `dolor en ${(r ? regionLabel(r.id, 'es') : pain[1]).toLowerCase()}`
  }
  return L(symptom, lang)
}

/** "Sleep: yellow", "Mood, stress and fatigue: stress yellow", the early signal, "Everything in your usual range". */
export function triggerEs(label: string, lang: Lang): string {
  if (lang !== 'es') return label
  if (label === 'Everything in your usual range') return 'Todo en tu rango normal'
  const m = label.match(/^(.+): (?:(mood|stress|fatigue|crew climate|low|high) )?(green|yellow|red)$/)
  if (!m) return L(label, lang)
  const [, name, qual, color] = m
  if (qual === 'low' || qual === 'high') return `${L(name, lang)}: ${COLOR_ES[color]} (${qual === 'low' ? 'bajo' : 'alto'})`
  return `${L(name, lang)}: ${qual ? `${ITEM_ES[qual.replace(' ', '_')]} ` : ''}${COLOR_ES[color]}`
}

const STATE_ES: Record<string, string> = {
  Green: 'Verde',
  'Yellow (self-care)': 'Amarillo (autocuidado)',
  'Red, physical': 'Rojo, físico',
  'Red, asked to talk': 'Rojo, pidió hablar',
}

const LINES: Rule[] = [
  [/^Day (\d+) status, shared by the astronaut$/, (m) => `Estado del día ${m[1]}, compartido por la persona astronauta`],
  [/^Day (\d+) escalation: physical safety rail in red$/, (m) => `Escalamiento del día ${m[1]}: límite de seguridad física en rojo`],
  [/^Weekly summary, days (\d+) to (\d+)$/, (m) => `Resumen semanal, días ${m[1]} a ${m[2]}`],
  [/^ORBIT state: (.+)$/, (m) => `Estado ORBIT: ${STATE_ES[m[1]] ?? L(m[1], 'es')}`],
  [/^(Today, )?(Body|Mind|Crew): (green|yellow|red|none)(?: \((.+)\))?$/, (m) =>
    `${m[1] ? 'Hoy, ' : ''}${DOMAIN_ES[m[2]]}: ${COLOR_ES[m[3]]}${m[4] ? ` (${names2es(m[4])})` : ''}`],
  [/^Not shared by (?:her|their|the astronaut's) choice: (.+)\.$/, (m) =>
    `No compartido, por decisión propia: ${m[1].split(', ').map((d) => DOMAIN_ES[d] ?? d).join(', ')}.`],
  [/^Not shared, by choice: (.+)\.$/, (m) => `No compartido, por decisión propia: ${m[1].split(', ').map((d) => DOMAIN_ES[d] ?? d).join(', ')}.`],
  [/^(?:She|They|The astronaut) chose to share Body, Mind and Crew\.$/, () => 'Se eligió compartir Cuerpo, Mente y Tripulación.'],
  [/^Shared by choice: Body, Mind and Crew\.$/, () => 'Se eligió compartir Cuerpo, Mente y Tripulación.'],
  [/^The crew medical officer was notified onboard first\.$/, () => 'Primero se avisó a bordo al oficial médico de la tripulación.'],
  [/^Early cross-domain signals: none$/, () => 'Señales tempranas entre dominios: ninguna'],
  [/^Early cross-domain signals: (\d+) \((.+)\)$/, (m) =>
    `Señales tempranas entre dominios: ${m[1]} (${m[2].replace(/\bday\b/g, 'día').replace(/ and /g, ' y ').replace(/resolved onboard/g, 'resuelta a bordo').replace(/still open/g, 'aún abierta')})`],
  [/^Red days: (\d+)$/, (m) => `Días en rojo: ${m[1]}`],
  [/^Check-in answers, journal and game content stay on the device\.$/, () => 'Las respuestas del check-in, el diario y los juegos se quedan en el dispositivo.'],
]

const PAIN_PARTS: [RegExp, string][] = [
  [/^Pain: /, 'Dolor: '], [/^Symptom: /, 'Síntoma: '], [/ \(both sides\)/g, ' (ambos lados)'], [/ \(left\)/g, ' (izquierda)'], [/ \(right\)/g, ' (derecha)'],
  [/ (\d+)\/10 none\b/g, ' $1/10 ninguno'], [/ (\d+)\/10 mild\b/g, ' $1/10 leve'], [/ (\d+)\/10 moderate\b/g, ' $1/10 moderado'], [/ (\d+)\/10 severe\b/g, ' $1/10 intenso'],
  [/started more than 2 days ago/g, 'empezó hace más de 2 días'], [/started 1 to 2 days ago/g, 'empezó hace 1 a 2 días'], [/started today/g, 'empezó hoy'],
  [/comes and goes/g, 'va y viene'], [/\bconstant\b/g, 'constante'],
  [/worse on move or press: not sure/g, 'empeora al mover o presionar: no sé'], [/worse on move or press: yes/g, 'empeora al mover o presionar: sí'],
  [/worse on move or press: no/g, 'empeora al mover o presionar: no'], [/\bsymptoms: /g, 'síntomas: '], [/\bcontext: /g, 'contexto: '], [/\balarm signs: /g, 'señales de alarma: '],
]

/** A line of a Transmit packet. */
export function packetLineEs(line: string, lang: Lang): string {
  if (lang !== 'es' || !line) return line
  const known = apply(LINES, line)
  if (known) return known
  if (/^(Pain|Symptom): /.test(line)) {
    let out = line
    for (const [re, es] of PAIN_PARTS) out = out.replace(re, es)
    // Symptom words of the vocabulary inside the line.
    out = out.replace(/(síntomas|señales de alarma): ([^;.]+)/g, (_, k: string, list: string) => `${k}: ${symptoms(list)}`)
    return names2es(out)
  }
  // "<Indicator>: <reason>" (the escalation packet).
  const ind = RULES.indicators.find((i) => line.startsWith(`${i.label_en}: `))
  if (ind) return `${L(ind.label_en, lang)}: ${reasonEs(line.slice(ind.label_en.length + 2), lang)}`
  return L(line, lang)
}

// Constellations tiles: Spanish names of the moons, planets and probes (the game still compares the English ids).
const TILE_ES: Record<string, string> = {
  Ganymede: 'Ganímedes', Callisto: 'Calisto', Titan: 'Titán', Enceladus: 'Encélado', Rhea: 'Rea', Oberon: 'Oberón', Triton: 'Tritón',
  Nereid: 'Nereida', Proteus: 'Proteo', Larissa: 'Larisa', Mercury: 'Mercurio', Earth: 'Tierra', Mars: 'Marte', Jupiter: 'Júpiter',
  Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Neptuno', Pluto: 'Plutón', Juno: 'Juno', Ceres: 'Ceres',
}
export const tileEs = (tile: string, lang: Lang) => (lang === 'es' ? TILE_ES[tile] ?? tile : tile)

const BOARD_ES: Record<string, string> = { 'Moon families': 'Familias de lunas', 'Worlds and visitors': 'Mundos y visitantes' }
/** Name of a Constellations board. */
export const boardEs = (board: string, lang: Lang) => (lang === 'es' ? BOARD_ES[board] ?? L(board, lang) : board)

/** The value on a card: "mood 4 · stress 7 · fatigue 6", "89 (day 23)". */
export function valueEs(value: string, lang: Lang): string {
  if (lang !== 'es') return value
  return value.replace(/\b(mood|stress|fatigue)\b/g, (w) => ITEM_ES[w]).replace(/\(day (\d+)\)/g, '(día $1)')
}
