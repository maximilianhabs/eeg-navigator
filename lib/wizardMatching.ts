/**
 * Regelbasiertes Scoring: Wizard-Antworten → wellen.json Entitäten
 *
 * Gewichtung:
 *  Verteilung (generalisiert/fokal)   +4
 *  Lokalisation (Region-Overlap)      +3 pro Treffer, max +6
 *  Frequenzband                       +4
 *  Dauer                              +4
 *  Polarität                          +3
 *  Rhythmizität                       +2
 *  Amplitude                          +2
 *  Auftreten / Periodizität           +2
 *
 * Max theoretisch: 27 Punkte
 * Frequenz wird nur gewertet wenn dauer != spike/sharp
 */

import type { PhaenomenAnswer } from '@/components/wizard/StepPhaenomen'
import type { FrequenzAnswer } from '@/components/wizard/StepFrequenz'
import type { LokalisationAnswer } from '@/components/wizard/StepLokalisation'
import type { MorphologieAnswer } from '@/components/wizard/StepMorphologie'

// ─── Hilfsfunktionen zum Parsen ───────────────────────────────────────────────

function tryParse<T>(s: string | undefined, fallback: T): T {
  try {
    if (s && s.startsWith('{')) return JSON.parse(s) as T
  } catch {}
  return fallback
}

// ─── Mapping: Wizard-Kategorien → DB-Labels ───────────────────────────────────

const FREQUENZ_MAP: Record<string, string[]> = {
  delta:  ['Delta', 'Delta (0.5–3 Hz)', 'Sehr langsam (Delta)', 'Delta/sehr langsam',
           'Theta/Delta', 'Delta/Theta', 'Theta bis Delta', 'Sehr langsam (1.5–2.5 Hz)',
           'Periodisch (0.5–2 Hz)', 'Delta + Beta (Komposit)'],
  theta:  ['Theta', 'Theta (6 Hz)', 'Theta (7–8 Hz)', 'Theta/Delta', 'Delta/Theta',
           'Theta bis Delta', 'Theta/Alpha', 'Alpha/Theta', 'variabel (3–6 Hz)', 'schnell (>4 Hz)'],
  alpha:  ['Alpha', 'Alpha (doppelt)', 'Alpha (asymmetrisch)', 'Alpha/Theta',
           'Theta/Alpha', 'gemischt (Alpha/Theta/Beta)', 'Alpha (transient beschleunigt)',
           'Sigma', 'Sigma/Beta', 'dual (14 Hz + 6 Hz)'],
  beta:   ['Beta', 'Beta-Grenzbereich', 'Sigma/Beta', 'Beta/Gamma (10–25 Hz)',
           'gemischt (Alpha/Theta/Beta)', 'gemischt (hochfrequent)', 'sehr schnell (>80 Hz intern)'],
  gamma:  ['Beta/Gamma (10–25 Hz)', 'sehr schnell (>80 Hz intern)', 'gemischt (hochfrequent)'],
  gemischt: ['gemischt', 'variabel', 'gemischt (Alpha/Theta/Beta)', 'gemischt (Delta/Theta/Spikes)',
             'gemischt (hochfrequent)', 'variabel (Spike-Wave/Polyspikes/Slow Waves)',
             'Delta + Beta (Komposit)'],
  kein_rhythmus: ['keine (isoelektrisch)', 'variabel/supprimiert', 'nicht_anwendbar'],
}

const RHYTHMIZITAET_MAP: Record<string, string[]> = {
  rhythmisch:     ['rhythmisch'],
  arrhythmisch:   ['arrhythmisch', 'nicht_anwendbar'],
  semirhythmisch: ['semirhythmisch', 'arrhythmisch'],
  burst:          ['paroxysmal', 'seriell'],
}

const DAUER_MAP: Record<string, string[]> = {
  spike:          ['sehr kurz', 'sehr kurz (Gruppe)', 'sehr kurz (<10 s)'],
  sharp:          ['kurz', 'kurz (Sekunden)', 'kurze Bursts'],
  komplex:        ['mittel', 'Sekunden', 'mehrere Sekunden', 'Transient (0,5–0,75 s)', 'Sekunden bis Minuten'],
  burst:          ['Bursts', 'Bursts (Sekunden)', 'Bursts: 2–26 s', 'Bursts 0.5–10 s', 'Bursts bis Minuten', 'lang',
                   'mehrere Sekunden (einzelne Transienten)', 'kurze Bursts', 'periodisch', 'periodisch wiederkehrend'],
  kontinuierlich: ['kontinuierlich', 'kontinuierlich (im Wachen)', 'anhaltend', 'anhaltend (Grundrhythmus)',
                   'persistierend', 'sehr lang', 'anhaltend (gesamter Fixationsentzug)',
                   'intermittierend oder kontinuierlich', 'Bursts oder kontinuierlich',
                   'variabel (Bursts oder kontinuierlich)'],
}

