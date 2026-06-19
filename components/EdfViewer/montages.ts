import type { EdfHeader } from './edfParser'

export type MontageId = 'bipolar' | 'cz'

export const MONTAGE_LABELS: Record<MontageId, string> = {
  bipolar: 'Doppelbanane (DGKN)',
  cz:      'CZ-Referenz',
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

export function normLabel(raw: string): string {
  const s = raw.toUpperCase().replace(/^EEG\s*/i, '').replace(/-[A-Z0-9]+$/, '').trim()
  return ALIASES[s] ?? s
}

export function findChannel(header: EdfHeader, label: string): number {
  const target = normLabel(label)
  return header.signals.findIndex(s => normLabel(s.label) === target)
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
export function getRowColor(colorKey: MontageRow['colorKey'], isDark: boolean): string {
  switch (colorKey) {
    case 'left':  return '#3b82f6'                   // Blau — beide Modes
    case 'right': return isDark ? '#e2e8f0' : '#1e293b'  // Hell auf Dunkel / Dunkel auf Hell
    case 'mid':   return isDark ? '#a16207' : '#92400e'  // Braun/Ocker
    case 'ecg':   return '#ef4444'                   // Rot
  }
}
