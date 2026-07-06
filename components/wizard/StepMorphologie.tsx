'use client'

import { useState } from 'react'
import type { StepAnswer } from '@/hooks/useWizardState'

export interface MorphologieAnswer {
  polaritaet: string   // 'negativ' | 'positiv' | 'biphasisch_np' | 'biphasisch_pn' | 'triphasisch' | 'alternierend' | 'nb'
  amplitude: string    // 'sehr_klein' | 'klein' | 'mittel' | 'gross' | 'sehr_gross' | 'nb'
  dauer: string        // 'spike' | 'sharp' | 'komplex' | 'burst' | 'kontinuierlich' | 'nb'
}

const DEFAULT: MorphologieAnswer = { polaritaet: '', amplitude: '', dauer: '' }

function parse(v: StepAnswer): MorphologieAnswer {
  try { if (typeof v === 'string' && v.startsWith('{')) return JSON.parse(v) } catch {}
  return DEFAULT
}

const POLARITAET = [
  {
    value: 'negativ',
    label: 'Negativ dominant',
    description: 'Ausschlag nach oben in der Standarddarstellung',
    beispiel: 'Spike, Sharp Wave, Alpha (Referenz)',
  },
  {
    value: 'positiv',
    label: 'Positiv dominant',
    description: 'Ausschlag nach unten in der Standarddarstellung',
    beispiel: '14+6 Hz pos. Spikes, POST (okzipital), RMTD',
  },
  {
    value: 'biphasisch_np',
    label: 'Biphasisch neg→pos',
    description: 'Negative Hauptkomponente, dann positive Nachkurve',
    beispiel: 'Typischer Spike-Wave-Komplex',
  },
  {
    value: 'biphasisch_pn',
    label: 'Biphasisch pos→neg',
    description: 'Positive Hauptkomponente, dann negative Nachkurve',
    beispiel: 'Triphasische Wellen (oft pos→neg→pos)',
  },
  {
    value: 'triphasisch',
    label: 'Triphasisch',
    description: 'Drei Phasen: neg–pos–neg oder pos–neg–pos',
    beispiel: 'Triphasische Wellen bei metabolischer Enzephalopathie',
  },
  {
    value: 'alternierend',
    label: 'Alternierend / variabel',
    description: 'Wechselnde Polarität, kein konstantes Muster',
    beispiel: 'Chaotische Aktivität, Hypsarrhythmie',
  },
]

const AMPLITUDE_STUFEN = [
  { value: 'sehr_klein', label: 'Sehr klein', range: '< 20 µV',   beispiel: 'Low-voltage EEG, Beta-Aktivität' },
  { value: 'klein',      label: 'Klein',       range: '20–50 µV',  beispiel: 'Alpha-Grundrhythmus (entspannt)' },
  { value: 'mittel',     label: 'Mittel',       range: '50–150 µV', beispiel: 'Theta, normale Schlafspindeln' },
  { value: 'gross',      label: 'Groß',         range: '150–300 µV',beispiel: 'K-Komplex, Delta-Wellen N3, Spike' },
  { value: 'sehr_gross', label: 'Sehr groß',    range: '> 300 µV',  beispiel: 'Hochamplitudige Spikes, SWA N3, Hyps.' },
]

const DAUER_STUFEN = [
  {
    value: 'spike',
    label: 'Sehr kurz — Spike',
    range: '< 80 ms',
    description: 'Scharf begrenzt, steiler Anstieg und Abfall',
    hinweis: null,
  },
  {
    value: 'sharp',
    label: 'Kurz — Sharp Wave',
    range: '80–250 ms',
    description: 'Scharf, aber breiter als ein Spike',
    hinweis: null,
  },
  {
    value: 'komplex',
    label: 'Mittel — Komplex / Welle',
    range: '250 ms – 2 s',
    description: 'Einzelne Welle, K-Komplex, Spike-Wave-Einzel',
    hinweis: null,
  },
  {
    value: 'burst',
    label: 'Lang — Burst / Episode',
    range: '2–30 s',
    description: 'Gruppe gleichartiger Potentiale, Schlafspindeln',
    hinweis: null,
  },
  {
    value: 'kontinuierlich',
    label: 'Sehr lang / kontinuierlich',
    range: '> 30 s',
    description: 'Anhaltend, Hintergrundmuster, Status-Muster',
    hinweis: 'Bei > 5 min kontinuierlicher epileptiformer Aktivität → Status epilepticus erwägen',
  },
]

