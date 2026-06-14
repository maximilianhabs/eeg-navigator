'use client'

import { useState } from 'react'
import type { StepAnswer } from '@/hooks/useWizardState'

// ─── Typen ────────────────────────────────────────────────────────────────────

export interface SpikeAnswer {
  kriterien: Record<string, boolean | null>  // null = nicht beurteilbar
  score: number
  entscheidung: 'spike' | 'sharp_wave' | 'kein_spike' | 'unklar' | ''
}

const DEFAULT: SpikeAnswer = { kriterien: {}, score: 0, entscheidung: '' }

function parse(v: StepAnswer): SpikeAnswer {
  try { if (typeof v === 'string' && v.startsWith('{')) return JSON.parse(v) } catch {}
  return DEFAULT
}

// ─── IFCN Kriterien (Noachtar et al. 2004 / IFCN 2017) ───────────────────────

interface Kriterium {
  id: string
  titel: string
  beschreibung: string
  erklaerung: string
  tipp: string
}

const IFCN_KRITERIEN: Kriterium[] = [
  {
    id: 'k1',
    titel: 'Dauer < 200 ms',
    beschreibung: 'Das Potential ist kürzer als 200 ms (Spike: < 80 ms, Sharp Wave: 80–200 ms)',
    erklaerung: 'Längere Potentiale (> 200 ms) gelten als "slow sharp" oder Welle — nicht mehr als epileptiform im IFCN-Sinne.',
    tipp: 'Messung in der Bipolarmontage am deutlichsten sichtbaren Kanal, Beginn bis Rückkehr zur Baseline.',
  },
  {
    id: 'k2',
    titel: 'Negative Hauptkomponente',
    beschreibung: 'Die Hauptphase ist negativ (Ausschlag nach oben in Standarddarstellung)',
    erklaerung: 'Echte kortikale Spikes sind fast immer negativ dominant. Positive Spikes (Ausschlag nach unten) sind selten und meist benigne (14+6 Hz, POST) — oder Artefakte.',
    tipp: 'In Referenzmontage eindeutiger beurteilbar. Positive Hauptkomponente → stark an Artefakt oder benigne Variante denken.',
  },
  {
    id: 'k3',
    titel: 'Diskruption des Hintergrunds',
    beschreibung: 'Der Spike unterbricht / überlagert den lokalen Hintergrundrhythmus',
    erklaerung: 'Ein echter epileptiformer Spike ist der Grundaktivität aufgesetzt und verändert sie kurz — er fällt aus dem Hintergrundrauschen heraus. Rauschen und EMG fallen nicht heraus.',
    tipp: 'Vergleiche den Kanal vor und nach dem Potential. Echte Disruption = kurze "Stille" oder Formveränderung der Hintergrundwellen.',
  },
  {
    id: 'k4',
    titel: 'Nachfolgende Slow Wave',
    beschreibung: 'Dem Spike folgt eine langsame Nachkurve (200–500 ms)',
    erklaerung: 'Die Slow Wave nach dem Spike entsteht durch postsynaptische Hemmung. Sie ist das wichtigste Unterscheidungsmerkmal zu Artefakten und zur normalen scharfen Variante.',
    tipp: 'In der Referenzmontage deutlicher erkennbar. Fehlt die Slow Wave komplett, ist Spike-Diagnose unsicher.',
  },
  {
    id: 'k5',
    titel: 'Plausibles kortikales Feld',
    beschreibung: 'Die Ausbreitung über benachbarte Elektroden ist anatomisch plausibel',
    erklaerung: 'Ein kortikaler Dipol erfasst mehrere benachbarte Elektroden in charakteristischer Stärkeverteilung. In Bipolarmontage: Phasenumkehr. In Referenz: Amplitudenabnahme zur Seite.',
    tipp: 'Unplausibles Feld = eine Elektrode dominant ohne Nachbarbeteiligung → stark an Elektrodenartefakt denken.',
  },
  {
    id: 'k6',
    titel: 'Reproduzierbarkeit',
    beschreibung: 'Das Potential tritt mehrfach mit konstanter Morphologie und Topographie auf',
    erklaerung: 'Echte epileptiforme Potentiale wiederholen sich mit ähnlicher Form und Lokalisation. Ein Einzelereignis ohne Wiederholung ist nur eingeschränkt als Spike zu klassifizieren.',
    tipp: 'Mindestens 2–3 gleichartige Potentiale sollten erkennbar sein. Variiert Morphologie stark → eher Artefakt.',
  },
]

// ─── Ergebnis-Interpretation ──────────────────────────────────────────────────

