// DGKN-konforme Montagen
// Bipolar longitudinal (Doppelbanane) + Cz-Referenz

import type { ElectrodeSignals } from './signals'
import { N_SAMPLES } from './signals'

export type MontageId = 'bipolar_longitudinal' | 'cz_reference' | 'mobile_subset'

export interface Channel {
  label: string        // Anzeigebeschriftung, z.B. "Fp1–F7"
  electrodes: string[] // [anode, kathode] für bipolar; [elektrode] für Referenz
  group: string        // für visuelle Gruppierung mit Trennlinie
}

// Doppelbanane (DGKN Standard)
// Reihenfolge: Temp. rechts → Temp. links → Parasag. rechts → Parasag. links → Mittellinie
// (gerade Zahlen / rechte Hemisphäre zuerst — klinische Konvention Deutschland)
export const BIPOLAR_LONGITUDINAL: Channel[] = [
  // Rechte Temporalreihe (gerade Elektroden)
  { label: 'Fp2–F8', electrodes: ['Fp2', 'F8'], group: 'Temp. rechts' },
  { label: 'F8–T4',  electrodes: ['F8',  'T4'], group: 'Temp. rechts' },
  { label: 'T4–T6',  electrodes: ['T4',  'T6'], group: 'Temp. rechts' },
  { label: 'T6–O2',  electrodes: ['T6',  'O2'], group: 'Temp. rechts' },
  // Linke Temporalreihe (ungerade Elektroden)
  { label: 'Fp1–F7', electrodes: ['Fp1', 'F7'], group: 'Temp. links' },
  { label: 'F7–T3',  electrodes: ['F7',  'T3'], group: 'Temp. links' },
  { label: 'T3–T5',  electrodes: ['T3',  'T5'], group: 'Temp. links' },
  { label: 'T5–O1',  electrodes: ['T5',  'O1'], group: 'Temp. links' },
  // Rechte Parasagittalreihe
  { label: 'Fp2–F4', electrodes: ['Fp2', 'F4'], group: 'Parasag. rechts' },
  { label: 'F4–C4',  electrodes: ['F4',  'C4'], group: 'Parasag. rechts' },
  { label: 'C4–P4',  electrodes: ['C4',  'P4'], group: 'Parasag. rechts' },
  { label: 'P4–O2',  electrodes: ['P4',  'O2'], group: 'Parasag. rechts' },
  // Linke Parasagittalreihe
  { label: 'Fp1–F3', electrodes: ['Fp1', 'F3'], group: 'Parasag. links' },
  { label: 'F3–C3',  electrodes: ['F3',  'C3'], group: 'Parasag. links' },
  { label: 'C3–P3',  electrodes: ['C3',  'P3'], group: 'Parasag. links' },
  { label: 'P3–O1',  electrodes: ['P3',  'O1'], group: 'Parasag. links' },
  // Mittellinie
  { label: 'Fz–Cz',  electrodes: ['Fz',  'Cz'], group: 'Mittellinie' },
  { label: 'Cz–Pz',  electrodes: ['Cz',  'Pz'], group: 'Mittellinie' },
  // EKG-Platzhalter (perspektivisch: Pulsartefakt-Simulation)
  // { label: 'EKG', electrodes: ['EKG'], group: 'EKG' },
]

