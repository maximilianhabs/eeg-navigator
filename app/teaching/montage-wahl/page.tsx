'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ELECTRODE_COORDS } from '@/data/topography'

// ─── Feldberechnung ───────────────────────────────────────────────────────────

function computeField(
  source: string,
  sigma: number,
  polarity: 'negativ' | 'positiv' = 'negativ',
): Record<string, number> {
  const src = ELECTRODE_COORDS[source]
  if (!src) return {}
  const sign = polarity === 'negativ' ? -1 : 1
  const field: Record<string, number> = {}
  for (const [id, pos] of Object.entries(ELECTRODE_COORDS)) {
    const d2 = (pos.x - src.x) ** 2 + (pos.y - src.y) ** 2
    field[id] = sign * 150 * Math.exp(-d2 / (2 * sigma ** 2))
  }
  return field
}

// Diffuses Feld: anterior betont (frontal 100 µV, okzipital 70 µV)
function computeDiffuseField(): Record<string, number> {
  const field: Record<string, number> = {}
  const yMin = Math.min(...Object.values(ELECTRODE_COORDS).map(p => p.y))
  const yMax = Math.max(...Object.values(ELECTRODE_COORDS).map(p => p.y))
  for (const [id, pos] of Object.entries(ELECTRODE_COORDS)) {
    const t = (pos.y - yMin) / (yMax - yMin)  // 0 = anterior, 1 = posterior
    field[id] = -(100 - t * 30)               // frontal -100, okzipital -70
  }
  return field
}

// ─── Presets ─────────────────────────────────────────────────────────────────

type PresetId = 'focal' | 'diffuse' | 'endchain'

const PRESETS: Record<PresetId, {
  label: string
  sublabel: string
  field: () => Record<string, number>
  chain_bp: {a:string;b:string}[]
  chain_ref: {a:string;b:string}[]
  ref_label: string
  insight: string
  morph: 'spike' | 'slow'
}> = {
  focal: {
    label: 'Fokaler Spike',
    sublabel: 'Maximale Negativität bei T3',
    field: () => computeField('T3', 72),
    chain_bp:  [{a:'Fp1',b:'F7'},{a:'F7',b:'T3'},{a:'T3',b:'T5'},{a:'T5',b:'O1'}],
    chain_ref: [{a:'Fp1',b:'Cz'},{a:'F7',b:'Cz'},{a:'T3',b:'Cz'},{a:'T5',b:'Cz'},{a:'O1',b:'Cz'}],
    ref_label: 'Cz-Referenz (links temporal)',
    insight: 'Bipolar → Phasenumkehr bei T3: F7–T3 und T3–T5 zeigen entgegengesetzte Ausschläge (rot markiert). Alle Nachbarelektroden bekommen etwas vom Feld ab — eine isolierte Phasenumkehr ohne Feldausbreitung wäre eher ein Elektrodenartefakt! Referenz → Amplitude: T3 hat die größte Amplitude, Nachbarn sind kleiner. Beide Montagen lokalisieren — aber die Phasenumkehr in der Bipolarmontage ist präziser.',
    morph: 'spike',
  },
  diffuse: {
    label: 'Diffuse Verlangsamung',
    sublabel: 'Großes, gleichförmiges Feld (Enzephalopathie)',
    field: computeDiffuseField,
    chain_bp:  [{a:'Fp1',b:'F3'},{a:'F3',b:'C3'},{a:'C3',b:'P3'},{a:'P3',b:'O1'}],
    chain_ref: [{a:'Fp1',b:'Cz'},{a:'F3',b:'Cz'},{a:'C3',b:'Cz'},{a:'P3',b:'Cz'},{a:'O1',b:'Cz'}],
    ref_label: 'Cz-Referenz (parasagittal links)',
    insight: 'Cancellation Effect: Das gesamte Feld ist fast gleichförmig → die Differenzen benachbarter Elektroden sind winzig → Bipolarkette zeigt fast keine Aktivität, obwohl ein riesiges pathologisches Feld existiert! Cz-Referenz zeigt dagegen die tatsächliche Feldamplitude.',
    morph: 'slow',
  },
  endchain: {
    label: 'End-of-Chain-Effekt',
    sublabel: 'Feldmaximum am Kettenende (O1)',
    field: () => computeField('O1', 38),
    chain_bp:  [{a:'Fp1',b:'F3'},{a:'F3',b:'C3'},{a:'C3',b:'P3'},{a:'P3',b:'O1'}],
    chain_ref: [{a:'Fp1',b:'Cz'},{a:'F3',b:'Cz'},{a:'C3',b:'Cz'},{a:'P3',b:'Cz'},{a:'O1',b:'Cz'}],
    ref_label: 'Cz-Referenz (Vergleich)',
    insight: 'End-of-Chain-Effekt: O1 liegt am Ende der Kette — es gibt keinen Kanal mehr dahinter. P3–O1 zeigt hohe Amplitude, aber keine echte Phasenumkehr. Das Maximum erscheint scheinbar ans Kettenende "verschoben". Cz-Referenz zeigt klar, dass O1 das wirkliche Feldmaximum ist.',
    morph: 'spike',
  },
}