const AMPLITUDE_MAP: Record<string, string[]> = {
  sehr_klein: ['sehr klein', 'keine (<2 µV)', 'sehr klein (supprimiert)'],
  klein:      ['klein', 'niedrig', 'niedrig bis mittel', 'niedrig_bis_mittel'],
  mittel:     ['mittel', 'klein bis mittel', 'mittel bis groß', 'mittel bis hoch'],
  gross:      ['groß', 'gross', 'hoch', 'mittel bis groß', 'mittel bis hoch', 'asymmetrisch'],
  sehr_gross: ['sehr groß', 'sehr groß (chaotisch)', 'hoch'],
}

const POLARITAET_MAP: Record<string, string[]> = {
  negativ:        ['negativ', 'negativ_dominant', 'negativ_dann_positiv', 'gemischt'],
  positiv:        ['positiv', 'gemischt'],
  biphasisch_np:  ['biphasisch', 'negativ_dann_positiv', 'gemischt', 'negativ'],
  biphasisch_pn:  ['biphasisch', 'gemischt', 'positiv'],
  triphasisch:    ['triphasisch', 'gemischt'],
  alternierend:   ['alternierend', 'wechselnd', 'variabel', 'gemischt'],
  nb:             [],
}

const AUFTRETEN_MAP: Record<string, string[]> = {
  einmalig:       ['nicht_periodisch'],
  intermittierend:['nicht_periodisch', 'quasi_periodisch'],
  periodisch:     ['periodisch', 'quasi_periodisch'],
  kontinuierlich: ['nicht_periodisch', 'nicht_anwendbar'],
}

// Verteilung → Lateralität + Field-Plausibility
const VERTEILUNG_LATERALITY: Record<string, string[]> = {
  generalisiert:   ['bilateral_symmetrisch', 'generalisiert', 'nicht_anwendbar'],
  fokal:           ['links', 'rechts', 'bilateral_asymmetrisch'],
  hemisphärisch:   ['links', 'rechts', 'bilateral_asymmetrisch'],
  multifokal:      ['wechselnd', 'bilateral_asymmetrisch'],
  nb:              [],
}

const VERTEILUNG_FIELD: Record<string, string[]> = {
  generalisiert:   ['generalisiert', 'kein_plausibles_Feld'],
  fokal:           ['streng_fokal', 'fokal_mit_Ausbreitung', 'regional'],
  hemisphärisch:   ['hemisphärisch', 'regional'],
  multifokal:      ['hemisphärisch', 'generalisiert', 'regional'],
  nb:              [],
}

// Wizard-Lateralität → passende Entity-laterality-Werte
const LATERAL_MATCH: Record<string, string[]> = {
  bilateral:     ['bilateral_symmetrisch', 'bilateral_asymmetrisch', 'bilateral_asynchron', 'generalisiert', 'nicht_anwendbar'],
  unilateral:    ['links', 'rechts', 'bilateral_asymmetrisch', 'wechselnd', 'unilateral'],
  nicht_lateral: ['bilateral_symmetrisch', 'generalisiert', 'nicht_anwendbar'],
}

// ─── Montage: Wizard-Wert → montage_behavior-Feld + Suchbegriffe ──────────────
const MONTAGE_FIELD: Record<string, string> = {
  bipolar_laengs: 'bipolar_longitudinal',
  bipolar_quer:   'bipolar_transverse',
  referenz_cz:    'referential_cz',
  referenz_avg:   'referential_average',
  referenz_ohr:   'referential_mastoid',
}
const MONTAGE_LABEL: Record<string, string> = {
  bipolar_laengs: 'bipolare Längsreihe',
  bipolar_quer:   'bipolare Querreihe',
  referenz_cz:    'Cz-Referenz',
  referenz_avg:   'Average-Referenz',
  referenz_ohr:   'Ohr-/Mastoid-Referenz',
}
const MONTAGE_KEYWORDS: Record<string, string[]> = {
  bipolar_laengs: ['längsreihe', 'longitudinal', 'doppelbanane'],
  bipolar_quer:   ['querreihe', 'transversal', 'quer'],
  referenz_cz:    ['cz-referenz', 'cz', 'zentralreferenz'],
  referenz_avg:   ['average', 'mittelwert', 'common average'],
  referenz_ohr:   ['mastoid', 'ohr', 'a1', 'a2'],
}
const MONTAGE_WARN = ['vorsicht', 'cave', 'kontamin', 'ungeeignet', 'schlecht', 'maskier',
  'wenig sichtbar', 'erschwert', 'nicht geeignet', 'problem', 'scheinbar generalisiert']