// Cz-Referenz: gleiche Kanalreihenfolge wie Doppelbanane, einzeln gegen Cz
export const CZ_REFERENCE: Channel[] = [
  // Rechte Temporalreihe
  { label: 'Fp2–Cz', electrodes: ['Fp2'], group: 'Temp. rechts' },
  { label: 'F8–Cz',  electrodes: ['F8'],  group: 'Temp. rechts' },
  { label: 'T4–Cz',  electrodes: ['T4'],  group: 'Temp. rechts' },
  { label: 'T6–Cz',  electrodes: ['T6'],  group: 'Temp. rechts' },
  { label: 'O2–Cz',  electrodes: ['O2'],  group: 'Temp. rechts' },
  // Linke Temporalreihe
  { label: 'Fp1–Cz', electrodes: ['Fp1'], group: 'Temp. links' },
  { label: 'F7–Cz',  electrodes: ['F7'],  group: 'Temp. links' },
  { label: 'T3–Cz',  electrodes: ['T3'],  group: 'Temp. links' },
  { label: 'T5–Cz',  electrodes: ['T5'],  group: 'Temp. links' },
  { label: 'O1–Cz',  electrodes: ['O1'],  group: 'Temp. links' },
  // Rechte Parasagittalreihe
  { label: 'Fp2–Cz', electrodes: ['Fp2'], group: 'Parasag. rechts' },
  { label: 'F4–Cz',  electrodes: ['F4'],  group: 'Parasag. rechts' },
  { label: 'C4–Cz',  electrodes: ['C4'],  group: 'Parasag. rechts' },
  { label: 'P4–Cz',  electrodes: ['P4'],  group: 'Parasag. rechts' },
  { label: 'O2–Cz',  electrodes: ['O2'],  group: 'Parasag. rechts' },
  // Linke Parasagittalreihe
  { label: 'Fp1–Cz', electrodes: ['Fp1'], group: 'Parasag. links' },
  { label: 'F3–Cz',  electrodes: ['F3'],  group: 'Parasag. links' },
  { label: 'C3–Cz',  electrodes: ['C3'],  group: 'Parasag. links' },
  { label: 'P3–Cz',  electrodes: ['P3'],  group: 'Parasag. links' },
  { label: 'O1–Cz',  electrodes: ['O1'],  group: 'Parasag. links' },
  // Mittellinie
  { label: 'Fz–Cz',  electrodes: ['Fz'],  group: 'Mittellinie' },
  { label: 'Pz–Cz',  electrodes: ['Pz'],  group: 'Mittellinie' },
]

// 8-Kanal-Subset für mobil: parasagittal beidseits (Alpha + Schlafspindeln gut sichtbar)
export const MOBILE_SUBSET: Channel[] = [
  { label: 'Fp2–F4', electrodes: ['Fp2', 'F4'], group: 'Parasag. rechts' },
  { label: 'F4–C4',  electrodes: ['F4',  'C4'], group: 'Parasag. rechts' },
  { label: 'C4–P4',  electrodes: ['C4',  'P4'], group: 'Parasag. rechts' },
  { label: 'P4–O2',  electrodes: ['P4',  'O2'], group: 'Parasag. rechts' },
  { label: 'Fp1–F3', electrodes: ['Fp1', 'F3'], group: 'Parasag. links' },
  { label: 'F3–C3',  electrodes: ['F3',  'C3'], group: 'Parasag. links' },
  { label: 'C3–P3',  electrodes: ['C3',  'P3'], group: 'Parasag. links' },
  { label: 'P3–O1',  electrodes: ['P3',  'O1'], group: 'Parasag. links' },
]

export const MONTAGES: Record<MontageId, Channel[]> = {
  bipolar_longitudinal: BIPOLAR_LONGITUDINAL,
  cz_reference: CZ_REFERENCE,
  mobile_subset: MOBILE_SUBSET,
}

export const MONTAGE_LABELS: Record<MontageId, string> = {
  bipolar_longitudinal: 'Bipolar longitudinal (Doppelbanane)',
  cz_reference: 'Cz-Referenz',
  mobile_subset: 'Parasagittal beidseits (8 Kanäle)',
}

// Compute channel signals from electrode signals
export function deriveChannelSignals(
  montage: Channel[],
  electrodeSignals: ElectrodeSignals,
  montageId: MontageId
): Float32Array[] {
  return montage.map(ch => {
    const out = new Float32Array(N_SAMPLES)
    if (montageId === 'bipolar_longitudinal' || montageId === 'mobile_subset') {
      // V(anode) - V(kathode)
      const a = electrodeSignals[ch.electrodes[0]]
      const b = electrodeSignals[ch.electrodes[1]]
      if (a && b) for (let i = 0; i < N_SAMPLES; i++) out[i] = a[i] - b[i]
    } else {
      // V(electrode) - V(Cz)
      const a = electrodeSignals[ch.electrodes[0]]
      const cz = electrodeSignals['Cz']
      if (a && cz) for (let i = 0; i < N_SAMPLES; i++) out[i] = a[i] - cz[i]
    }
    return out
  })
}
