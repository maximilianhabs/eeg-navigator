// ─── 10-20-System: Regionen & Elektroden ─────────────────────────────────────
//
// Einteilung nach klinisch-neurologischer Konvention:
//   Frontopolar    → Fp1, Fp2
//   Frontal        → F3, Fz, F4
//   Anterotemporal → F7, F8
//   Mitteltemporal → T3 (T7), T4 (T8)
//   Posterotemporal→ T5 (P7), T6 (P8)
//   Zentral        → C3, Cz, C4
//   Parietal       → P3, Pz, P4
//   Okzipital      → O1, Oz, O2
//   Mittellinie    → Fz, Cz, Pz  (querschneidend)
//   Generalisiert  → kein spezifisches Feld

export type RegionId =
  | 'frontopolar'
  | 'frontal'
  | 'anterotemporal'
  | 'mitteltemporal'
  | 'posterotemporal'
  | 'zentral'
  | 'parietal'
  | 'okzipital'
  | 'generalisiert'

export type TopoMode = 'physiologisch' | 'pathologisch'

export interface Region {
  id: RegionId
  label: string
  labelShort: string
  electrodes: string[]
  colorHex: string           // Standardfarbe (physiologisch-Modus)
  colorHexPath: string       // Pathologisch-Modus
  description: string
}

export const REGIONS: Region[] = [
  {
    id: 'frontopolar',
    label: 'Frontopolar',
    labelShort: 'FP',
    electrodes: ['Fp1', 'Fp2'],
    colorHex: '#c4b5fd',      // violet-300
    colorHexPath: '#f9a8d4',  // pink-300
    description: 'Äußerste Frontalregion, präfrontaler Kortex',
  },
  {
    id: 'frontal',
    label: 'Frontal',
    labelShort: 'F',
    electrodes: ['F3', 'Fz', 'F4'],
    colorHex: '#93c5fd',      // blue-300
    colorHexPath: '#fca5a5',  // red-300
    description: 'Frontallappen, dorsolateraler präfrontaler Kortex, Fz = fronto-mesial',
  },
  {
    id: 'anterotemporal',
    label: 'Anterotemporal',
    labelShort: 'AT',
    electrodes: ['F7', 'F8'],
    colorHex: '#67e8f9',      // cyan-300
    colorHexPath: '#fb923c',  // orange-400
    description: 'Vorderer Temporallappen, frontotemporal (F7/F8)',
  },
  {
    id: 'mitteltemporal',
    label: 'Mitteltemporal',
    labelShort: 'MT',
    electrodes: ['T3', 'T4'],
    colorHex: '#7dd3fc',      // sky-300
    colorHexPath: '#f97316',  // orange-500
    description: 'Mittlerer Temporallappen (T3=T7, T4=T8)',
  },
  {
    id: 'posterotemporal',
    label: 'Posterotemporal',
    labelShort: 'PT',
    electrodes: ['T5', 'T6'],
    colorHex: '#5eead4',      // teal-300
    colorHexPath: '#fdba74',  // orange-300
    description: 'Hinterer Temporallappen (T5=P7, T6=P8)',
  },
  {
    id: 'zentral',
    label: 'Zentral',
    labelShort: 'C',
    electrodes: ['C3', 'Cz', 'C4'],
    colorHex: '#86efac',      // green-300
    colorHexPath: '#fda4af',  // rose-300
    description: 'Motorischer/somatosensorischer Kortex, Rolando-Region (C3/Cz/C4)',
  },
  {
    id: 'parietal',
    label: 'Parietal',
    labelShort: 'P',
    electrodes: ['P3', 'Pz', 'P4'],
    colorHex: '#fde047',      // yellow-300
    colorHexPath: '#f9a8d4',  // pink-300
    description: 'Parietallappen, somatosensorischer Assoziationskortex (P3/Pz/P4)',
  },
  {
    id: 'okzipital',
    label: 'Okzipital',
    labelShort: 'O',
    electrodes: ['O1', 'Oz', 'O2'],
    colorHex: '#fdba74',      // orange-300
    colorHexPath: '#f87171',  // red-400
    description: 'Okzipitallappen, primärer visueller Kortex (O1/Oz/O2)',
  },
  {
    id: 'generalisiert',
    label: 'Generalisiert / Diffus',
    labelShort: 'GEN',
    electrodes: [],
    colorHex: '#cbd5e1',      // slate-300
    colorHexPath: '#fca5a5',  // red-300
    description: 'Bilateral diffuse Muster ohne regionalen Schwerpunkt',
  },
]

