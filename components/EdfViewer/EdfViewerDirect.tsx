'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { EDFParser } from './edfParser'
import { buildMontageRows, MONTAGE_LABELS, getRowColor, type MontageId } from './montages'
import type { EdfHeader } from './edfParser'

const SENSITIVITY_STEPS = [100, 50, 30, 20, 15, 10, 7, 5, 3]
const DEFAULT_SENSITIVITY = 10
const PX_PER_MM = 96 / 25.4

interface Props {
  url: string
  filename: string
}

export default function EdfViewerDirect({ url, filename }: Props) {
  const canvasRef                      = useRef<HTMLCanvasElement>(null)
  const [header,      setHeader]       = useState<EdfHeader | null>(null)
  const [signals,     setSignals]      = useState<Float32Array[]>([])
  const [montage,     setMontage]      = useState<MontageId>('bipolar')
  const [sensitivity, setSensitivity]  = useState(DEFAULT_SENSITIVITY)
  const [viewStart,   setViewStart]    = useState(0)
  const [windowSec,   setWindowSec]    = useState(10)
  const [loading,     setLoading]      = useState(false)
  const [error,       setError]        = useState<string | null>(null)

  const sensIdx = SENSITIVITY_STEPS.indexOf(sensitivity)
  const moreAmp = () => setSensitivity(SENSITIVITY_STEPS[Math.min(sensIdx + 1, SENSITIVITY_STEPS.length - 1)])
  const lessAmp = () => setSensitivity(SENSITIVITY_STEPS[Math.max(sensIdx - 1, 0)])

  useEffect(() => {
    setLoading(true); setError(null); setHeader(null); setSignals([]); setViewStart(0)
    setSensitivity(DEFAULT_SENSITIVITY)
    fetch(url)
      .then(r => r.arrayBuffer())
      .then(buf => {
        const parser = new EDFParser(buf)
        const h = parser.parse()
        setHeader(h)
        setSignals(h.signals.map((_, i) => parser.readSignal(i)))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [url])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !header || signals.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width, H = canvas.height
    const isDark = document.documentElement.classList.contains('dark')
    const bgColor     = isDark ? '#0d1117' : '#ffffff'
    const gridColor   = isDark ? '#1e2436' : '#f1f5f9'
    const timeColor   = isDark ? '#475569' : '#94a3b8'
    const spacerColor = isDark ? '#2d3748' : '#e2e8f0'

    ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H)

    const allRows = buildMontageRows(header, montage)
    if (allRows.length === 0) {
      ctx.fillStyle = timeColor; ctx.font = '12px system-ui'; ctx.textAlign = 'center'
      ctx.fillText('Keine passenden Kanäle', W / 2, H / 2); return
    }

    const duration = header.numRecords * header.recordDuration
    const viewEnd  = Math.min(viewStart + windowSec, duration)
    const pad = { top: 28, bottom: 18, left: 76, right: 8 }
    const plotW = W - pad.left - pad.right
    const plotH = H - pad.top - pad.bottom
    const SPACER_WEIGHT = 0.3
    const totalWeight = allRows.reduce((s, r) => s + (r.isSpacer ? SPACER_WEIGHT : 1), 0)
    const unitH = plotH / totalWeight

    const eegScale = 1 / (sensitivity * PX_PER_MM)

    ctx.strokeStyle = gridColor; ctx.lineWidth = 1
    for (let t = Math.ceil(viewStart); t < viewEnd; t++) {
      const x = pad.left + (t - viewStart) / windowSec * plotW
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, H - pad.bottom); ctx.stroke()
      if ((t - Math.floor(viewStart)) % 5 === 0) {
        ctx.fillStyle = timeColor; ctx.font = '9px system-ui'; ctx.textAlign = 'left'
        ctx.fillText(formatTime(t), x + 2, pad.top - 6)
      }
    }

    let yOffset = pad.top
    allRows.forEach((row, rowIdx) => {
      const rowH = row.isSpacer ? unitH * SPACER_WEIGHT : unitH
      if (row.isSpacer) {
        const yMid = yOffset + rowH / 2
        ctx.strokeStyle = spacerColor; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
        ctx.beginPath(); ctx.moveTo(pad.left, yMid); ctx.lineTo(W - pad.right, yMid); ctx.stroke()
        ctx.setLineDash([]); yOffset += rowH; return
      }
      const yCenter = yOffset + rowH / 2
      const color   = getRowColor(row.colorKey, isDark)
      const scale   = row.isEcg
        ? (rowH * 0.6) / (row.ampRange * 0.25)
        : eegScale

      if (rowIdx > 0 && !allRows[rowIdx - 1].isSpacer) {
        ctx.strokeStyle = row.isEcg ? (isDark ? '#2d1a1a' : '#fee2e2') : gridColor
        ctx.lineWidth = 0.5
        ctx.beginPath(); ctx.moveTo(pad.left, yOffset); ctx.lineTo(W - pad.right, yOffset); ctx.stroke()
      }
      if (row.isEcg) {
        ctx.fillStyle = 'rgba(239,68,68,0.05)'
        ctx.fillRect(pad.left, yOffset, plotW, rowH)
      }
      ctx.fillStyle = color
      ctx.font = row.isEcg ? 'bold 8px system-ui' : '9px system-ui'
      ctx.textAlign = 'right'; ctx.fillText(row.label, pad.left - 3, yCenter + 3)

      const dataA = signals[row.sigA]
      const dataB = row.sigB >= 0 ? signals[row.sigB] : null
      const fs    = row.fs
      const s0    = Math.floor(viewStart * fs), s1 = Math.ceil(viewEnd * fs)
      const step  = Math.max(1, Math.floor((s1 - s0) / (plotW * 2)))

      ctx.strokeStyle = color; ctx.lineWidth = row.isEcg ? 1.1 : 0.85; ctx.beginPath()
      let first = true
      for (let s = s0; s < s1 && s < dataA.length; s += step) {
        const val = dataA[s] - (dataB && s < dataB.length ? dataB[s] : 0)
        const x   = pad.left + ((s / fs) - viewStart) / windowSec * plotW
        const y   = yCenter + val * scale
        if (first) { ctx.moveTo(x, y); first = false } else { ctx.lineTo(x, y) }
      }
      ctx.stroke()
      yOffset += rowH
    })

    ctx.fillStyle = timeColor; ctx.font = '9px system-ui'
    ctx.textAlign = 'left'; ctx.fillText(formatTime(viewStart), pad.left, H - 3)
    ctx.textAlign = 'right'; ctx.fillText(formatTime(viewEnd), W - pad.right, H - 3)
    ctx.fillStyle = isDark ? '#1e3a5f' : '#dbeafe'
    ctx.font = '9px system-ui'; ctx.textAlign = 'right'
    ctx.fillText(MONTAGE_LABELS[montage], W - pad.right, pad.top - 6)
  }, [header, signals, montage, sensitivity, viewStart, windowSec])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const obs = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; draw()
    })
    obs.observe(canvas); return () => obs.disconnect()
  }, [draw])

  const duration = header ? header.numRecords * header.recordDuration : 0

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 flex-wrap"
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle)' }}>

        {/* Montage */}
        <div className="flex rounded-lg overflow-hidden border text-[11px] font-medium" style={{ borderColor: 'var(--border)' }}>
          {(['bipolar', 'cz'] as MontageId[]).map(m => (
            <button key={m} onClick={() => setMontage(m)} className="px-3 py-1.5 transition-colors"
              style={{ background: montage === m ? 'var(--brand)' : 'var(--bg-surface)', color: montage === m ? '#fff' : 'var(--text-secondary)' }}>
              {m === 'bipolar' ? 'Doppelbanane' : 'CZ-Referenz'}
            </button>
          ))}
        </div>

        <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

        {/* Sensitivität */}
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Sens.</span>
        <button onClick={moreAmp} title="Mehr Amplitude"
          className="w-6 h-6 rounded text-[11px] font-bold hover:opacity-80"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>＋</button>
        <span className="text-[11px] font-mono tabular-nums min-w-[56px] text-center"
          style={{ color: 'var(--text-primary)' }}>
          {sensitivity} µV/mm
        </span>
        <button onClick={lessAmp} title="Weniger Amplitude"
          className="w-6 h-6 rounded text-[11px] font-bold hover:opacity-80"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>－</button>

        <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

        {/* Navigation */}
        <button onClick={() => setViewStart(s => Math.max(0, s - windowSec))}
          className="w-6 h-6 rounded text-[11px] hover:opacity-80"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>◀</button>
        <button onClick={() => setViewStart(s => Math.min(duration - windowSec, s + windowSec))}
          className="w-6 h-6 rounded text-[11px] hover:opacity-80"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>▶</button>
        <select value={windowSec} onChange={e => setWindowSec(Number(e.target.value))} className="text-[11px] rounded px-1 py-0.5"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <option value={5}>5 s</option>
          <option value={10}>10 s</option>
        </select>

        <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded"
          style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>
          {filename}
        </span>
      </div>

      {/* Canvas */}
      <div className="relative" style={{ height: 420 }}>
        {loading && <div className="absolute inset-0 flex items-center justify-center text-sm"
          style={{ color: 'var(--text-tertiary)', background: 'var(--bg-surface)' }}>Lade EEG-Daten…</div>}
        {error && <div className="absolute inset-0 flex items-center justify-center text-sm text-red-500">Fehler: {error}</div>}
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 flex items-center gap-3"
        style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          {duration > 0 ? `${duration} s` : '—'} · {header?.signals.length ?? 0} Kanäle · {header?.signals[0]?.sampleRate ?? 0} Hz
        </span>
      </div>
    </div>
  )
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = (sec % 60).toFixed(1)
  return `${m}:${s.padStart(4, '0')}`
}
