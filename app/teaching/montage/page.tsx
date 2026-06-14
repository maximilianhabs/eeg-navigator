'use client'

import { useState, useMemo } from 'react'
import { ELECTRODE_COORDS, REGION_PATHS } from '@/data/topography'

// ─── Feldberechnung ───────────────────────────────────────────────────────────

const AMPLITUDE = 150 // µV — Signalmaximum

const FIELD_SIGMA: Record<string, number> = { fokal: 32, mittel: 62, weit: 95 }

const DIPOLE_PARTNERS: Record<string, string> = {
  Fp1:'T3', Fp2:'T4',
  F7:'T5',  F8:'T6',
  F3:'P3',  F4:'P4',
  Fz:'Pz',
  T3:'Fp1', T4:'Fp2',
  T5:'F7',  T6:'F8',
  C3:'Fp1', C4:'Fp2',
  Cz:'Pz',
  P3:'F3',  P4:'F4',
  Pz:'Fz',
  O1:'F3',  O2:'F4',
  Oz:'Fz',
}

function computeField(
  source: string,
  polarity: 'negativ' | 'positiv',
  sigma: number,
  showDipole: boolean,
): Record<string, number> {
  const src = ELECTRODE_COORDS[source]
  if (!src) return {}
  const sign = polarity === 'negativ' ? -1 : 1
  const field: Record<string, number> = {}

  for (const [id, pos] of Object.entries(ELECTRODE_COORDS)) {
    const d2 = (pos.x - src.x) ** 2 + (pos.y - src.y) ** 2
    field[id] = sign * AMPLITUDE * Math.exp(-d2 / (2 * sigma ** 2))
  }

  if (showDipole) {
    const partner = DIPOLE_PARTNERS[source]
    const dp = partner ? ELECTRODE_COORDS[partner] : null
    if (dp) {
      for (const [id, pos] of Object.entries(ELECTRODE_COORDS)) {
        const d2 = (pos.x - dp.x) ** 2 + (pos.y - dp.y) ** 2
        field[id] = (field[id] ?? 0) + (-sign * AMPLITUDE * 0.55 * Math.exp(-d2 / (2 * (sigma * 0.85) ** 2)))
      }
    }
  }
  return field
}

// ─── Montage-Ketten ───────────────────────────────────────────────────────────

interface Pair { a: string; b: string }
interface Chain { id: string; label: string; short: string; pairs: Pair[]; color: string; referential?: boolean }

const CHAINS: Chain[] = [
  { id: 'tl',     label: 'Temporale Kette links',     short: 'Temp. L',  color: '#3b82f6',
    pairs: [{a:'Fp1',b:'F7'},{a:'F7',b:'T3'},{a:'T3',b:'T5'},{a:'T5',b:'O1'}] },
  { id: 'tr',     label: 'Temporale Kette rechts',     short: 'Temp. R',  color: '#3b82f6',
    pairs: [{a:'Fp2',b:'F8'},{a:'F8',b:'T4'},{a:'T4',b:'T6'},{a:'T6',b:'O2'}] },
  { id: 'pl',     label: 'Parasagittale Kette links',  short: 'Para. L',  color: '#14b8a6',
    pairs: [{a:'Fp1',b:'F3'},{a:'F3',b:'C3'},{a:'C3',b:'P3'},{a:'P3',b:'O1'}] },
  { id: 'pr',     label: 'Parasagittale Kette rechts', short: 'Para. R',  color: '#14b8a6',
    pairs: [{a:'Fp2',b:'F4'},{a:'F4',b:'C4'},{a:'C4',b:'P4'},{a:'P4',b:'O2'}] },
  { id: 'qc',     label: 'Querreihe Zentral',          short: 'Quer C',   color: '#8b5cf6',
    pairs: [{a:'T3',b:'C3'},{a:'C3',b:'Cz'},{a:'Cz',b:'C4'},{a:'C4',b:'T4'}] },
  { id: 'qf',     label: 'Querreihe Frontal',          short: 'Quer F',   color: '#8b5cf6',
    pairs: [{a:'F7',b:'F3'},{a:'F3',b:'Fz'},{a:'Fz',b:'F4'},{a:'F4',b:'F8'}] },
  { id: 'ref_cz', label: 'Cz-Referenz (links)',        short: 'Ref. Cz',  color: '#f59e0b', referential: true,
    pairs: [{a:'Fp1',b:'Cz'},{a:'F7',b:'Cz'},{a:'F3',b:'Cz'},{a:'T3',b:'Cz'},{a:'C3',b:'Cz'},{a:'T5',b:'Cz'},{a:'P3',b:'Cz'},{a:'O1',b:'Cz'}] },
]

