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
  // Entitäten getrennt nach Modus
  physiologisch: string[]    // classification: physiologisch | benigne_variante
  pathologisch: string[]     // classification: pathologisch | epileptiform | kontextabhaengig
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
    physiologisch: [],
    pathologisch: [
      'EEG_0046',  // 3-Hz-SWK (frontopolar-betont)
      'EEG_0086',  // WHAM (Fp1/Fp2)
    ],
  },
  {
    id: 'frontal',
    label: 'Frontal',
    labelShort: 'F',
    electrodes: ['F3', 'Fz', 'F4'],
    colorHex: '#93c5fd',      // blue-300
    colorHexPath: '#fca5a5',  // red-300
    description: 'Frontallappen, dorsolateraler präfrontaler Kortex, Fz = fronto-mesial',
    physiologisch: [
      'EEG_0002',  // Beta-Aktivität (frontozentral)
      'EEG_0023',  // Hypnagoge Theta-Delta-Bursts
      'EEG_0024',  // Hypnopompe Theta-Delta-Bursts
      'EEG_0026',  // K-Komplex (Fz)
      'EEG_0027',  // Schlafspindeln (Fz)
      'EEG_0041',  // Encoches frontales (Fz, neonatal)
    ],
    pathologisch: [
      'EEG_0009',  // Vermehrte Beta (medikamentös)
      'EEG_0045',  // Spike-Wave-Komplex (frontal-betont)
      'EEG_0047',  // Langsamer SWK
      'EEG_0050',  // Paroxysmal Fast Activity
      'EEG_0054',  // FIRDA
      'EEG_0067',  // Triphasische Wellen
      'EEG_0070',  // Alpha-Koma (frontal-betont)
      'EEG_0072',  // Beta-Koma
    ],
  },
  {
    id: 'anterotemporal',
    label: 'Anterotemporal',
    labelShort: 'AT',
    electrodes: ['F7', 'F8'],
    colorHex: '#67e8f9',      // cyan-300
    colorHexPath: '#fb923c',  // orange-400
    description: 'Vorderer Temporallappen, frontotemporal (F7/F8)',
    physiologisch: [
      'EEG_0030',  // Small Sharp Spikes (SSS)
      'EEG_0031',  // Wicket Spikes
    ],
    pathologisch: [
      'EEG_0042',  // Spike (fokal temporal)
      'EEG_0043',  // Sharp Wave (temporal)
      'EEG_0075',  // Temporale Verlangsamung des Älteren
    ],
  },
  {
    id: 'mitteltemporal',
    label: 'Mitteltemporal',
    labelShort: 'MT',
    electrodes: ['T3', 'T4'],
    colorHex: '#7dd3fc',      // sky-300
    colorHexPath: '#f97316',  // orange-500
    description: 'Mittlerer Temporallappen (T3=T7, T4=T8)',
    physiologisch: [
      'EEG_0030',  // Small Sharp Spikes
      'EEG_0031',  // Wicket Spikes
      'EEG_0033',  // RMTD (Drowsiness)
    ],
    pathologisch: [
      'EEG_0039',  // Intermittierende Temporale Verlangsamung
      'EEG_0042',  // Spike
      'EEG_0043',  // Sharp Wave
      'EEG_0052',  // Centrotemporale Spikes (BECTS)
      'EEG_0056',  // TIRDA
      'EEG_0057',  // Temporale Theta-Aktivität
      'EEG_0059',  // LPDs (temporal)
      'EEG_0075',  // Temporale Verlangsamung des Älteren
    ],
  },
  {
    id: 'posterotemporal',
    label: 'Posterotemporal',
    labelShort: 'PT',
    electrodes: ['T5', 'T6'],
    colorHex: '#5eead4',      // teal-300
    colorHexPath: '#fdba74',  // orange-300
    description: 'Hinterer Temporallappen (T5=P7, T6=P8)',
    physiologisch: [
      'EEG_0028',  // POSTS
      'EEG_0032',  // 14-und-6-Hz-positive Spikes
      'EEG_0035',  // SREDA
    ],
    pathologisch: [
      'EEG_0056',  // TIRDA
      'EEG_0057',  // Temporale Theta-Aktivität
      'EEG_0059',  // LPDs
    ],
  },
  {
    id: 'zentral',
    label: 'Zentral',
    labelShort: 'C',
    electrodes: ['C3', 'Cz', 'C4'],
    colorHex: '#86efac',      // green-300
    colorHexPath: '#fda4af',  // rose-300
    description: 'Motorischer/somatosensorischer Kortex, Rolando-Region (C3/Cz/C4)',
    physiologisch: [
      'EEG_0002',  // Beta-Aktivität (frontozentral)
      'EEG_0014',  // Mu-Rhythmus (C3/C4)
      'EEG_0025',  // Vertex-Wellen (Cz)
      'EEG_0026',  // K-Komplex
      'EEG_0027',  // Schlafspindeln (Cz)
      'EEG_0029',  // Sägezahnwellen (REM)
      'EEG_0034',  // Midline-Theta-Rhythmus (Cz)
      'EEG_0037',  // Mitten Pattern
    ],
    pathologisch: [
      'EEG_0052',  // Centrotemporale Spikes (BECTS)
      'EEG_0071',  // Spindel-Koma
    ],
  },
  {
    id: 'parietal',
    label: 'Parietal',
    labelShort: 'P',
    electrodes: ['P3', 'Pz', 'P4'],
    colorHex: '#fde047',      // yellow-300
    colorHexPath: '#f9a8d4',  // pink-300
    description: 'Parietallappen, somatosensorischer Assoziationskortex (P3/Pz/P4)',
    physiologisch: [
      'EEG_0001',  // Alpha-Grundrhythmus (okzipitoparietal)
      'EEG_0005',  // Langsame Alpha-Variante
      'EEG_0007',  // Beta-Grundrhythmus
      'EEG_0028',  // POSTS
      'EEG_0034',  // Midline-Theta (Pz)
      'EEG_0035',  // SREDA
      'EEG_0036',  // FOLD (posterior)
      'EEG_0079',  // Langsame Alpha-Variante
      'EEG_0081',  // Schnelle Alpha-Variante
    ],
    pathologisch: [
      'EEG_0010',  // Grundrhythmusverlangsamung
      'EEG_0085',  // Bancaud-Phänomen
    ],
  },
  {
    id: 'okzipital',
    label: 'Okzipital',
    labelShort: 'O',
    electrodes: ['O1', 'Oz', 'O2'],
    colorHex: '#fdba74',      // orange-300
    colorHexPath: '#f87171',  // red-400
    description: 'Okzipitallappen, primärer visueller Kortex (O1/Oz/O2)',
    physiologisch: [
      'EEG_0001',  // Alpha-Grundrhythmus
      'EEG_0005',  // Langsame Alpha-Variante
      'EEG_0006',  // Schnelle Alpha-Variante
      'EEG_0007',  // Beta-Grundrhythmus
      'EEG_0008',  // Theta-Grundrhythmus-Variante
      'EEG_0016',  // Lambda-Wellen
      'EEG_0017',  // Lidschlussaktivität
      'EEG_0018',  // Shut-Eye-Waves
      'EEG_0019',  // Photic Driving
      'EEG_0020',  // Fixation-Off-Sensitivität
      'EEG_0022',  // Hypnagoge Hypersynchronie
      'EEG_0028',  // POSTS
      'EEG_0036',  // FOLD
      'EEG_0038',  // Occipitales Delta der Jugend
      'EEG_0079',  // Langsame Alpha-Variante
      'EEG_0080',  // Alpha-Squeak-Effekt
      'EEG_0081',  // Schnelle Alpha-Variante
      'EEG_0082',  // Posteriore Slow-Wave-Transienten
      'EEG_0083',  // Okzipitale Slow Transients / Cone Waves
      'EEG_0084',  // Nadelspitzen bei Blindheit
    ],
    pathologisch: [
      'EEG_0010',  // Grundrhythmusverlangsamung
      'EEG_0049',  // Photoparoxysmale Reaktion
      'EEG_0055',  // OIRDA
      'EEG_0085',  // Bancaud-Phänomen
    ],
  },
  {
    id: 'generalisiert',
    label: 'Generalisiert / Diffus',
    labelShort: 'GEN',
    electrodes: [],
    colorHex: '#cbd5e1',      // slate-300
    colorHexPath: '#fca5a5',  // red-300
    description: 'Bilateral diffuse Muster ohne regionalen Schwerpunkt',
    physiologisch: [
      'EEG_0011',  // Grundrhythmus-Suppression (durch Sedierung)
      'EEG_0021',  // Arousal-Reaktion
      'EEG_0077',  // Tracé alternant (neonatal physiologisch)
      'EEG_0078',  // Tracé discontinu (neonatal physiologisch)
    ],
    pathologisch: [
      'EEG_0011',  // Grundrhythmus-Suppression (pathologisch)
      'EEG_0012',  // Asymmetrischer Grundrhythmus
      'EEG_0013',  // Elektrozerebrale Inaktivität
      'EEG_0044',  // Polyspikes
      'EEG_0045',  // Spike-Wave-Komplex
      'EEG_0046',  // 3-Hz-SWK
      'EEG_0047',  // Langsamer SWK
      'EEG_0048',  // Polyspike-Wave-Komplex
      'EEG_0051',  // GPFA
      'EEG_0053',  // Hypsarrhythmie
      'EEG_0058',  // Slow Waves (diffus)
      'EEG_0060',  // GPDs
      'EEG_0064',  // GRDA
      'EEG_0068',  // Bursts
      'EEG_0069',  // Burst-Suppression
      'EEG_0073',  // Burst-Attenuation
      'EEG_0074',  // Eye-Closure Sensitivity
      'EEG_0076',  // Delta-Brushes
    ],
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

export function getEntitiesForRegion(regionId: RegionId, mode: TopoMode): string[] {
  const region = getRegionById(regionId)
  if (!region) return []
  return mode === 'physiologisch' ? region.physiologisch : region.pathologisch
}
