'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { WaveEntity } from '@/lib/types'
import {
  REGIONS, REGION_PATHS, ELECTRODE_COORDS, MIDLINE_ELECTRODES,
  buildRegionIndex,
  type RegionId, type TopoMode,
} from '@/data/topography'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  alleWellen: WaveEntity[]
}

// ─── Klassifikations-Badge ────────────────────────────────────────────────────

const CLASS_COLOR: Record<string, string> = {
  physiologisch:                   'bg-blue-100 text-blue-700',
  benigne_variante:                'bg-teal-100 text-teal-700',
  kontextabhaengig:                'bg-purple-100 text-purple-700',
  pathologisch_nicht_epileptiform: 'bg-orange-100 text-orange-700',
  epileptiform:                    'bg-red-100 text-red-700',
}
const CLASS_LABEL: Record<string, string> = {
  physiologisch:                   'Physiol.',
  benigne_variante:                'Benigne',
  kontextabhaengig:                'Kontext',
  pathologisch_nicht_epileptiform: 'Pathol.',
  epileptiform:                    'Epilept.',
}

// ─── SVG Konstanten ───────────────────────────────────────────────────────────

const W = 400
const H = 440
const CX = 200
const CY = 222
const RX = 165
const RY = 190

// Rechte Seite: x → 400 - x (gespiegelt um x=200)
function mirrorPoints(pts: string): string {
  return pts.split(' ').map(pair => {
    const [x, y] = pair.split(',').map(Number)
    return `${W - x},${y}`
  }).join(' ')
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export function TopographyView({ alleWellen }: Props) {
  const [mode, setMode]               = useState<TopoMode>('physiologisch')
  const [hoveredRegion, setHovered]   = useState<RegionId | null>(null)
  const [selectedRegion, setSelected] = useState<RegionId | null>(null)

  const wellenById = useMemo(() => {
    const m: Record<string, WaveEntity> = {}
    alleWellen.forEach(e => { m[e.id] = e })
    return m
  }, [alleWellen])

  // Region-Index dynamisch aus der Datenbank ableiten (keine hartkodierten Listen mehr)
  const regionIndex = useMemo(() => buildRegionIndex(alleWellen), [alleWellen])

  // Entitäten für gewählte Region + Modus
  const panelEntities = useMemo((): WaveEntity[] => {
    if (!selectedRegion) return []
    const bucket = regionIndex[selectedRegion]
    if (!bucket) return []
    const ids = mode === 'physiologisch' ? bucket.physiologisch : bucket.pathologisch
    return ids.map(id => wellenById[id]).filter(Boolean)
  }, [selectedRegion, mode, regionIndex, wellenById])

  const activeRegion = hoveredRegion ?? selectedRegion

  // Farbe einer Region ermitteln
  function regionFill(id: RegionId): string {
    const region = REGIONS.find(r => r.id === id)
    if (!region) return '#e2e8f0'
    const isActive = activeRegion === id
    const base = mode === 'physiologisch' ? region.colorHex : region.colorHexPath
    if (id === 'generalisiert') return '#e2e8f0'
    return isActive ? base : base + 'aa' // leicht transparent wenn nicht aktiv
  }

  function regionStroke(id: RegionId): string {
    return selectedRegion === id ? '#1e293b' : hoveredRegion === id ? '#475569' : '#94a3b8'
  }

  const selectedRegionMeta = REGIONS.find(r => r.id === selectedRegion)

  return (
    <div className="space-y-4">

      {/* Mode-Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => { setMode('physiologisch'); setSelected(null) }}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              mode === 'physiologisch'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ○ Physiologisch
          </button>
          <button
            onClick={() => { setMode('pathologisch'); setSelected(null) }}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              mode === 'pathologisch'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ▲ Pathologisch &amp; Epileptiform
          </button>
        </div>
        <p className="text-xs text-slate-400">
          {mode === 'physiologisch'
            ? 'Normalbefunde, physiologische Muster und benigne Varianten nach Region'
            : 'Pathologische und epileptiforme EEG-Veränderungen nach Region'
          }
        </p>
      </div>

      {/* Haupt-Layout: SVG + Panel */}
      <div className="flex gap-6 items-start">

        {/* ── SVG Kopf ── */}
        <div className="shrink-0">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="380"
            style={{ maxWidth: '100%' }}
            className="drop-shadow-sm"
          >
            <defs>
              <clipPath id="head-clip">
                <ellipse cx={CX} cy={CY} rx={RX} ry={RY} />
              </clipPath>
            </defs>

            {/* ── Regions-Flächen (geclippt zum Kopf) ── */}
            <g clipPath="url(#head-clip)">

              {/* Frontopolar */}
              <polygon
                points={REGION_PATHS.frontopolar}
                fill={regionFill('frontopolar')}
                stroke={regionStroke('frontopolar')}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered('frontopolar')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(s => s === 'frontopolar' ? null : 'frontopolar')}
              />

              {/* Frontal */}
              <polygon
                points={REGION_PATHS.frontal}
                fill={regionFill('frontal')}
                stroke={regionStroke('frontal')}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered('frontal')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(s => s === 'frontal' ? null : 'frontal')}
              />

              {/* Anterotemporal links */}
              <polygon
                points={REGION_PATHS.anterotemporal}
                fill={regionFill('anterotemporal')}
                stroke={regionStroke('anterotemporal')}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered('anterotemporal')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(s => s === 'anterotemporal' ? null : 'anterotemporal')}
              />
              {/* Anterotemporal rechts (gespiegelt) */}
              <polygon
                points={mirrorPoints(REGION_PATHS.anterotemporal)}
                fill={regionFill('anterotemporal')}
                stroke={regionStroke('anterotemporal')}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered('anterotemporal')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(s => s === 'anterotemporal' ? null : 'anterotemporal')}
              />

              {/* Zentral */}
              <polygon
                points={REGION_PATHS.zentral}
                fill={regionFill('zentral')}
                stroke={regionStroke('zentral')}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered('zentral')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(s => s === 'zentral' ? null : 'zentral')}
              />

              {/* Mitteltemporal links */}
              <polygon
                points={REGION_PATHS.mitteltemporal}
                fill={regionFill('mitteltemporal')}
                stroke={regionStroke('mitteltemporal')}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered('mitteltemporal')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(s => s === 'mitteltemporal' ? null : 'mitteltemporal')}
              />
              {/* Mitteltemporal rechts */}
              <polygon
                points={mirrorPoints(REGION_PATHS.mitteltemporal)}
                fill={regionFill('mitteltemporal')}
                stroke={regionStroke('mitteltemporal')}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered('mitteltemporal')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(s => s === 'mitteltemporal' ? null : 'mitteltemporal')}
              />

              {/* Parietal */}
              <polygon
                points={REGION_PATHS.parietal}
                fill={regionFill('parietal')}
                stroke={regionStroke('parietal')}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered('parietal')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(s => s === 'parietal' ? null : 'parietal')}
              />

              {/* Posterotemporal links */}
              <polygon
                points={REGION_PATHS.posterotemporal}
                fill={regionFill('posterotemporal')}
                stroke={regionStroke('posterotemporal')}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered('posterotemporal')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(s => s === 'posterotemporal' ? null : 'posterotemporal')}
              />
              {/* Posterotemporal rechts */}
              <polygon
                points={mirrorPoints(REGION_PATHS.posterotemporal)}
                fill={regionFill('posterotemporal')}
                stroke={regionStroke('posterotemporal')}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered('posterotemporal')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(s => s === 'posterotemporal' ? null : 'posterotemporal')}
              />

              {/* Okzipital */}
              <polygon
                points={REGION_PATHS.okzipital}
                fill={regionFill('okzipital')}
                stroke={regionStroke('okzipital')}
                strokeWidth="1"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered('okzipital')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(s => s === 'okzipital' ? null : 'okzipital')}
              />

            </g>

            {/* ── Kopf-Umriss ── */}
            <ellipse
              cx={CX} cy={CY} rx={RX} ry={RY}
              fill="none" stroke="#94a3b8" strokeWidth="2"
            />

            {/* Nasion-Marker (oben) */}
            <path
              d={`M ${CX - 14},${CY - RY + 10} L ${CX},${CY - RY - 14} L ${CX + 14},${CY - RY + 10}`}
              fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinejoin="round"
            />

            {/* Ohren links/rechts */}
            <ellipse cx={CX - RX - 4} cy={CY} rx="9" ry="16" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
            <ellipse cx={CX + RX + 4} cy={CY} rx="9" ry="16" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />

            {/* Mittellinie-Linie (gestrichelt) */}
            <line
              x1={CX} y1={CY - RY + 5}
              x2={CX} y2={CY + RY - 5}
              stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.5"
            />

            {/* ── Elektroden-Punkte ── */}
            {Object.entries(ELECTRODE_COORDS).map(([name, coord]) => {
              const isMidline = MIDLINE_ELECTRODES.includes(name)
              const isInActiveRegion = coord.region === activeRegion
              return (
                <g key={name}>
                  <circle
                    cx={coord.x} cy={coord.y} r={isMidline ? 5 : 4.5}
                    fill={isInActiveRegion ? '#1e293b' : '#ffffff'}
                    stroke={isInActiveRegion ? '#1e293b' : isMidline ? '#64748b' : '#94a3b8'}
                    strokeWidth={isMidline ? 1.8 : 1.5}
                  />
                  <text
                    x={coord.x} y={coord.y - 8}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontFamily="ui-monospace, monospace"
                    fill={isInActiveRegion ? '#0f172a' : '#64748b'}
                    fontWeight={isInActiveRegion ? '700' : '400'}
                  >
                    {name}
                  </text>
                </g>
              )
            })}

            {/* ── Region-Labels im SVG ── */}
            {[
              { id: 'frontopolar',     x: CX,       y: 56,  label: 'FP' },
              { id: 'frontal',         x: CX,       y: 128, label: 'F' },
              { id: 'anterotemporal',  x: 65,       y: 152, label: 'AT' },
              { id: 'anterotemporal',  x: W - 65,   y: 152, label: 'AT', right: true },
              { id: 'zentral',         x: CX,       y: 204, label: 'C' },
              { id: 'mitteltemporal',  x: 40,       y: 210, label: 'MT' },
              { id: 'mitteltemporal',  x: W - 40,   y: 210, label: 'MT', right: true },
              { id: 'posterotemporal', x: 68,       y: 286, label: 'PT' },
              { id: 'posterotemporal', x: W - 68,   y: 286, label: 'PT', right: true },
              { id: 'parietal',        x: CX,       y: 284, label: 'P' },
              { id: 'okzipital',       x: CX,       y: 366, label: 'O' },
            ].filter((item, i, arr) => !('right' in item && item.right) || i === arr.findIndex(a => a.id === item.id && 'right' in a && a.right))
             .map((item, i) => (
              <text
                key={i}
                x={item.x} y={item.y}
                textAnchor="middle"
                fontSize="9"
                fontFamily="ui-sans-serif, system-ui"
                fill={activeRegion === item.id ? '#0f172a' : '#94a3b8'}
                fontWeight={activeRegion === item.id ? '800' : '600'}
                letterSpacing="0.05em"
                className="pointer-events-none select-none"
              >
                {item.label}
              </text>
            ))}

            {/* Hover-Tooltip: Region-Name */}
            {hoveredRegion && hoveredRegion !== 'generalisiert' && (
              <g>
                <rect x={CX - 100} y={H - 32} width="200" height="22" rx="4"
                  fill="#0f172a" opacity="0.85" />
                <text x={CX} y={H - 17} textAnchor="middle"
                  fontSize="10" fill="white" fontWeight="600"
                  className="pointer-events-none">
                  {REGIONS.find(r => r.id === hoveredRegion)?.label}
                </text>
              </g>
            )}

          </svg>

          {/* Generalisiert-Button unter SVG */}
          <button
            onClick={() => setSelected(s => s === 'generalisiert' ? null : 'generalisiert')}
            onMouseEnter={() => setHovered('generalisiert')}
            onMouseLeave={() => setHovered(null)}
            className={`mt-2 w-full rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedRegion === 'generalisiert'
                ? 'border-slate-700 bg-slate-800 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            ⊕ Generalisiert / Diffus
          </button>
        </div>

        {/* ── Panel: Entitätenliste ── */}
        <div className="flex-1 min-w-0">
          {!selectedRegion ? (
            <EmptyPanel mode={mode} />
          ) : (
            <EntityPanel
              region={selectedRegionMeta!}
              entities={panelEntities}
              mode={mode}
              classColor={CLASS_COLOR}
              classLabel={CLASS_LABEL}
              onClose={() => setSelected(null)}
            />
          )}
        </div>

      </div>

      {/* ── Legende ── */}
      <Legend mode={mode} />

    </div>
  )
}

// ─── Panel: Leer-Zustand ──────────────────────────────────────────────────────

function EmptyPanel({ mode }: { mode: TopoMode }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
      <div className="mb-2 text-2xl opacity-30">{mode === 'physiologisch' ? '○' : '▲'}</div>
      <p className="text-sm font-medium text-slate-400">Region anklicken</p>
      <p className="mt-1 text-xs text-slate-300">
        {mode === 'physiologisch'
          ? 'Zeigt normale EEG-Muster für diese Region'
          : 'Zeigt pathologische Befunde für diese Region'
        }
      </p>
    </div>
  )
}

// ─── Panel: Entitäten ─────────────────────────────────────────────────────────

function EntityPanel({
  region, entities, mode, classColor, classLabel, onClose,
}: {
  region: NonNullable<ReturnType<typeof REGIONS.find>>
  entities: WaveEntity[]
  mode: TopoMode
  classColor: Record<string, string>
  classLabel: Record<string, string>
  onClose: () => void
}) {
  const modeColor = mode === 'physiologisch' ? 'text-blue-700' : 'text-red-700'
  const modeBg    = mode === 'physiologisch' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'

  return (
    <div className={`rounded-2xl border ${modeBg} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-current border-opacity-10">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${modeColor}`}>{region.label}</span>
            <span className="text-xs text-slate-400">·  {region.electrodes.join(', ') || 'bilateral diffus'}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{region.description}</p>
        </div>
        <button onClick={onClose} className="text-slate-300 hover:text-slate-500 text-sm mt-0.5">✕</button>
      </div>

      {/* Entitäten-Liste */}
      {entities.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-slate-400">
          Keine {mode === 'physiologisch' ? 'physiologischen' : 'pathologischen'} Muster für diese Region dokumentiert
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {entities.map(e => (
            <Link
              key={e.id}
              href={`/entity/${e.id}`}
              className="flex items-start gap-3 px-4 py-2.5 hover:bg-white/60 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors leading-5">
                    {e.name}
                  </span>
                  <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 ${classColor[e.classification] ?? 'bg-slate-100 text-slate-500'}`}>
                    {classLabel[e.classification] ?? e.classification}
                  </span>
                </div>
                {e.aliases.length > 0 && (
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {e.aliases.slice(0, 2).join(' · ')}
                  </p>
                )}
                {e.teaching_pearl && (
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {e.teaching_pearl}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-slate-300 font-mono shrink-0 mt-0.5">{e.id}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-current border-opacity-10">
        <p className="text-[10px] text-slate-400">
          {entities.length} Muster · Klick auf Eintrag → Detailseite
        </p>
      </div>
    </div>
  )
}

// ─── Legende ──────────────────────────────────────────────────────────────────

function Legend({ mode }: { mode: TopoMode }) {
  const regions = REGIONS.filter(r => r.id !== 'generalisiert')
  return (
    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
      {regions.map(r => (
        <div key={r.id} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: mode === 'physiologisch' ? r.colorHex : r.colorHexPath }}
          />
          <span className="text-[10px] text-slate-500">{r.label}</span>
        </div>
      ))}
    </div>
  )
}