// Elektroden, die für das Lehren besonders lohnend sind
const SOURCE_ELECTRODES = ['Fp1','F7','F3','Fz','T3','C3','Cz','T5','P3','Pz','O1','T4','T6']

// ─── SVG-Kopf: Feldvisualisierung ────────────────────────────────────────────

const W = 400; const H = 440
const REGION_COLOR = '#e2e8f0'

function voltageColor(v: number, maxAbs: number): string {
  if (maxAbs === 0) return 'transparent'
  const t = Math.min(1, Math.abs(v) / maxAbs)
  if (v < -2)  return `rgba(59,130,246,${0.15 + t * 0.75})`  // blau  = negativ
  if (v > 2)   return `rgba(239,68,68,${0.15 + t * 0.75})`   // rot   = positiv
  return 'rgba(148,163,184,0.25)'
}

function voltageRadius(v: number, maxAbs: number): number {
  if (maxAbs === 0) return 9
  const t = Math.min(1, Math.abs(v) / maxAbs)
  return 9 + t * 13
}

interface HeadProps {
  field: Record<string, number>
  source: string
  showDipole: boolean
  polarity: 'negativ' | 'positiv'
  onSelectElectrode: (id: string) => void
  visibleChains: Chain[]
}

function FieldHeadSVG({ field, source, onSelectElectrode, visibleChains }: HeadProps) {
  const maxAbs = Math.max(...Object.values(field).map(Math.abs), 1)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs mx-auto select-none">
      {/* Kopf-Ellipse */}
      <ellipse cx={200} cy={222} rx={165} ry={190} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />

      {/* Nasion */}
      <path d="M188,24 L200,10 L212,24" fill="none" stroke="#94a3b8" strokeWidth="2" />

      {/* Ohren */}
      <ellipse cx={36} cy={222} rx={12} ry={20} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
      <ellipse cx={364} cy={222} rx={12} ry={20} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>

      {/* Regionen */}
      {(Object.entries(REGION_PATHS) as [string, string][]).map(([id, pts]) => (
        <polygon key={id} points={pts} fill={REGION_COLOR} stroke="#e2e8f0" strokeWidth="1" opacity="0.5" />
      ))}
      {/* Gespiegelte Regionen (rechts) */}
      {(['anterotemporal','mitteltemporal','posterotemporal'] as const).map(id => {
        const pts = REGION_PATHS[id]
        const mirrored = pts.split(' ').map(p => {
          const [x,y] = p.split(',').map(Number)
          return `${W-x},${y}`
        }).join(' ')
        return <polygon key={`${id}_r`} points={mirrored} fill={REGION_COLOR} stroke="#e2e8f0" strokeWidth="1" opacity="0.5" />
      })}

      {/* Montage-Verbindungslinien */}
      {visibleChains.map(chain =>
        chain.pairs.map(({a, b}, i) => {
          const pa = ELECTRODE_COORDS[a]; const pb = ELECTRODE_COORDS[b]
          if (!pa || !pb) return null
          return (
            <line key={`${chain.id}-${i}`}
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={chain.color}
              strokeWidth={chain.referential ? 1.2 : 2}
              strokeDasharray={chain.referential ? '3 4' : '6 3'}
              opacity="0.55"
              strokeLinecap="round"
            />
          )
        })
      )}

      {/* Feldaura um Quellelektrode */}
      {ELECTRODE_COORDS[source] && (() => {
        const pos = ELECTRODE_COORDS[source]
        const fieldV = field[source] ?? 0
        const isNeg = fieldV < 0
        return Array.from({length: 4}, (_, i) => (
          <circle
            key={i}
            cx={pos.x} cy={pos.y}
            r={24 + i * 14}
            fill="none"
            stroke={isNeg ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)'}
            strokeWidth="10"
          />
        ))
      })()}

      {/* Elektroden */}
      {Object.entries(ELECTRODE_COORDS).map(([id, pos]) => {
        const v = field[id] ?? 0
        const r = voltageRadius(v, maxAbs)
        const fill = voltageColor(v, maxAbs)
        const isSource = id === source
        return (
          <g key={id} className="cursor-pointer" onClick={() => onSelectElectrode(id)}>
            {isSource && <circle cx={pos.x} cy={pos.y} r={r + 5} fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeDasharray="4 2"/>}
            <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={isSource ? '#1d4ed8' : '#94a3b8'} strokeWidth={isSource ? 2 : 1} />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
              fontSize="9" fontWeight={isSource ? '700' : '600'}
              fill={isSource ? '#1d4ed8' : Math.abs(v) > 30 ? '#fff' : '#475569'}
            >{id}</text>
          </g>
        )
      })}

      {/* µV-Legende */}
      <g>
        <circle cx={18} cy={408} r={8} fill="rgba(59,130,246,0.7)" />
        <text x={30} y={412} fontSize="9" fill="#475569">negativ</text>
        <circle cx={78} cy={408} r={8} fill="rgba(239,68,68,0.7)" />
        <text x={90} y={412} fontSize="9" fill="#475569">positiv</text>
      </g>
    </svg>
  )
}

