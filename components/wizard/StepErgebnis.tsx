'use client'

import { useMemo, useState } from 'react'
import type { StepAnswer } from '@/hooks/useWizardState'
import { runMatching, type MatchResult } from '@/lib/wizardMatching'
import wellenData from '@/data/wellen.json'

// ─── IFCN Spike-Kriterien ─────────────────────────────────────────────────────

const IFCN_KRITERIEN = [
  {
    id: 'k1',
    titel: 'Dauer < 200 ms',
    beschreibung: 'Spike: < 80 ms · Sharp Wave: 80–200 ms',
    erklaerung: 'Längere Potentiale (> 200 ms) gelten als „slow sharp" oder Welle — nicht mehr als epileptiform im IFCN-Sinne.',
    tipp: 'Messung in der Bipolarmontage am deutlichsten sichtbaren Kanal, Beginn bis Rückkehr zur Baseline.',
  },
  {
    id: 'k2',
    titel: 'Negative Hauptkomponente',
    beschreibung: 'Hauptphase negativ (Ausschlag nach oben in Standarddarstellung)',
    erklaerung: 'Echte kortikale Spikes sind fast immer negativ dominant. Positive Spikes (nach unten) sind selten und meist benigne (14+6 Hz, POST) — oder Artefakte.',
    tipp: 'In Referenzmontage eindeutiger beurteilbar. Positive Hauptkomponente → stark an Artefakt oder benigne Variante denken.',
  },
  {
    id: 'k3',
    titel: 'Disruption des Hintergrunds',
    beschreibung: 'Der Spike unterbricht / überlagert den lokalen Hintergrundrhythmus',
    erklaerung: 'Ein echter epileptiformer Spike ist der Grundaktivität aufgesetzt und verändert sie kurz — er fällt aus dem Hintergrundrauschen heraus.',
    tipp: 'Vergleiche den Kanal vor und nach dem Potential. Echte Disruption = kurze „Stille" oder Formveränderung der Hintergrundwellen.',
  },
  {
    id: 'k4',
    titel: 'Nachfolgende Slow Wave',
    beschreibung: 'Dem Spike folgt eine langsame Nachkurve (200–500 ms)',
    erklaerung: 'Die Slow Wave entsteht durch postsynaptische Hemmung. Sie ist das wichtigste Unterscheidungsmerkmal zu Artefakten und benignen Varianten.',
    tipp: 'In der Referenzmontage deutlicher erkennbar. Fehlt die Slow Wave komplett, ist Spike-Diagnose unsicher.',
  },
  {
    id: 'k5',
    titel: 'Plausibles kortikales Feld',
    beschreibung: 'Ausbreitung über benachbarte Elektroden anatomisch plausibel',
    erklaerung: 'Ein kortikaler Dipol erfasst mehrere benachbarte Elektroden in charakteristischer Stärkeverteilung. In Bipolarmontage: Phasenumkehr. In Referenz: Amplitudenabnahme zur Seite.',
    tipp: 'Eine Elektrode dominant ohne Nachbarbeteiligung → stark an Elektrodenartefakt denken.',
  },
  {
    id: 'k6',
    titel: 'Reproduzierbarkeit',
    beschreibung: 'Mehrfaches Auftreten mit konstanter Morphologie und Topographie',
    erklaerung: 'Echte epileptiforme Potentiale wiederholen sich mit ähnlicher Form und Lokalisation. Ein Einzelereignis ohne Wiederholung ist nur eingeschränkt als Spike zu klassifizieren.',
    tipp: 'Mindestens 2–3 gleichartige Potentiale sollten erkennbar sein. Stark variierende Morphologie → eher Artefakt.',
  },
]

