'use client'

import { useState, useMemo } from 'react'
import { ELECTRODE_COORDS, REGION_PATHS } from '@/data/topography'

// ─── Feldberechnung ───────────────────────────────────────────────────────────

const AMPLITUDE = 150
const FIELD_SIGMA: Record<string, number> = { fokal: 28, mittel: 58, weit: 100 }

// Zentrum der Kopf-Ellipse (aus SVG-Koordinaten)
const CX = 200, CY = 222

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
    // Echter antipodaler Punkt: Lot durch Kopfmittelpunkt verlängert
    const apX = 2 * CX - src.x
    const apY = 2 * CY - src.y
    // Tangentialer Dipol: ~1/3 Amplitude (0.28×), mäßig breit (1.4× sigma)
    // Konzentriert auf 4–5 Elektroden nahe Antipodal-Punkt; global skaliert → klar sichtbar aber deutlich schwächer als Primary
    // Radiale Dipole (häufigste Spike-Form) hätten keinen Gegenpol auf der Skalpoberfläche
    const dipSigma = sigma * 1.4
    for (const [id, pos] of Object.entries(ELECTRODE_COORDS)) {
      const d2 = (pos.x - apX) ** 2 + (pos.y - apY) ** 2
      field[id] = (field[id] ?? 0) + (-sign * AMPLITUDE * 0.28 * Math.exp(-d2 / (2 * dipSigma ** 2)))
    }
  }
  return field
}

// ─── Ketten-Definition ────────────────────────────────────────────────────────

type ChainType = 'temporal' | 'parasagittal'
type Side = 'left' | 'right'
type Morphology = 'spike' | 'sharp' | 'slow'

interface Pair { a: string; b: string }

const BIPOLAR_PAIRS: Record<ChainType, Record<Side, Pair[]>> = {
  temporal: {
    left:  [{a:'Fp1',b:'F7'},{a:'F7',b:'T3'},{a:'T3',b:'T5'},{a:'T5',b:'O1'}],
    right: [{a:'Fp2',b:'F8'},{a:'F8',b:'T4'},{a:'T4',b:'T6'},{a:'T6',b:'O2'}],
  },
  parasagittal: {
    left:  [{a:'Fp1',b:'F3'},{a:'F3',b:'C3'},{a:'C3',b:'P3'},{a:'P3',b:'O1'}],
    right: [{a:'Fp2',b:'F4'},{a:'F4',b:'C4'},{a:'C4',b:'P4'},{a:'P4',b:'O2'}],
  },
}

function getRefPairs(chainType: ChainType, side: Side): Pair[] {
  const bp = BIPOLAR_PAIRS[chainType][side]
  const electrodes: string[] = []
  for (const p of bp) { if (!electrodes.includes(p.a)) electrodes.push(p.a) }
  const last = bp[bp.length - 1].b
  if (!electrodes.includes(last)) electrodes.push(last)
  return electrodes.map(el => ({ a: el, b: 'Cz' }))
}

function chainLabel(chainType: ChainType, side: Side) {
  const t = chainType === 'temporal' ? 'Temporal' : 'Parasagittal'
  const s = side === 'left' ? 'links' : 'rechts'
  return `${t} ${s}`
}

// ─── Kopf-SVG ─────────────────────────────────────────────────────────────────

const W = 400; const H = 440

function voltageColor(v: number, maxAbs: number): string {
  if (maxAbs === 0) return 'transparent'
  const t = Math.min(1, Math.abs(v) / maxAbs)
  if (v < -2) return `rgba(59,130,246,${0.12 + t * 0.78})`
  if (v > 2)  return `rgba(239,68,68,${0.12 + t * 0.78})`
  return 'rgba(148,163,184,0.2)'
}

function voltageRadius(v: number, maxAbs: number): number {
  const t = maxAbs === 0 ? 0 : Math.min(1, Math.abs(v) / maxAbs)
  return 9 + t * 12
}