// ─── EEG-Kurven ──────────────────────────────────────────────────────────────

const CH_H = 52    // Höhe pro Kanal in px
const TRACE_W = 280
const MAX_DEFL = 20 // px Maximalauslenkung

type Morphology = 'spike' | 'sharp' | 'slow'

function spikePathD(voltage: number, maxV: number, morph: Morphology): string {
  const baseline = CH_H / 2
  // EEG-Konvention: negatives Kanalvoltage → Ausschlag nach oben (kleines y in SVG)
  const defl = maxV === 0 ? 0 : (voltage / maxV) * MAX_DEFL
  const x0 = 8; const x1 = TRACE_W - 8
  const xpeak = 110

  if (Math.abs(defl) < 0.5) return `M ${x0} ${baseline} L ${x1} ${baseline}`

  const p = baseline + defl  // Peak-y

  if (morph === 'spike') {
    // Sehr spitz: Anstieg 7 px, Abfall 20 px + kleine entgegengesetzte Nachkomponente
    const after = baseline - defl * 0.18
    return [
      `M ${x0} ${baseline}`,
      `L ${xpeak - 7} ${baseline}`,
      `L ${xpeak} ${p}`,
      `L ${xpeak + 20} ${baseline}`,
      `L ${xpeak + 38} ${after}`,
      `L ${xpeak + 60} ${baseline}`,
      `L ${x1} ${baseline}`,
    ].join(' ')
  }

  if (morph === 'sharp') {
    // Sharp Wave: Anstieg 16 px, Abfall 45 px
    return [
      `M ${x0} ${baseline}`,
      `L ${xpeak - 16} ${baseline}`,
      `L ${xpeak} ${p}`,
      `L ${xpeak + 45} ${baseline}`,
      `L ${x1} ${baseline}`,
    ].join(' ')
  }

  // Slow Wave: breite sanfte Bezier-Kurve
  const rs = xpeak - 60; const re = xpeak + 100
  return [
    `M ${x0} ${baseline}`,
    `C ${rs + 20} ${baseline}, ${xpeak - 15} ${p}, ${xpeak} ${p}`,
    `C ${xpeak + 15} ${p}, ${re - 20} ${baseline}, ${re} ${baseline}`,
    `L ${x1} ${baseline}`,
  ].join(' ')
}