function ifcnInterpretation(score: number) {
  if (score >= 5) return { farbe: 'red',    titel: 'Epileptiformes Potential — hohe Spezifität',      sub: `Score ${score}/6: > 95 % Spezifität (IFCN 2017)` }
  if (score === 4) return { farbe: 'orange', titel: 'Wahrscheinlich epileptiformes Potential',          sub: `Score ${score}/6: Klinische Korrelation erforderlich` }
  if (score === 3) return { farbe: 'amber',  titel: 'Mögliches epileptiformes Potential',              sub: `Score ${score}/6: Grenzwertig — weitere Ableitung empfohlen` }
  return           { farbe: 'slate',  titel: 'Kein epileptiformes Potential',                  sub: `Score ${score}/6: Benigne Variante oder Artefakt wahrscheinlicher` }
}

const FARBEN: Record<string, { border: string; bg: string; text: string }> = {
  red:    { border: 'border-red-300',    bg: 'bg-red-50',    text: 'text-red-800' },
  orange: { border: 'border-orange-300', bg: 'bg-orange-50', text: 'text-orange-800' },
  amber:  { border: 'border-amber-300',  bg: 'bg-amber-50',  text: 'text-amber-800' },
  slate:  { border: 'border-slate-300',  bg: 'bg-slate-50',  text: 'text-slate-700' },
}

