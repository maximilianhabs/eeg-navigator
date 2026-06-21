'use client'

import { useEffect, useState } from 'react'
import EdfViewerDirect from '@/components/EdfViewer/EdfViewerDirect'

interface EdfEntry {
  filename: string
  url: string
  slug: string
  entityName: string | null
  age: string
  montage: string
  num: string
}

export default function EEGViewerPage() {
  const [files,      setFiles]      = useState<EdfEntry[]>([])
  const [active,     setActive]     = useState<EdfEntry | null>(null)
  const [fileParam,  setFileParam]  = useState<string | null>(null)

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('file')
    setFileParam(param)
    fetch('/api/edf/list')
      .then(r => r.json())
      .then((list: EdfEntry[]) => {
        setFiles(list)
        const target = param ? list.find(f => f.filename === param) : null
        setActive(target ?? (list.length > 0 ? list[0] : null))
      })
  }, [])

  // Fullscreen-Modus: wenn ?file= gesetzt, nur den Viewer ohne Sidebar/Header
  if (fileParam) {
    return (
      <main style={{ background: 'var(--bg-base)', height: '100vh', overflow: 'hidden' }}>
        {active ? (
          <EdfViewerDirect
            url={active.url}
            filename={active.filename}
            canvasHeight="calc(100vh - 130px)"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm"
            style={{ color: 'var(--text-tertiary)' }}>Lade…</div>
        )}
      </main>
    )
  }

  // Normal-Modus: Sidebar + Viewer
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          EEG-Viewer
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
          Reale EDF-Beispieldateien aus der Bibliothek
        </p>

        <div className="flex gap-4 items-start">
          {/* File list */}
          <div className="w-64 shrink-0 rounded-2xl border overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-tertiary)', background: 'var(--bg-subtle)' }}>
              Dateien ({files.length})
            </div>
            {files.length === 0 && (
              <div className="px-3 py-6 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
                Keine EDF-Dateien vorhanden
              </div>
            )}
            {files.map(f => (
              <button key={f.filename} onClick={() => setActive(f)}
                className="w-full text-left px-3 py-2.5 transition-colors"
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: active?.filename === f.filename ? 'var(--bg-subtle)' : 'transparent',
                  borderLeft: active?.filename === f.filename ? '3px solid var(--brand)' : '3px solid transparent',
                }}>
                <div className="text-[11px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {f.entityName ?? f.slug}
                </div>
                <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {f.slug} · {f.age} · #{f.num}
                </div>
              </button>
            ))}
          </div>

          {/* Viewer */}
          <div className="flex-1 min-w-0">
            {active ? (
              <EdfViewerDirect url={active.url} filename={active.filename} canvasHeight="calc(100vh - 220px)" />
            ) : (
              <div className="rounded-2xl border flex items-center justify-center h-64 text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)', background: 'var(--bg-surface)' }}>
                Datei auswählen
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