// ─── Vigilanz: robustes Zustandsmodell (Präzision ist begrenzt beurteilbar) ────
// Zustände: 'wach' | 'schlaefrig' | 'schlaf' | 'koma'
function userVigilanzState(vigilanz: string): string {
  if (vigilanz === 'wach') return 'wach'
  if (vigilanz === 'schlaefrig') return 'schlaefrig'
  if (vigilanz === 'schlafend') return 'schlaf'
  if (vigilanz === 'bewusstseinsgestoert') return 'koma'
  return ''
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function entityVigilanzStates(entity: any): Set<string> {
  const oc: string[] = (entity.occurrence_context ?? []).map((x: string) => x.toLowerCase())
  const ss: string = (entity.sleep_stage ?? '').toLowerCase()
  const sub: string = (entity.subcategory ?? '').toLowerCase()
  const s = new Set<string>()
  if (oc.some(x => x.includes('wach') || x.includes('augen_offen') || x.includes('entspannt'))) s.add('wach')
  if (oc.some(x => x.includes('schläf') || x.includes('schlaef') || x.includes('drows'))) s.add('schlaefrig')
  if (['n1', 'n2', 'n3', 'rem'].includes(ss) || oc.some(x => x === 'schlaf' || x.includes('schlaf_') || x.includes('_schlaf'))) s.add('schlaf')
  if (oc.some(x => x.includes('koma')) || ss.includes('koma') || sub.includes('koma')) s.add('koma')
  if (s.size === 0) s.add('any')  // keine Vigilanz-Info → neutral
  return s
}

// ─── Scoring-Funktion ─────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  verteilung:   number
  lokalisation: number
  frequenz:     number
  dauer:        number
  polaritaet:   number
  amplitude:    number
  auftreten:    number
  montage:      number
  vigilanz:     number
  total:        number
  maxPossible:  number
  pct:          number   // 0–100
  caveats:      string[] // weiche Hinweise (Montage/Vigilanz), nie ausschließend
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scoreEntity(entity: any, w: WizardInputs): ScoreBreakdown {
  let verteilung = 0
  let lokalisation = 0
  let frequenz = 0
  let dauer = 0
  let polaritaet = 0
  let amplitude = 0
  let auftreten = 0
  let montage = 0
  let vigilanz = 0
  const caveats: string[] = []

  // 1. Verteilung (+4)
  if (w.verteilung && w.verteilung !== 'nb') {
    const entLat: string = entity.laterality ?? ''
    const entField: string = entity.field_distribution?.field_plausibility ?? ''
    const latMatch = VERTEILUNG_LATERALITY[w.verteilung]?.includes(entLat)
    const fieldMatch = VERTEILUNG_FIELD[w.verteilung]?.includes(entField)
    if (latMatch || fieldMatch) verteilung = 4
    // Generalisiert-Entität bei fokal-Auswahl → leichte Strafe
    if (w.verteilung === 'fokal' && entLat === 'bilateral_symmetrisch') verteilung = -2
  }

  // 1b. Lateralität (weich, ±2) — bilateral vs. unilateral vs. nicht lateralisiert
  // Viele Muster sind typisch bilateral (Alpha/Beta-Grundrhythmus, Schlafspindeln),
  // andere streng fokal (Wicket Spikes). Das soll ins Ranking eingehen.
  if (w.lateralitaet && w.lateralitaet !== 'nb') {
    const entLat: string = entity.laterality ?? ''
    if (LATERAL_MATCH[w.lateralitaet]?.includes(entLat)) {
      verteilung = Math.min(verteilung + 2, 6)
    } else if (entLat) {
      const bilateralEntity = entLat === 'bilateral_symmetrisch' || entLat === 'generalisiert'
      const focalEntity = entLat === 'links' || entLat === 'rechts'
      if ((w.lateralitaet === 'unilateral' && bilateralEntity) ||
          (w.lateralitaet === 'bilateral' && focalEntity)) {
        verteilung = Math.max(verteilung - 2, -3)
      }
    }
  }

  // 2. Lokalisation (+3 pro Region-Overlap, max +6)
  if (w.regionen.length > 0 && !w.regionen.includes('nb') && !w.regionen.includes('generalisiert')) {
    const entLoc: string[] = entity.localization ?? []
    const overlap = w.regionen.filter((r: string) => entLoc.includes(r))
    lokalisation = Math.min(overlap.length * 3, 6)
    // Keine Überschneidung → leichte Strafe
    if (overlap.length === 0 && entLoc.length > 0) lokalisation = -1
  }

  // 3. Frequenzband (+4) — nur wenn dauer != spike/sharp
  const dauerKurz = w.dauer === 'spike' || w.dauer === 'sharp'
  if (!dauerKurz && w.frequenzBand && w.frequenzBand !== 'nb') {
    const entFreq: string = entity.frequency?.label ?? ''
    const targets = FREQUENZ_MAP[w.frequenzBand] ?? []
    if (targets.includes(entFreq)) frequenz = 4
    else if (entFreq === 'variabel' || entFreq === 'gemischt') frequenz = 1
    else frequenz = -1
  }

  // 3b. Rhythmizität (+2) — nur wenn frequenz aktiv
  if (!dauerKurz && w.rhythmizitaet && w.rhythmizitaet !== 'nb') {
    const entRhyth: string = entity.rhythmicity ?? ''
    const targets = RHYTHMIZITAET_MAP[w.rhythmizitaet] ?? []
    if (targets.includes(entRhyth)) auftreten += 2
  }

  // 4. Dauer (+4)
  if (w.dauer && w.dauer !== 'nb') {
    const entDur: string = entity.duration?.label ?? ''
    const targets = DAUER_MAP[w.dauer] ?? []
    if (targets.includes(entDur)) dauer = 4
    else if (entDur === 'variabel' || entDur === 'stimulusgebunden') dauer = 1 // neutral
    else dauer = -1
  }

  // 4. Polarität (+3)
  if (w.polaritaet && w.polaritaet !== 'nb') {
    const entPol: string = entity.polarity ?? ''
    const targets = POLARITAET_MAP[w.polaritaet] ?? []
    if (targets.includes(entPol)) polaritaet = 3
    else if (entPol === 'variabel' || entPol === 'gemischt') polaritaet = 1
    else polaritaet = -1
  }

  // 5. Amplitude (+2)
  if (w.amplitude && w.amplitude !== 'nb') {
    const entAmp: string = entity.amplitude?.label ?? ''
    const targets = AMPLITUDE_MAP[w.amplitude] ?? []
    if (targets.includes(entAmp)) amplitude = 2
    else if (entAmp === 'variabel' || entAmp === 'asymmetrisch') amplitude = 1
  }

  // 6. Auftreten / Periodizität (+2)
  if (w.auftreten && w.auftreten !== 'nb') {
    const entPeriod: string = entity.periodicity ?? ''
    const targets = AUFTRETEN_MAP[w.auftreten] ?? []
    if (targets.includes(entPeriod)) auftreten = 2
    else if (entPeriod === 'nicht_anwendbar') auftreten = 1
  }

  // 7. Montage (weich, ±2 + Caveat) — passt die gewählte Montage zur Entität?
  if (w.montage && MONTAGE_FIELD[w.montage]) {
    const mb = entity.montage_behavior ?? {}
    const best = String(mb.best_montage ?? '').toLowerCase()
    const fieldText = String(mb[MONTAGE_FIELD[w.montage]] ?? '').toLowerCase()
    const problematic = MONTAGE_WARN.some(k => fieldText.includes(k))
    const isBest = MONTAGE_KEYWORDS[w.montage].some(k => best.includes(k))
    if (problematic) {
      montage = -2
      caveats.push(`In der ${MONTAGE_LABEL[w.montage]} ist dieses Muster erfahrungsgemäß schwer zu beurteilen — Befund vorsichtig werten.`)
    } else if (isBest) {
      montage = 2
    }
  }

  // 8. Vigilanz (weich, asymmetrisch) — Vigilanz ist nur begrenzt beurteilbar
  const uVig = userVigilanzState(w.vigilanz)
  if (uVig) {
    const states = entityVigilanzStates(entity)
    if (states.has('any')) {
      vigilanz = 0
    } else if (states.has(uVig)) {
      vigilanz = 2
    } else if (uVig === 'koma') {
      // Koma ist verlässlich beobachtbar → Muster ohne Koma-Kontext stark unwahrscheinlich
      vigilanz = -4
      caveats.push('Bei angegebener Bewusstseinsstörung/Koma tritt dieses Muster typischerweise nicht auf.')
    } else if (states.has('koma') && !states.has('wach') && !states.has('schlaefrig') && !states.has('schlaf')) {
      // Reines Komamuster, aber Patient als wach/schläfrig/schlafend angegeben
      vigilanz = -3
      caveats.push('Dieses Muster ist ein Komamuster — beim angegebenen Wachheitsgrad unwahrscheinlich.')
    } else {
      // wach ↔ schläfrig ↔ schlafend sind leicht verwechselbar → nur milder Malus
      const confusable = new Set(['wach', 'schlaefrig', 'schlaf'])
      vigilanz = (confusable.has(uVig) && [...states].some(s => confusable.has(s))) ? -1 : -2
    }
  }

  // Pädiatrische Entitäten ausschließen wenn Patient erwachsen (kein Alter bekannt → neutral lassen)
  if (entity.pediatric_only) {
    verteilung = Math.max(verteilung - 3, -3)
  }

  const total = verteilung + lokalisation + frequenz + dauer + polaritaet + amplitude + auftreten + montage + vigilanz
  const maxPossible = 6 + 6 + 4 + 4 + 3 + 2 + 2 + 2 + 2 // 31 (Verteilung inkl. Lateralität; Rhythmizität in auftreten)
  const pct = Math.round(Math.max(0, total) / maxPossible * 100)

  return { verteilung, lokalisation, frequenz, dauer, polaritaet, amplitude, auftreten, montage, vigilanz, total, maxPossible, pct, caveats }
}

// ─── Öffentliche API ──────────────────────────────────────────────────────────

export interface WizardInputs {
  verteilung: string
  auftreten: string
  frequenzBand: string
  rhythmizitaet: string
  regionen: string[]
  lateralitaet: string
  polaritaet: string
  amplitude: string
  dauer: string
  montage: string
  vigilanz: string
  alter: string
}

export interface MatchResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entity: any
  score: ScoreBreakdown
  rank: number
  confidence: 'hoch' | 'gut' | 'moeglich' | 'gering'
}

