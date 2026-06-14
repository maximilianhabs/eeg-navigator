'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { buildSources, computeElectrodeSignals, SAMPLE_RATE, EPOCH_DURATION, type EEGState } from './signals'
import { MONTAGES, MONTAGE_LABELS, deriveChannelSignals, type MontageId } from './montages'
import { localizationToChainGroups } from '@/lib/eegStates'
import dynamic from 'next/dynamic'

const EEGCanvas = dynamic(() => import('./EEGCanvas'), { ssr: false })

interface Props {
  entityId: string
  eegState: EEGState
  localization: string[]
}

const MONTAGE_IDS: MontageId[] = ['bipolar_longitudinal', 'cz_reference']

export default function EEGMiniViewer({ entityId, eegState, localization }: Props) {
  const [montageId, setMontageId] = useState<MontageId>('bipolar_longitudinal')
  const [expanded, setExpanded]   = useState(false)

  // Relevante Gruppen aus Lokalisierung ableiten
  const relevantGroups = useMemo(() => localizationToChainGroups(localization), [localization])

  // Signal-Berechnung (einmalig pro State)
  const electrodeSignals = useMemo(() => {
    return computeElectrodeSignals(buildSources(eegState), 0.06)
  }, [eegState])

  // Kanal-Subset: expanded = alle, sonst nur relevante Gruppen
  const allChannels = MONTAGES[montageId]
  const channels = useMemo(() => {
    if (expanded || relevantGroups.length === 0) return allChannels
    return allChannels.filter(ch => relevantGroups.includes(ch.group))
  }, [expanded, relevantGroups, allChannels])

  const channelSignals = useMemo(
    () => deriveChannelSignals(channels, electrodeSignals, montageId),
    [channels, electrodeSignals, montageId]
  )

  // Auto-sensitivity: scale so the 99th-percentile peak fills ~85% of the channel half-height.
  // Computed fresh per montage → bipolar and Cz-ref display at comparable visual amplitudes.
  const autoSensitivity = useMemo(() => {
    if (channelSignals.length === 0) return 2.5
    // Collect absolute values across all channels (sample every 4th for speed)
    const vals: number[] = []
    for (const sig of channelSignals) {
      for (let i = 0; i < sig.length; i += 4) vals.push(Math.abs(sig[i]))
    }
    vals.sort((a, b) => a - b)
    const p99 = vals[Math.floor(vals.length * 0.99)] ?? 1
    // CH_HEIGHT=72, CH_PADDING=4 → maxDeflection=32px; fill 85% to leave headroom
    const maxDeflectionPx = 72 / 2 - 4
    return Math.max(0.5, p99 / (maxDeflectionPx * 0.85))
  }, [channelSignals])

  const subsetLabel = relevantGroups.length > 0
    ? relevantGroups.join(' · ')
    : 'alle Ketten'

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            EEG-Darstellung
          </span>
          {!expanded && relevantGroups.length > 0 && (
            <span className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 font-medium">
              {subsetLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Montage-Toggle */}
          <div className="flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 p-0.5">
            {MONTAGE_IDS.map(id => (
              <button
                key={id}
                onClick={() => setMontageId(id)}
                className={`rounded px-2.5 py-1 text-[10px] font-medium transition-all ${
                  montageId === id
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {id === 'bipolar_longitudinal' ? 'Bipolar' : 'Cz-Ref'}
              </button>
            ))}
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-slate-800 transition-colors rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1"
          >
            {expanded ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16">
                  <path strokeLinecap="round" d="M4 8h8"/>
                </svg>
                Subset
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16">
                  <path strokeLinecap="round" d="M8 4v8M4 8h8"/>
                </svg>
                Alle Ketten
              </>
            )}
          </button>

          {/* Link zum Vollbild */}
          <Link
            href={`/eeg-viewer`}
            className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 transition-colors rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16">
              <path strokeLinecap="round" d="M3 3h10v10M3 13L13 3"/>
            </svg>
            EEG-Viewer
          </Link>
        </div>
      </div>

      {/* Montage-Label */}
      <div className="px-4 pt-2 pb-0">
        <span className="text-[10px] text-slate-400">
          {MONTAGE_LABELS[montageId]} · {channels.length} Kanäle · 30 mm/s · negativ nach oben (DGKN)
        </span>
      </div>

      {/* Canvas */}
      <div className="px-3 pb-3 pt-1">
        <EEGCanvas
          channelSignals={channelSignals}
          channels={channels}
          montageId={montageId}
          sampleRate={SAMPLE_RATE}
          epochDuration={EPOCH_DURATION}
          sensitivityUvPerPx={autoSensitivity}
        />
      </div>
    </div>
  )
}