// ─── Mini EEG-Trace ───────────────────────────────────────────────────────────

const CH_H = 48
const TW = 240
const MAX_D = 18

function tracePath(v: number, maxV: number, morph: 'spike' | 'slow'): string {
  const bl = CH_H / 2
  // Negative channel voltage → up (EEG convention)
  const d = maxV === 0 ? 0 : (v / maxV) * MAX_D
  if (Math.abs(d) < 0.3) return `M 8 ${bl} L ${TW - 8} ${bl}`
  const xp = 95; const p = bl + d

  if (morph === 'spike') {
    const after = bl - d * 0.18
    return [
      `M 8 ${bl}`,
      `L ${xp - 7} ${bl}`,
      `L ${xp} ${p}`,
      `L ${xp + 18} ${bl}`,
      `L ${xp + 34} ${after}`,
      `L ${xp + 52} ${bl}`,
      `L ${TW - 8} ${bl}`,
    ].join(' ')
  }
  // Slow wave: Bezier
  const rs = xp - 55; const re = xp + 85
  return [
    `M 8 ${bl}`,
    `C ${rs + 18} ${bl}, ${xp - 12} ${p}, ${xp} ${p}`,
    `C ${xp + 12} ${p}, ${re - 18} ${bl}, ${re} ${bl}`,
    `L ${TW - 8} ${bl}`,
  ].join(' ')
}

function MiniTrace({
  pairs, field, morph, title, lineColor, showPR,
}: {
  pairs: {a:string;b:string}[]
  field: Record<string, number>
  morph: 'spike' | 'slow'
  title: string
  lineColor: string
  showPR: boolean
}) {
  const channels = pairs.map(({a,b}) => ({
    label: `${a}–${b}`,
    v: (field[a] ?? 0) - (field[b] ?? 0),
  }))
  const maxAbsV = Math.max(...channels.map(c => Math.abs(c.v)), 1)

  const prIdx = new Set<number>()
  if (showPR) {
    for (let i = 0; i < channels.length - 1; i++) {
      const c = channels[i]; const n = channels[i+1]
      if (Math.abs(c.v) > 5 && Math.abs(n.v) > 5 &&
          ((c.v > 0 && n.v < 0) || (c.v < 0 && n.v > 0))) {
        prIdx.add(i); prIdx.add(i+1)
      }
    }
  }

  const totalH = channels.length * CH_H + 4

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-3 h-0.5 rounded" style={{background: lineColor}} />
        <p className="text-xs font-semibold text-slate-600">{title}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <svg viewBox={`0 -2 ${TW + 72} ${totalH}`} className="w-full">
          {channels.map((ch, i) => {
            const y = i * CH_H
            const isPR = prIdx.has(i)
            const path = tracePath(ch.v, maxAbsV, morph)
            const isNearZero = Math.abs(ch.v) < maxAbsV * 0.08

            return (
              <g key={ch.label}>
                {isPR && <rect x={0} y={y} width={TW+72} height={CH_H} fill="rgba(239,68,68,0.07)"/>}
                {i > 0 && <line x1={0} y1={y} x2={TW+72} y2={y} stroke="#f1f5f9" strokeWidth="0.8"/>}
                <text x={5} y={y+CH_H/2} dominantBaseline="central"
                  fontSize="9.5" fontWeight="600"
                  fill={isPR ? '#dc2626' : '#64748b'}>{ch.label}</text>
                {isPR && <text x={54} y={y+CH_H/2} dominantBaseline="central" fontSize="8" fill="#dc2626">⬡</text>}
                <g transform={`translate(60, ${y})`}>
                  <line x1={0} y1={CH_H/2} x2={TW} y2={CH_H/2} stroke="#e2e8f0" strokeWidth="0.7"/>
                  <path d={path} fill="none"
                    stroke={isNearZero ? '#cbd5e1' : isPR ? '#dc2626' : lineColor}
                    strokeWidth={isPR ? 2 : 1.7}
                    strokeLinejoin="round"
                    opacity={isNearZero ? 0.6 : 1}
                  />
                  <text x={TW-3} y={CH_H/2} textAnchor="end" dominantBaseline="central"
                    fontSize="7.5"
                    fill={Math.abs(ch.v) < 3 ? '#cbd5e1' : '#94a3b8'}>
                    {ch.v > 0 ? '+' : ''}{Math.round(ch.v)}µV
                  </text>
                </g>
              </g>
            )
          })}
          <text x={(TW+72)/2} y={totalH-1} textAnchor="middle" fontSize="7" fill="#94a3b8">
            ↑ neg / ↓ pos
          </text>
        </svg>
      </div>
    </div>
  )
}