interface TraceProps {
  chain: Chain
  field: Record<string, number>
  morphology: Morphology
}

function EEGTraceView({ chain, field, morphology }: TraceProps) {
  const channelVoltages = chain.pairs.map(({a, b}) => ({
    label: `${a}–${b}`,
    a, b,
    va: field[a] ?? 0,
    vb: field[b] ?? 0,
    v: (field[a] ?? 0) - (field[b] ?? 0),
  }))

  const maxAbsV = Math.max(...channelVoltages.map(c => Math.abs(c.v)), 1)

  // Phasenumkehr: benachbarte Kanäle mit verschiedenem Vorzeichen (>5µV)
  const phaseReversalIdx = new Set<number>()
  for (let i = 0; i < channelVoltages.length - 1; i++) {
    const curr = channelVoltages[i]
    const next = channelVoltages[i + 1]
    if (Math.abs(curr.v) > 5 && Math.abs(next.v) > 5) {
      if ((curr.v > 0 && next.v < 0) || (curr.v < 0 && next.v > 0)) {
        phaseReversalIdx.add(i)
        phaseReversalIdx.add(i + 1)
      }
    }
  }

  const totalH = channelVoltages.length * CH_H + 8

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{chain.label}</p>
      <div className="relative rounded-xl border border-slate-200 bg-white overflow-hidden">
        <svg viewBox={`0 ${-4} ${TRACE_W + 80} ${totalH}`} className="w-full">
          {channelVoltages.map((ch, i) => {
            const y = i * CH_H
            const isPR = phaseReversalIdx.has(i)
            const pathD = spikePathD(ch.v, maxAbsV, morphology)

            return (
              <g key={ch.label}>
                {/* Hintergrund für Phasenumkehr */}
                {isPR && (
                  <rect x={0} y={y} width={TRACE_W + 80} height={CH_H}
                    fill="rgba(239,68,68,0.07)" />
                )}

                {/* Trennlinie */}
                {i > 0 && <line x1={0} y1={y} x2={TRACE_W + 80} y2={y} stroke="#e2e8f0" strokeWidth="0.5" />}

                {/* Label */}
                <text x={6} y={y + CH_H / 2} dominantBaseline="central"
                  fontSize="10" fontWeight="600" fill={isPR ? '#dc2626' : '#64748b'}>
                  {ch.label}
                </text>

                {/* Phasenumkehr-Marker */}
                {isPR && (
                  <text x={56} y={y + CH_H / 2} dominantBaseline="central"
                    fontSize="8" fill="#dc2626">⬡</text>
                )}

                {/* Baseline + Kurve */}
                <g transform={`translate(64, ${y})`}>
                  {/* Baseline */}
                  <line x1={0} y1={CH_H/2} x2={TRACE_W} y2={CH_H/2} stroke="#e2e8f0" strokeWidth="0.8" />
                  {/* Nulllinie */}
                  <line x1={20} y1={0} x2={20} y2={CH_H} stroke="#f1f5f9" strokeWidth="0.5" />

                  {/* EEG-Kurve */}
                  <path d={pathD} fill="none"
                    stroke={isPR ? '#dc2626' : Math.abs(ch.v) > 10 ? '#3b82f6' : '#94a3b8'}
                    strokeWidth={isPR ? 2.0 : 1.5}
                    strokeLinejoin="round"
                  />

                  {/* µV-Wert */}
                  <text x={TRACE_W - 4} y={CH_H/2} textAnchor="end" dominantBaseline="central"
                    fontSize="8" fill="#94a3b8">
                    {ch.v > 0 ? '+' : ''}{Math.round(ch.v)}µV
                  </text>
                </g>
              </g>
            )
          })}

          {/* Pfeil-Konvention */}
          <text x={64 + TRACE_W / 2} y={totalH - 2} textAnchor="middle"
            fontSize="7.5" fill="#94a3b8">
            ↑ negativ  /  ↓ positiv
          </text>
        </svg>
      </div>
    </div>
  )
}

