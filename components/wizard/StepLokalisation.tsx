'use client'

import { useState } from 'react'
import type { StepAnswer } from '@/hooks/useWizardState'

export interface LokalisationAnswer {
  regionen: string[]
  lateralitaet: string
}

const DEFAULT: LokalisationAnswer = { regionen: [], lateralitaet: '' }

function parse(v: StepAnswer): LokalisationAnswer {
  try { if (typeof v === 'string' && v.startsWith('{')) return JSON.parse(v) } catch {}
  return DEFAULT
}

// ─── Regionen (identisch zu bisherigen Daten) ─────────────────────────────────

const REGIONEN = [
  { value: 'frontopolar',        label: 'Frontopolar',             elektroden: 'Fp1, Fp2',        hint: 'Augenbewegungen, DC-Potentiale' },
  { value: 'frontal',            label: 'Frontal',                 elektroden: 'F3, F4, Fz',      hint: 'SMA, Blickfeld, FIRDA' },
  { value: 'temporal_anterior',  label: 'Temporal anterior',       elektroden: 'F7, F8',          hint: 'Sylvische Region, Temporallappen anterior' },
  { value: 'zentral',            label: 'Zentral',                 elektroden: 'C3, C4, Cz',      hint: 'Motorik, Sensorik, µ-Rhythmus' },
  { value: 'temporal_mittel',    label: 'Temporal mittel',         elektroden: 'T7, T8',          hint: 'Temporaler Pol, Hippokampus-Projektion' },
  { value: 'vertex',             label: 'Vertex',                  elektroden: 'Cz, nahe Pz',     hint: 'Vertex-Wellen, K-Komplexe' },
  { value: 'parietal',           label: 'Parietal',                elektroden: 'P3, P4, Pz',      hint: 'Sensorik, POST' },
  { value: 'temporal_posterior', label: 'Temporal posterior',      elektroden: 'P7, P8',          hint: 'Temporo-okzipitale Übergangszone' },
  { value: 'okzipital',          label: 'Okzipital',               elektroden: 'O1, O2',          hint: 'Alpha, PDR, POST, OIRDA' },
  { value: 'generalisiert',      label: 'Generalisiert / diffus',  elektroden: 'alle',            hint: 'Kein klares regionäres Maximum' },
]

const LATERALITAET = [
  { value: 'bilateral',        label: 'Bilateral',              description: 'Beide Hemisphären betroffen' },
  { value: 'unilateral',       label: 'Unilateral',             description: 'Nur eine Hemisphäre (Seite unerheblich)' },
  { value: 'nicht_lateral',    label: 'Nicht lateralisiert',    description: 'Mittellinie / zentral, keine Seitenbetonung' },
  { value: 'nb',               label: 'Nicht beurteilbar',      description: '' },
]

// ─── SVG Kopf — klickbare Regionen ───────────────────────────────────────────
// Koordinatensystem 300×330, Nase oben, vereinfachte Polygon-Regionen

const W = 300
const H = 330
const CX = 150
const CY = 166
const RX = 122
const RY = 142

// Regionen als klickbare SVG-Zonen
// Jede Region = Polygon oder Ellipse mit onCick → toggleRegion

interface RegionShape {
  id: string
  // Für polygon:
  points?: string
  // Für Ellipse-ähnliche Shapes:
  cx?: number; cy?: number; rx?: number; ry?: number
  // Label-Position im SVG
  lx: number; ly: number
  labelShort: string
}

