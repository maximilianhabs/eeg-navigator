'use client'

import { useMemo, useState, useEffect } from 'react'
import { buildSources, computeElectrodeSignals, SAMPLE_RATE, EPOCH_DURATION, type EEGState } from './signals'
import { MONTAGES, MONTAGE_LABELS, deriveChannelSignals, type MontageId } from './montages'
import { ENTITY_EEG_STATE } from '@/lib/eegStates'
import { getAllWellen } from '@/lib/data'
import dynamic from 'next/dynamic'

const EEGCanvas = dynamic(() => import('./EEGCanvas'), { ssr: false })

// ── DGKN Standard-Geräteeinstellungen (Routine-EEG) ─────────────────────────
const DGKN_SETTINGS = {
  sensitivity:  '7 µV/mm',
  speed:        '30 mm/s',
  tc:           '0,3 s',
  lff:          '0,53 Hz',
  hff:          '70 Hz',
  notch:        '50 Hz (aus)',
  electrodes:   '10-20 System',
  impedance:    '< 5 kΩ',
}

const GROUP_COLORS: Record<string, string> = {
  'Temp. rechts':    '#1a1a2e',
  'Parasag. rechts': '#1a1a2e',
  'Temp. links':     '#1e3a8a',
  'Parasag. links':  '#1e3a8a',
  'Mittellinie':     '#5c2d0e',
  'EKG':             '#7f1d1d',
}

const SELECTABLE_ENTITIES = (() => {
  const alleWellen = getAllWellen()
  const entityMap = Object.fromEntries(alleWellen.map(e => [e.id, e]))
  return Object.entries(ENTITY_EEG_STATE)
    .map(([entityId, eegState]) => ({
      entityId,
      eegState: eegState as EEGState,
      name: entityMap[entityId]?.name ?? entityId,
    }))
    .sort((a, b) => a.entityId.localeCompare(b.entityId))
})()

const STATE_DESC: Record<EEGState, string> = {
  normal_alpha: 'Entspannt, Augen geschlossen · PDR 10 Hz okzipital dominant',
  sleep_n2:     'NREM N2 · Schlafspindeln 11–16 Hz zentroparietal · K-Komplex frontal',
  sleep_n3:     'NREM N3 (SWS) · Hochamplitudige Delta 0,5–2 Hz >75 µV · frontale Dominanz',
  sleep_rem:    'REM-Schlaf · Low-Voltage mixed · Sägezahnwellen 2–3 Hz frontozentral',
}

const DESKTOP_MONTAGES: MontageId[] = ['bipolar_longitudinal', 'cz_reference']

const DEFAULT_ENTITY = SELECTABLE_ENTITIES[0]?.entityId ?? 'EEG_0001'