// ─── Spannungstabelle ─────────────────────────────────────────────────────────

function VoltageTable({ field, chain }: { field: Record<string, number>; chain: Chain }) {
  const electrodes = [...new Set(chain.pairs.flatMap(p => [p.a, p.b]))]
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Elektrode</th>
            <th className="px-3 py-2 text-right font-semibold text-slate-600">Potential (µV)</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Feld</th>
          </tr>
        </thead>
        <tbody>
          {electrodes.map(id => {
            const v = field[id] ?? 0
            const isNeg = v < -2; const isPos = v > 2
            return (
              <tr key={id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-1.5 font-mono font-semibold text-slate-700">{id}</td>
                <td className={`px-3 py-1.5 text-right font-mono font-bold
                  ${isNeg ? 'text-blue-600' : isPos ? 'text-red-500' : 'text-slate-400'}`}>
                  {v > 0 ? '+' : ''}{Math.round(v)}
                </td>
                <td className="px-3 py-1.5">
                  <div className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium
                    ${isNeg ? 'bg-blue-50 text-blue-700' : isPos ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                    {isNeg ? '↑ negativ' : isPos ? '↓ positiv' : '≈ 0'}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Kanalrechnung ────────────────────────────────────────────────────────────

function ChannelMathPanel({ field, chain }: { field: Record<string, number>; chain: Chain }) {
  const channelVoltages = chain.pairs.map(({a, b}) => {
    const va = field[a] ?? 0; const vb = field[b] ?? 0; const v = va - vb
    return { label: `${a}–${b}`, a, b, va, vb, v }
  })
  const maxAbsV = Math.max(...channelVoltages.map(c => Math.abs(c.v)), 1)

  const phaseReversals: string[] = []
  for (let i = 0; i < channelVoltages.length - 1; i++) {
    const curr = channelVoltages[i]; const next = channelVoltages[i+1]
    if (Math.abs(curr.v) > 5 && Math.abs(next.v) > 5 &&
      ((curr.v > 0 && next.v < 0) || (curr.v < 0 && next.v > 0))) {
      // Phasenumkehrelektrode = gemeinsame Elektrode beider Kanalpaare
      const commonEl = [curr.a, curr.b].find(e => [next.a, next.b].includes(e))
      if (commonEl) phaseReversals.push(commonEl)
    }
  }

  const maxCh = channelVoltages.reduce((max, c) => Math.abs(c.v) > Math.abs(max.v) ? c : max, channelVoltages[0])
  const isNegPR = phaseReversals.length > 0 && channelVoltages.some(c => c.v < 0) && channelVoltages.some(c => c.v > 0)
  const prType = phaseReversals.length === 0 ? null
    : channelVoltages.find(c => c.v > 0 && channelVoltages.some(d => d.v < 0 && Math.abs(channelVoltages.indexOf(d) - channelVoltages.indexOf(c)) === 1))
      ? (channelVoltages[0].v > 0 ? 'negativ' : 'positiv')
      : null

  // Bestimme PR-Typ anhand des Musters
  const prNeg = phaseReversals.length > 0 && (() => {
    const idx = channelVoltages.findIndex(c =>
      phaseReversals.some(pr => c.a === pr || c.b === pr) && c.v < 0
    )
    const idxPrev = channelVoltages.findIndex(c =>
      phaseReversals.some(pr => c.a === pr || c.b === pr) && c.v > 0
    )
    return idx >= 0
  })()

  return (
    <div className="space-y-3">
      {/* Kanalrechnungen */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kanalspannungen V = El₁ − El₂</p>
        {channelVoltages.map((ch, i) => {
          const isLargest = ch === maxCh
          const isInPR = phaseReversals.some(pr => ch.a === pr || ch.b === pr)
          return (
            <div key={ch.label}
              className={`rounded-lg px-3 py-2 text-xs font-mono ${
                isInPR ? 'bg-red-50 border border-red-200' :
                isLargest ? 'bg-blue-50 border border-blue-200' :
                'bg-slate-50 border border-slate-200'
              }`}>
              <span className={`font-bold ${isInPR ? 'text-red-700' : 'text-slate-700'}`}>{ch.label}</span>
              <span className="text-slate-400 mx-2">=</span>
              <span className="text-slate-600">({ch.va > 0 ? '+' : ''}{Math.round(ch.va)})</span>
              <span className="text-slate-400 mx-1">−</span>
              <span className="text-slate-600">({ch.vb > 0 ? '+' : ''}{Math.round(ch.vb)})</span>
              <span className="text-slate-400 mx-1">=</span>
              <span className={`font-black ${ch.v > 2 ? 'text-red-500' : ch.v < -2 ? 'text-blue-600' : 'text-slate-400'}`}>
                {ch.v > 0 ? '+' : ''}{Math.round(ch.v)} µV
              </span>
              <span className="ml-2 text-slate-400">
                → {Math.abs(ch.v) < 3 ? 'flach' : ch.v < 0 ? '↑' : '↓'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Interpretation */}
      <div className="space-y-2">
        {phaseReversals.length > 0 ? (
          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-3 space-y-1.5">
            <p className="text-sm font-bold text-red-800">
              {prNeg === false ? '✕ Positive' : '✓ Negative'} Phasenumkehr bei <span className="font-black">{phaseReversals.join(', ')}</span>
            </p>
            <p className="text-xs text-red-700">
              {prNeg === false
                ? 'Benachbarte Kanäle zeigen voneinander weg (∨∧). Maximale Positivität bei ' + phaseReversals.join('/') + '.'
                : 'Benachbarte Kanäle zeigen aufeinander zu (∧∨). Maximale Negativität bei ' + phaseReversals.join('/') + '.'
              }
            </p>
            <p className="text-xs text-red-600 font-medium italic">
              Die Phasenumkehr lokalisiert das Feldmaximum — nicht zwingend den epileptischen Generator.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm text-slate-600">
              {channelVoltages.every(c => Math.abs(c.v) < 5)
                ? 'Kein Signal in dieser Kette sichtbar — Signalmaximum liegt außerhalb.'
                : 'Kein Vorzeichenwechsel in dieser Kette — Phasenumkehr liegt in anderer Montage.'
              }
            </p>
          </div>
        )}

        {/* Feldbreite-Hinweis */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
          <span className="font-semibold">Feldbreite: </span>
          {(() => {
            const n = channelVoltages.filter(c => Math.abs(c.v) > maxAbsV * 0.3).length
            if (n <= 1) return 'sehr fokal — steiler Gradient, wenige Elektroden beteiligt'
            if (n === 2) return 'fokal — typisch für epileptiforme Spikes'
            if (n === 3) return 'mittelweit — mehrere Elektroden beteiligt'
            return 'weit — flacher Gradient, typisch für Verlangsamungen oder tiefe Generatoren'
          })()}
        </div>
      </div>
    </div>
  )
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

export default function MontageLehrPage() {
  const [source, setSource] = useState('T3')
  const [polarity, setPolarity] = useState<'negativ' | 'positiv'>('negativ')
  const [fieldSize, setFieldSize] = useState<'fokal' | 'mittel' | 'weit'>('mittel')
  const [showDipole, setShowDipole] = useState(false)
  const [activeChains, setActiveChains] = useState<string[]>(['tl', 'pl'])
  const [morphology, setMorphology] = useState<Morphology>('spike')
  const [showMath, setShowMath] = useState(false)

  const sigma = FIELD_SIGMA[fieldSize]

  const field = useMemo(
    () => computeField(source, polarity, sigma, showDipole),
    [source, polarity, sigma, showDipole]
  )

  const visibleChains = CHAINS.filter(c => activeChains.includes(c.id))

  function toggleChain(id: string) {
    setActiveChains(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(x => x !== id) : prev) : [...prev, id]
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-slate-900">Phasenumkehr & Feldanalyse</h1>
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs font-semibold text-violet-700">Teaching</span>
        </div>
        <p className="text-sm text-slate-500">
          Interaktive Simulation: Wähle Quellelektrode, Polarität und Feldgröße — sieh in Echtzeit, wie sich das Feld in der bipolaren Montage abbildet.
        </p>
      </div>

      {/* Steuerleiste */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">

        {/* Quellelektrode */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quellelektrode (Signalmaximum)</p>
          <div className="flex flex-wrap gap-1.5">
            {SOURCE_ELECTRODES.map(el => (
              <button key={el}
                onClick={() => setSource(el)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-mono font-bold transition-all ${
                  source === el
                    ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                }`}>
                {el}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Polarität */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Polarität an {source}</p>
            <div className="flex gap-2">
              {(['negativ','positiv'] as const).map(p => (
                <button key={p} onClick={() => setPolarity(p)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-all ${
                    polarity === p
                      ? p === 'negativ'
                        ? 'border-blue-400 bg-blue-600 text-white'
                        : 'border-red-400 bg-red-500 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}>
                  {p === 'negativ' ? '↑ Negativ' : '↓ Positiv'}
                </button>
              ))}
            </div>
          </div>

          {/* Feldgröße */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Feldgröße (Sigma)</p>
            <div className="flex gap-2">
              {(['fokal','mittel','weit'] as const).map(f => (
                <button key={f} onClick={() => setFieldSize(f)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-all ${
                    fieldSize === f
                      ? 'border-slate-700 bg-slate-800 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Potenzial-Morphologie */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Potenzial-Form</p>
            <div className="flex gap-2">
              {([['spike','Spike'],['sharp','Sharp Wave'],['slow','Slow Wave']] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => setMorphology(val)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-all ${
                    morphology === val
                      ? 'border-rose-500 bg-rose-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-rose-300'
                  }`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Dipol */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dipol-Gegenpol</p>
            <button
              onClick={() => setShowDipole(d => !d)}
              className={`w-full rounded-lg border py-2 text-xs font-semibold transition-all ${
                showDipole
                  ? 'border-violet-400 bg-violet-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'
              }`}>
              {showDipole ? '⬡ Dipol aktiv' : '⬡ Dipol anzeigen'}
            </button>
            {showDipole && DIPOLE_PARTNERS[source] && (
              <p className="text-[10px] text-violet-600 mt-1">Gegenpol: {DIPOLE_PARTNERS[source]} ({polarity === 'negativ' ? 'positiv' : 'negativ'})</p>
            )}
          </div>
        </div>

        {/* Montage-Auswahl */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sichtbare Montage-Ketten</p>
          <div className="flex flex-wrap gap-1.5">
            {CHAINS.map(c => (
              <button key={c.id} onClick={() => toggleChain(c.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  activeChains.includes(c.id)
                    ? 'border-slate-600 bg-slate-700 text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}>
                {c.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Haupt-Content: Kopf + Kurven */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Kopf-SVG */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Feldvisualisierung</p>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span><span className="inline-block w-3 h-3 rounded-full bg-blue-400 mr-1"/>negativ</span>
              <span><span className="inline-block w-3 h-3 rounded-full bg-red-400 mr-1"/>positiv</span>
              <span>Klick = Quelle wählen</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <FieldHeadSVG
              field={field}
              source={source}
              polarity={polarity}
              showDipole={showDipole}
              onSelectElectrode={setSource}
              visibleChains={visibleChains}
            />
          </div>
          {/* Theorie-Hinweis */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 space-y-1">
            <p className="font-semibold">Konvention (DGKN/IFCN)</p>
            <p>Negativität an der Kopfoberfläche → Ausschlag <strong>nach oben</strong> (↑)</p>
            <p>Positivität an der Kopfoberfläche → Ausschlag <strong>nach unten</strong> (↓)</p>
          </div>
        </div>

        {/* EEG-Kurven */}
        <div className="space-y-4">
          {visibleChains.map(chain => (
            <EEGTraceView key={chain.id} chain={chain} field={field} morphology={morphology} />
          ))}
        </div>
      </div>

      {/* Kanalrechnungen — einklappbar */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <button
          onClick={() => setShowMath(m => !m)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">Berechnungen & Kanalvoltage</span>
            <span className="text-xs text-slate-400">(V = El₁ − El₂)</span>
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${showMath ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showMath && (
          <div className="border-t border-slate-100 divide-y divide-slate-100">
            {visibleChains.map(chain => (
              <div key={chain.id} className="p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{chain.label}</p>
                <VoltageTable field={field} chain={chain} />
                <ChannelMathPanel field={field} chain={chain} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lehrtext */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-4">
        <h2 className="text-sm font-bold text-blue-900">Grundprinzipien der Phasenumkehr</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-blue-800">
          <div className="space-y-2">
            <p className="font-semibold">Was misst ein bipolarer Kanal?</p>
            <p>Jeder Kanal zeigt die <strong>Spannungsdifferenz</strong> zweier Elektroden:</p>
            <p className="font-mono bg-white/60 rounded px-2 py-1">V = V<sub>El1</sub> − V<sub>El2</sub></p>
            <p>Wenn El1 negativer ist als El2 → negativer Wert → Ausschlag nach <strong>oben</strong>.</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Negative Phasenumkehr (häufig)</p>
            <p>Zwei benachbarte Kanäle zeigen <strong>aufeinander zu</strong> (∧∨ oder ↑↓).</p>
            <p>→ Feldmaximum liegt an der gemeinsamen Elektrode (negatives Oberflächenpotential).</p>
            <p className="text-blue-700">Typisch: Spikes, Sharp Waves, kortikale Generatoren.</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Positive Phasenumkehr (selten)</p>
            <p>Zwei benachbarte Kanäle zeigen <strong>voneinander weg</strong> (∨∧ oder ↓↑).</p>
            <p>→ Feldmaximum liegt an der gemeinsamen Elektrode (positives Oberflächenpotential).</p>
            <p className="text-blue-700">Typisch: POSTS, Lambda-Wellen, 14+6 Hz pos. Spikes.</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Fokal vs. weites Feld</p>
            <p><strong>Fokal</strong> (enge PR): steiler Gradient, 1-2 Elektroden dominant → kleinerer kortikaler Generator.</p>
            <p><strong>Weit</strong> (breite PR): flacher Gradient, viele Elektroden → Verlangsamung, tiefer/großer Generator, Artefakt.</p>
            <p className="italic">Feldbreite ist diagnostisch oft wichtiger als die Morphologie allein.</p>
          </div>
        </div>
        <div className="rounded-lg bg-white/60 border border-blue-200 px-3 py-2 text-xs text-blue-800">
          <p className="font-semibold mb-0.5">Wichtigste Regel der EEG-Lokalisation</p>
          <p>Eine Phasenumkehr lokalisiert den <em>Ort maximaler Spannung im elektrischen Feld</em> — nicht automatisch den epileptischen Generator und nicht automatisch eine epileptiforme Aktivität. Artefakte können ebenfalls perfekte Phasenumkehren erzeugen.</p>
        </div>
      </div>

    </div>
  )
}