interface HeadProps {
  field: Record<string, number>
  source: string
  polarity: 'negativ' | 'positiv'
  fieldSize: 'fokal' | 'mittel' | 'weit'
  showDipole: boolean
  chainType: ChainType
  side: Side
  onSelectElectrode: (id: string) => void
}

function FieldHeadSVG({ field, source, polarity, fieldSize, showDipole, chainType, side, onSelectElectrode }: HeadProps) {
  const maxAbs = Math.max(...Object.values(field).map(Math.abs), 1)
  const isNeg = (field[source] ?? 0) < 0
  const ringColor = isNeg ? '59,130,246' : '239,68,68'
  const numRings = fieldSize === 'fokal' ? 1 : fieldSize === 'mittel' ? 2 : 3

  const bipolarPairs = BIPOLAR_PAIRS[chainType][side]
  const refPairs = getRefPairs(chainType, side)

  // Dipol-Gegenpol für Anzeige
  const src = ELECTRODE_COORDS[source]
  const dipX = src ? 2 * CX - src.x : CX
  const dipY = src ? 2 * CY - src.y : CY

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
      <defs>
        {/* Clip auf Kopfellipse */}
        <clipPath id="headClip">
          <ellipse cx={200} cy={222} rx={158} ry={183} />
        </clipPath>
      </defs>

      {/* Kopf */}
      <ellipse cx={200} cy={222} rx={165} ry={190} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M188,24 L200,10 L212,24" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <ellipse cx={36} cy={222} rx={12} ry={20} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
      <ellipse cx={364} cy={222} rx={12} ry={20} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>

      {/* Regionen — geclipt */}
      <g clipPath="url(#headClip)">
        {(Object.entries(REGION_PATHS) as [string, string][]).map(([id, pts]) => (
          <polygon key={id} points={pts} fill="#e8edf2" stroke="#dde3eb" strokeWidth="0.5" opacity="0.6" />
        ))}
        {(['anterotemporal','mitteltemporal','posterotemporal'] as const).map(id => {
          const pts = REGION_PATHS[id]
          const mirrored = pts.split(' ').map(p => {
            const [x, y] = p.split(',').map(Number)
            return `${W - x},${y}`
          }).join(' ')
          return <polygon key={`${id}_r`} points={mirrored} fill="#e8edf2" stroke="#dde3eb" strokeWidth="0.5" opacity="0.6" />
        })}
      </g>

      {/* Aktive Kette — bipolar */}
      {bipolarPairs.map(({a, b}, i) => {
        const pa = ELECTRODE_COORDS[a]; const pb = ELECTRODE_COORDS[b]
        if (!pa || !pb) return null
        return <line key={`bp-${i}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
          stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3" opacity="0.55" strokeLinecap="round" />
      })}

      {/* Aktive Kette — referenziell */}
      {refPairs.map(({a, b}, i) => {
        const pa = ELECTRODE_COORDS[a]; const pb = ELECTRODE_COORDS[b]
        if (!pa || !pb) return null
        return <line key={`ref-${i}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
          stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.5" strokeLinecap="round" />
      })}

      {/* Dipol-Gegenpol Marker — nur kleines Fadenkreuz, Feld sehr schwach */}
      {showDipole && (
        <>
          <circle cx={dipX} cy={dipY} r={8} fill="none"
            stroke={isNeg ? 'rgba(239,68,68,0.35)' : 'rgba(59,130,246,0.35)'} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1={dipX - 5} y1={dipY} x2={dipX + 5} y2={dipY}
            stroke={isNeg ? 'rgba(239,68,68,0.35)' : 'rgba(59,130,246,0.35)'} strokeWidth="1" />
          <line x1={dipX} y1={dipY - 5} x2={dipX} y2={dipY + 5}
            stroke={isNeg ? 'rgba(239,68,68,0.35)' : 'rgba(59,130,246,0.35)'} strokeWidth="1" />
        </>
      )}

      {/* Konzentrische Ringe um Quellelektrode */}
      {ELECTRODE_COORDS[source] && (() => {
        const pos = ELECTRODE_COORDS[source]
        return Array.from({length: numRings}, (_, i) => (
          <circle key={i} cx={pos.x} cy={pos.y}
            r={22 + i * 17} fill="none"
            stroke={`rgba(${ringColor},${0.70 - i * 0.15})`}
            strokeWidth={3.5 - i * 0.7}
          />
        ))
      })()}

      {/* Elektroden */}
      {Object.entries(ELECTRODE_COORDS).map(([id, pos]) => {
        const v = field[id] ?? 0
        const r = voltageRadius(v, maxAbs)
        const fill = voltageColor(v, maxAbs)
        const isSource = id === source
        const inChain = [...bipolarPairs.flatMap(p => [p.a, p.b])].includes(id)
        return (
          <g key={id} className="cursor-pointer" onClick={() => onSelectElectrode(id)}>
            {isSource && <circle cx={pos.x} cy={pos.y} r={r + 5} fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeDasharray="4 2"/>}
            <circle cx={pos.x} cy={pos.y} r={r} fill={fill}
              stroke={isSource ? '#1d4ed8' : inChain ? '#64748b' : '#94a3b8'}
              strokeWidth={isSource ? 2 : inChain ? 1.2 : 0.8} />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
              fontSize={isSource ? '9.5' : '8.5'}
              fontWeight={isSource || inChain ? '700' : '500'}
              fill={isSource ? '#1d4ed8' : Math.abs(v) > 30 ? '#fff' : inChain ? '#1e293b' : '#64748b'}
            >{id}</text>
          </g>
        )
      })}

      {/* Legende */}
      <g>
        <circle cx={18} cy={412} r={7} fill="rgba(59,130,246,0.7)" />
        <text x={29} y={416} fontSize="9" fill="#475569">negativ</text>
        <circle cx={82} cy={412} r={7} fill="rgba(239,68,68,0.7)" />
        <text x={93} y={416} fontSize="9" fill="#475569">positiv</text>
        <text x={W - 4} y={416} textAnchor="end" fontSize="9" fill="#94a3b8">Klick = Quelle wählen</text>
      </g>
    </svg>
  )
}