function getInterpretation(score: number): {
  farbe: string
  titel: string
  text: string
  entityHint: string
} {
  if (score >= 5) return {
    farbe: 'red',
    titel: 'Epileptiformes Potential — hohe Spezifität',
    text: `Score ${score}/6: ≥ 5 Kriterien erfüllt entspricht > 95 % Spezifität für epileptiforme Aktivität (IFCN 2017).`,
    entityHint: 'EEG_0042',
  }
  if (score === 4) return {
    farbe: 'orange',
    titel: 'Wahrscheinlich epileptiformes Potential',
    text: `Score ${score}/6: Klinisch relevante Übereinstimmung. Interpretation im klinischen Kontext erforderlich.`,
    entityHint: 'EEG_0042',
  }
  if (score === 3) return {
    farbe: 'amber',
    titel: 'Mögliches epileptiformes Potential',
    text: `Score ${score}/6: Grenzwertig. Weitere Ableitung, alternative Montage oder klinische Korrelation empfohlen.`,
    entityHint: 'EEG_0043',
  }
  return {
    farbe: 'slate',
    titel: 'Kein epileptiformes Potential',
    text: `Score ${score}/6: Kriterien nicht ausreichend erfüllt. Benigne scharfe Variante oder Artefakt wahrscheinlicher.`,
    entityHint: '',
  }
}

const FARBEN: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  red:    { border: 'border-red-300',    bg: 'bg-red-50',    text: 'text-red-800',    badge: 'bg-red-100 text-red-700' },
  orange: { border: 'border-orange-300', bg: 'bg-orange-50', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700' },
  amber:  { border: 'border-amber-300',  bg: 'bg-amber-50',  text: 'text-amber-800',  badge: 'bg-amber-100 text-amber-700' },
  slate:  { border: 'border-slate-300',  bg: 'bg-slate-50',  text: 'text-slate-700',  badge: 'bg-slate-100 text-slate-600' },
}

// ─── Kriterium-Karte ──────────────────────────────────────────────────────────