// ─── Mittellinie ──────────────────────────────────────────────────────────────

export const MIDLINE_ELECTRODES = ['Fz', 'Cz', 'Pz']

export const MIDLINE_ENTITIES: string[] = [
  'EEG_0025', // Vertex-Wellen (Cz)
  'EEG_0026', // K-Komplex (Fz)
  'EEG_0027', // Schlafspindeln (Fz/Cz)
  'EEG_0029', // Sägezahnwellen (Cz)
  'EEG_0034', // Midline-Theta-Rhythmus (Fz/Cz/Pz)
  'EEG_0041', // Encoches frontales (Fz)
]

// ─── Elektroden-Koordinaten ───────────────────────────────────────────────────
// SVG-Viewport: 0 0 400 440
// Kopf-Ellipse: cx=200, cy=222, rx=165, ry=182
// Skalierung: x_svg = x_norm/100 * 330 + 35, y_svg = y_norm/100 * 360 + 22

export const ELECTRODE_COORDS: Record<string, { x: number; y: number; region: RegionId; midline?: boolean }> = {
  Fp1: { x: 157, y:  58, region: 'frontopolar' },
  Fp2: { x: 243, y:  58, region: 'frontopolar' },
  F7:  { x:  94, y: 130, region: 'anterotemporal' },
  F3:  { x: 138, y: 114, region: 'frontal' },
  Fz:  { x: 200, y: 108, region: 'frontal', midline: true },
  F4:  { x: 262, y: 114, region: 'frontal' },
  F8:  { x: 306, y: 130, region: 'anterotemporal' },
  T3:  { x:  68, y: 202, region: 'mitteltemporal' },
  C3:  { x: 118, y: 202, region: 'zentral' },
  Cz:  { x: 200, y: 202, region: 'zentral', midline: true },
  C4:  { x: 282, y: 202, region: 'zentral' },
  T4:  { x: 332, y: 202, region: 'mitteltemporal' },
  T5:  { x:  94, y: 274, region: 'posterotemporal' },
  P3:  { x: 138, y: 282, region: 'parietal' },
  Pz:  { x: 200, y: 290, region: 'parietal', midline: true },
  P4:  { x: 262, y: 282, region: 'parietal' },
  T6:  { x: 306, y: 274, region: 'posterotemporal' },
  O1:  { x: 157, y: 350, region: 'okzipital' },
  Oz:  { x: 200, y: 358, region: 'okzipital' },
  O2:  { x: 243, y: 350, region: 'okzipital' },
}

// ─── SVG-Regions-Pfade (clipped zur Kopf-Ellipse) ────────────────────────────
// Jede Region als Polygon-Punkte-String für <polygon points="...">

export const REGION_PATHS: Record<Exclude<RegionId, 'generalisiert'>, string> = {
  frontopolar:     '130,22 270,22 278,82 200,88 122,82',
  frontal:         '122,82 278,82 288,162 200,168 112,162',
  anterotemporal:  '35,108 122,82 112,162 38,178',   // left; right via transform
  mitteltemporal:  '22,178 38,178 112,162 108,242 22,242',
  posterotemporal: '38,242 108,242 120,318 55,328',
  zentral:         '112,162 288,162 292,242 108,242',
  parietal:        '108,242 292,242 278,322 200,330 122,322',
  okzipital:       '122,322 278,322 260,402 200,414 140,402',
}