// ─── EEG-Kurven ──────────────────────────────────────────────────────────────

const CH_H = 52
const TRACE_W = 240
const MAX_DEFL = 20

function lerpPW(x: number, pts: [number, number][]): number {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]
    if (x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
  }
  return pts[pts.length - 1][1]
}

function combinedPathD(voltage: number, maxV: number, morph: Morphology, channelIdx: number): string {
  const baseline = CH_H / 2
  const defl = maxV === 0 ? 0 : (voltage / maxV) * MAX_DEFL
  const xpeak = 90
  const N = 80
  const dx = TRACE_W / N
  const ph = channelIdx * 2.3

  const noise = (x: number) =>
    2.2 * Math.sin(x * 0.055 + ph) +
    1.1 * Math.sin(x * 0.11 + ph * 0.6) +
    0.6 * Math.sin(x * 0.21 + ph * 1.4)

  let spikeAt: (x: number) => number
  if (Math.abs(defl) < 0.5) {
    spikeAt = () => baseline
  } else if (morph === 'spike') {
    const p = baseline + defl
    const after = baseline - defl * 0.18
    const kp: [number, number][] = [[0,baseline],[xpeak-7,baseline],[xpeak,p],[xpeak+20,baseline],[xpeak+38,after],[xpeak+60,baseline],[TRACE_W,baseline]]
    spikeAt = (x) => lerpPW(x, kp)
  } else if (morph === 'sharp') {
    const p = baseline + defl
    const kp: [number, number][] = [[0,baseline],[xpeak-16,baseline],[xpeak,p],[xpeak+45,baseline],[TRACE_W,baseline]]
    spikeAt = (x) => lerpPW(x, kp)
  } else {
    // Slow wave: smooth cosine bump
    const rs = xpeak - 55, re = xpeak + 90
    spikeAt = (x) => {
      if (x < rs || x > re) return baseline
      return baseline + defl * Math.sin(Math.PI * (x - rs) / (re - rs))
    }
  }

  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const x = i * dx
    return `${x.toFixed(1)},${(spikeAt(x) + noise(x)).toFixed(1)}`
  })
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')}`
}