// Koordinaten für vereinfachten Kopf (Ansicht von oben, Nase oben/vorne)
// Mirrored: left = x<150, right = x>150
// Y-Bänder neu verteilt: Zentralregion vergrößert, Parietal + Okzipital nach hinten
// gezogen (Okzipital reicht jetzt bis nahe an den Hinterkopf, y≈298 statt 278).
const SHAPES: RegionShape[] = [
  // Frontopolar — ganz vorne
  { id: 'frontopolar', points: '100,32 200,32 210,70 150,72 90,70', lx: CX, ly: 52, labelShort: 'FP' },
  // Frontal
  { id: 'frontal', points: '90,70 210,70 216,114 150,116 84,114', lx: CX, ly: 94, labelShort: 'F' },
  // Temporal anterior links / rechts
  { id: 'temporal_anterior',   points: '28,92 84,114 82,152 32,148', lx: 52, ly: 128, labelShort: 'AT' },
  { id: 'temporal_anterior_r', points: '272,92 216,114 218,152 268,148', lx: 248, ly: 128, labelShort: 'AT' },
  // Zentral — vergrößert (y 114–176)
  { id: 'zentral', points: '84,114 216,114 222,174 150,178 78,174', lx: CX, ly: 148, labelShort: 'C' },
  // Temporal mittel links / rechts
  { id: 'temporal_mittel',   points: '24,152 82,152 80,212 30,206', lx: 46, ly: 184, labelShort: 'MT' },
  { id: 'temporal_mittel_r', points: '276,152 218,152 220,212 270,206', lx: 254, ly: 184, labelShort: 'MT' },
  // Parietal — nach hinten geschoben (y 174–230)
  { id: 'parietal', points: '78,174 222,174 218,230 150,234 82,230', lx: CX, ly: 204, labelShort: 'P' },
  // Temporal posterior links / rechts
  { id: 'temporal_posterior',   points: '30,206 80,212 82,264 38,258', lx: 50, ly: 238, labelShort: 'PT' },
  { id: 'temporal_posterior_r', points: '270,206 220,212 218,264 262,258', lx: 250, ly: 238, labelShort: 'PT' },
  // Okzipital — bis nahe an den Hinterkopf (y 230–298)
  { id: 'okzipital', points: '82,230 218,230 206,286 150,298 94,286', lx: CX, ly: 262, labelShort: 'O' },
]

// Mapping: rechte Spiegel-Shapes → originale Region-ID
const SHAPE_TO_REGION: Record<string, string> = {
  temporal_anterior_r: 'temporal_anterior',
  temporal_mittel_r: 'temporal_mittel',
  temporal_posterior_r: 'temporal_posterior',
}

// Farben pro Region (wenn ausgewählt)
const REGION_COLOR: Record<string, string> = {
  frontopolar:        '#c4b5fd',
  frontal:            '#93c5fd',
  temporal_anterior:  '#6ee7b7',
  zentral:            '#fde68a',
  temporal_mittel:    '#86efac',
  vertex:             '#fde68a',
  parietal:           '#fca5a5',
  temporal_posterior: '#fbcfe8',
  okzipital:          '#fdba74',
  generalisiert:      '#e2e8f0',
}

function HeadSVG({
  selected,
  onToggle,
}: { selected: string[]; onToggle: (id: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)

  function getRegionId(shapeId: string): string {
    return SHAPE_TO_REGION[shapeId] ?? shapeId
  }

  function isActive(shapeId: string): boolean {
    return selected.includes(getRegionId(shapeId))
  }

  function getFill(shapeId: string): string {
    const rid = getRegionId(shapeId)
    const active = selected.includes(rid)
    const hover = hovered && getRegionId(hovered) === rid
    const color = REGION_COLOR[rid] ?? '#e2e8f0'
    if (active) return color
    if (hover) return color + '88'
    return color + '44'
  }

  function getStroke(shapeId: string): string {
    const rid = getRegionId(shapeId)
    if (selected.includes(rid)) return '#1e293b'
    if (hovered && getRegionId(hovered) === rid) return '#475569'
    return '#94a3b8'
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[260px]" xmlns="http://www.w3.org/2000/svg">
      {/* Kopf-Clippath */}
      <defs>
        <clipPath id="wiz-head-clip">
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} />
        </clipPath>
      </defs>

      {/* Regionen, geclippt */}
      <g clipPath="url(#wiz-head-clip)">
        {SHAPES.map(s => (
          <polygon
            key={s.id}
            points={s.points}
            fill={getFill(s.id)}
            stroke={getStroke(s.id)}
            strokeWidth="1"
            className="cursor-pointer transition-colors duration-100"
            onMouseEnter={() => setHovered(s.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onToggle(getRegionId(s.id))}
          />
        ))}
      </g>

      {/* Kopf-Umriss */}
      <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="#94a3b8" strokeWidth="2" />

      {/* Nase */}
      <path d={`M ${CX-10},${CY-RY+8} L ${CX},${CY-RY-10} L ${CX+10},${CY-RY+8}`}
        fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinejoin="round" />

      {/* Ohren */}
      <ellipse cx={CX-RX-3} cy={CY} rx="7" ry="13" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
      <ellipse cx={CX+RX+3} cy={CY} rx="7" ry="13" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />

      {/* Mittellinie gestrichelt */}
      <line x1={CX} y1={CY-RY+4} x2={CX} y2={CY+RY-4}
        stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.5" />

      {/* Region-Labels */}
      {SHAPES
        .filter(s => !s.id.endsWith('_r')) // nur einmal pro Region
        .map(s => {
          const rid = getRegionId(s.id)
          const active = selected.includes(rid)
          return (
            <text key={s.id + '_lbl'}
              x={s.lx} y={s.ly}
              textAnchor="middle"
              fontSize="9"
              fontFamily="ui-sans-serif, system-ui"
              fill={active ? '#0f172a' : '#64748b'}
              fontWeight={active ? '800' : '500'}
              className="pointer-events-none select-none"
            >
              {s.labelShort}
            </text>
          )
        })
      }

      {/* Hover-Tooltip */}
      {hovered && (
        <g>
          <rect x={CX-80} y={H-26} width="160" height="20" rx="4" fill="#0f172a" opacity="0.85" />
          <text x={CX} y={H-12} textAnchor="middle" fontSize="9.5" fill="white" fontWeight="600"
            className="pointer-events-none">
            {REGIONEN.find(r => r.value === getRegionId(hovered))?.label}
          </text>
        </g>
      )}
    </svg>
  )
}

// ─── Montage-Hinweis aus vorherigem Step ──────────────────────────────────────

function MontageHint({ montage }: { montage: string }) {
  if (!montage) return null
  const isBipolar = montage === 'bipolar_laengs' || montage === 'bipolar_quer'
  const isReferenz = montage.startsWith('referenz') || montage === 'referenz_ohr'
  if (isBipolar) return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-blue-700 space-y-1">
      <p className="font-semibold">Bipolare Montage — Lokalisation via Phasenumkehr</p>
      <p>Das Amplitudenmaximum liegt an der Elektrode, wo die Kurven ihre Polarität <strong>umkehren</strong>.</p>
    </div>
  )
  if (isReferenz) return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-blue-700 space-y-1">
      <p className="font-semibold">Referenzmontage — Lokalisation via Amplitudenmaximum</p>
      <p>Die Elektrode mit dem <strong>größten Ausschlag</strong> liegt am nächsten zur Quelle.</p>
    </div>
  )
  return null
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

