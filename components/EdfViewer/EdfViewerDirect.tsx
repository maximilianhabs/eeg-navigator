'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { EDFParser } from './edfParser'
import { buildMontageRows, MONTAGE_LABELS, getRowColor, AVG_REF_SENTINEL, isStandardEegChannel, isPreMontaged, type MontageId } from './montages'
import { filterSignal, HP_OPTIONS, LP_OPTIONS, DEFAULT_HP, DEFAULT_LP } from './filters'
import type { EdfHeader } from './edfParser'

const SENSITIVITY_STEPS = [100, 50, 30, 20, 15, 10, 7, 5, 3, 1, 0.5, 0.2]
const DEFAULT_SENSITIVITY = 1
const PX_PER_MM = 96 / 25.4

interface EdfMarker { t: number; label: string; color?: string }
interface Props {
  url: string
  filename: string
  markers?: EdfMarker[]
  canvasHeight?: string
}

export default function EdfViewerDirect({ url, filename, markers, canvasHeight = '420px' }: Props) {
  const canvasRef                      = useRef<HTMLCanvasElement>(null)
  const touchStartX                    = useRef<number | null>(null)
  const pinchRef                       = useRef<{ dist: number; win: number } | null>(null)
  const [showSecondary, setShowSecondary] = useState(false)
  const [header,      setHeader]       = useState<EdfHeader | null>(null)
  const [signals,     setSignals]      = useState<Float32Array[]>([])
  const [montage,     setMontage]      = useState<MontageId>('bipolar')
  const [sensitivity, setSensitivity]  = useState(DEFAULT_SENSITIVITY)
  const [viewStart,   setViewStart]    = useState(0)
  const [windowSec,   setWindowSec]    = useState(10)
  const [hpFreq,      setHpFreq]       = useState<number | null>(DEFAULT_HP)
  const [lpFreq,      setLpFreq]       = useState<number | null>(DEFAULT_LP)
  const [notch,       setNotch]        = useState(false)
  const [neonMode,    setNeonMode]     = useState(false)
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

  const filteredSignals = useMemo(() => {
    if (!header || signals.length === 0) return signals
    return signals.map((sig, i) => {
      const fs = header.signals[i].sampleRate
      const label = (header.signals[i].label || '').trim()
      const isEkg = /ECG|EKG|CARD/i.test(label) || /^POL X1$/i.test(label)
      return filterSignal(sig, fs, hpFreq, lpFreq, notch || isEkg)
    })
  }, [signals, header, hpFreq, lpFreq, notch])

  // Average reference: Mittelwert aller Standard-10-20-EEG-Kanäle sample-weise
  const avgRef = useMemo<Float32Array | null>(() => {
    if (!header || filteredSignals.length === 0) return null
    const eegIndices = header.signals
      .map((s, i) => ({ i, label: (s.label || '').trim() }))
      .filter(({ label }) => isStandardEegChannel(label))
      .map(({ i }) => i)
    if (eegIndices.length === 0) return null
    const len = filteredSignals[eegIndices[0]].length
    const avg = new Float32Array(len)
    for (const i of eegIndices) {
      const sig = filteredSignals[i]
      for (let s = 0; s < len && s < sig.length; s++) avg[s] += sig[s]
    }
    const n = eegIndices.length
    for (let s = 0; s < len; s++) avg[s] /= n
    return avg
  }, [filteredSignals, header])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !header || filteredSignals.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width, H = canvas.height
    const isDark = document.documentElement.classList.contains('dark')
    const bgColor     = neonMode ? '#080808' : (isDark ? '#0d1117' : '#ffffff')
    const gridColor   = neonMode ? '#1a1a1a' : (isDark ? '#1e2436' : '#f1f5f9')
    const timeColor   = neonMode ? '#3a3a3a' : (isDark ? '#475569' : '#94a3b8')
    const spacerColor = neonMode ? '#222222' : (isDark ? '#2d3748' : '#e2e8f0')

    ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H)

    // Bereits montierte Dateien (rekonstruierte Doppelbananen) MÜSSEN im Roh-Modus
    // bleiben — siehe ausführlichen Kommentar in EdfViewer/index.tsx (normLabel-
    // Mehrdeutigkeit: "-F7"-Suffix würde sonst wie eine Referenz-Endung behandelt
    // und Kanäle fälschlich gegeneinander verrechnen).
    const preMontaged = isPreMontaged(header)
    const effMontage: MontageId = preMontaged ? 'raw' : montage
    const allRows = buildMontageRows(header, effMontage)
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
      const color   = getRowColor(row.colorKey, isDark, neonMode)
      let scale: number
      if (row.isEcg) {
        const sig = filteredSignals[row.sigA]
        const sampleStep = Math.max(1, Math.floor(sig.length / 2000))
        const absVals: number[] = []
        for (let i = 0; i < sig.length; i += sampleStep) absVals.push(Math.abs(sig[i]))
        absVals.sort((a, b) => a - b)
        const p95 = absVals[Math.floor(absVals.length * 0.95)] || row.ampRange * 0.1
        scale = (rowH * 0.55) / p95
      } else {
        scale = eegScale
      }

      if (rowIdx > 0 && !allRows[rowIdx - 1].isSpacer) {
        ctx.strokeStyle = row.isEcg ? (isDark ? '#2d1a1a' : '#fee2e2') : gridColor
        ctx.lineWidth = 0.5
        ctx.beginPath(); ctx.moveTo(pad.left, yOffset); ctx.lineTo(W - pad.right, yOffset); ctx.stroke()
      }
      if (row.isEcg) {
        ctx.fillStyle = neonMode ? 'rgba(255,51,51,0.06)' : 'rgba(239,68,68,0.05)'
        ctx.fillRect(pad.left, yOffset, plotW, rowH)
      }
      ctx.fillStyle = color
      ctx.font = row.isEcg ? 'bold 8px system-ui' : '9px system-ui'
      ctx.textAlign = 'right'; ctx.fillText(row.label, pad.left - 3, yCenter + 3)

      const dataA = filteredSignals[row.sigA]
      const dataB = row.sigB === AVG_REF_SENTINEL ? (avgRef ?? null)
                  : row.sigB >= 0 ? filteredSignals[row.sigB] : null
      const fs    = row.fs
      const s0    = Math.floor(viewStart * fs), s1 = Math.ceil(viewEnd * fs)
      const step  = Math.max(1, Math.floor((s1 - s0) / (plotW * 2)))

      ctx.strokeStyle = color; ctx.lineWidth = neonMode ? (row.isEcg ? 1.4 : 1.1) : (row.isEcg ? 1.1 : 0.85); ctx.beginPath()
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

    // Marker overlays
    for (const marker of (markers ?? [])) {
      if (marker.t < viewStart || marker.t > viewStart + windowSec) continue
      const x = pad.left + (marker.t - viewStart) / windowSec * plotW
      const mc = marker.color === 'amber' ? '#f59e0b'
               : marker.color === 'red'   ? '#ef4444'
               : marker.color === 'green' ? '#22c55e'
               : '#60a5fa'
      ctx.save()
      ctx.strokeStyle = mc; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.globalAlpha = 0.85
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, H - pad.bottom); ctx.stroke()
      ctx.restore()
      ctx.font = 'bold 9px system-ui'; ctx.textAlign = 'left'
      const tw = ctx.measureText(marker.label).width
      const lx = Math.min(x + 4, W - pad.right - tw - 6)
      ctx.fillStyle = mc
      ctx.beginPath(); ctx.roundRect(lx - 2, pad.top, tw + 8, 14, 3); ctx.fill()
      ctx.fillStyle = '#ffffff'; ctx.fillText(marker.label, lx + 2, pad.top + 10)
    }

    ctx.fillStyle = timeColor; ctx.font = '9px system-ui'
    ctx.textAlign = 'left'; ctx.fillText(formatTime(viewStart), pad.left, H - 3)
    ctx.textAlign = 'right'; ctx.fillText(formatTime(viewEnd), W - pad.right, H - 3)
    ctx.fillStyle = isDark ? '#1e3a5f' : '#dbeafe'
    ctx.font = '9px system-ui'; ctx.textAlign = 'right'
    ctx.fillText(MONTAGE_LABELS[effMontage], W - pad.right, pad.top - 6)
    if (preMontaged && montage !== 'raw') {
      ctx.fillStyle = isDark ? '#fbbf24' : '#d97706'; ctx.font = '8px system-ui'; ctx.textAlign = 'right'
      ctx.fillText('vormontiert — Referenzmontagen nicht ableitbar', W - pad.right, pad.top + 6)
    }
  }, [header, filteredSignals, avgRef, montage, sensitivity, viewStart, windowSec, neonMode, markers])

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

      {/* Toolbar — Primäre Zeile (immer sichtbar) */}
      <div className="flex items-center gap-2 px-3 py-2 flex-wrap"
        style={{ borderBottom: showSecondary ? 'none' : '1px solid var(--border)', backgroundColor: 'var(--bg-subtle)' }}>

        {/* Montage */}
        <div className="flex rounded-lg overflow-hidden border text-[11px] font-medium" style={{ borderColor: 'var(--border)' }}>
          {/* 'Roh' bewusst kein Button hier — nur für den EDF-Cropper relevant. Wird
              für vormontierte Dateien trotzdem automatisch erzwungen (siehe preMontaged
              oben), nur eben ohne manuelle Wahlmöglichkeit im Navigator. */}
          {([['bipolar', 'Doppelbanane'], ['cz', 'CZ-Ref.'], ['avg', 'Avg-Ref.']] as [MontageId, string][]).map(([m, label]) => (
            <button key={m} onClick={() => setMontage(m)} className="px-3 py-1.5 transition-colors"
              style={{ background: montage === m ? 'var(--brand)' : 'var(--bg-surface)', color: montage === m ? '#fff' : 'var(--text-secondary)' }}>
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 mx-1 hidden md:block" style={{ background: 'var(--border)' }} />

        {/* Navigation */}
        <button onClick={() => setViewStart(s => Math.max(0, s - windowSec))}
          className="w-8 h-8 md:w-6 md:h-6 rounded text-[11px] hover:opacity-80"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>◀</button>
        <button onClick={() => setViewStart(s => Math.min(duration - windowSec, s + windowSec))}
          className="w-8 h-8 md:w-6 md:h-6 rounded text-[11px] hover:opacity-80"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>▶</button>
        <select value={windowSec} onChange={e => setWindowSec(Number(e.target.value))} className="text-[11px] rounded px-1 py-0.5"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <option value={5}>5 s</option>
          <option value={10}>10 s</option>
        </select>

        {/* Desktop: Sensitivität inline */}
        <div className="hidden md:flex items-center gap-2">
          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Sens.</span>
          <button onClick={moreAmp} title="Mehr Amplitude"
            className="w-6 h-6 rounded text-[11px] font-bold hover:opacity-80"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>＋</button>
          <span className="text-[11px] font-mono tabular-nums min-w-[56px] text-center" style={{ color: 'var(--text-primary)' }}>
            {sensitivity} µV/mm
          </span>
          <button onClick={lessAmp} title="Weniger Amplitude"
            className="w-6 h-6 rounded text-[11px] font-bold hover:opacity-80"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>－</button>
          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>HP</span>
          <select value={hpFreq ?? 'off'} onChange={e => setHpFreq(e.target.value === 'off' ? null : Number(e.target.value))}
            className="text-[11px] rounded px-1 py-0.5"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {HP_OPTIONS.map(o => <option key={o.label} value={o.value ?? 'off'}>{o.label}</option>)}
          </select>
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>TP</span>
          <select value={lpFreq ?? 'off'} onChange={e => setLpFreq(e.target.value === 'off' ? null : Number(e.target.value))}
            className="text-[11px] rounded px-1 py-0.5"
            style={{ background: 'var(--bg-subtle)', border: `1px solid ${lpFreq === 35 ? '#f59e0b' : 'var(--border)'}`, color: lpFreq === 35 ? '#d97706' : 'var(--text-secondary)' }}>
            {LP_OPTIONS.map(o => <option key={o.label} value={o.value ?? 'off'}>{o.label}</option>)}
          </select>
          {lpFreq === 35 && (
            <span className="text-[10px] font-semibold text-amber-600" title="35 Hz filtert EMG-Artefakte heraus — diese können dann wie Hirnaktivität wirken. DGKN-Standard: 70 Hz.">
              ⚠ EMG
            </span>
          )}
          <button onClick={() => setNotch(n => !n)} title="50 Hz Netzartefakt-Filter"
            className="px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
            style={{ background: notch ? 'var(--brand)' : 'var(--bg-subtle)', border: '1px solid var(--border)', color: notch ? '#fff' : 'var(--text-secondary)' }}>
            50 Hz
          </button>
          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
          <button onClick={() => setNeonMode(n => !n)} title="Neon-Modus (schwarzer Hintergrund)"
            className="px-2 py-0.5 rounded text-[10px] font-medium transition-all"
            style={{
              background: neonMode ? '#080808' : 'var(--bg-subtle)',
              border: `1px solid ${neonMode ? '#00ff88' : 'var(--border)'}`,
              color: neonMode ? '#00ff88' : 'var(--text-secondary)',
              boxShadow: neonMode ? '0 0 6px rgba(0,255,136,0.4)' : 'none',
            }}>
            ◉ Neon
          </button>
        </div>

        {/* Mobile: Filter-Toggle */}
        <button
          className="md:hidden w-8 h-8 rounded flex items-center justify-center transition-colors"
          onClick={() => setShowSecondary(s => !s)}
          title="Filter & Sensitivität"
          style={{
            background: showSecondary ? 'var(--brand)' : 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            color: showSecondary ? '#fff' : 'var(--text-secondary)',
          }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <span className="ml-auto hidden md:inline text-[10px] font-mono px-2 py-0.5 rounded"
          style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>
          {filename}
        </span>
      </div>

      {/* Toolbar — Sekundäre Zeile (mobile, ausklappbar) */}
      {showSecondary && (
        <div className="md:hidden flex items-center gap-2 px-3 py-2 flex-wrap"
          style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Sens.</span>
          <button onClick={moreAmp}
            className="w-8 h-8 rounded text-[11px] font-bold hover:opacity-80"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>＋</button>
          <span className="text-[11px] font-mono tabular-nums min-w-[56px] text-center" style={{ color: 'var(--text-primary)' }}>
            {sensitivity} µV/mm
          </span>
          <button onClick={lessAmp}
            className="w-8 h-8 rounded text-[11px] font-bold hover:opacity-80"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>－</button>
          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>HP</span>
          <select value={hpFreq ?? 'off'} onChange={e => setHpFreq(e.target.value === 'off' ? null : Number(e.target.value))}
            className="text-[11px] rounded px-2 py-1.5"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {HP_OPTIONS.map(o => <option key={o.label} value={o.value ?? 'off'}>{o.label}</option>)}
          </select>
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>TP</span>
          <select value={lpFreq ?? 'off'} onChange={e => setLpFreq(e.target.value === 'off' ? null : Number(e.target.value))}
            className="text-[11px] rounded px-2 py-1.5"
            style={{ background: 'var(--bg-subtle)', border: `1px solid ${lpFreq === 35 ? '#f59e0b' : 'var(--border)'}`, color: lpFreq === 35 ? '#d97706' : 'var(--text-secondary)' }}>
            {LP_OPTIONS.map(o => <option key={o.label} value={o.value ?? 'off'}>{o.label}</option>)}
          </select>
          {lpFreq === 35 && (
            <span className="text-[10px] font-semibold text-amber-600" title="35 Hz filtert EMG-Artefakte heraus — diese können dann wie Hirnaktivität wirken. DGKN-Standard: 70 Hz.">
              ⚠ EMG
            </span>
          )}
          <button onClick={() => setNotch(n => !n)}
            className="px-3 py-1.5 rounded text-[10px] font-medium transition-colors"
            style={{ background: notch ? 'var(--brand)' : 'var(--bg-subtle)', border: '1px solid var(--border)', color: notch ? '#fff' : 'var(--text-secondary)' }}>
            50 Hz
          </button>
          <button onClick={() => setNeonMode(n => !n)}
            className="px-3 py-1.5 rounded text-[10px] font-medium transition-all"
            style={{
              background: neonMode ? '#080808' : 'var(--bg-subtle)',
              border: `1px solid ${neonMode ? '#00ff88' : 'var(--border)'}`,
              color: neonMode ? '#00ff88' : 'var(--text-secondary)',
              boxShadow: neonMode ? '0 0 6px rgba(0,255,136,0.4)' : 'none',
            }}>
            ◉ Neon
          </button>
        </div>
      )}

      {/* Canvas */}
      <div
        className="relative"
        style={{ height: canvasHeight }}
        onTouchStart={e => {
          if (e.touches.length === 2) {
            // Pinch-Start: Abststand + aktuellen windowSec merken
            const dx = e.touches[0].clientX - e.touches[1].clientX
            const dy = e.touches[0].clientY - e.touches[1].clientY
            pinchRef.current = { dist: Math.hypot(dx, dy), win: windowSec }
            touchStartX.current = null
          } else {
            touchStartX.current = e.touches[0].clientX
          }
        }}
        onTouchMove={e => {
          if (e.touches.length !== 2 || !pinchRef.current) return
          e.preventDefault()
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          const newDist = Math.hypot(dx, dy)
          const ratio   = pinchRef.current.dist / newDist  // >1 = zoom in, <1 = zoom out
          const next    = Math.max(3, Math.min(60, Math.round(pinchRef.current.win * ratio)))
          setWindowSec(next)
        }}
        onTouchEnd={e => {
          pinchRef.current = null
          if (touchStartX.current === null) return
          const delta = touchStartX.current - e.changedTouches[0].clientX
          touchStartX.current = null
          if (Math.abs(delta) < 50) return
          const duration = header ? header.numRecords * header.recordDuration : 0
          if (delta > 0) {
            setViewStart(s => Math.min(s + windowSec, Math.max(0, duration - windowSec)))
          } else {
            setViewStart(s => Math.max(0, s - windowSec))
          }
        }}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col gap-2 p-3" style={{ background: 'var(--bg-surface)' }}>
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="skeleton flex-1 rounded" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        )}
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