export default function EEGViewer({ initialEntity }: { initialEntity?: string }) {
  const [montageId, setMontageId]         = useState<MontageId>('bipolar_longitudinal')
  const [colorMode, setColorMode]         = useState(false)
  const [selectedEntity, setSelectedEntity] = useState(initialEntity ?? DEFAULT_ENTITY)
  const [isMobile, setIsMobile]           = useState(false)

  // Bildschirmbreite ermitteln — nach Mount, damit SSR + Hydration konsistent
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const currentEntry = SELECTABLE_ENTITIES.find(e => e.entityId === selectedEntity) ?? SELECTABLE_ENTITIES[0]
  const state: EEGState = currentEntry?.eegState ?? 'normal_alpha'

  // Auf mobil immer 8-Kanal-Subset, unabhängig vom gesetzten montageId
  const effectiveMontageId: MontageId = isMobile ? 'mobile_subset' : montageId

  const electrodeSignals = useMemo(() => {
    const sources = buildSources(state)
    return computeElectrodeSignals(sources, 0.06)
  }, [state])

  const channels = MONTAGES[effectiveMontageId]

  const channelSignals = useMemo(
    () => deriveChannelSignals(channels, electrodeSignals, effectiveMontageId),
    [channels, electrodeSignals, effectiveMontageId]
  )

  const channelColors = useMemo(
    () => colorMode ? channels.map(ch => GROUP_COLORS[ch.group] ?? '#1a1a2e') : undefined,
    [colorMode, channels]
  )

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">EEG-Viewer</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Schematische Darstellung · DGKN-Standard · negativ nach oben · 10 s Epoche
        </p>
      </div>

      {/* Controls — Desktop: Montage + Farbe nebeneinander; Mobil: versteckt (Subset fix) */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        {/* Montage toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          {DESKTOP_MONTAGES.map(id => (
            <button
              key={id}
              onClick={() => setMontageId(id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                montageId === id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {id === 'bipolar_longitudinal' ? 'Bipolar longitudinal' : 'Cz-Referenz'}
            </button>
          ))}
        </div>
        {/* Color mode toggle */}
        <button
          onClick={() => setColorMode(v => !v)}
          title="Hemisphären farblich kodieren"
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition-all ${
            colorMode
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="flex gap-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-blue-800 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full" style={{background:'#5c2d0e'}} />
          </span>
          Farbkodierung
        </button>
      </div>

      {/* Color legend (nur wenn aktiv, nur Desktop) */}
      {colorMode && !isMobile && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-xs">
          <span className="text-indigo-500 font-semibold uppercase tracking-wide text-[10px]">Legende</span>
          {[
            { color: '#1a1a2e', label: 'Rechte Hemisphäre' },
            { color: '#1e3a8a', label: 'Linke Hemisphäre' },
            { color: '#5c2d0e', label: 'Mittellinie' },
          ].map(({ color, label }) => (
            <span key={color} className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Entity-Selektor */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mr-1">Darstellung</span>
          {SELECTABLE_ENTITIES.map(entry => (
            <button
              key={entry.entityId}
              onClick={() => setSelectedEntity(entry.entityId)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                selectedEntity === entry.entityId
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/70 text-blue-700 hover:bg-white border border-blue-200'
              }`}
            >
              <span className="font-mono text-[10px] mr-1 opacity-60 hidden sm:inline">{entry.entityId}</span>
              {entry.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-blue-500">{STATE_DESC[state]}</p>
      </div>

      {/* EEG Canvas */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            {MONTAGE_LABELS[effectiveMontageId]}
          </span>
          <span className="text-xs text-slate-400">{channels.length} Kanäle</span>
        </div>
        {/* Horizontal scroll auf mobil, falls Canvas breiter als Viewport */}
        <div className="overflow-x-auto">
          <div className="p-3 min-w-0">
            <EEGCanvas
              channelSignals={channelSignals}
              channels={channels}
              montageId={effectiveMontageId}
              sampleRate={SAMPLE_RATE}
              epochDuration={EPOCH_DURATION}
              channelColors={channelColors}
            />
          </div>
        </div>
      </div>

      {/* DGKN Geräteeinstellungen */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Geräteeinstellungen · DGKN-Routine-EEG
          </span>
        </div>
        <div className="px-4 py-3 grid grid-cols-2 sm:flex sm:flex-wrap gap-x-6 gap-y-3">
          {[
            { label: 'Sensitivität',          value: DGKN_SETTINGS.sensitivity },
            { label: 'Papiergeschw.',         value: DGKN_SETTINGS.speed },
            { label: 'Zeitkonstante',         value: DGKN_SETTINGS.tc },
            { label: 'Untere Grenzfrequenz',  value: DGKN_SETTINGS.lff },
            { label: 'Obere Grenzfrequenz',   value: DGKN_SETTINGS.hff },
            { label: 'Notchfilter',           value: DGKN_SETTINGS.notch },
            { label: 'Elektrodensystem',      value: DGKN_SETTINGS.electrodes },
            { label: 'Impedanz',              value: DGKN_SETTINGS.impedance },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{label}</span>
              <span className="text-sm font-semibold text-slate-700 font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feldphysik — auf mobil kompakter */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Feldphysik</h2>
        {isMobile ? (
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Parasagittale Reihen</strong> beidseits: Alpha-Maximum P3–O1 / P4–O2 (okzipital),
            Amplitudenabnahme nach frontal. Phasenumkehr an O1/O2 bei bipolarer Ableitung sichtbar.
          </p>
        ) : montageId === 'bipolar_longitudinal' ? (
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Phasenumkehr</strong> an der Quellelektrode (Max. okzipital): T5–O1 und P3–O1 zeigen
            gegenläufige Deflektionen, da V(O1) {'>'} V(T5) und V(O1) {'>'} V(P3). Die Alpha-Amplitude nimmt
            zur Frontalregion hin ab — Fp1–F7 nahezu isoelektrisch. Feld folgt inverser Distanzfunktion.
          </p>
        ) : (
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Cz-Referenz</strong>: Absolute Aktivität jeder Elektrode relativ zu Cz. Okzipitale
            Elektroden (O1, O2) zeigen maximale Alpha-Amplitude. Achtung: Cz-Kontamination durch
            zentrale Quellen (Mu-Rhythmus) möglich — Cz ist nie vollständig inaktiv.
          </p>
        )}
      </div>

    </div>
  )
}
