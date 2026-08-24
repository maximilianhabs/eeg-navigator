import type { EdfHeader } from './edfParser'

export type MontageId = 'bipolar' | 'cz' | 'avg' | 'raw'

export const MONTAGE_LABELS: Record<MontageId, string> = {
  bipolar: 'Doppelbanane (DGKN)',
  cz:      'CZ-Referenz',
  avg:     'Average-Referenz',
  raw:     'Roh (wie aufgezeichnet)',
}

// Sentinel: sigB = -2 → "subtract average reference" (computed in EdfPanel)
export const AVG_REF_SENTINEL = -2

// Whitelist der Standard 10-20 Elektroden für Average-Referenz-Berechnung
const EEG_10_20 = new Set([
  'FP1','FP2','F7','F3','FZ','F4','F8',
  'T3','T7','C3','CZ','C4','T4','T8',
  'T5','P7','P3','PZ','P4','T6','P8',
  'O1','O2','A1','A2','M1','M2',
  'AF3','AF4','AF7','AF8',
  'F1','F2','F5','F6',
  'FC1','FC2','FC3','FC4','FC5','FC6','FCZ',
  'CP1','CP2','CP3','CP4','CP5','CP6','CPZ',
  'P1','P2','P5','P6',
  'PO3','PO4','PO7','PO8','POZ',
  'OZ',
])

/** Gibt true zurück wenn das Label eine bekannte EEG-Elektrode nach 10-20 ist */
export function isStandardEegChannel(rawLabel: string): boolean {
  return EEG_10_20.has(normLabel(rawLabel))
}

// ── DGKN Doppelbanane — Gruppen mit Farbe ────────────────────────────────────
const DGKN_GROUPS: { label: string; color: 'left' | 'right' | 'mid'; pairs: [string, string][] }[] = [
  {
    label: 'Temporal links',
    color: 'left',
    pairs: [['Fp1','F7'], ['F7','T3'], ['T3','T5'], ['T5','O1']],
  },
  {
    label: 'Temporal rechts',
    color: 'right',
    pairs: [['Fp2','F8'], ['F8','T4'], ['T4','T6'], ['T6','O2']],
  },
  {
    label: 'Parasagittal links',
    color: 'left',
    pairs: [['Fp1','F3'], ['F3','C3'], ['C3','P3'], ['P3','O1']],
  },
  {
    label: 'Parasagittal rechts',
    color: 'right',
    pairs: [['Fp2','F4'], ['F4','C4'], ['C4','P4'], ['P4','O2']],
  },
  {
    label: 'Mittellinie',
    color: 'mid',
    pairs: [['Fz','Cz'], ['Cz','Pz']],
  },
]

const ALIASES: Record<string, string> = {
  T7:'T3', T8:'T4', P7:'T5', P8:'T6', M1:'A1', M2:'A2',
}

// Suffix nur strippen, wenn er eine ECHTE Referenz-Endung ist (Ref-Platzhalter oder
// Mastoid/Ohr-Referenz), NICHT wenn er selbst ein Skalp-Elektrodenname ist. Sonst würde
// z.B. "Fp1-F7" (ein bereits-differentieller Kanal einer vormontierten Datei) fälschlich
// zu "FP1" normalisiert und mit einer echten Fp1-Elektrode verwechselt (siehe
// EEG_0036__02: buildMontageRows hätte sonst "Fp1-F7" MINUS "F7-T3" verrechnet).
const REFERENCE_SUFFIXES = new Set(['REF', 'A1', 'A2', 'M1', 'M2'])

export function normLabel(raw: string): string {
  const noPrefix = raw.toUpperCase().replace(/^EEG\s*/i, '').trim()
  const m = noPrefix.match(/^(.+)-([A-Z0-9]+)$/)
  const s = (m && REFERENCE_SUFFIXES.has(m[2])) ? m[1] : noPrefix
  return ALIASES[s] ?? s
}

export function findChannel(header: EdfHeader, label: string): number {
  const target = normLabel(label)
  return header.signals.findIndex(s => normLabel(s.label) === target)
}

/**
 * Erkennt bereits montierte Dateien: Mehrheit der EEG-Kanäle trägt bipolare
 * Ableitungs-Labels wie "Fp1-F7" (zwei bekannte 10-20-Elektroden mit Bindestrich).
 * Solche Dateien (z.B. aus Abbildungen rekonstruierte Doppelbananen) im Roh-Modus zeigen.
 */