function KriteriumKarte({
  k, nummer, wert, onWert,
}: {
  k: typeof IFCN_KRITERIEN[0]
  nummer: number
  wert: boolean | null | undefined
  onWert: (v: boolean | null | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const checked = wert === true
  const nein = wert === false
  const nb = wert === null

  return (
    <div className={`rounded-xl border transition-all ${
      checked ? 'border-emerald-300 bg-emerald-50' :
      nein    ? 'border-red-200 bg-red-50 opacity-75' :
      nb      ? 'border-slate-200 bg-slate-50' :
                'border-slate-200 bg-white'
    }`}>
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
            checked ? 'bg-emerald-500 text-white' :
            nein    ? 'bg-red-200 text-red-600' :
                      'bg-slate-100 text-slate-500'
          }`}>
            {checked ? '✓' : nein ? '✗' : nummer}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm font-semibold ${checked ? 'text-emerald-800' : nein ? 'text-red-700' : 'text-slate-800'}`}>
                {k.titel}
              </p>
              <button onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{k.beschreibung}</p>
          </div>
        </div>
        {open && (
          <div className="mt-3 ml-10 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-2">
            <p>{k.erklaerung}</p>
            <p className="rounded bg-blue-50 border border-blue-100 px-2 py-1.5 text-blue-700">
              💡 <strong>Tipp:</strong> {k.tipp}
            </p>
          </div>
        )}
        <div className="flex gap-2 mt-3 ml-10">
          <button onClick={() => onWert(wert === true ? undefined : true)}
            className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-all ${
              checked ? 'border-emerald-400 bg-emerald-100 text-emerald-700'
                      : 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600'
            }`}>✓ Ja</button>
          <button onClick={() => onWert(wert === false ? undefined : false)}
            className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-all ${
              nein ? 'border-red-400 bg-red-100 text-red-700'
                   : 'border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
            }`}>✗ Nein</button>
          <button onClick={() => onWert(wert === null ? undefined : null)}
            className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-all ${
              nb ? 'border-slate-400 bg-slate-200 text-slate-700'
                 : 'border-slate-200 text-slate-400 hover:border-slate-300'
            }`}>? n.b.</button>
        </div>
      </div>
    </div>
  )
}

// ─── Spike Check Panel ────────────────────────────────────────────────────────

function SpikeCheckPanel() {
  const [open, setOpen] = useState(true)
  const [kriterien, setKriterien] = useState<Record<string, boolean | null | undefined>>({})

  const score = Object.values(kriterien).filter(v => v === true).length
  const bewertet = Object.values(kriterien).filter(v => v !== undefined).length
  const interp = ifcnInterpretation(score)
  const f = FARBEN[interp.farbe]

  function setK(id: string, v: boolean | null | undefined) {
    setKriterien(prev => {
      const next = { ...prev }
      if (v === undefined) delete next[id]
      else next[id] = v
      return next
    })
  }

  return (
    <div className="rounded-xl border-2 border-violet-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-violet-50 hover:bg-violet-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
          <span className="text-sm font-bold text-violet-900">IFCN Spike-Charakterisierung</span>
          <span className="rounded-full bg-violet-200 px-2 py-0.5 text-xs font-semibold text-violet-700">
            {score}/6
          </span>
        </div>
        <svg className={`w-4 h-4 text-violet-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="p-4 space-y-4 bg-white">
          {/* Intro */}
          <div className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-xs text-violet-700 space-y-0.5">
            <p className="font-semibold text-violet-900">Noachtar et al. 2004 / IFCN 2017 — 6 Kriterien</p>
            <p>Score ≥ 4/6 = klinisch relevant · Score ≥ 5/6 = &gt; 95 % Spezifität</p>
          </div>

          {/* Score */}
          <div className={`rounded-xl border-2 ${f.border} ${f.bg} px-4 py-3 flex items-center justify-between`}>
            <div>
              <p className={`text-sm font-bold ${f.text}`}>{interp.titel}</p>
              <p className={`text-xs mt-0.5 ${f.text} opacity-80`}>{interp.sub}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <div className={`text-3xl font-black ${f.text}`}>{score}<span className="text-lg font-normal">/6</span></div>
              <div className="text-xs text-slate-400">{bewertet} bewertet</div>
            </div>
          </div>

          {/* Kriterien */}
          <div className="space-y-2">
            {IFCN_KRITERIEN.map((k, i) => (
              <KriteriumKarte
                key={k.id}
                k={k}
                nummer={i + 1}
                wert={kriterien[k.id]}
                onWert={v => setK(k.id, v)}
              />
            ))}
          </div>

          {/* Empfohlene Entitäten */}
          {score >= 4 && (
            <div className={`rounded-xl border ${f.border} ${f.bg} px-4 py-3 space-y-2`}>
              <p className={`text-xs font-semibold ${f.text}`}>Empfohlene Entitäten:</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'EEG_0042', label: 'Spike' },
                  { id: 'EEG_0043', label: 'Sharp Wave' },
                  { id: 'EEG_0045', label: 'Spike-Wave-Komplex' },
                ].map(e => (
                  <a key={e.id} href={`/entity/${e.id}`}
                    className={`rounded-lg border ${f.border} px-3 py-1.5 text-xs font-medium ${f.text} hover:opacity-80 transition-opacity`}>
                    → {e.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Spike-Mimic IDs ──────────────────────────────────────────────────────────

const SPIKE_MIMIC_IDS = new Set(['EEG_0030', 'EEG_0031', 'EEG_0032', 'EEG_0036', 'EEG_0084'])

// ─── Confidence Badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ c }: { c: MatchResult['confidence'] }) {
  const cfg = {
    hoch:     { label: 'Hohe Übereinstimmung',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    gut:      { label: 'Gute Übereinstimmung',     cls: 'bg-blue-100 text-blue-700 border-blue-300' },
    moeglich: { label: 'Mögliche Übereinstimmung', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
    gering:   { label: 'Geringe Übereinstimmung',  cls: 'bg-slate-100 text-slate-500 border-slate-300' },
  }[c]
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ─── Klassifikations-Badge ────────────────────────────────────────────────────

function KlassifikationBadge({ k }: { k: string }) {
  const cfg: Record<string, string> = {
    physiologisch:                    'bg-green-100 text-green-700',
    benigne_variante:                 'bg-teal-100 text-teal-700',
    kontextabhaengig:                 'bg-yellow-100 text-yellow-700',
    pathologisch_nicht_epileptiform:  'bg-orange-100 text-orange-700',
    epileptiform:                     'bg-red-100 text-red-700',
  }
  const labels: Record<string, string> = {
    physiologisch:                    'Physiologisch',
    benigne_variante:                 'Benigne Variante',
    kontextabhaengig:                 'Kontextabhängig',
    pathologisch_nicht_epileptiform:  'Pathologisch (nicht-epileptiform)',
    epileptiform:                     'Epileptiform',
  }
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${cfg[k] ?? 'bg-slate-100 text-slate-600'}`}>
      {labels[k] ?? k}
    </span>
  )
}

// ─── Score-Balken ─────────────────────────────────────────────────────────────

function ScoreBar({ pct, confidence }: { pct: number; confidence: MatchResult['confidence'] }) {
  const color =
    confidence === 'hoch'     ? 'bg-emerald-500' :
    confidence === 'gut'      ? 'bg-blue-500' :
    confidence === 'moeglich' ? 'bg-amber-400' : 'bg-slate-300'
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Primärtreffer-Karte ──────────────────────────────────────────────────────

function PrimaerKarte({ result }: { result: MatchResult }) {
  const e = result.entity
  return (
    <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-blue-400">{e.id}</span>
            <ConfidenceBadge c={result.confidence} />
          </div>
          <h3 className="text-base font-bold text-slate-900">{e.name}</h3>
          {e.aliases?.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">{e.aliases.slice(0, 3).join(' · ')}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-blue-700">{result.score.pct}%</div>
          <div className="text-xs text-slate-400">Übereinstimmung</div>
        </div>
      </div>

      <ScoreBar pct={result.score.pct} confidence={result.confidence} />

      <div className="flex flex-wrap gap-2">
        {e.classification && <KlassifikationBadge k={e.classification} />}
        {e.main_category && (
          <span className="rounded px-2 py-0.5 text-xs bg-slate-100 text-slate-600">{e.main_category}</span>
        )}
        {e.localization?.slice(0, 3).map((loc: string) => (
          <span key={loc} className="rounded px-2 py-0.5 text-xs bg-white border border-slate-200 text-slate-500">{loc}</span>
        ))}
      </div>

      {e.teaching_pearl && (
        <p className="text-xs text-blue-700 border-t border-blue-200 pt-2 italic">
          💡 {e.teaching_pearl}
        </p>
      )}

      <a
        href={`/entity/${e.id}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Detailseite öffnen
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </a>
    </div>
  )
}

// ─── DD-Karte (kompakt) ───────────────────────────────────────────────────────

function DDKarte({ result }: { result: MatchResult }) {
  const e = result.entity
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-slate-400 flex-shrink-0">{e.id}</span>
          <span className="text-sm font-semibold text-slate-800 truncate">{e.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium text-slate-500">{result.score.pct}%</span>
          <ConfidenceBadge c={result.confidence} />
        </div>
      </div>
      <ScoreBar pct={result.score.pct} confidence={result.confidence} />
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1.5 flex-wrap">
          {e.classification && <KlassifikationBadge k={e.classification} />}
        </div>
        <a
          href={`/entity/${e.id}`}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          → Öffnen
        </a>
      </div>
    </div>
  )
}

// ─── Score-Aufschlüsselung ────────────────────────────────────────────────────

function ScoreDetails({ result }: { result: MatchResult }) {
  const s = result.score
  const dims = [
    { label: 'Verteilung',   pts: s.verteilung,   max: 4 },
    { label: 'Lokalisation', pts: s.lokalisation, max: 6 },
    { label: 'Frequenz',     pts: s.frequenz,     max: 4 },
    { label: 'Dauer',        pts: s.dauer,        max: 4 },
    { label: 'Polarität',    pts: s.polaritaet,   max: 3 },
    { label: 'Amplitude',    pts: s.amplitude,    max: 2 },
    { label: 'Auftreten',    pts: s.auftreten,    max: 4 },
  ]
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Score-Aufschlüsselung — {result.entity.name}</p>
      {dims.map(d => (
        <div key={d.label} className="flex items-center gap-2 text-xs">
          <span className="w-24 text-slate-500 flex-shrink-0">{d.label}</span>
          <div className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full ${d.pts > 0 ? 'bg-blue-400' : d.pts < 0 ? 'bg-red-300' : 'bg-slate-200'}`}
              style={{ width: `${Math.max(0, d.pts) / d.max * 100}%` }}
            />
          </div>
          <span className={`w-12 text-right font-mono ${d.pts > 0 ? 'text-blue-600' : d.pts < 0 ? 'text-red-500' : 'text-slate-400'}`}>
            {d.pts > 0 ? `+${d.pts}` : d.pts} / {d.max}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Kein Treffer ─────────────────────────────────────────────────────────────

function KeinTreffer() {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center space-y-2">
      <div className="text-3xl">🔍</div>
      <p className="text-sm font-semibold text-slate-700">Kein ausreichender Treffer gefunden</p>
      <p className="text-xs text-slate-500">
        Die Kombination der Merkmale ergibt keinen Match in der aktuellen Datenbank.
        Mögliche Ursachen: seltenes Phänomen, unvollständige Angaben, oder Entität noch nicht in der DB.
      </p>
      <a href="/" className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800">
        → Atlas durchsuchen
      </a>
    </div>
  )
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

interface Props {
  value: StepAnswer
  onChange: (v: StepAnswer) => void
  technikAnswer?: string
  patientAnswer?: string
  phaenomenAnswer?: string
  frequenzAnswer?: string
  lokalisationAnswer?: string
  morphologieAnswer?: string
}

export default function StepErgebnis({
  technikAnswer,
  patientAnswer,
  phaenomenAnswer,
  frequenzAnswer,
  lokalisationAnswer,
  morphologieAnswer,
}: Props) {
  const entities = (wellenData as { entities: unknown[] }).entities

  const results = useMemo(() =>
    runMatching(
      entities,
      technikAnswer,
      patientAnswer,
      phaenomenAnswer,
      frequenzAnswer,
      lokalisationAnswer,
      morphologieAnswer,
    ),
    [entities, technikAnswer, patientAnswer, phaenomenAnswer, frequenzAnswer, lokalisationAnswer, morphologieAnswer]
  )

  const primary = results[0]
  const dd = results.slice(1, 5)
  const top5 = results.slice(0, 5)

  // Spike-Check Trigger
  const dauer = (() => { try { return JSON.parse(morphologieAnswer ?? '{}').dauer ?? '' } catch { return '' } })()
  const pol   = (() => { try { return JSON.parse(morphologieAnswer ?? '{}').polaritaet ?? '' } catch { return '' } })()
  const spikeCandidate = (dauer === 'spike' || dauer === 'sharp') && (pol === 'negativ' || pol === 'biphasisch_np')
  const hasEpileptiform = top5.some(r => r.entity.classification === 'epileptiform')
  const hasSpikeMimic = top5.some(r => SPIKE_MIMIC_IDS.has(r.entity.id))
  const showSpikeCheck = spikeCandidate || hasEpileptiform || hasSpikeMimic

  return (
    <div className="space-y-6">

      {/* Primärtreffer */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bester Treffer</h3>
        {primary ? <PrimaerKarte result={primary} /> : <KeinTreffer />}
      </div>

      {/* Score-Aufschlüsselung */}
      {primary && <ScoreDetails result={primary} />}

      {/* DD-Liste */}
      {dd.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Differentialdiagnosen ({dd.length})
          </h3>
          {dd.map(r => <DDKarte key={r.entity.id} result={r} />)}
        </div>
      )}

      {/* IFCN Spike-Charakterisierung */}
      {showSpikeCheck && <SpikeCheckPanel />}

      {/* Neue Klassifikation starten */}
      <div className="border-t border-slate-100 pt-4 text-center">
        <p className="text-xs text-slate-400 mb-2">Anderes Phänomen klassifizieren?</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Wizard neu starten
        </button>
      </div>
    </div>
  )
}