function KriteriumKarte({
  kriterium,
  wert,
  onWert,
  nummer,
}: {
  kriterium: Kriterium
  wert: boolean | null | undefined
  onWert: (v: boolean | null) => void
  nummer: number
}) {
  const [open, setOpen] = useState(false)
  const checked = wert === true
  const nein    = wert === false
  const nb      = wert === null

  return (
    <div className={`rounded-xl border transition-all ${
      checked ? 'border-emerald-300 bg-emerald-50' :
      nein    ? 'border-red-200 bg-red-50 opacity-75' :
      nb      ? 'border-slate-200 bg-slate-50' :
                'border-slate-200 bg-white'
    }`}>
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Nummer / Check-Kreis */}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
            checked ? 'bg-emerald-500 text-white' :
            nein    ? 'bg-red-200 text-red-600' :
                      'bg-slate-100 text-slate-500'
          }`}>
            {checked ? '✓' : nein ? '✗' : nummer}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm font-semibold ${
                checked ? 'text-emerald-800' : nein ? 'text-red-700' : 'text-slate-800'
              }`}>
                {kriterium.titel}
              </p>
              <button
                onClick={() => setOpen(o => !o)}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{kriterium.beschreibung}</p>
          </div>
        </div>

        {/* Aufgeklappte Erklärung */}
        {open && (
          <div className="mt-3 ml-10 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-2">
            <p>{kriterium.erklaerung}</p>
            <p className="rounded bg-blue-50 border border-blue-100 px-2 py-1.5 text-blue-700">
              💡 <strong>Tipp:</strong> {kriterium.tipp}
            </p>
          </div>
        )}

        {/* Bewertungs-Buttons */}
        <div className="flex gap-2 mt-3 ml-10">
          <button
            onClick={() => onWert(wert === true ? undefined as unknown as null : true)}
            className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-all ${
              checked
                ? 'border-emerald-400 bg-emerald-100 text-emerald-700'
                : 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600'
            }`}
          >
            ✓ Ja — erfüllt
          </button>
          <button
            onClick={() => onWert(wert === false ? undefined as unknown as null : false)}
            className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-all ${
              nein
                ? 'border-red-400 bg-red-100 text-red-700'
                : 'border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            ✗ Nein
          </button>
          <button
            onClick={() => onWert(wert === null ? undefined as unknown as null : null)}
            className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-all ${
              nb
                ? 'border-slate-400 bg-slate-200 text-slate-700'
                : 'border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            ? n.b.
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

interface Props {
  value: StepAnswer
  onChange: (v: StepAnswer) => void
  morphologieAnswer?: string
  artefakteAnswer?: string
}

function isSpikeCandidate(morphologieRaw?: string): boolean {
  try {
    const m = JSON.parse(morphologieRaw ?? '{}')
    const dauer = m.dauer ?? ''
    const pol   = m.polaritaet ?? ''
    return (dauer === 'spike' || dauer === 'sharp') &&
           (pol === 'negativ' || pol === 'biphasisch_np' || pol === 'negativ_dominant')
  } catch { return false }
}

export default function StepSpike({ value, onChange, morphologieAnswer, artefakteAnswer }: Props) {
  const [answer, setAnswer] = useState<SpikeAnswer>(parse(value))
  const isCandidate = isSpikeCandidate(morphologieAnswer)

  function setKriterium(id: string, v: boolean | null | undefined) {
    const next: Record<string, boolean | null> = { ...answer.kriterien }
    if (v === undefined) {
      delete next[id]
    } else {
      next[id] = v
    }
    const score = Object.values(next).filter(x => x === true).length
    const updated: SpikeAnswer = { ...answer, kriterien: next, score }
    setAnswer(updated)
    onChange(JSON.stringify(updated))
  }

  if (!isCandidate) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center space-y-2">
        <div className="text-3xl">⏭</div>
        <p className="text-sm font-medium text-slate-700">Spike-Check nicht zutreffend</p>
        <p className="text-xs text-slate-500">
          Die IFCN-Spike-Kriterien sind nur bei kurzen negativen Potentialen relevant (Dauer &lt; 250 ms, negative Hauptkomponente).
          Weiter zum Ergebnis.
        </p>
      </div>
    )
  }

  const score = answer.score
  const bewertet = Object.keys(answer.kriterien).length
  const interp = getInterpretation(score)
  const f = FARBEN[interp.farbe]

  return (
    <div className="space-y-5">

      {/* IFCN-Intro */}
      <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs text-violet-700 space-y-1">
        <p className="font-semibold text-sm text-violet-900">IFCN Spike-Kriterien (Noachtar et al. 2004 / IFCN 2017)</p>
        <p>6 Kriterien für die Klassifikation als epileptiformes Potential. Bewertet jedes Kriterium mit Ja / Nein / nicht beurteilbar.</p>
        <p className="pt-0.5">
          <span className="font-medium">Score ≥ 4/6</span> = klinisch relevant ·
          <span className="font-medium ml-2">Score ≥ 5/6</span> = &gt;95 % Spezifität
        </p>
      </div>

      {/* Score-Anzeige */}
      <div className={`rounded-xl border-2 ${f.border} ${f.bg} px-4 py-3 flex items-center justify-between`}>
        <div>
          <p className={`text-sm font-bold ${f.text}`}>{interp.titel}</p>
          <p className={`text-xs mt-0.5 ${f.text} opacity-80`}>{interp.text}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <div className={`text-3xl font-black ${f.text}`}>{score}<span className="text-lg font-normal">/6</span></div>
          <div className="text-xs text-slate-400">{bewertet} bewertet</div>
        </div>
      </div>

      {/* Kriterien-Karten */}
      <div className="space-y-2">
        {IFCN_KRITERIEN.map((k, i) => (
          <KriteriumKarte
            key={k.id}
            kriterium={k}
            nummer={i + 1}
            wert={answer.kriterien[k.id]}
            onWert={v => setKriterium(k.id, v)}
          />
        ))}
      </div>

      {/* Ergebnis-Links */}
      {score >= 4 && (
        <div className={`rounded-xl border ${f.border} ${f.bg} px-4 py-3 space-y-2`}>
          <p className={`text-xs font-semibold ${f.text}`}>Empfohlene Entitäten:</p>
          <div className="flex gap-2 flex-wrap">
            <a href="/entity/EEG_0042" className={`rounded-lg border ${f.border} px-3 py-1.5 text-xs font-medium ${f.text} hover:opacity-80 transition-opacity`}>
              → EEG_0042 Spike
            </a>
            <a href="/entity/EEG_0043" className={`rounded-lg border ${f.border} px-3 py-1.5 text-xs font-medium ${f.text} hover:opacity-80 transition-opacity`}>
              → EEG_0043 Sharp Wave
            </a>
            <a href="/entity/EEG_0045" className={`rounded-lg border ${f.border} px-3 py-1.5 text-xs font-medium ${f.text} hover:opacity-80 transition-opacity`}>
              → EEG_0045 Spike-Wave-Komplex
            </a>
          </div>
        </div>
      )}

    </div>
  )
}
