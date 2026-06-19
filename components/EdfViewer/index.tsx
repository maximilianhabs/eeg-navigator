'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { EDFParser } from './edfParser'
import { buildMontageRows, MONTAGE_LABELS, getRowColor, type MontageId } from './montages'
import type { EdfHeader } from './edfParser'

// Klinische Standard-Sensitivitätsstufen (µV/mm), von niedrig zu hoch
const SENSITIVITY_STEPS = [100, 50, 30, 20, 15, 10, 7, 5, 3, 1]
const DEFAULT_SENSITIVITY = 1   // µV/mm — maximale Sensitivität als Standard
const PX_PER_MM = 96 / 25.4    // CSS-Pixel pro mm bei 96 dpi

interface EdfExample {
  filename: string; url: string; age: string; montage: string; num: string
}

// ── Single canvas panel ───────────────────────────────────────────────────────

function EdfPanel({ example, montage, sensitivity, windowSec }: {
  example: EdfExample; montage: MontageId; sensitivity: number; windowSec: number
}) {
  const canvasRef                    = useRef<HTMLCanvasElement>(null)
  const [header,    setHeader]       = useState<EdfHeader | null>(null)
  const [signals,   setSignals]      = useState<Float32Array[]>([])
  const [viewStart, setViewStart]    = useState(0)
  const [loading,   setLoading]      = useState(false)
  const [error,     setError]        = useState<string | null>(null)

  useEffect(() => {
    setLoading(true); setError(null); setHeader(null); setSignals([]); setViewStart(0)
    fetch(example.url)
      .then(r => r.arrayBuffer())
      .then(buf => {
        const p = new EDFParser(buf)
        const h = p.parse()
        setHeader(h)
        setSignals(h.signals.map((_, i) => p.readSignal(i)))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [example.url])

  const duration = header ? header.numRecords * header.recordDuration : 0

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

    const viewEnd = Math.min(viewStart + windowSec, duration)
    const pad = { top: 24, bottom: 16, left: 76, right: 8 }
    const plotW = W - pad.left - pad.right
    const plotH = H - pad.top - pad.bottom
    const SPACER_WEIGHT = 0.3
    const totalWeight = allRows.reduce((s, r) => s + (r.isSpacer ? SPACER_WEIGHT : 1), 0)
    const unitH = plotH / totalWeight

    // EEG scale: klinische Sensitivität µV/mm → px/µV
    const eegScale = 1 / (sensitivity * PX_PER_MM)

    // Time grid
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

      // EKG: relativer Scale (25% der physischen Spanne füllt Zeile)
      // EEG: klinische Sensitivität µV/mm
      const scale = row.isEcg
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
      ctx.fillStyle = color; ctx.font = row.isEcg ? 'bold 8px system-ui' : '9px system-ui'
      ctx.textAlign = 'right'; ctx.fillText(row.label, pad.left - 3, yCenter + 3)

      const dataA = signals[row.sigA]
      const dataB = row.sigB >= 0 ? signals[row.sigB] : null
      const fs = row.fs
      const s0 = Math.floor(viewStart * fs), s1 = Math.ceil(viewEnd * fs)
      const step = Math.max(1, Math.floor((s1 - s0) / (plotW * 2)))

      ctx.strokeStyle = color; ctx.lineWidth = row.isEcg ? 1.1 : 0.85; ctx.beginPath()
      let first = true
      for (let s = s0; s < s1 && s < dataA.length; s += step) {
        const val = dataA[s] - (dataB && s < dataB.length ? dataB[s] : 0)
        const x = pad.left + ((s / fs) - viewStart) / windowSec * plotW
        const y = yCenter + val * scale
        if (first) { ctx.moveTo(x, y); first = false } else { ctx.lineTo(x, y) }
      }
      ctx.stroke()
      yOffset += rowH
    })

    ctx.fillStyle = timeColor; ctx.font = '9px system-ui'
    ctx.textAlign = 'left'; ctx.fillText(formatTime(viewStart), pad.left, H - 3)
    ctx.textAlign = 'right'; ctx.fillText(formatTime(Math.min(viewStart + windowSec, duration)), W - pad.right, H - 3)
    ctx.fillStyle = isDark ? '#1e3a5f' : '#dbeafe'; ctx.font = '9px system-ui'; ctx.textAlign = 'right'
    ctx.fillText(MONTAGE_LABELS[montage], W - pad.right, pad.top - 6)
  }, [header, signals, montage, sensitivity, viewStart, windowSec, duration])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const obs = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; draw()
    })
    obs.observe(canvas); return () => obs.disconnect()
  }, [draw])

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 px-3 py-1.5"
        style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => setViewStart(s => Math.max(0, s - windowSec))}
          className="w-5 h-5 rounded text-[10px] hover:opacity-70"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>◀</button>
        <button onClick={() => setViewStart(s => Math.min(duration - windowSec, s + windowSec))}
          className="w-5 h-5 rounded text-[10px] hover:opacity-70"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>▶</button>
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          {formatTime(viewStart)} – {formatTime(Math.min(viewStart + windowSec, duration))}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <a href={`/eeg-viewer?file=${encodeURIComponent(example.filename)}`} target="_blank" rel="noopener noreferrer"
            title="In neuem Fenster öffnen (Vollbild)"
            className="w-5 h-5 flex items-center justify-center rounded hover:opacity-70 text-[10px]"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>⛶</a>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>
            #{example.num} · {example.age}
          </span>
        </span>
      </div>
      <div className="relative" style={{ height: 320 }}>
        {loading && <div className="absolute inset-0 flex items-center justify-center text-sm"
          style={{ color: 'var(--text-tertiary)', background: 'var(--bg-surface)' }}>Lade…</div>}
        {error && <div className="absolute inset-0 flex items-center justify-center text-sm text-red-500">Fehler: {error}</div>}
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EdfViewer({ entityId }: { entityId: string }) {
  const [examples,     setExamples]     = useState<EdfExample[]>([])
  const [montage,      setMontage]      = useState<MontageId>('bipolar')
  const [sensitivity,  setSensitivity]  = useState(DEFAULT_SENSITIVITY)
  const [windowSec,    setWindowSec]    = useState(10)

  const sensIdx = SENSITIVITY_STEPS.indexOf(sensitivity)
  const moreAmp = () => setSensitivity(SENSITIVITY_STEPS[Math.min(sensIdx + 1, SENSITIVITY_STEPS.length - 1)])
  const lessAmp = () => setSensitivity(SENSITIVITY_STEPS[Math.max(sensIdx - 1, 0)])

  useEffect(() => {
    fetch(`/api/edf/${entityId}`)
      .then(r => r.json())
      .then((list: EdfExample[]) => setExamples(list.slice(0, 5)))
      .catch(() => {})
  }, [entityId])

  if (examples.length === 0) return null

  return (
    <div>
      <h2 className="mb-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
        EEG-Beispiel{examples.length > 1 ? `e (${examples.length})` : ''} (real)
      </h2>
      <div className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>

        {/* Shared toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 flex-wrap"
          style={{ backgroundColor: 'var(--bg-subtle)' }}>

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
          <button onClick={moreAmp}
            title="Mehr Amplitude (sensibler)"
            className="w-6 h-6 rounded text-[11px] font-bold hover:opacity-80"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>＋</button>
          <span className="text-[11px] font-mono tabular-nums min-w-[56px] text-center"
            style={{ color: 'var(--text-primary)' }}>
            {sensitivity} µV/mm
          </span>
          <button onClick={lessAmp}
            title="Weniger Amplitude (weniger sensitiv)"
            className="w-6 h-6 rounded text-[11px] font-bold hover:opacity-80"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>－</button>

          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

          {/* Zeitfenster */}
          <select value={windowSec} onChange={e => setWindowSec(Number(e.target.value))} className="text-[11px] rounded px-1 py-0.5"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <option value={5}>5 s</option>
            <option value={10}>10 s</option>
          </select>
        </div>

        {/* Stacked panels */}
        {examples.map(ex => (
          <EdfPanel key={ex.filename} example={ex} montage={montage} sensitivity={sensitivity} windowSec={windowSec} />
        ))}
      </div>
    </div>
  )
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = (sec % 60).toFixed(1)
  return `${m}:${s.padStart(4, '0')}`
}
