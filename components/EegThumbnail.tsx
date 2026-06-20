'use client'

import { useEffect, useRef, useState } from 'react'
import { EDFParser } from './EdfViewer/edfParser'

// Shared fetch cache — all thumbnails reuse one request
let listPromise: Promise<{ slug: string; url: string; montage: string }[]> | null = null
function fetchEdfList() {
  if (!listPromise) listPromise = fetch('/api/edf/list').then(r => r.json()).catch(() => [])
  return listPromise
}

const THUMB_CHANNELS = ['Fp2-F8', 'F8-T4', 'T4-T6', 'T6-O2']
const START_SEC = 2
const DURATION_SEC = 5

export function EegThumbnail({ entityId }: { entityId: string }) {
  const ioRef    = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)    // canvas drawn
  const [skip, setSkip]   = useState(false)    // no EDF found

  useEffect(() => {
    const el = ioRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        obs.disconnect()
        load()
      },
      { rootMargin: '300px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [entityId])

  async function load() {
    const slug = entityId.toLowerCase()
    const list = await fetchEdfList()
    const entry = list.find(f => f.slug.toLowerCase() === slug && f.montage === 'bipolar')
               ?? list.find(f => f.slug.toLowerCase() === slug)
    if (!entry) { setSkip(true); return }

    try {
      const buf    = await fetch(entry.url).then(r => r.arrayBuffer())
      const parser = new EDFParser(buf)
      const header = parser.parse()

      // Match channels case-insensitively
      const normalize = (s: string) => s.trim().replace(/\s/g, '').toLowerCase()
      const indices = THUMB_CHANNELS
        .map(ch => header.signals.findIndex(s => normalize(s.label) === normalize(ch)))
        .filter(i => i >= 0)

      if (indices.length < 2) { setSkip(true); return }

      const signals = indices.map(i => parser.readSignal(i))
      const fs      = header.signals[indices[0]].sampleRate
      const s0      = Math.floor(START_SEC * fs)
      const s1      = Math.min(Math.floor((START_SEC + DURATION_SEC) * fs), signals[0].length)

      const canvas = canvasRef.current
      if (!canvas) return
      const W = canvas.offsetWidth || 300
      const H = 72
      canvas.width  = W * window.devicePixelRatio
      canvas.height = H * window.devicePixelRatio
      canvas.style.width  = W + 'px'
      canvas.style.height = H + 'px'

      const ctx = canvas.getContext('2d')!
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      ctx.clearRect(0, 0, W, H)

      const nCh      = indices.length
      const rowH     = H / nCh
      const PAD_LEFT = 36
      const plotW    = W - PAD_LEFT - 4

      ctx.font      = '8px ui-monospace, SFMono-Regular, monospace'
      ctx.textAlign = 'right'

      indices.forEach((sigIdx, row) => {
        const yCenter = row * rowH + rowH / 2
        const slice   = signals[row].slice(s0, s1)

        // Row separator
        if (row > 0) {
          ctx.strokeStyle = 'rgba(128,128,128,0.1)'
          ctx.lineWidth   = 0.5
          ctx.beginPath(); ctx.moveTo(0, row * rowH); ctx.lineTo(W, row * rowH); ctx.stroke()
        }

        // Channel label
        ctx.fillStyle = 'rgba(148,163,184,0.75)'
        ctx.fillText(THUMB_CHANNELS[row] ?? header.signals[sigIdx].label.trim(), PAD_LEFT - 4, yCenter + 3)

        // Scale per channel
        let mn = Infinity, mx = -Infinity
        for (let i = 0; i < slice.length; i++) {
          if (slice[i] < mn) mn = slice[i]
          if (slice[i] > mx) mx = slice[i]
        }
        const range = mx - mn || 1
        const scale = (rowH * 0.75) / range

        // Waveform
        ctx.strokeStyle = 'rgba(59,130,246,0.8)'
        ctx.lineWidth   = 1.2
        ctx.lineJoin    = 'round'
        ctx.beginPath()
        const step = Math.max(1, Math.floor(slice.length / plotW / 2))
        for (let i = 0; i < slice.length; i += step) {
          const x = PAD_LEFT + (i / (slice.length - 1)) * plotW
          const y = yCenter - (slice[i] - (mn + mx) / 2) * scale
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      })

      setReady(true)
    } catch {
      setSkip(true)
    }
  }

  if (skip) return null

  return (
    <>
      <div ref={ioRef} />
      {ready && (
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: '72px', background: 'var(--bg-subtle)', borderRadius: '14px 14px 0 0' }}
        />
      )}
    </>
  )
}