// ─── Polaritäts-Erklärungsbox ─────────────────────────────────────────────────

function PolaritaetsHilfe({ montage }: { montage: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
      <button
        className="w-full flex items-center justify-between px-3 py-2 font-medium"
        onClick={() => setOpen(o => !o)}
      >
        <span>💡 Was bedeutet "positiv" und "negativ" im EEG?</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-amber-200 pt-2">
          <p><strong>Konvention:</strong> Negative Potentiale werden <strong>nach oben</strong> abgebildet, positive <strong>nach unten</strong>.</p>
          <p><strong>Referenzmontage:</strong> Ein negativer Ausschlag bedeutet, dass die abgeleitete Elektrode negativer ist als die Referenz. Ein positiver Ausschlag = Elektrode ist positiver als Referenz.</p>
          <p><strong>Bipolare Montage:</strong> Die Polarität zeigt den Unterschied zwischen zwei benachbarten Elektroden — <em>nicht</em> die absolute Polarität der Quelle.</p>
          {montage === 'bipolar_laengs' && (
            <p className="rounded bg-amber-100 px-2 py-1">
              <strong>Beispiel POST (Bipolare Längsreihe):</strong> Die okzipitalen Elektroden sind positiv → die Kurve zeigt nach <em>unten</em> bei O1/O2. Das sieht aus wie ein nach-oben-Ausschlag im P7/8–O1/O2-Kanal — weil die okzipitale Elektrode positiver ist als die parietale, nicht weil das Kortexpotential negativ ist.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Live-Wellen-Simulator ────────────────────────────────────────────────────
// Zeichnet aus Polarität/Amplitude/Dauer eine schematische mehrkanalige Welle.
// Konvention: negativ = nach OBEN. Phasenumkehr zwischen den mittleren Kanälen.
const AMP_FACTOR: Record<string, number> = {
  sehr_klein: 0.25, klein: 0.45, mittel: 0.7, gross: 0.95, sehr_gross: 1.2, nb: 0.6, '': 0.6,
}
const DUR_SHAPE: Record<string, { width: number; repeats: number }> = {
  spike:          { width: 0.10, repeats: 1 },
  sharp:          { width: 0.20, repeats: 1 },
  komplex:        { width: 0.44, repeats: 1 },
  burst:          { width: 0.92, repeats: 3 },
  kontinuierlich: { width: 1.0,  repeats: 6 },
}
// Schärfe je Dauer: kurz = spitze Welle, lang = runde Welle
const DUR_SHARP: Record<string, number> = {
  spike: 0.95, sharp: 0.6, komplex: 0.25, burst: 0.1, kontinuierlich: 0, '': 0.3,
}
// Dreieck-Version einer Sinuswelle → scharfe Spitze statt runder Kuppe
const triangleOf = (x: number) => (2 / Math.PI) * Math.asin(Math.sin(x))
// Deflektionswert (+ = oben = "negativ") einer Einzelwelle über u∈[0,1].
// sharp∈[0,1]: 0 = runde Sinuskuppe, 1 = spitze Dreieckspitze.
function shapeValue(pol: string, u: number, sharp: number): number {
  let arg: number, mult: number
  switch (pol) {
    case 'positiv':        arg = Math.PI * u;     mult = -1; break
    case 'biphasisch_np':  arg = 2 * Math.PI * u; mult =  1; break
    case 'biphasisch_pn':  arg = 2 * Math.PI * u; mult = -1; break
    case 'triphasisch':    arg = 3 * Math.PI * u; mult =  1; break
    case 'alternierend':   arg = 2 * Math.PI * u; mult =  1; break
    default:               arg = Math.PI * u;     mult =  1  // negativ
  }
  return mult * ((1 - sharp) * Math.sin(arg) + sharp * triangleOf(arg))
}
function WaveSimulator({ polaritaet, amplitude, dauer, montage }: { polaritaet: string; amplitude: string; dauer: string; montage: string }) {
  const W = 300, rowH = 26, rows = 4, padTop = 14
  const H = padTop * 2 + rowH * rows
  const CH_LABELS = ['F', 'C', 'P', 'O']
  // Montageabhängige Feldverteilung:
  //  • Referenz: alle Kanäle gleichsinnig, größte Amplitude am Maximum (C), KEINE Umkehr.
  //  • Bipolar: Phasenumkehr — bei Negativität zeigen die Spitzen am Maximum (C/P) AUFEINANDER
  //    (oberhalb nach unten, unterhalb nach oben → Feld [−,−,+,+]).
  const isReferential = montage.startsWith('referenz')
  const CH_FIELD = isReferential ? [0.45, 1.0, 0.75, 0.4] : [-0.6, -1.0, 1.0, 0.6]
  const amp = AMP_FACTOR[amplitude] ?? 0.6
  const dur = DUR_SHAPE[dauer] ?? { width: 0.44, repeats: 1 }
  const sharp = DUR_SHARP[dauer] ?? 0.3
  const x0 = 0.5 - dur.width / 2, x1 = 0.5 + dur.width / 2
  const hasSel = polaritaet || amplitude || dauer
  const N = 200

  function tracePath(ch: number): string {
    const baseY = padTop + rowH * ch + rowH / 2
    const maxDefl = rowH * 0.42
    const pts: string[] = []
    for (let i = 0; i <= N; i++) {
      const t = i / N
      let v = 0
      if (t >= x0 && t <= x1) {
        const local = (t - x0) / (x1 - x0)
        const wv = local * dur.repeats
        v = shapeValue(polaritaet || 'negativ', wv - Math.floor(wv), sharp)
      }
      const y = baseY - v * amp * CH_FIELD[ch] * maxDefl
      pts.push(`${(t * W).toFixed(1)},${y.toFixed(1)}`)
    }
    return 'M ' + pts.join(' L ')
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live-Vorschau</p>
        <span className="text-[10px] text-slate-400">
          {isReferential ? 'Referenz · negativ = oben' : 'Bipolar · Phasenumkehr'}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" xmlns="http://www.w3.org/2000/svg">
        {Array.from({ length: rows }).map((_, ch) => {
          const baseY = padTop + rowH * ch + rowH / 2
          return (
            <g key={ch}>
              <line x1={22} y1={baseY} x2={W} y2={baseY} stroke="#e2e8f0" strokeWidth="1" />
              <text x={4} y={baseY + 3} fontSize="9" fill="#94a3b8">{CH_LABELS[ch]}</text>
              {hasSel && (
                <path d={tracePath(ch)} fill="none" stroke="#2563eb" strokeWidth="1.4" strokeLinejoin="round" />
              )}
            </g>
          )
        })}
      </svg>
      {!hasSel && <p className="text-[10px] text-slate-400 text-center -mt-2">Wähle Polarität, Amplitude und Dauer …</p>}
    </div>
  )
}

interface Props {
  value: StepAnswer
  onChange: (v: StepAnswer) => void
  technikAnswer?: string
}

export default function StepMorphologie({ value, onChange, technikAnswer }: Props) {
  const [answer, setAnswer] = useState<MorphologieAnswer>(parse(value))

  const montage = (() => {
    try { return JSON.parse(technikAnswer ?? '{}').montage ?? '' } catch { return '' }
  })()

  function update(patch: Partial<MorphologieAnswer>) {
    const next = { ...answer, ...patch }
    setAnswer(next)
    onChange(JSON.stringify(next))
  }

  // Spike-Sonderpfad-Trigger: kurz + negativ/biphasisch
  const spikeCandidate =
    (answer.dauer === 'spike' || answer.dauer === 'sharp') &&
    (answer.polaritaet === 'negativ' || answer.polaritaet === 'biphasisch_np')

  return (
    <div className="space-y-7">

      {/* Live-Wellen-Simulator */}
      <WaveSimulator polaritaet={answer.polaritaet} amplitude={answer.amplitude} dauer={answer.dauer} montage={montage} />

      {/* Polarität */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Polarität des Potentials</h3>
        <PolaritaetsHilfe montage={montage} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {POLARITAET.map(opt => {
            const active = answer.polaritaet === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => update({ polaritaet: active ? '' : opt.value })}
                className={`text-left rounded-xl border p-3 transition-all ${
                  active
                    ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`text-sm font-semibold block mb-0.5 ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-slate-500 block">{opt.description}</span>
                <span className="text-xs text-slate-400 block mt-0.5 italic">{opt.beispiel}</span>
              </button>
            )
          })}
          <button
            onClick={() => update({ polaritaet: answer.polaritaet === 'nb' ? '' : 'nb' })}
            className={`text-left rounded-xl border p-3 transition-all ${
              answer.polaritaet === 'nb'
                ? 'border-slate-400 bg-slate-100'
                : 'border-dashed border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-sm text-slate-500">Nicht beurteilbar</span>
          </button>
        </div>
      </div>

      {/* Amplitude */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Amplitude</h3>
        <div className="flex flex-col gap-2">
          {AMPLITUDE_STUFEN.map(opt => {
            const active = answer.amplitude === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => update({ amplitude: active ? '' : opt.value })}
                className={`text-left rounded-xl border px-4 py-2.5 transition-all flex items-center justify-between ${
                  active
                    ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-slate-400 ml-2 italic">{opt.beispiel}</span>
                </div>
                <span className={`text-xs font-mono font-medium ${active ? 'text-blue-500' : 'text-slate-400'}`}>
                  {opt.range}
                </span>
              </button>
            )
          })}
          <button
            onClick={() => update({ amplitude: answer.amplitude === 'nb' ? '' : 'nb' })}
            className={`text-left rounded-xl border px-4 py-2.5 transition-all ${
              answer.amplitude === 'nb'
                ? 'border-slate-400 bg-slate-100'
                : 'border-dashed border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-sm text-slate-500">Nicht beurteilbar</span>
          </button>
        </div>
      </div>

      {/* Dauer */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dauer / Zeitverhalten</h3>
        <div className="flex flex-col gap-2">
          {DAUER_STUFEN.map(opt => {
            const active = answer.dauer === opt.value
            return (
              <div key={opt.value}>
                <button
                  onClick={() => update({ dauer: active ? '' : opt.value })}
                  className={`w-full text-left rounded-xl border px-4 py-2.5 transition-all flex items-center justify-between ${
                    active
                      ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">{opt.description}</span>
                  </div>
                  <span className={`text-xs font-mono font-medium flex-shrink-0 ml-2 ${active ? 'text-blue-500' : 'text-slate-400'}`}>
                    {opt.range}
                  </span>
                </button>
                {active && opt.hinweis && (
                  <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    ⚠ {opt.hinweis}
                  </div>
                )}
              </div>
            )
          })}
          <button
            onClick={() => update({ dauer: answer.dauer === 'nb' ? '' : 'nb' })}
            className={`text-left rounded-xl border px-4 py-2.5 transition-all ${
              answer.dauer === 'nb'
                ? 'border-slate-400 bg-slate-100'
                : 'border-dashed border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-sm text-slate-500">Nicht beurteilbar</span>
          </button>
        </div>
      </div>

      {/* Spike-Sonderpfad-Vorankündigung */}
      {spikeCandidate && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
          <div>
            <p className="font-semibold">Möglicher Spike / Sharp Wave erkannt</p>
            <p className="text-xs mt-0.5 text-violet-600">Nach dem Artefakt-Check wird die IFCN-Spike-Kriterienliste aktiviert.</p>
          </div>
        </div>
      )}

    </div>
  )
}
