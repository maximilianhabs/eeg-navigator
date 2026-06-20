'use client'

import { useEffect, useRef, useState } from 'react'
import { EDFParser } from './EdfViewer/edfParser'
import { findChannel } from './EdfViewer/montages'

// Shared fetch cache
let listPromise: Promise<{ slug: string; url: string; montage: string }[]> | null = null
function fetchEdfList() {
  if (!listPromise) listPromise = fetch('/api/edf/list').then(r => r.json()).catch(() => [])
  return listPromise
}

// Temporale Rechts-Kette bipolar
const PAIRS: [string, string][] = [['Fp2','F8'], ['F8','T4'], ['T4','T6'], ['T6','O2']]
const START_SEC   = 2
const DURATION_SEC = 5

export function EegThumbnail({ entityId }: { entityId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [skip, setSkip]   = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const slug = entityId.toLowerCase()
      const list = await fetchEdfList()
      const entry = list.find(f => f.slug.toLowerCase() === slug)
      if (!entry || cancelled) { setSkip(true); return }

      try {
        const buf    = await fetch(entry.url).then(r => r.arrayBuffer())
        if (cancelled) return
        const parser = new EDFParser(buf)
        const header = parser.parse()

        // Paare aus Referenzsignalen: Fp2-F8 = signal(Fp2) − signal(F8)
        const validPairs = PAIRS
          .map(([a, b]) => ({ a: findChannel(header, a), b: findChannel(header, b), label: `${a}-${b}` }))
          .filter(p => p.a >= 0 && p.b >= 0)

        if (validPairs.length < 2 || cancelled) { setSkip(true); return }

        const fs  = header.signals[validPairs[0].a].sampleRate
        const s0  = Math.floor(START_SEC * fs)
        const s1  = Math.min(Math.floor((START_SEC + DURATION_SEC) * fs),
                             header.signals[validPairs[0].a].numSamplesPerRecord * header.numRecords)

        // Bipolar berechnen
        const traces = validPairs.map(({ a, b }) => {
          const sigA = parser.readSignal(a)
          const sigB = parser.readSignal(b)
          const diff = new Float32Array(s1 - s0)
          for (let i = 0; i < diff.length; i++) diff[i] = sigA[s0 + i] - sigB[s0 + i]
          return diff
        })

        if (cancelled) return

        const canvas = canvasRef.current
        if (!canvas) return

        const W   = canvas.offsetWidth || 320
        const H   = 72
        const dpr = window.devicePixelRatio || 1
        canvas.width        = W * dpr
        canvas.height       = H * dpr
        canvas.style.width  = W + 'px'
        canvas.style.height = H + 'px'

        const ctx = canvas.getContext('2d')!
        ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, W, H)

        const nCh      = traces.length
        const rowH     = H / nCh
        const PAD_LEFT = 36
        const plotW    = W - PAD_LEFT - 4

        ctx.font      = '8px ui-monospace, monospace'
        ctx.textAlign = 'right'

        traces.forEach((slice, row) => {
          const yCenter = row * rowH + rowH / 2

          if (row > 0) {
            ctx.strokeStyle = 'rgba(128,128,128,0.12)'
            ctx.lineWidth   = 0.5
            ctx.beginPath(); ctx.moveTo(0, row * rowH); ctx.lineTo(W, row * rowH); ctx.stroke()
          }

          ctx.fillStyle = 'rgba(148,163,184,0.8)'
          ctx.fillText(validPairs[row].label, PAD_LEFT - 4, yCenter + 3)

          let mn = Infinity, mx = -Infinity
          for (let i = 0; i < slice.length; i++) {
            if (slice[i] < mn) mn = slice[i]
            if (slice[i] > mx) mx = slice[i]
          }
          const range = mx - mn || 1
          const scale = (rowH * 0.75) / range

          ctx.strokeStyle = 'rgba(59,130,246,0.85)'
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

        if (!cancelled) setReady(true)
      } catch {
        if (!cancelled) setSkip(true)
      }
    }

    load()
    return () => { cancelled = true }
  }, [entityId])

  if (skip) return null

  return (
    <canvas
      ref={canvasRef}
      className="w-full block"
      style={{
        height: ready ? '72px' : '0px',
        background: 'var(--bg-subtle)',
        borderRadius: '14px 14px 0 0',
        transition: 'height 0.2s ease',
      }}
    />
  )
}
