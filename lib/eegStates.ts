// Mapping: EntityId → EEG-State (welche synthetische Simulation passt)
// Wird erweitert sobald neue States (sleep_n2, spike_temporal, ...) gebaut werden.

import type { EEGState } from '@/components/EEGViewer/signals'

export const ENTITY_EEG_STATE: Partial<Record<string, EEGState>> = {
  'EEG_0001': 'normal_alpha',   // Alpha-Grundrhythmus / PDR
  'EEG_0027': 'sleep_n2',       // Schlafspindeln (N2)
  'EEG_0026': 'sleep_n2',       // K-Komplex — teilt N2-State
  'EEG_0101': 'sleep_n3',       // Slow Wave Activity (N3 / SWS)
  'EEG_0029': 'sleep_rem',      // Sägezahnwellen (REM)
  // 'EEG_0042': 'spike_focal', // Spike — sobald State existiert
}

// Lokalisierung → relevante Montage-Gruppen (Subset-Ansicht)
// Gibt [] zurück wenn alle Ketten relevant sind (generalisiert/diffus).
export function localizationToChainGroups(localization: string[]): string[] {
  const loc = localization.join(' ').toLowerCase()

  if (loc.includes('generalisiert') || loc.includes('diffus') || loc.includes('bilateral')) {
    return [] // alle Ketten zeigen
  }
  if (loc.includes('temporal')) {
    return ['Temp. rechts', 'Temp. links']
  }
  if (loc.includes('okzipital') || loc.includes('parietal') || loc.includes('parasagittal')) {
    return ['Parasag. rechts', 'Parasag. links']
  }
  if (loc.includes('frontal') || loc.includes('frontopolar') || loc.includes('frontozentral')) {
    return ['Parasag. rechts', 'Parasag. links', 'Mittellinie']
  }
  if (loc.includes('zentral') || loc.includes('parietal') || loc.includes('zentroparietal')) {
    return ['Parasag. rechts', 'Parasag. links', 'Mittellinie']
  }
  // Fallback: parasagittal
  return ['Parasag. rechts', 'Parasag. links']
}