// ─── Mini Kopf SVG ────────────────────────────────────────────────────────────

function MiniHead({ field, activePairs }: { field: Record<string,number>; activePairs: {a:string;b:string}[] }) {
  const vals = Object.values(field)
  const maxAbs = Math.max(...vals.map(Math.abs), 1)

  const electrodeIds = [...new Set(activePairs.flatMap(p => [p.a, p.b]))]

  function col(v: number) {
    const t = Math.min(1, Math.abs(v) / maxAbs)
    if (v < -2)  return `rgba(59,130,246,${0.2 + t*0.7})`
    if (v > 2)   return `rgba(239,68,68,${0.2 + t*0.7})`
    return 'rgba(203,213,225,0.4)'
  }
  function r(v: number) { return 7 + Math.min(1, Math.abs(v)/maxAbs) * 10 }

  return (
    <svg viewBox="60 30 280 340" className="w-20 h-24 flex-shrink-0">
      <ellipse cx={200} cy={200} rx={130} ry={148} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
      {/* Linien */}
      {activePairs.map(({a,b},i) => {
        const pa = ELECTRODE_COORDS[a]; const pb = ELECTRODE_COORDS[b]
        if (!pa || !pb) return null
        return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
          stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.5"/>
      })}
      {/* Alle Elektroden schwach */}
      {Object.entries(ELECTRODE_COORDS).map(([id, pos]) => {
        const v = field[id] ?? 0
        const inChain = electrodeIds.includes(id)
        return (
          <g key={id}>
            <circle cx={pos.x} cy={pos.y} r={inChain ? r(v) : 5}
              fill={inChain ? col(v) : 'rgba(203,213,225,0.3)'}
              stroke={inChain ? (v < -2 ? '#3b82f6' : v > 2 ? '#ef4444' : '#94a3b8') : '#e2e8f0'}
              strokeWidth="0.8"/>
            {inChain && <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
              fontSize="8" fontWeight="700" fill={Math.abs(v) > 40 ? '#fff' : '#475569'}>{id}</text>}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Vergleichs-Demo ──────────────────────────────────────────────────────────

function VergleichsDemo() {
  const [preset, setPreset] = useState<PresetId>('focal')
  const p = PRESETS[preset]
  const field = p.field()

  return (
    <div className="space-y-4">
      {/* Preset-Auswahl */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(PRESETS) as [PresetId, typeof PRESETS[PresetId]][]).map(([id, def]) => (
          <button key={id} onClick={() => setPreset(id)}
            className={`rounded-xl border px-4 py-2.5 text-left transition-all ${
              preset === id
                ? 'border-slate-700 bg-slate-800 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}>
            <div className="text-xs font-bold">{def.label}</div>
            <div className={`text-[10px] mt-0.5 ${preset === id ? 'text-slate-300' : 'text-slate-400'}`}>{def.sublabel}</div>
          </button>
        ))}
      </div>

      {/* Haupt-Vergleich */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-start gap-4">
          <MiniHead field={field} activePairs={p.chain_bp} />
          <div className="flex gap-3 flex-1 min-w-0">
            <MiniTrace
              pairs={p.chain_bp}
              field={field}
              morph={p.morph}
              title="Bipolarkette"
              lineColor="#3b82f6"
              showPR={true}
            />
            <MiniTrace
              pairs={p.chain_ref}
              field={field}
              morph={p.morph}
              title={p.ref_label}
              lineColor="#f59e0b"
              showPR={false}
            />
          </div>
        </div>

        {/* Insight-Box */}
        <div className={`rounded-lg px-3 py-2.5 text-xs space-y-0.5 ${
          preset === 'diffuse'
            ? 'bg-orange-50 border border-orange-200 text-orange-800'
            : preset === 'endchain'
            ? 'bg-violet-50 border border-violet-200 text-violet-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          <p className="font-semibold text-sm">{p.label}</p>
          <p className="leading-relaxed">{p.insight}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Bergmodell SVG ───────────────────────────────────────────────────────────

function BergmodellSVG() {
  // Elektroden-Punkte am Hang (x, y auf Bergsilhouette, Label)
  const refElectrodes  = [{x:80,y:148,l:'O1'},{x:108,y:108,l:'P3'},{x:148,y:68,l:'C3'},{x:188,y:108,l:'F3'},{x:216,y:148,l:'Fp1'}]
  const bipElectrodes  = [{x:310,y:148,l:'O1'},{x:338,y:108,l:'P3'},{x:378,y:68,l:'C3'},{x:418,y:108,l:'F3'},{x:446,y:148,l:'Fp1'}]
  return (
    <svg viewBox="0 0 540 210" className="w-full max-w-2xl mx-auto">
      <defs>
        <marker id="arrB" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#3b82f6"/>
        </marker>
        <marker id="arrG" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#16a34a"/>
        </marker>
      </defs>

      {/* Boden */}
      <line x1={20} y1={160} x2={520} y2={160} stroke="#cbd5e1" strokeWidth="1.5"/>

      {/* ── REFERENZ-BERG (links) ── */}
      <polygon points="60,160 148,38 236,160" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2"/>
      {/* Höhenlinien */}
      {[70,100,130].map((y,i) => {
        const frac = (160-y)/(160-38)
        const xl = 60 + frac*88; const xr = 236 - frac*88
        return <line key={i} x1={xl} y1={y} x2={xr} y2={y} stroke="#93c5fd" strokeWidth="1" strokeDasharray="4 3" opacity="0.7"/>
      })}
      {/* Pfeil absolute Höhe */}
      <line x1={46} y1={160} x2={46} y2={41} stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrB)"/>
      <text x={36} y={100} textAnchor="middle" fontSize="10" fill="#2563eb" fontWeight="700" transform="rotate(-90,36,100)">Absolute Höhe</text>
      {/* Elektroden */}
      {refElectrodes.map(e => (
        <g key={e.l}>
          <circle cx={e.x} cy={e.y} r={7} fill="#3b82f6" opacity="0.85"/>
          <text x={e.x} y={e.y} textAnchor="middle" dominantBaseline="central" fontSize="7.5" fontWeight="700" fill="white">{e.l}</text>
        </g>
      ))}
      {/* Ref-Linie von Elektrode zum Boden */}
      {refElectrodes.map(e => (
        <line key={e.l+'l'} x1={e.x} y1={e.y+7} x2={e.x} y2={160} stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" opacity="0.4"/>
      ))}
      <text x={148} y={26} textAnchor="middle" fontSize="11" fill="#1d4ed8" fontWeight="800">Referenzmontage</text>
      <text x={148} y={178} textAnchor="middle" fontSize="9.5" fill="#64748b">Amplitude (absolute Höhe) erkennbar</text>

      {/* Trennlinie */}
      <line x1={268} y1={20} x2={268} y2={175} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="6 4"/>

      {/* ── BIPOLAR-BERG (rechts) — Mehreck, O1/P3/C3, Höhengewinn-Balken ── */}
      {/* Mehreck: flacher Fuß, dann Steilstufe */}
      <polygon points="285,160 325,150 370,72 415,160" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5"/>
      {/* Aktiver Hang dicker */}
      <polyline points="285,160 325,150 370,72" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinejoin="round"/>

      {/* Elektroden */}
      {([{x:285,y:160,l:'O1'},{x:325,y:150,l:'P3'},{x:370,y:72,l:'C3'}] as {x:number,y:number,l:string}[]).map(e => (
        <g key={e.l}>
          <circle cx={e.x} cy={e.y} r={8} fill="#16a34a" stroke="white" strokeWidth="2"/>
          <text x={e.x} y={e.y} textAnchor="middle" dominantBaseline="central" fontSize="7.5" fontWeight="700" fill="white">{e.l}</text>
        </g>
      ))}

      {/* Höhengewinn-Balken rechts */}
      {/* O1→P3: kleiner Gewinn (10 px) */}
      <line x1={325} y1={150} x2={432} y2={150} stroke="#16a34a" strokeWidth={0.8} strokeDasharray="4 3" opacity={0.4}/>
      <rect x={432} y={150} width={14} height={10} rx={2} fill="#86efac" stroke="#16a34a" strokeWidth={1}/>
      <text x={439} y={143} textAnchor="middle" fontSize="8" fill="#64748b">O1→P3</text>

      {/* P3→C3: großer Gewinn (78 px) */}
      <line x1={370} y1={72} x2={432} y2={72} stroke="#15803d" strokeWidth={0.8} strokeDasharray="4 3" opacity={0.4}/>
      <rect x={432} y={72} width={14} height={78} rx={2} fill="#15803d"/>
      <text x={439} y={65} textAnchor="middle" fontSize="8" fill="#15803d" fontWeight="700">P3→C3</text>

      <text x={350} y={26} textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="800">Bipolarmontage</text>
      <text x={350} y={178} textAnchor="middle" fontSize="9.5" fill="#64748b">Höhengewinn pro Schritt = Kanalausschlag</text>

      {/* Legende */}
      <text x={270} y={200} textAnchor="middle" fontSize="9" fill="#94a3b8" fontStyle="italic">
        Jede Elektrode = Messpunkt · Pfeil = was die Montage misst
      </text>
    </svg>
  )
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

const CONCEPTS = [
  {
    id: 'hochpass',
    color: 'blue',
    icon: '⛰',
    title: 'Bipolarkette = räumlicher Hochpass',
    subtitle: 'Gradient-Detektor',
    text: 'Vₙ = El₁ − El₂ — es wird immer nur der Unterschied benachbarter Elektroden abgebildet. Gleichförmige Felder erzeugen keine Differenz → sie werden unterdrückt. Lokale Kontraste (steile Gradienten) erscheinen verstärkt.',
    pros: ['Hervorragende Lokalisation fokaler Aktivität','Klare Phasenumkehr bei steilem Gradienten','Große Amplitude bei fokalem Generator'],
    cons: ['Diffuse/großflächige Felder verschwinden (Cancellation)','Amplitude unterschätzt oft das Feld','End-of-Chain-Effekt: kein PR am Kettenende'],
  },
  {
    id: 'feld',
    color: 'amber',
    icon: '🗺',
    title: 'Referenzmontage = Feldmessung',
    subtitle: 'Feld-Detektor',
    text: 'Vₙ = El₁ − Ref. Wenn die Referenz inaktiv ist, spiegelt jeder Kanal das tatsächliche Potential am Ort der Elektrode. Die räumliche Ausdehnung und die echte Amplitude des Feldes bleiben erhalten.',
    pros: ['Zeigt die tatsächliche Feldverteilung','Auch diffuse Aktivität erkennbar','Amplitude nicht durch Subtraktion verringert'],
    cons: ['Referenzkontamination wenn Ref im Feld liegt','Schlechtere Lokalisation bei gutem Feld','Average-Ref. verteilt starke Signale auf alle Kanäle'],
  },
  {
    id: 'cancel',
    color: 'orange',
    icon: '⚠',
    title: 'Cancellation Effect',
    subtitle: 'Das unsichtbare Feld',
    text: 'Bei diffuser Aktivität (z.B. Enzephalopathie, generalisierte Verlangsamung): Alle Elektroden haben ähnliches Potential → Differenzen benachbarter Elektroden sind winzig → Bipolarkette zeigt fast nichts. Die pathologische Aktivität ist trotzdem vorhanden — sie wird durch die Montage unterdrückt.',
    pros: [],
    cons: ['Diffuse Delta kann in Bipolarkette fast unsichtbar sein','Schweregrad einer Enzephalopathie wird unterschätzt','Referenzmontage oder EKG-Referenz notwendig zur korrekten Beurteilung'],
  },
  {
    id: 'endchain',
    color: 'violet',
    icon: '🔚',
    title: 'End-of-Chain-Effekt',
    subtitle: 'Scheinmaximum am Kettenende',
    text: 'Liegt das Feldmaximum am Ende einer Kette (z.B. O1 in der Parasagittalen), gibt es keinen Partner-Kanal dahinter. P3–O1 zeigt hohe Amplitude, aber keine Phasenumkehr. Das Maximum erscheint ans Kettenende verschoben. Lösung: Referenzmontage oder verlängerte Kette.',
    pros: [],
    cons: ['Falscher Eindruck der Lokalisation','Keine Phasenumkehr trotz echtem Maximum','Häufig bei okzipitalen und frontopolaren Foci'],
  },
]

const COLORS: Record<string, {bg:string;border:string;text:string;badge:string}> = {
  blue:   {bg:'bg-blue-50',  border:'border-blue-200',  text:'text-blue-900',   badge:'bg-blue-100 text-blue-700'},
  amber:  {bg:'bg-amber-50', border:'border-amber-200', text:'text-amber-900',  badge:'bg-amber-100 text-amber-700'},
  orange: {bg:'bg-orange-50',border:'border-orange-200',text:'text-orange-900', badge:'bg-orange-100 text-orange-700'},
  violet: {bg:'bg-violet-50',border:'border-violet-200',text:'text-violet-900', badge:'bg-violet-100 text-violet-700'},
}

export default function MontageWahlPage() {
  const [openConcept, setOpenConcept] = useState<string | null>('hochpass')

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-slate-900">Montageauswahl & Feldeigenschaften</h1>
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs font-semibold text-violet-700">Teaching</span>
        </div>
        <p className="text-sm text-slate-500">
          Es gibt keine optimale Montage — jede ist ein Filter für bestimmte räumliche Eigenschaften des Feldes.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Link href="/teaching/montage"
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
            Interaktiver Phasenumkehr-Simulator
          </Link>
        </div>
      </div>

      {/* Kernthese */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grundprinzip</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-blue-50 border-2 border-blue-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⛓</span>
              <p className="text-sm font-black text-blue-900">Bipolare Kette</p>
            </div>
            <p className="text-xs font-semibold text-blue-700">= räumlicher Gradientmesser</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Misst den <strong>Unterschied</strong> zwischen je zwei benachbarten Elektroden.
              Gleichförmige Felder erzeugen kaum Differenz — lokale Kontraste werden sichtbar.
            </p>
            <div className="mt-1 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800">
              ↳ Kennzeichen: <span className="text-red-600">Phasenumkehr</span> lokalisiert das Feldmaximum
            </div>
          </div>
          <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗺</span>
              <p className="text-sm font-black text-amber-900">Referenzmontage</p>
            </div>
            <p className="text-xs font-semibold text-amber-700">= absoluter Feldmesser</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Misst jede Elektrode gegen eine gemeinsame (inaktive) Referenz.
              Die <strong>tatsächliche Amplitude</strong> und räumliche Ausdehnung des Feldes bleiben erhalten.
            </p>
            <div className="mt-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
              ↳ Kennzeichen: <span className="text-amber-700">Amplitude</span> zeigt die wahre Feldstärke
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-3">
          Der erfahrene EEG-Befunder fragt nicht „Welche Montage ist richtig?" — sondern „Welche Information brauche ich gerade?"
        </p>
      </div>

      {/* Interaktive Demo */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Interaktiver Vergleich</h2>
        <p className="text-sm text-slate-500">Dasselbe elektrische Feld — zwei Montagen, zwei verschiedene Informationen.</p>
        <VergleichsDemo />
      </div>

      {/* Berg-Analogie */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-800">Die Gebirgs-Analogie</h2>
        <BergmodellSVG />
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="font-bold text-blue-800">Referenzmontage → Höhenmessung</p>
            <p className="text-blue-700 mt-1">Zeigt die absolute Höhe jedes Berges. Du siehst, wie hoch der Gipfel ist und wie groß das Gebirge ist.</p>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-3">
            <p className="font-bold text-green-800">Bipolarkette → Steigungsmessung</p>
            <p className="text-green-700 mt-1">Zeigt nur die Steigung zwischen zwei Punkten. Du siehst, wo es steil wird — aber nicht die absolute Höhe.</p>
          </div>
        </div>
      </div>

      {/* Konzept-Karten */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Die 4 Schlüsselkonzepte</h2>
        {CONCEPTS.map(c => {
          const col = COLORS[c.color]
          const isOpen = openConcept === c.id
          return (
            <div key={c.id} className={`rounded-xl border-2 ${col.border} overflow-hidden transition-all`}>
              <button
                onClick={() => setOpenConcept(isOpen ? null : c.id)}
                className={`w-full flex items-center justify-between px-4 py-3 ${col.bg} hover:opacity-90 transition-opacity text-left`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${col.text}`}>{c.title}</p>
                    <span className={`text-xs rounded px-1.5 py-0.5 font-semibold ${col.badge}`}>{c.subtitle}</span>
                  </div>
                </div>
                <svg className={`w-4 h-4 flex-shrink-0 ${col.text} opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                </svg>
              </button>

              {isOpen && (
                <div className="px-4 py-4 bg-white space-y-3">
                  <p className="text-sm text-slate-700 leading-relaxed">{c.text}</p>

                  {(c.pros.length > 0 || c.cons.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {c.pros.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 mb-1.5">Stärken</p>
                          <ul className="space-y-1">
                            {c.pros.map((p,i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                                <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>{p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {c.cons.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-600 mb-1.5">{c.pros.length > 0 ? 'Schwächen' : 'Probleme'}</p>
                          <ul className="space-y-1">
                            {c.cons.map((con,i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                                <span className="text-red-400 flex-shrink-0 mt-0.5">✗</span>{con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Entscheidungstabelle */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-800">Wann welche Montage?</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { frage: 'Wo liegt der Focus?', montage: 'Bipolare Längsreihe + Querreihe', grund: 'Phasenumkehr lokalisiert das Feldmaximum; steiler Gradient = fokales Signal', icon: '📍' },
            { frage: 'Wie groß ist das Feld?', montage: 'Referenzmontage (Cz, Average)', grund: 'Feldverteilung bleibt erhalten; räumliche Ausdehnung ablesbar', icon: '🗺' },
            { frage: 'Wie hoch ist die Amplitude?', montage: 'Referenzmontage', grund: 'Bipolarkette unterschätzt die Feldstärke durch Subtraktion', icon: '📏' },
            { frage: 'Diffuse Verlangsamung?', montage: 'Referenzmontage (primär)', grund: 'Bipolarkette unterdrückt gleichförmige Felder (Cancellation Effect)', icon: '🌊' },
            { frage: 'Focal am Kettenende?', montage: 'Ref.-Montage zur Kontrolle', grund: 'End-of-Chain-Effekt kann Lokalisation in Bipolarmontage verfälschen', icon: '🔚' },
            { frage: 'Referenzaktivität verdächtig?', montage: 'Bipolarmontage + Average Ref.', grund: 'Aktive Referenz kontaminiert alle Kanäle; Montage wechseln zur Verifikation', icon: '⚠' },
          ].map((row,i) => (
            <div key={i} className="px-4 py-3 grid grid-cols-12 gap-3 items-start">
              <div className="col-span-1 text-lg">{row.icon}</div>
              <div className="col-span-4">
                <p className="text-xs font-semibold text-slate-700">{row.frage}</p>
              </div>
              <div className="col-span-3">
                <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{row.montage}</span>
              </div>
              <div className="col-span-4">
                <p className="text-xs text-slate-500">{row.grund}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teaching Pearl */}
      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <h2 className="text-sm font-bold text-blue-900">Teaching Pearl</h2>
        </div>
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>Bipolare Montagen maximieren räumliche Kontraste</strong> und verbessern die Lokalisation kleiner Felder.{' '}
          <strong>Referenzmontagen erhalten die Feldamplitude</strong> und die räumliche Ausdehnung großer Potentialfelder.
          Keine Montage kann beides gleichzeitig optimal leisten.
        </p>
        <p className="text-xs text-blue-700 italic leading-relaxed border-t border-blue-200 pt-2">
          Deshalb wird in der klinischen EEG-Befundung praktisch immer zwischen mindestens einer bipolaren und einer Referenzmontage gewechselt.
          Das ist kein Luxus, sondern notwendig — weil jede Montage andere Informationen desselben elektrischen Feldes sichtbar macht.
        </p>
      </div>

      {/* Link zum interaktiven Tool */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Diese Konzepte interaktiv erkunden</p>
          <p className="text-xs text-slate-500 mt-0.5">Wähle Quellelektrode, Feldgröße und Montage — sieh Phasenumkehr in Echtzeit</p>
        </div>
        <Link href="/teaching/montage"
          className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          Simulator öffnen
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
          </svg>
        </Link>
      </div>

    </div>
  )
}