// Hilfsfunktionen
export function getRegionById(id: RegionId): Region | undefined {
  return REGIONS.find(r => r.id === id)
}

// ─── Dynamische Ableitung aus der Datenbank ──────────────────────────────────
// Statt hartkodierter Entitätslisten (Drift-Gefahr!) wird die Region-Zuordnung
// zur Laufzeit aus den localization- und classification-Feldern der Entitäten
// berechnet. Neue/geänderte Entitäten erscheinen dadurch automatisch korrekt.
//
// LOC_TO_REGIONS ist das kontrollierte Vokabular: jeder in wellen.json
// vorkommende localization-Wert MUSS hier stehen (validate-data.mjs prüft das).
export const LOC_TO_REGIONS: Record<string, RegionId[]> = {
  // generalisiert / unspezifisch-fokal → generalisiert
  'generalisiert': ['generalisiert'],
  'bilateral': ['generalisiert'],
  'hemisphärisch': ['generalisiert'],
  'variabel': ['generalisiert'],
  'fokal_variabel': ['generalisiert'],
  'fokal_moeglich': ['generalisiert'],
  'fokal_oder_generalisiert': ['generalisiert'],
  'multifokale Spikes': ['generalisiert'],
  'bilateral_unabhängig': ['generalisiert'],
  'unilateral': ['generalisiert'],
  'lateral_einseitig': ['generalisiert'],
  // frontopolar
  'frontopolar': ['frontopolar'],
  'Fp1': ['frontopolar'],
  'Fp2': ['frontopolar'],
  // frontal = ÜBERBEGRIFF → schließt frontopolar + frontal (fronto-mesial) ein.
  // NICHT pauschal zentral: fronto-zentrale Entitäten tragen dafür ihr eigenes
  // explizites 'zentral'/'fronto-zentral'-Token.
  'frontal': ['frontopolar', 'frontal'],
  'frontal_betont': ['frontopolar', 'frontal'],
  'frontal-median': ['frontal'],   // median = Fz-spezifisch, nicht frontopolar
  'Fz': ['frontal'],
  'anterior': ['frontopolar', 'frontal'],
  // fronto-zentral = eigenständiger Begriff → Anzeige NUR im Frontal-Feld (Nutzer-Entscheidung).
  // Bleibt zugleich ein präzises Frontal-Token (schaltet die frontopolar-Verbreiterung ab).
  'frontozentral': ['frontal'],
  'fronto-zentral': ['frontal'],
  // zentral (inkl. Vertex, parasagittal)
  'zentral': ['zentral'],
  'Cz': ['zentral'],
  'vertex': ['zentral'],
  'parasagittal': ['zentral'],
  // temporal = ÜBERBEGRIFF → schließt antero-, mittel- UND posterotemporal ein.
  // (Feinere DB-Angabe ist besser, aber generisch 'temporal' deckt alle drei ab.)
  'temporal': ['anterotemporal', 'mitteltemporal', 'posterotemporal'],
  'temporal_anterior': ['anterotemporal'],
  'temporal_mittel': ['mitteltemporal'],
  'temporal_posterior': ['posterotemporal'],
  'posterior-temporal': ['posterotemporal'],
  'T3': ['mitteltemporal'],
  'T4': ['mitteltemporal'],
  'F7': ['anterotemporal'],
  'F8': ['anterotemporal'],
  // parietal
  'parietal': ['parietal'],
  'Pz': ['parietal'],
  'parieto-temporal': ['parietal', 'mitteltemporal'],
  'temporoparietal': ['parietal', 'mitteltemporal'],
  // okzipital / posterior
  'okzipital': ['okzipital'],
  'O1': ['okzipital'],
  'O2': ['okzipital'],
  'posterior': ['okzipital'],
  'parieto-okzipital': ['parietal', 'okzipital'],
  'okzipito-parietal': ['parietal', 'okzipital'],
}