interface TraceProps {
  pairs: Pair[]
  field: Record<string, number>
  morphology: Morphology
  color: string
  label: string
  isRef?: boolean
  scaleMax?: number
}

function EEGTraceView({ pairs, field, morphology, color, label, isRef, scaleMax }: TraceProps) {
  const channels = pairs.map(({a, b}) => {
    const va = field[a] ?? 0
    const vb = field[b] ?? 0
    return { label: `${a}–${b}`, va, vb, v: va - vb }
  })

  const maxAbsV = scaleMax ?? Math.max(...channels.map(c => Math.abs(c.v)), 1)

  // Phasenumkehr nur bei bipolar sinnvoll
  const prIdx = new Set<number>()
  if (!isRef) {
    for (let i = 0; i < channels.length - 1; i++) {
      const c = channels[i]; const n = channels[i+1]
      if (Math.abs(c.v) > 5 && Math.abs(n.v) > 5 &&
        ((c.v > 0 && n.v < 0) || (c.v < 0 && n.v > 0))) {
        prIdx.add(i); prIdx.add(i+1)
      }
    }
  }

  const LPAD = 56
  const totalH = channels.length * CH_H + 10

  return (
    <div className="space-y-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
        {isRef && <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium flex-shrink-0">→ Cz</span>}
        {!isRef && <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium flex-shrink-0">Bipolar</span>}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <svg viewBox={`0 ${-4} ${LPAD + TRACE_W + 36} ${totalH}`} className="w-full">
          {channels.map((ch, i) => {
            const y = i * CH_H
            const isPR = prIdx.has(i)
            const pathD = combinedPathD(ch.v, maxAbsV, morphology, i)
            const traceColor = isPR ? '#dc2626' : Math.abs(ch.v) > 10 ? color : '#94a3b8'

            return (
              <g key={ch.label}>
                {isPR && <rect x={0} y={y} width={LPAD + TRACE_W + 36} height={CH_H} fill="rgba(239,68,68,0.06)" />}
                {i > 0 && <line x1={0} y1={y} x2={LPAD + TRACE_W + 36} y2={y} stroke="#e2e8f0" strokeWidth="0.5" />}

                <text x={LPAD - 4} y={y + CH_H/2} textAnchor="end" dominantBaseline="central"
                  fontSize="9" fontWeight="600" fill={isPR ? '#dc2626' : '#64748b'}>
                  {ch.label}
                </text>
                {isPR && <text x={LPAD - 16} y={y + CH_H/2} dominantBaseline="central" fontSize="8" fill="#dc2626">⬡</text>}

                <g transform={`translate(${LPAD}, ${y})`}>
                  <line x1={0} y1={CH_H/2} x2={TRACE_W} y2={CH_H/2} stroke="#e2e8f0" strokeWidth="0.8" />
                  <path d={pathD} fill="none" stroke={traceColor}
                    strokeWidth={isPR ? 2.0 : 1.5} strokeLinejoin="round" />
                </g>
              </g>
            )
          })}

          <text x={LPAD + TRACE_W / 2} y={totalH - 2} textAnchor="middle"
            fontSize="7" fill="#94a3b8">↑ neg  /  ↓ pos</text>
        </svg>
      </div>

      {/* Phasenumkehr-Hinweis */}
      {prIdx.size > 0 && (() => {
        const prChs = channels.filter((_, i) => prIdx.has(i))
        const prEl = (() => {
          for (let i = 0; i < channels.length - 1; i++) {
            if (prIdx.has(i) && prIdx.has(i+1)) {
              const a = pairs[i]; const b = pairs[i+1]
              return [a.a, a.b].find(e => [b.a, b.b].includes(e)) ?? ''
            }
          }
          return ''
        })()
        const isNegPR = channels.some(c => c.v < 0) && channels.some(c => c.v > 0)
        return (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs">
            <span className="font-semibold text-red-800">{isNegPR ? '✓ Neg.' : '✕ Pos.'} Phasenumkehr bei {prEl}</span>
            <span className="text-red-600 ml-2">{isNegPR ? '∧∨ — Feldmaximum Negativität' : '∨∧ — Feldmaximum Positivität'}</span>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Kanalrechnungen (einklappbar) ───────────────────────────────────────────

function ChannelMathPanel({ pairs, field, label }: { pairs: Pair[]; field: Record<string, number>; label: string }) {
  const channels = pairs.map(({a, b}) => {
    const va = field[a] ?? 0; const vb = field[b] ?? 0
    return { label: `${a}–${b}`, va, vb, v: va - vb }
  })
  const maxCh = channels.reduce((max, c) => Math.abs(c.v) > Math.abs(max.v) ? c : max, channels[0])

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      {channels.map((ch) => (
        <div key={ch.label} className={`rounded-lg px-3 py-1.5 text-xs font-mono ${
          ch === maxCh ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 border border-slate-200'
        }`}>
          <span className="font-bold text-slate-700">{ch.label}</span>
          <span className="text-slate-400 mx-2">=</span>
          <span className="text-slate-600">({ch.va > 0 ? '+' : ''}{Math.round(ch.va)})</span>
          <span className="text-slate-400 mx-1">−</span>
          <span className="text-slate-600">({ch.vb > 0 ? '+' : ''}{Math.round(ch.vb)})</span>
          <span className="text-slate-400 mx-1">=</span>
          <span className={`font-black ${ch.v > 2 ? 'text-red-500' : ch.v < -2 ? 'text-blue-600' : 'text-slate-400'}`}>
            {ch.v > 0 ? '+' : ''}{Math.round(ch.v)} µV
          </span>
          <span className="ml-2 text-slate-400">→ {Math.abs(ch.v) < 3 ? 'flach' : ch.v < 0 ? '↑' : '↓'}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

export default function MontageLehrPage() {
  const [source, setSource] = useState('T3')
  const [polarity, setPolarity] = useState<'negativ' | 'positiv'>('negativ')
  const [fieldSize, setFieldSize] = useState<'fokal' | 'mittel' | 'weit'>('mittel')
  const [showDipole, setShowDipole] = useState(false)
  const [chainType, setChainType] = useState<ChainType>('temporal')
  const [side, setSide] = useState<Side>('left')
  const [morphology, setMorphology] = useState<Morphology>('spike')
  const [showMath, setShowMath] = useState(false)

  const sigma = FIELD_SIGMA[fieldSize]
  const field = useMemo(
    () => computeField(source, polarity, sigma, showDipole),
    [source, polarity, sigma, showDipole]
  )

  const bipolarPairs = BIPOLAR_PAIRS[chainType][side]
  const refPairs = getRefPairs(chainType, side)
  const label = chainLabel(chainType, side)

  const dipolePartnerName = (() => {
    const src = ELECTRODE_COORDS[source]
    if (!src) return null
    const apX = 2 * CX - src.x, apY = 2 * CY - src.y
    let closest = '', minD = Infinity
    for (const [id, pos] of Object.entries(ELECTRODE_COORDS)) {
      if (id === source) continue
      const d = (pos.x - apX) ** 2 + (pos.y - apY) ** 2
      if (d < minD) { minD = d; closest = id }
    }
    return closest
  })()

  const numRingsLabel = { fokal: '◉ fokal', mittel: '◉◉ mittelweit', weit: '◉◉◉ weit' }[fieldSize]

  // Cz-Kontamination: Abstand Quelle→Cz
  const czPos = ELECTRODE_COORDS['Cz']
  const srcPos = ELECTRODE_COORDS[source]
  const czDistance = srcPos && czPos
    ? Math.round(Math.sqrt((srcPos.x - czPos.x) ** 2 + (srcPos.y - czPos.y) ** 2))
    : 999
  // Unter ~110 px: Cz liegt im Feldkern, Referenz ist kontaminiert
  const czContaminated = czDistance < 110

  // Globale Skala: Max über alle Elektroden — verhindert dass Dipol-Gegenseite überproportional groß wirkt
  const globalScaleMax = Math.max(...Object.values(field).map(v => Math.abs(v)), 1)

  return (
    <div className="max-w-6xl mx-auto space-y-4">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="text-xl font-bold text-slate-900">Phasenumkehr & Feldanalyse</h1>
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs font-semibold text-violet-700">Teaching</span>
        </div>
        <p className="text-sm text-slate-500">
          Klicke auf eine Elektrode im Kopf-Diagramm, um die Signalquelle zu wählen.
        </p>
      </div>

      {/* Steuerleiste oben — kompakt */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">

        {/* Quelle */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Quelle</span>
          <span className="rounded bg-blue-600 text-white px-2.5 py-1 text-xs font-bold font-mono">{source}</span>
          <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
            polarity === 'negativ' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'
          }`}>
            {polarity === 'negativ' ? '↑' : '↓'}
          </span>
        </div>

        <div className="w-px h-5 bg-slate-200 hidden sm:block" />

        {/* Polarität */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Polarität</span>
          <div className="flex gap-1">
            {(['negativ','positiv'] as const).map(p => (
              <button key={p} onClick={() => setPolarity(p)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                  polarity === p
                    ? p === 'negativ' ? 'border-blue-400 bg-blue-600 text-white' : 'border-red-400 bg-red-500 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}>
                {p === 'negativ' ? '↑ Neg.' : '↓ Pos.'}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-5 bg-slate-200 hidden sm:block" />

        {/* Feldgröße */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Feld</span>
          <div className="flex gap-1">
            {(['fokal','mittel','weit'] as const).map(f => (
              <button key={f} onClick={() => setFieldSize(f)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                  fieldSize === f ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}>
                {f === 'fokal' ? '◉' : f === 'mittel' ? '◉◉' : '◉◉◉'}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400">{numRingsLabel}</span>
        </div>

        <div className="w-px h-5 bg-slate-200 hidden sm:block" />

        {/* Form */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Form</span>
          <div className="flex gap-1">
            {([['spike','Spike'],['sharp','Sharp W.'],['slow','Slow W.']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setMorphology(v)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                  morphology === v ? 'border-rose-500 bg-rose-600 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-rose-300'
                }`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-5 bg-slate-200 hidden sm:block" />

        {/* Dipol */}
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 cursor-pointer shrink-0">
            <span className="text-xs font-semibold text-slate-500">⬡ Dipol</span>
            <button
              role="switch"
              aria-checked={showDipole}
              onClick={() => setShowDipole(d => !d)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none ${
                showDipole ? 'border-violet-500 bg-violet-600' : 'border-slate-300 bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                showDipole ? 'translate-x-4' : 'translate-x-0'
              }`}/>
            </button>
          </label>
          <span className="text-[10px] text-violet-600 min-w-[120px]">
            {showDipole && dipolePartnerName
              ? `Gegenpol ~${dipolePartnerName} (${polarity === 'negativ' ? 'pos.' : 'neg.'})`
              : ''}
          </span>
        </div>
      </div>

      {/* DGKN-Konvention Banner */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-700 flex gap-5">
        <span className="font-semibold">DGKN-Konvention:</span>
        <span>Negativität → <strong>↑ nach oben</strong></span>
        <span>Positivität → <strong>↓ nach unten</strong></span>
        <span className="ml-auto flex items-center gap-1">
          <span className="inline-block w-4 h-px bg-blue-400" style={{borderTop:'2px dashed #3b82f6'}}></span> Bipolar
          <span className="ml-2 inline-block w-4 h-px bg-amber-400" style={{borderTop:'2px dashed #f59e0b'}}></span> Cz-Referenz
        </span>
      </div>

      {/* Haupt-Content: 3 Spalten */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '275px minmax(0,1fr) minmax(0,1fr)' }}>

        {/* Spalte 1: Kopf + Ketten-Wahl */}
        <div className="space-y-2">
          <div className="rounded-xl border border-slate-200 bg-white p-2">
            <FieldHeadSVG
              field={field}
              source={source}
              polarity={polarity}
              fieldSize={fieldSize}
              showDipole={showDipole}
              chainType={chainType}
              side={side}
              onSelectElectrode={setSource}
            />
          </div>

          {/* Ketten-Wähler */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Kette wählen</p>
            <div className="flex gap-1.5">
              {(['temporal','parasagittal'] as const).map(t => (
                <button key={t} onClick={() => setChainType(t)}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                    chainType === t ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  {t === 'temporal' ? 'Temporal' : 'Parasagittal'}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {(['left','right'] as const).map(s => (
                <button key={s} onClick={() => setSide(s)}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                    side === s ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 text-slate-600 hover:border-teal-300'
                  }`}>
                  {s === 'left' ? 'Links' : 'Rechts'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Spalte 2: Bipolare Kurven */}
        <EEGTraceView
          pairs={bipolarPairs}
          field={field}
          morphology={morphology}
          color="#3b82f6"
          label={label}
          scaleMax={globalScaleMax}
        />

        {/* Spalte 3: CZ-Referenz Kurven */}
        <div className="space-y-2 min-w-0">
          <EEGTraceView
            pairs={refPairs}
            field={field}
            morphology={morphology}
            color="#f59e0b"
            label={label}
            isRef
            scaleMax={globalScaleMax}
          />
          {czContaminated ? (
            <div className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-xs text-orange-800 space-y-1">
              <p className="font-semibold">⚠ Cz-Kontamination — Referenz im Feldkern</p>
              <p>
                <strong>{source}</strong> liegt nahe Cz — Cz trägt selbst einen großen Feldanteil.
                Deshalb erscheinen weit entfernte Elektroden wie Fp1 oder O1 paradox groß, während nahe Elektroden attenuiert wirken.
              </p>
              <p className="text-orange-700 italic">
                Dies ist klinisch reale <strong>Referenz-Kontamination</strong>. Bei Quellen nahe Cz (C3, C4, Fz, Pz) ist die Cz-Referenz eingeschränkt — Bipolar-Montage und Phasenumkehr sind zuverlässiger zur Lokalisation.
              </p>
              {chainType === 'temporal' && (
                <p className="text-orange-700 font-medium">
                  → Tipp: Wechsle auf <strong>Parasagittal</strong> — dort erscheint {source} direkt in der Kette.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-1">
              <p className="font-semibold text-amber-900">
                Cz-Referenz
                {Math.abs(field['Cz'] ?? 0) < 10
                  ? ' ✓ — Cz außerhalb des Feldes'
                  : Math.abs(field['Cz'] ?? 0) < 35
                  ? ' — Cz leicht im Feld'
                  : ' — Cz merklich im Feld'}
              </p>
              <p>
                In der Cz-Referenz gilt: <strong>V = field[El] − field[Cz]</strong>. Liegt Cz
                {Math.abs(field['Cz'] ?? 0) < 10
                  ? ' kaum im Feld (wie hier), entspricht V ≈ field[El] — die absoluten Amplituden sind gut ablesbar'
                  : ' im Feldrand, wird sein Anteil von jeder Elektrode subtrahiert — nahe Elektroden erscheinen relativ isoelektrisch'}.
              </p>
              <p className="text-amber-700">
                → <strong>Distanzprinzip:</strong> Je weiter eine Elektrode von Cz entfernt ist, desto mehr hebt sie sich
                von der Cz-Aktivität ab. Große diffuse Felder (z. B. occipitales Alpha), die Cz kaum erfassen, wirken in der
                Cz-Referenz <em>umso größer, je weiter die Elektrode von Cz liegt</em> — deshalb ist das Alpha-Grundrhythmus
                an O1/O2 in Cz-Referenz oft klarer sichtbar als bipolar (wo benachbarte Elektroden ähnliche Potenziale
                teils gegenseitig auslöschen).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Kanalrechnungen — einklappbar */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <button onClick={() => setShowMath(m => !m)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left">
          <span className="text-sm font-semibold text-slate-700">Kanalspannungen & Rechnungen (V = El₁ − El₂)</span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${showMath ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showMath && (
          <div className="border-t border-slate-100 p-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ChannelMathPanel pairs={bipolarPairs} field={field} label={`Bipolar — ${label}`} />
            <ChannelMathPanel pairs={refPairs} field={field} label={`Cz-Referenz — ${label}`} />
          </div>
        )}
      </div>

      {/* Lehrtext */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-4">
        <h2 className="text-sm font-bold text-blue-900">Grundprinzipien der Phasenumkehr</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-blue-800">
          <div className="space-y-1.5">
            <p className="font-semibold">Was misst ein bipolarer Kanal?</p>
            <p>Jeder Kanal zeigt die <strong>Spannungsdifferenz</strong> zweier Elektroden: V = V<sub>El1</sub> − V<sub>El2</sub></p>
            <p>El1 negativer als El2 → negativer Wert → Ausschlag <strong>oben</strong>.</p>
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold">Negative Phasenumkehr (häufig)</p>
            <p>Benachbarte Kanäle zeigen <strong>aufeinander zu</strong> (∧∨). Feldmaximum an der gemeinsamen Elektrode.</p>
            <p className="text-blue-700">Typisch: Spikes, Sharp Waves, kortikale Generatoren.</p>
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold">Referenz vs. bipolar</p>
            <p><strong>Cz-Referenz</strong>: zeigt Amplitude → Feldstärke und Lateralisation.</p>
            <p><strong>Bipolar</strong>: zeigt Gradient → Phasenumkehr lokalisiert Feldmaximum präzise.</p>
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold">Kortikaler Dipol — zwei Typen</p>
            <p><strong>Radialer Dipol</strong> (häufigster Typ, Konvexitätsspike): Der positive Gegenpol liegt tief im Hirninneren — <em>kein messbarer Gegenpol auf der Schädeloberfläche</em>. Nur eine Feldmaxime (typisch negativ) ist skalp-EEG-seitig sichtbar.</p>
            <p><strong>Tangentialer Dipol</strong> (Sulcus-nahe oder mesiale Quelle): Beide Pole können auf der Schädeloberfläche erscheinen — breites, diffuses, entgegengesetztes Feld auf der Gegenseite, deutlich schwächer als der Primärpol. Klassisch: mesio-temporale Spikes mit bifrontaler Negativität und okzipitaler Positivität.</p>
            <p className="text-blue-700 italic">Die Simulation zeigt vereinfacht einen tangentialen Dipol. Der Gegenpol ist in der Realität erheblich schwächer als das hier dargestellte Primärfeld.</p>
          </div>
        </div>
        <div className="rounded-lg bg-white/60 border border-blue-200 px-3 py-2 text-xs text-blue-800">
          <p className="font-semibold mb-0.5">Wichtigste Regel der EEG-Lokalisation</p>
          <p>Eine Phasenumkehr lokalisiert den <em>Ort maximaler Spannung im elektrischen Feld</em> — nicht automatisch den epileptischen Generator. Artefakte können ebenfalls perfekte Phasenumkehren erzeugen.</p>
        </div>
      </div>

    </div>
  )
}