export function isPreMontaged(header: EdfHeader): boolean {
  let bipolar = 0, total = 0
  for (const s of header.signals) {
    const raw = s.label.replace(/^EEG\s*/i, '').trim()
    if (/ECG|EKG|CARD/i.test(raw)) continue
    total++
    const m = raw.toUpperCase().match(/^([A-Z0-9]+)-([A-Z0-9]+)$/)
    if (m) {
      const a = ALIASES[m[1]] ?? m[1]
      const b = ALIASES[m[2]] ?? m[2]
      if (EEG_10_20.has(a) && EEG_10_20.has(b)) bipolar++
    }
  }
  return total > 0 && bipolar / total > 0.6
}

export interface MontageRow {
  label:    string
  sigA:     number
  sigB:     number    // -1 = raw sigA
  fs:       number
  isEcg:    boolean
  isSpacer: boolean
  colorKey: 'left' | 'right' | 'mid' | 'ecg'
  ampRange: number
  groupLabel?: string
}

export function buildMontageRows(header: EdfHeader, montage: MontageId): MontageRow[] {
  const rows: MontageRow[] = []

  if (montage === 'bipolar') {
    let firstGroup = true
    for (const group of DGKN_GROUPS) {
      const groupRows: MontageRow[] = []
      for (const [a, b] of group.pairs) {
        const iA = findChannel(header, a)
        const iB = findChannel(header, b)
        if (iA < 0 || iB < 0) continue
        groupRows.push({
          label:    `${a}-${b}`,
          sigA:     iA,
          sigB:     iB,
          fs:       header.signals[iA].sampleRate,
          isEcg:    false,
          isSpacer: false,
          colorKey: group.color,
          ampRange: 150,
          groupLabel: group.label,
        })
      }
      if (groupRows.length === 0) continue
      if (!firstGroup) {
        rows.push({ label:'', sigA:-1, sigB:-1, fs:0, isEcg:false, isSpacer:true, colorKey:'mid', ampRange:0 })
      }
      rows.push(...groupRows)
      firstGroup = false
    }
  }

  if (montage === 'cz') {
    const czIdx = findChannel(header, 'Cz')
    if (czIdx < 0) return buildMontageRows(header, 'bipolar')

    // DGKN-Reihenfolge für CZ-Referenz: dieselbe Gruppenstruktur wie Doppelbanane
    const CZ_GROUPS: { label: string; color: 'left' | 'right' | 'mid'; electrodes: string[] }[] = [
      { label: 'Temporal links',      color: 'left',  electrodes: ['Fp1','F7','T3','T5','O1'] },
      { label: 'Temporal rechts',     color: 'right', electrodes: ['Fp2','F8','T4','T6','O2'] },
      { label: 'Parasagittal links',  color: 'left',  electrodes: ['Fp1','F3','C3','P3','O1'] },
      { label: 'Parasagittal rechts', color: 'right', electrodes: ['Fp2','F4','C4','P4','O2'] },
      { label: 'Mittellinie',         color: 'mid',   electrodes: ['Fz','Pz'] },
    ]

    let firstGroup = true
    for (const group of CZ_GROUPS) {
      const groupRows: MontageRow[] = []
      for (const el of group.electrodes) {
        const iA = findChannel(header, el)
        if (iA < 0) continue
        groupRows.push({
          label:    `${el}-Cz`,
          sigA:     iA,
          sigB:     czIdx,
          fs:       header.signals[iA].sampleRate,
          isEcg:    false,
          isSpacer: false,
          colorKey: group.color,
          ampRange: 150,
          groupLabel: group.label,
        })
      }
      if (groupRows.length === 0) continue
      if (!firstGroup) {
        rows.push({ label:'', sigA:-1, sigB:-1, fs:0, isEcg:false, isSpacer:true, colorKey:'mid', ampRange:0 })
      }
      rows.push(...groupRows)
      firstGroup = false
    }
  }

  if (montage === 'avg') {
    // Dieselbe Gruppenstruktur wie CZ, aber sigB = AVG_REF_SENTINEL → EdfPanel subtrahiert Average
    const AVG_GROUPS: { label: string; color: 'left' | 'right' | 'mid'; electrodes: string[] }[] = [
      { label: 'Temporal links',      color: 'left',  electrodes: ['Fp1','F7','T3','T5','O1'] },
      { label: 'Temporal rechts',     color: 'right', electrodes: ['Fp2','F8','T4','T6','O2'] },
      { label: 'Parasagittal links',  color: 'left',  electrodes: ['Fp1','F3','C3','P3','O1'] },
      { label: 'Parasagittal rechts', color: 'right', electrodes: ['Fp2','F4','C4','P4','O2'] },
      { label: 'Mittellinie',         color: 'mid',   electrodes: ['Fz','Cz','Pz'] },
    ]

    let firstGroup = true
    for (const group of AVG_GROUPS) {
      const groupRows: MontageRow[] = []
      for (const el of group.electrodes) {
        const iA = findChannel(header, el)
        if (iA < 0) continue
        groupRows.push({
          label:    `${el}-Avg`,
          sigA:     iA,
          sigB:     AVG_REF_SENTINEL,
          fs:       header.signals[iA].sampleRate,
          isEcg:    false,
          isSpacer: false,
          colorKey: group.color,
          ampRange: 150,
          groupLabel: group.label,
        })
      }
      if (groupRows.length === 0) continue
      if (!firstGroup) {
        rows.push({ label:'', sigA:-1, sigB:-1, fs:0, isEcg:false, isSpacer:true, colorKey:'mid', ampRange:0 })
      }
      rows.push(...groupRows)
      firstGroup = false
    }
  }

  if (montage === 'raw') {
    // Roh/Passthrough: jeder (Nicht-EKG-)Kanal wird 1:1 dargestellt (sigB = -1).
    // Für bereits montierte Dateien (z.B. rekonstruierte Doppelbananen) ist das
    // die korrekte Darstellung — keine erneute Verrechnung.
    for (let i = 0; i < header.signals.length; i++) {
      const raw = header.signals[i].label.replace(/^EEG\s*/i, '').trim()
      if (/ECG|EKG|CARD/i.test(raw) || /^POL X1$/i.test(raw)) continue
      rows.push({
        label:    raw,
        sigA:     i,
        sigB:     -1,
        fs:       header.signals[i].sampleRate,
        isEcg:    false,
        isSpacer: false,
        colorKey: /2$|4$|6$|8$/.test(raw.split('-')[0]) ? 'right' : 'left',
        ampRange: 150,
      })
    }
  }

  // EKG/ECG — Spacer davor, feste klinische Skalierung (QRS prominent)
  // "POL E" = Nihon Kohden EKG-Kanal (Elektrode E = EKG)
  const ecgSignals: MontageRow[] = []
  for (let i = 0; i < header.signals.length; i++) {
    if (/ECG|EKG|CARD/i.test(header.signals[i].label) || /^POL X1$/i.test(header.signals[i].label.trim())) {
      const sig = header.signals[i]
      const range = Math.abs(sig.physMax - sig.physMin)
      if (range === 0) continue
      // Feste Skalierung: 25% der physischen Spanne → QRS-Zacke füllt den Kanal gut aus
      ecgSignals.push({
        label:    'EKG',
        sigA:     i,
        sigB:     -1,
        fs:       sig.sampleRate,
        isEcg:    true,
        isSpacer: false,
        colorKey: 'ecg',
        ampRange: range * 0.25,
      })
    }
  }
  if (ecgSignals.length > 0 && rows.length > 0) {
    rows.push({ label:'', sigA:-1, sigB:-1, fs:0, isEcg:false, isSpacer:true, colorKey:'mid', ampRange:0 })
    rows.push(...ecgSignals)
  }

  return rows
}

// Farben nach colorKey + dark/light mode
export function getRowColor(colorKey: MontageRow['colorKey'], isDark: boolean, neonMode = false): string {
  if (neonMode) {
    switch (colorKey) {
      case 'left':  return '#00ff88'  // Neon-Grün (temporal/parasagittal links)
      case 'right': return '#00bfff'  // Neon-Cyan (temporal/parasagittal rechts)
      case 'mid':   return '#ff8c00'  // Neon-Orange (Mittellinie)
      case 'ecg':   return '#ff3333'  // Neon-Rot (EKG)
    }
  }
  switch (colorKey) {
    case 'left':  return '#3b82f6'                        // Blau — beide Modes
    case 'right': return isDark ? '#e2e8f0' : '#1e293b'   // Hell auf Dunkel / Dunkel auf Hell
    case 'mid':   return isDark ? '#a16207' : '#92400e'   // Braun/Ocker
    case 'ecg':   return '#ef4444'                        // Rot
  }
}