interface Props {
  value: StepAnswer
  onChange: (v: StepAnswer) => void
  technikAnswer?: string
}

export default function StepLokalisation({ value, onChange, technikAnswer }: Props) {
  const [answer, setAnswer] = useState<LokalisationAnswer>(parse(value))

  const montage = (() => {
    try { return JSON.parse(technikAnswer ?? '{}').montage ?? '' } catch { return '' }
  })()

  function toggleRegion(v: string) {
    const next = answer.regionen.includes(v)
      ? answer.regionen.filter(r => r !== v)
      : [...answer.regionen, v]
    update({ regionen: next })
  }

  function update(patch: Partial<LokalisationAnswer>) {
    const next = { ...answer, ...patch }
    setAnswer(next)
    onChange(JSON.stringify(next))
  }

  return (
    <div className="space-y-5">

      <MontageHint montage={montage} />

      {/* ── Kopf + Textliste nebeneinander ── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Region mit maximalem Ausschlag
          <span className="ml-2 normal-case font-normal tracking-normal text-slate-400 italic">Mehrfachauswahl</span>
        </h3>

        <div className="flex gap-4 items-start">
          {/* Kopf-SVG */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <HeadSVG selected={answer.regionen} onToggle={toggleRegion} />
            {/* Generalisiert unter dem Kopf */}
            <button
              onClick={() => toggleRegion('generalisiert')}
              className={`w-full rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                answer.regionen.includes('generalisiert')
                  ? 'border-slate-700 bg-slate-800 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              ⊕ Generalisiert / Diffus
            </button>
          </div>

          {/* Text-Buttons als Alternative */}
          <div className="flex-1 min-w-0 grid grid-cols-1 gap-1.5">
            {REGIONEN.filter(r => r.value !== 'generalisiert').map(r => {
              const active = answer.regionen.includes(r.value)
              return (
                <button
                  key={r.value}
                  onClick={() => toggleRegion(r.value)}
                  className={`text-left rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                    active
                      ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium">{r.label}</span>
                  <span className="ml-1 font-mono text-[10px] opacity-50">{r.elektroden}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Ausgewählte Regionen — Hinweisbox */}
      {answer.regionen.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="font-medium">Ausgewählt:</span>{' '}
          {answer.regionen.map(r => REGIONEN.find(x => x.value === r)?.label).filter(Boolean).join(' · ')}
        </div>
      )}

      {/* ── Lateralität ── */}
      {!answer.regionen.includes('generalisiert') && answer.regionen.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lateralität</h3>
          <div className="flex flex-wrap gap-2">
            {LATERALITAET.map(opt => {
              const active = answer.lateralitaet === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => update({ lateralitaet: active ? '' : opt.value })}
                  className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                    active
                      ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                  {opt.description && <span className="ml-1.5 text-xs opacity-60">{opt.description}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
