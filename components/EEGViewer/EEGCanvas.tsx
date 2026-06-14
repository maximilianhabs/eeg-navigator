'use client'

import { useEffect, useRef } from 'react'
import type { Channel, MontageId } from './montages'

interface Props {
  channelSignals: Float32Array[]
  channels: Channel[]
  montageId: MontageId
  sampleRate: number
  epochDuration: number
  channelColors?: string[]      // per-channel trace color; falls back to TRACE_COLOR
  sensitivityUvPerPx?: number   // auto-computed by parent; falls back to 2.5
}

// Display constants
const CH_HEIGHT = 72                  // px per channel — mehr Raum für große Transienten
const CH_PADDING = 4                  // px above/below baseline; Überlappung erlaubt
const LABEL_WIDTH = 72               // px for left label column
const MARGIN_TOP = 28                // px for time ruler
const MARGIN_BOTTOM = 24            // px for scale bar
const GROUP_GAP = 36                 // extra px between chain groups
const PAPER_COLOR = '#fefdf6'
const GRID_COLOR = '#e8e4d8'
const TRACE_COLOR = '#1a1a2e'
const LABEL_COLOR = '#64748b'
const GROUP_LABEL_COLOR = '#94a3b8'

export default function EEGCanvas({
  channelSignals, channels, montageId, sampleRate, epochDuration, channelColors, sensitivityUvPerPx,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate group boundaries for spacing
    const groups: string[] = []
    channels.forEach(ch => {
      if (!groups.includes(ch.group)) groups.push(ch.group)
    })
    const groupStarts: Record<string, number> = {}
    let chIdx = 0
    for (const g of groups) {
      groupStarts[g] = chIdx
      chIdx += channels.filter(c => c.group === g).length
    }

    // Total height: channels + group gaps + margins
    const nGroups = groups.length
    const totalHeight = MARGIN_TOP + channels.length * CH_HEIGHT + (nGroups - 1) * GROUP_GAP + MARGIN_BOTTOM

    // Width: time axis, 30mm/s → use 90px/s for screen readability
    const PX_PER_SEC = 90
    const signalWidth = epochDuration * PX_PER_SEC
    const totalWidth = LABEL_WIDTH + signalWidth

    canvas.width = totalWidth
    canvas.height = totalHeight

    // ── Background ───────────────────────────────────────────────────────────
    ctx.fillStyle = PAPER_COLOR
    ctx.fillRect(0, 0, totalWidth, totalHeight)

    // ── Helper: y-offset for channel index (accounts for group gaps) ─────────
    function channelY(idx: number): number {
      const g = channels[idx].group
      const gIdx = groups.indexOf(g)
      return MARGIN_TOP + idx * CH_HEIGHT + gIdx * GROUP_GAP + CH_HEIGHT / 2
    }

    // ── Time grid (1s and 0.2s) ───────────────────────────────────────────────
    const contentBottom = totalHeight - MARGIN_BOTTOM

    // 0.2s minor grid
    ctx.strokeStyle = GRID_COLOR
    ctx.lineWidth = 0.5
    ctx.setLineDash([])
    for (let s = 0; s <= epochDuration; s += 0.2) {
      const x = LABEL_WIDTH + s * PX_PER_SEC
      ctx.beginPath()
      ctx.moveTo(x, MARGIN_TOP)
      ctx.lineTo(x, contentBottom)
      ctx.stroke()
    }

    // 1s major grid — slightly darker
    ctx.strokeStyle = '#cec9b8'
    ctx.lineWidth = 0.8
    for (let s = 0; s <= epochDuration; s++) {
      const x = LABEL_WIDTH + s * PX_PER_SEC
      ctx.beginPath()
      ctx.moveTo(x, MARGIN_TOP)
      ctx.lineTo(x, contentBottom)
      ctx.stroke()
    }

    // ── Time ruler ───────────────────────────────────────────────────────────
    ctx.fillStyle = LABEL_COLOR
    ctx.font = '9px "SF Mono", monospace'
    ctx.textAlign = 'center'
    for (let s = 0; s <= epochDuration; s++) {
      const x = LABEL_WIDTH + s * PX_PER_SEC
      ctx.fillText(`${s}s`, x, MARGIN_TOP - 6)
    }

    // ── Group labels + separators ─────────────────────────────────────────────
    ctx.textAlign = 'left'
    ctx.font = '9px system-ui'
    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i]
      const y = channelY(i)
      const isFirstInGroup = i === 0 || channels[i - 1].group !== ch.group

      if (isFirstInGroup) {
        // group label above first channel of group
        const gIdx = groups.indexOf(ch.group)
        const separatorY = y - CH_HEIGHT / 2 - (gIdx > 0 ? GROUP_GAP / 2 : 0)

        if (gIdx > 0) {
          // solid separator line centred in the gap between groups
          ctx.strokeStyle = '#b8b2a0'
          ctx.lineWidth = 1.2
          ctx.setLineDash([])
          ctx.beginPath()
          ctx.moveTo(0, separatorY)
          ctx.lineTo(totalWidth, separatorY)
          ctx.stroke()
        }

        // group label, vertically centred in the gap (or at top for first group)
        const labelY = gIdx > 0
          ? separatorY + GROUP_GAP / 2 + 3
          : MARGIN_TOP - 4
        ctx.fillStyle = GROUP_LABEL_COLOR
        ctx.font = 'bold 8px system-ui'
        ctx.fillText(ch.group.toUpperCase(), 2, labelY)
      }
    }

    // ── Baselines (horizontal zero lines) ────────────────────────────────────
    ctx.strokeStyle = '#d6d1c0'
    ctx.lineWidth = 0.4
    ctx.setLineDash([])
    for (let i = 0; i < channels.length; i++) {
      const y = channelY(i)
      ctx.beginPath()
      ctx.moveTo(LABEL_WIDTH, y)
      ctx.lineTo(totalWidth, y)
      ctx.stroke()
    }

    // ── Channel labels ────────────────────────────────────────────────────────
    ctx.fillStyle = LABEL_COLOR
    ctx.font = '10px system-ui'
    ctx.textAlign = 'right'
    for (let i = 0; i < channels.length; i++) {
      const y = channelY(i)
      ctx.fillText(channels[i].label, LABEL_WIDTH - 4, y + 3.5)
    }

    // ── EEG Traces (negative up = DGKN standard) ──────────────────────────────
    const nSamples = channelSignals[0]?.length ?? 0
    const pxPerSample = signalWidth / nSamples
    // Sensitivity: from parent (auto-scaled per montage) or fallback 2.5 µV/px
    const uvPerPx = sensitivityUvPerPx ?? 2.5
    // maxDeflection: hard clip only if signal somehow exceeds channel bounds
    const maxDeflection = CH_HEIGHT / 2 - CH_PADDING

    ctx.lineWidth = 0.85
    ctx.setLineDash([])

    for (let i = 0; i < channels.length; i++) {
      const sig = channelSignals[i]
      if (!sig) continue
      const baseY = channelY(i)

      ctx.strokeStyle = channelColors?.[i] ?? TRACE_COLOR
      ctx.beginPath()
      let started = false
      for (let s = 0; s < nSamples; s++) {
        const x = LABEL_WIDTH + s * pxPerSample
        // EEG-Konvention (DGKN/IFCN): negativ oben — negativer µV-Wert → kleineres y → Aufwärtsauslenkung
        const deflection = sig[s] / uvPerPx
        const y = baseY + Math.max(-maxDeflection, Math.min(maxDeflection, deflection))
        if (!started) { ctx.moveTo(x, y); started = true }
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    // ── Scale bar (bottom left) ───────────────────────────────────────────────
    const scaleY = totalHeight - 8
    const scaleX = LABEL_WIDTH + 4
    // Pick a round scale bar value close to 30% of max channel height
    const rawScaleUV = (CH_HEIGHT / 2 - CH_PADDING) * uvPerPx * 0.5
    const scaleUV = rawScaleUV >= 100 ? Math.round(rawScaleUV / 50) * 50
                  : rawScaleUV >= 20  ? Math.round(rawScaleUV / 10) * 10
                  : Math.round(rawScaleUV / 5) * 5 || 5
    const scalePx = scaleUV / uvPerPx
    const scaleTimePx = PX_PER_SEC

    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 1.5
    ctx.setLineDash([])

    // amplitude bar (vertical)
    ctx.beginPath()
    ctx.moveTo(scaleX, scaleY - scalePx)
    ctx.lineTo(scaleX, scaleY)
    ctx.stroke()
    // time bar (horizontal)
    ctx.beginPath()
    ctx.moveTo(scaleX, scaleY)
    ctx.lineTo(scaleX + scaleTimePx, scaleY)
    ctx.stroke()

    ctx.fillStyle = '#475569'
    ctx.font = '9px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(`${scaleUV} µV`, scaleX + 3, scaleY - scalePx + 9)
    ctx.fillText('1 s', scaleX + scaleTimePx / 2 - 6, scaleY - 3)

    // Sensitivity label
    ctx.fillStyle = LABEL_COLOR
    ctx.textAlign = 'right'
    ctx.fillText(`${uvPerPx.toFixed(1)} µV/px`, LABEL_WIDTH - 2, totalHeight - 4)

  }, [channelSignals, channels, montageId, sampleRate, epochDuration, channelColors])

  return (
    <div className="overflow-x-auto">
      <canvas
        ref={canvasRef}
        style={{ display: 'block', imageRendering: 'crisp-edges' }}
      />
    </div>
  )
}