export function runMatching(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entities: any[],
  technikRaw?: string,
  patientRaw?: string,
  phaenomenRaw?: string,
  frequenzRaw?: string,
  lokalisationRaw?: string,
  morphologieRaw?: string,
): MatchResult[] {
  const phaenomen  = tryParse<PhaenomenAnswer>(phaenomenRaw,  { verteilung: '', auftreten: '' })
  const frequenz   = tryParse<FrequenzAnswer>(frequenzRaw,   { band: '', hzApprox: '', rhythmizitaet: '' })
  const lokalisation = tryParse<LokalisationAnswer>(lokalisationRaw, { regionen: [], lateralitaet: '' })
  const morphologie  = tryParse<MorphologieAnswer>(morphologieRaw,   { polaritaet: '', amplitude: '', dauer: '' })
  const technik    = tryParse<{ montage?: string }>(technikRaw, {})
  const patient    = tryParse<{ vigilanz?: string; alter?: string }>(patientRaw, {})

  const inputs: WizardInputs = {
    verteilung:    phaenomen.verteilung,
    auftreten:     phaenomen.auftreten,
    frequenzBand:  frequenz.band,
    rhythmizitaet: frequenz.rhythmizitaet,
    regionen:      lokalisation.regionen,
    lateralitaet:  lokalisation.lateralitaet,
    polaritaet:    morphologie.polaritaet,
    amplitude:     morphologie.amplitude,
    dauer:         morphologie.dauer,
    montage:       technik.montage ?? '',
    vigilanz:      patient.vigilanz ?? '',
    alter:         patient.alter ?? '',
  }

  // Pädiatrische Muster nur ausschließen, wenn KEIN pädiatrisches Alter gewählt wurde
  const PEDIATRIC_AGE = new Set(['neonatal', 'kleinkind', 'kind', 'jugendlicher'])
  const includePediatric = PEDIATRIC_AGE.has(inputs.alter)

  const scored = entities
    .filter(e => includePediatric || !e.pediatric_only)
    .map(e => ({ entity: e, score: scoreEntity(e, inputs) }))
    .filter(r => r.score.total > 0)
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 8)

  return scored.map((r, i) => ({
    ...r,
    rank: i + 1,
    confidence:
      r.score.pct >= 70 ? 'hoch' :
      r.score.pct >= 45 ? 'gut' :
      r.score.pct >= 25 ? 'moeglich' : 'gering',
  }))
}

export { tryParse }