export interface RegionEntities { physiologisch: string[]; pathologisch: string[] }
export type RegionIndex = Record<RegionId, RegionEntities>

// ── Überbegriffe & Präzision ─────────────────────────────────────────────────
// PRINZIP: Eine konkrete Region schlägt immer den Überbegriff. Hat eine Entität
// eine präzise Angabe (z.B. mitteltemporal, frontopolar, fronto-zentral), darf
// der Überbegriff (temporal, frontal) sie NICHT auf die übrigen Unterregionen
// verwässern.
const TEMPORAL_UMBRELLA = new Set(['temporal'])
const FRONTAL_UMBRELLA = new Set(['frontal', 'frontal_betont', 'anterior'])
const UMBRELLA_TOKENS = new Set([...TEMPORAL_UMBRELLA, ...FRONTAL_UMBRELLA])
// Präzise Token, deren Anwesenheit den jeweiligen Überbegriff „ausschaltet":
const PRECISE_TEMPORAL = new Set([
  'temporal_anterior', 'temporal_mittel', 'temporal_posterior', 'posterior-temporal',
  'T3', 'T4', 'F7', 'F8', 'parieto-temporal', 'temporoparietal',
])
const PRECISE_FRONTAL = new Set([
  'frontopolar', 'Fp1', 'Fp2', 'fronto-zentral', 'frontozentral', 'frontal-median', 'Fz',
])

// Regionen einer Entität aus ihrer localization-Liste bestimmen (Präzision schlägt Überbegriff).
export function regionsForLocalization(locs: string[]): RegionId[] {
  const R = new Set<RegionId>()
  // 1. Präzise Token direkt auflösen (Überbegriffe hier überspringen)
  for (const loc of locs)
    if (!UMBRELLA_TOKENS.has(loc))
      for (const rid of LOC_TO_REGIONS[loc] ?? []) R.add(rid)
  // 2. Temporal-Überbegriff: nur breit auffächern, wenn KEIN präzises temporales Token vorliegt
  if (locs.some(l => TEMPORAL_UMBRELLA.has(l)) && !locs.some(l => PRECISE_TEMPORAL.has(l))) {
    R.add('anterotemporal'); R.add('mitteltemporal'); R.add('posterotemporal')
  }
  // 3. Frontal-Überbegriff: Heimregion 'frontal' immer; frontopolar nur ergänzen,
  //    wenn kein präzises frontales Token (frontopolar/fronto-zentral/Fz …) vorliegt
  if (locs.some(l => FRONTAL_UMBRELLA.has(l))) {
    R.add('frontal')
    if (!locs.some(l => PRECISE_FRONTAL.has(l))) R.add('frontopolar')
  }
  return [...R]
}

// classification → Bucket. kontextabhängig (beide Schreibweisen) erscheint in BEIDEN.
const PHYS_CLASSES = new Set(['physiologisch', 'benigne_variante'])
const BOTH_CLASSES = new Set(['kontextabhaengig', 'kontextabhängig'])

export function buildRegionIndex(
  waves: { id: string; localization?: string[]; classification: string }[]
): RegionIndex {
  const idx = {} as RegionIndex
  REGIONS.forEach(r => { idx[r.id] = { physiologisch: [], pathologisch: [] } })
  for (const w of waves) {
    const regions = regionsForLocalization(w.localization ?? [])
    const inPhys = PHYS_CLASSES.has(w.classification) || BOTH_CLASSES.has(w.classification)
    const inPath = !PHYS_CLASSES.has(w.classification) // patho/epileptiform/kontext → pathologisch
    regions.forEach(rid => {
      if (inPhys && !idx[rid].physiologisch.includes(w.id)) idx[rid].physiologisch.push(w.id)
      if (inPath && !idx[rid].pathologisch.includes(w.id)) idx[rid].pathologisch.push(w.id)
    })
  }
  return idx
}
