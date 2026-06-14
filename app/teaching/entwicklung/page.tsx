'use client'

import { useState } from 'react'

// ─── Daten ────────────────────────────────────────────────────────────────────

interface AgeMarker {
  pma: number        // Postmenstruelles Alter in Wochen
  label: string
  sublabel?: string
}

const AGE_MARKERS: AgeMarker[] = [
  { pma: 24, label: '24 Wo', sublabel: 'Grenze Lebensfähigkeit' },
  { pma: 28, label: '28 Wo' },
  { pma: 30, label: '30 Wo' },
  { pma: 32, label: '32 Wo' },
  { pma: 34, label: '34 Wo' },
  { pma: 36, label: '36 Wo' },
  { pma: 38, label: '38 Wo' },
  { pma: 40, label: '40 Wo', sublabel: 'Termin' },
  { pma: 44, label: '44 Wo' },
  { pma: 46, label: '46 Wo' },
  { pma: 49, label: '49 Wo' },
]

interface Feature {
  id: string
  label: string
  color: string        // Tailwind bg color class
  borderColor: string
  textColor: string
  start: number        // PMA Wochen
  end: number
  desc: string
  detail: string
  pathological?: string
}

const FEATURES: Feature[] = [
  // Kontinuität / IBI
  {
    id: 'ibi_max',
    label: 'IBI bis 60 s',
    color: 'bg-red-200',
    borderColor: 'border-red-400',
    textColor: 'text-red-900',
    start: 24, end: 26,
    desc: 'Interburst-Intervall bis 60 Sekunden erlaubt',
    detail: 'Sehr lange Pausen zwischen Aktivitätsausbrüchen sind in dieser Frühphase normal. Kortikale Verbindungen sind noch kaum ausgebildet.',
    pathological: 'IBI > 60 s oder völlig flaches EEG (Suppression)',
  },
  {
    id: 'ibi_40',
    label: 'IBI bis 40 s',
    color: 'bg-orange-200',
    borderColor: 'border-orange-400',
    textColor: 'text-orange-900',
    start: 26, end: 28,
    desc: 'IBI ≤ 40 Sekunden',
    detail: 'Rasche Verkürzung der Pausen. Zunehmende kortikale Vernetzung.',
    pathological: 'IBI > 40 s',
  },
  {
    id: 'ibi_20',
    label: 'IBI bis 20 s',
    color: 'bg-amber-200',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-900',
    start: 28, end: 34,
    desc: 'IBI ≤ 20 Sekunden',
    detail: 'Halbierung der erlaubten Pausendauer. Unterschiedliche Schlafzustände beginnen sich herauszukristallisieren.',
    pathological: 'IBI > 20 s (Burst Suppression)',
  },
  {
    id: 'ibi_10',
    label: 'IBI bis 10 s',
    color: 'bg-yellow-200',
    borderColor: 'border-yellow-400',
    textColor: 'text-yellow-900',
    start: 34, end: 37,
    desc: 'IBI ≤ 10 Sekunden',
    detail: 'Kurze Pausen nur noch im Tiefschlaf. Trace alternans beginnt (IBI-Amplitude > 25 µV).',
    pathological: 'IBI > 10 s',
  },
  {
    id: 'ibi_6',
    label: 'IBI ≤ 6 s',
    color: 'bg-lime-200',
    borderColor: 'border-lime-500',
    textColor: 'text-lime-900',
    start: 37, end: 40,
    desc: 'IBI ≤ 6 Sekunden (Ruheschlaf)',
    detail: 'Trace alternans im Ruheschlaf. Im Wachen und Aktiv-Schlaf ist das EEG bereits kontinuierlich.',
    pathological: 'IBI > 6 s',
  },
  {
    id: 'kontinuierlich',
    label: 'Kontinuierlich',
    color: 'bg-green-200',
    borderColor: 'border-green-500',
    textColor: 'text-green-900',
    start: 40, end: 49,
    desc: 'Vollständig kontinuierlich (auch im Ruheschlaf)',
    detail: 'Nach 46 Wochen PMA sollte keine Diskontinuität mehr nachweisbar sein, auch nicht im Ruheschlaf. Spätestens ab 46 Wochen obligatorisch.',
    pathological: 'Persistierende Diskontinuität > 46 Wochen PMA',
  },

  // Synchronie
  {
    id: 'async',
    label: 'Asynchron',
    color: 'bg-slate-200',
    borderColor: 'border-slate-400',
    textColor: 'text-slate-700',
    start: 24, end: 30,
    desc: 'Häufige interhemisphärische Asynchronie normal',
    detail: 'Corpus callosum unreif. Aktivitätsausbrüche müssen nicht synchron beider Hemisphären auftreten.',
  },
  {
    id: 'sync_80',
    label: '80 % synchron',
    color: 'bg-teal-100',
    borderColor: 'border-teal-400',
    textColor: 'text-teal-800',
    start: 30, end: 38,
    desc: '≥ 80 % der Aktivität synchron',
    detail: 'Zunehmende interhemisphärische Synchronisation. Persistierende Asynchronie > 20 % ab 32 Wochen verdächtig.',
    pathological: '> 20 % Asynchronie nach 32 Wochen PMA',
  },
  {
    id: 'sync_100',
    label: 'Synchron',
    color: 'bg-teal-300',
    borderColor: 'border-teal-600',
    textColor: 'text-teal-900',
    start: 38, end: 49,
    desc: 'Vollständige Synchronie',
    detail: 'Ab 38 Wochen sollte der gesamte Ableitungsabschnitt synchron sein.',
    pathological: 'Asynchronie nach 38 Wochen PMA stets pathologisch',
  },

  // Reaktivität
  {
    id: 'no_react',
    label: 'Keine Reaktivität',
    color: 'bg-rose-100',
    borderColor: 'border-rose-300',
    textColor: 'text-rose-800',
    start: 24, end: 30,
    desc: 'Fehlende Reaktivität auf Stimuli normal',
    detail: 'Externe Stimuli zeigen keine reproduzierbare EEG-Veränderung. Normal bis 29 Wochen PMA.',
  },
  {
    id: 'react_partial',
    label: 'Reaktivität beginnt',
    color: 'bg-pink-100',
    borderColor: 'border-pink-400',
    textColor: 'text-pink-800',
    start: 30, end: 34,
    desc: 'Reaktivität auf Stimuli vorhanden',
    detail: 'Ab 30 Wochen sollte zumindest zeitweise eine Reaktion auf akustische oder taktile Stimuli erkennbar sein.',
    pathological: 'Fehlende Reaktivität nach 30 Wochen PMA',
  },
  {
    id: 'react_full',
    label: 'Volle Reaktivität',
    color: 'bg-pink-300',
    borderColor: 'border-pink-600',
    textColor: 'text-pink-900',
    start: 34, end: 49,
    desc: 'Regelmäßige, reproduzierbare Reaktivität',
    detail: 'Ab 32–34 Wochen PMA vollständige Reaktivität erwartet.',
    pathological: 'Fehlende Reaktivität nach 34 Wochen PMA pathologisch',
  },

  // Graphoelemente
  {
    id: 'temp_theta',
    label: 'Temp. Theta',
    color: 'bg-indigo-100',
    borderColor: 'border-indigo-400',
    textColor: 'text-indigo-800',
    start: 24, end: 32,
    desc: 'Temporales Theta (Sägezahnmuster)',
    detail: 'Scharf konturierte, mäßig bis hoch amplitudige Theta-Bursts bitemporal. Normales neonatales Graphoelement sehr unreifer Gehirne.',
    pathological: 'Persistenz > 34 Wochen oder einseitige Betonung verdächtig',
  },
  {
    id: 'occ_delta',
    label: 'Mono. occ. Delta',
    color: 'bg-indigo-200',
    borderColor: 'border-indigo-500',
    textColor: 'text-indigo-900',
    start: 24, end: 32,
    desc: 'Monomorphes okzipitales Delta',
    detail: 'Gleichförmige, mäßig amplitudige Deltawellen okzipital. Verschwindet bis 34 Wochen PMA. Nur bei sehr früh Frühgeborenen gesehen.',
    pathological: 'Persistenz nach 34 Wochen',
  },
  {
    id: 'delta_brush',
    label: 'Delta Brush',
    color: 'bg-purple-200',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-900',
    start: 28, end: 42,
    desc: 'Delta Brush (8–20 Hz auf Deltawellen)',
    detail: 'Schnelle Aktivität (8–20 Hz) überlagert langsame Deltawellen — wie Borsten auf einem Pinsel. Beginnt diffus (~28 Wo), wird ab 36 Wo posterior betont, verschwindet um 40–42 Wo PMA. Cave: auch bei NMDA-Rezeptor-Enzephalitis beim Erwachsenen!',
    pathological: 'Persistenz > 42 Wochen PMA; oder Delta Brush beim Erwachsenen → NMDA-Enzephalitis ausschließen',
  },
  {
    id: 'encoches',
    label: 'Encoches frontales',
    color: 'bg-violet-200',
    borderColor: 'border-violet-500',
    textColor: 'text-violet-900',
    start: 34, end: 46,
    desc: 'Frontale Spitzentransienten (Encoches frontales)',
    detail: 'Bifrontale, synchrone Spitzenpotentiale. Normal 34–46 Wochen PMA. Wichtig: Sie müssen SYNCHRON sein — asynchrone frontale Sharps sind epileptiform verdächtig.',
    pathological: 'Asynchrone Encoches → epileptiforme Aktivität ausschließen',
  },
  {
    id: 'centrotemps',
    label: 'Zentrotemporale Sharps',
    color: 'bg-fuchsia-100',
    borderColor: 'border-fuchsia-400',
    textColor: 'text-fuchsia-800',
    start: 34, end: 46,
    desc: 'Zentrotemporale Spitzentransienten',
    detail: 'Häufige Normvariante. Seltene multifokale Sharps (wenige pro Stunde) sind normal. Problematisch wird es bei Häufung, Persistenz oder Rhythmizität an einer Stelle.',
    pathological: 'Exzessiv häufige, persistente oder rhythmische Sharps an einer Stelle',
  },
  {
    id: 'multifocal_sharps',
    label: 'Multif. Sharps',
    color: 'bg-fuchsia-200',
    borderColor: 'border-fuchsia-500',
    textColor: 'text-fuchsia-900',
    start: 38, end: 49,
    desc: 'Multifokale Spitzentransienten',
    detail: 'Im ersten Lebensmonat weitgehend normal. Verschwinden bis 49 Wochen PMA. Okzipitale und Mittelliniensharps sind in jedem Alter eher pathologisch.',
    pathological: 'Persistenz > 49 Wochen; okzipitale/Mittellinien-Sharps immer verdächtig',
  },

  // Schlafzustände
  {
    id: 'no_states',
    label: 'Keine Schlafstadien',
    color: 'bg-stone-100',
    borderColor: 'border-stone-300',
    textColor: 'text-stone-700',
    start: 24, end: 29,
    desc: 'EEG unabhängig von Wach-/Schlafzustand gleichförmig',
    detail: 'Bis 28–29 Wochen PMA sieht das EEG im Wachen, Aktivschlaf und Ruheschlaf praktisch identisch aus.',
  },
  {
    id: 'trace_discontinu',
    label: 'Trace discontinu',
    color: 'bg-sky-100',
    borderColor: 'border-sky-400',
    textColor: 'text-sky-800',
    start: 30, end: 34,
    desc: 'Trace discontinu im Ruheschlaf',
    detail: 'Ruheschlaf-Muster: Bursts mit Interburst-Intervallen (IBI-Amplitude < 25 µV). Unterschied zu Trace alternans: die Pausen sind niedriger amplitudig (<25 µV).',
    pathological: 'Im Wachen oder Aktivschlaf → pathologisch',
  },
  {
    id: 'trace_alternans',
    label: 'Trace alternans',
    color: 'bg-sky-200',
    borderColor: 'border-sky-500',
    textColor: 'text-sky-900',
    start: 34, end: 40,
    desc: 'Trace alternans im Ruheschlaf',
    detail: 'Reiferes Ruheschlaf-Muster: IBI-Amplitude > 25 µV (höheramplitudig als Trace discontinu). Übergang zu Slow Wave Sleep ab 38 Wochen.',
    pathological: 'Persistenz > 46 Wochen (sollte zu SWS übergehen)',
  },
  {
    id: 'sws',
    label: 'Slow Wave Sleep',
    color: 'bg-sky-300',
    borderColor: 'border-sky-600',
    textColor: 'text-sky-900',
    start: 38, end: 49,
    desc: 'Slow Wave Sleep entwickelt sich',
    detail: 'Ab 38 Wochen entwickelt sich Trace alternans zu echtem Slow Wave Sleep (kontinuierlich, hochamplitudig). Vollständig kontinuierlich ab 46 Wochen.',
  },
]

// ─── Timeline-Konstanten ──────────────────────────────────────────────────────

const PMA_MIN = 24
const PMA_MAX = 49
const PMA_RANGE = PMA_MAX - PMA_MIN

function pmaToPercent(pma: number) {
  return ((pma - PMA_MIN) / PMA_RANGE) * 100
}

// ─── Gruppen ─────────────────────────────────────────────────────────────────

const GROUPS = [
  { id: 'ibi',    label: 'Diskontinuität / IBI', ids: ['ibi_max','ibi_40','ibi_20','ibi_10','ibi_6','kontinuierlich'] },
  { id: 'sync',   label: 'Synchronie',             ids: ['async','sync_80','sync_100'] },
  { id: 'react',  label: 'Reaktivität',            ids: ['no_react','react_partial','react_full'] },
  { id: 'graph',  label: 'Graphoelemente',         ids: ['temp_theta','occ_delta','delta_brush','encoches','centrotemps','multifocal_sharps'] },
  { id: 'sleep',  label: 'Schlafzustände',         ids: ['no_states','trace_discontinu','trace_alternans','sws'] },
]

const FEAT_MAP = Object.fromEntries(FEATURES.map(f => [f.id, f]))

// ─── PDR-Daten ───────────────────────────────────────────────────────────────

const PDR_DATA = [
  { age: 'Neonatal', range: '3–4', min: 3, max: 4, band: 'delta', note: 'Kein stabiler PDR' },
  { age: '3 Mo.',    range: '4–5', min: 4, max: 5, band: 'theta', note: '' },
  { age: '6 Mo.',    range: '5–6', min: 5, max: 6, band: 'theta', note: '' },
  { age: '1 Jahr',   range: '5–6', min: 5, max: 6, band: 'theta', note: '' },
  { age: '2 Jahre',  range: '6–7', min: 6, max: 7, band: 'theta', note: '' },
  { age: '4 Jahre',  range: '7–8', min: 7, max: 8, band: 'theta-alpha', note: '' },
  { age: '6 Jahre',  range: '8–9', min: 8, max: 9, band: 'alpha', note: 'Erw.-Grenze' },
  { age: '8–10 J.',  range: '9–10', min: 9, max: 10, band: 'alpha', note: 'Stabil adult' },
]

const BAND_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  delta:        { bg: 'bg-slate-200',   border: 'border-slate-400',   text: 'text-slate-700' },
  theta:        { bg: 'bg-amber-100',   border: 'border-amber-400',   text: 'text-amber-800' },
  'theta-alpha':{ bg: 'bg-lime-100',    border: 'border-lime-400',    text: 'text-lime-800'  },
  alpha:        { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-800' },
}

// Hz scale: 2–13 Hz (full range for bar position)
const HZ_MIN = 2
const HZ_MAX = 13
function hzToPercent(hz: number) { return ((hz - HZ_MIN) / (HZ_MAX - HZ_MIN)) * 100 }

function PDRChart() {
  return (
    <div className="rounded-xl border p-4 space-y-3 h-full"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          Grundrhythmus (PDR) nach Alter
        </h3>
        <div className="flex items-center gap-2 text-[9px] font-semibold">
          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">δ</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">θ</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">α</span>
        </div>
      </div>

      {/* Hz-Achse */}
      <div className="relative" style={{ marginLeft: '4.5rem' }}>
        <div className="relative h-3">
          {[2, 4, 6, 8, 10, 12].map(hz => (
            <span key={hz}
              style={{ left: `${hzToPercent(hz)}%`, color: 'var(--text-tertiary)', position: 'absolute', transform: 'translateX(-50%)' }}
              className="text-[8px] font-mono">
              {hz}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        {PDR_DATA.map(d => {
          const col = BAND_COLOR[d.band]
          const barLeft = hzToPercent(d.min)
          const barWidth = hzToPercent(d.max) - barLeft
          return (
            <div key={d.age} className="flex items-center gap-2">
              <span className="text-[10px] font-semibold w-16 flex-shrink-0 text-right"
                style={{ color: 'var(--text-secondary)' }}>
                {d.age}
              </span>
              <div className="flex-1 relative h-5">
                {/* track */}
                <div className="absolute inset-y-1.5 inset-x-0 rounded-full"
                  style={{ backgroundColor: 'var(--bg-subtle)' }}/>
                {/* bar */}
                <div
                  style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                  className={`absolute inset-y-0.5 rounded-full border ${col.bg} ${col.border} flex items-center justify-center`}>
                  <span className={`text-[9px] font-bold ${col.text} leading-none`}>{d.range} Hz</span>
                </div>
              </div>
              {d.note && (
                <span className="text-[9px] font-semibold text-emerald-700 w-14 flex-shrink-0 leading-tight">
                  {d.note}
                </span>
              )}
              {!d.note && <span className="w-14 flex-shrink-0"/>}
            </div>
          )
        })}
      </div>

      <p className="text-[10px] italic" style={{ color: 'var(--text-tertiary)' }}>
        PDR = Posteriore Dominante Rhythmik (okzipital, Augen geschlossen)
      </p>
    </div>
  )
}

// ─── PMA-Rechner ─────────────────────────────────────────────────────────────

function PMACalculator() {
  const [ga, setGa] = useState(38)
  const [ca, setCa] = useState(0)
  const pma = ga + ca

  return (
    <div className="rounded-xl border p-4 space-y-3 h-full"
      style={{ borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}>
      <h3 className="text-sm font-bold text-blue-900">PMA-Rechner</h3>

      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              Gestationsalter (GA)
            </label>
            <span className="text-sm font-mono font-bold text-blue-800">{ga} Wo</span>
          </div>
          <input type="range" min={23} max={42} value={ga} onChange={e => setGa(+e.target.value)}
            className="w-full accent-blue-600 h-1.5"/>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              Chron. Alter (CA)
            </label>
            <span className="text-sm font-mono font-bold text-blue-800">{ca} Wo</span>
          </div>
          <input type="range" min={0} max={16} value={ca} onChange={e => setCa(+e.target.value)}
            className="w-full accent-blue-600 h-1.5"/>
        </div>
      </div>

      <div className="rounded-lg bg-blue-600 px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-blue-200">PMA = GA + CA</span>
        <span className="text-xl font-black text-white">{pma} Wo</span>
      </div>

      <p className="text-[10px] text-blue-700 italic leading-snug">
        z.B. 34 SSW + 4 Wo alt → PMA 38 Wo
      </p>
    </div>
  )
}

// ─── Gantt-Zeile ─────────────────────────────────────────────────────────────

function GanttRow({ feature, onClick, selected }: { feature: Feature; onClick: () => void; selected: boolean }) {
  const left = pmaToPercent(feature.start)
  const width = pmaToPercent(feature.end) - left

  return (
    <button onClick={onClick} className="w-full text-left group"
      title={`${feature.label}: ${feature.start}–${feature.end} Wo PMA`}>
      <div className="relative h-7">
        <div
          style={{ left: `${left}%`, width: `${width}%` }}
          className={`absolute inset-y-0.5 rounded border-2 flex items-center px-1.5 text-[10px] font-semibold truncate transition-all
            ${feature.color} ${feature.borderColor} ${feature.textColor}
            ${selected ? 'ring-2 ring-offset-1 ring-slate-800 shadow-md' : 'group-hover:shadow-sm group-hover:brightness-95'}`}>
          {feature.label}
        </div>
      </div>
    </button>
  )
}

// ─── Detail-Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ feature }: { feature: Feature }) {
  return (
    <div className={`rounded-xl border-2 ${feature.borderColor} overflow-hidden`}>
      <div className={`${feature.color} px-4 py-3 flex items-start justify-between gap-3`}>
        <div>
          <p className={`text-sm font-bold ${feature.textColor}`}>{feature.label}</p>
          <p className={`text-xs mt-0.5 ${feature.textColor} opacity-80`}>
            {feature.start}–{feature.end} Wochen PMA
          </p>
        </div>
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold border ${feature.borderColor} ${feature.textColor} bg-white/60 flex-shrink-0`}>
          Normalvariante
        </span>
      </div>
      <div className="px-4 py-3 bg-white space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Beschreibung</p>
          <p className="text-sm text-slate-700 leading-relaxed">{feature.desc}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Hintergrund</p>
          <p className="text-sm text-slate-600 leading-relaxed">{feature.detail}</p>
        </div>
        {feature.pathological && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs font-semibold text-red-700 mb-0.5">⚠ Pathologisch wenn</p>
            <p className="text-xs text-red-600 leading-relaxed">{feature.pathological}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

export default function EntwicklungPage() {
  const [selected, setSelected] = useState<string | null>('delta_brush')
  const [tab, setTab] = useState<'timeline' | 'states' | 'pearl'>('timeline')

  const selectedFeature = selected ? FEAT_MAP[selected] : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-slate-900">Kindliche EEG-Entwicklung</h1>
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">Teaching</span>
        </div>
        <p className="text-sm text-slate-500">
          Das neonatale EEG entwickelt sich rasch — was mit 26 Wochen normal ist, kann mit 38 Wochen pathologisch sein.
          Grundlage ist das postmenstruelle Alter (PMA = GA + CA).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {([
          { id: 'timeline', label: 'Entwicklungs-Timeline' },
          { id: 'states',   label: 'Schlafzustände' },
          { id: 'pearl',    label: 'Klinische Perlen' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: TIMELINE ── */}
      {tab === 'timeline' && (
        <div className="space-y-5">
          {/* Kompakt-Row: PMA-Rechner + PDR-Chart nebeneinander */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <PMACalculator />
            <PDRChart />
          </div>

          {/* Gantt-Chart */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Klicke auf ein Element für Details
              </p>

              {/* PMA-Achse */}
              <div className="relative h-6 mb-1">
                {AGE_MARKERS.map(m => (
                  <div key={m.pma}
                    style={{ left: `${pmaToPercent(m.pma)}%` }}
                    className="absolute flex flex-col items-center text-[9px] text-slate-400 -translate-x-1/2">
                    <div className="h-2 w-px bg-slate-200 mb-0.5"/>
                    <span className="font-mono">{m.pma}</span>
                  </div>
                ))}
                {/* Terminlinie */}
                <div style={{ left: `${pmaToPercent(40)}%` }}
                  className="absolute top-0 bottom-0 w-px bg-blue-400 opacity-50"/>
                <div style={{ left: `${pmaToPercent(40)}%` }}
                  className="absolute -top-5 text-[9px] font-bold text-blue-500 -translate-x-1/2">
                  Termin
                </div>
              </div>

              {/* Gruppen */}
              <div className="space-y-3 mt-3">
                {GROUPS.map(g => (
                  <div key={g.id}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{g.label}</p>
                    <div className="space-y-0.5">
                      {g.ids.map(id => (
                        <GanttRow key={id} feature={FEAT_MAP[id]}
                          selected={selected === id}
                          onClick={() => setSelected(id === selected ? null : id)}/>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* PMA-Achse unten */}
              <div className="relative h-5 mt-2 border-t border-slate-100 pt-1">
                {AGE_MARKERS.map(m => (
                  <div key={m.pma}
                    style={{ left: `${pmaToPercent(m.pma)}%` }}
                    className="absolute text-[8px] text-slate-300 -translate-x-1/2">
                    {m.sublabel && <span className="text-slate-400 font-semibold">{m.sublabel}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail-Panel */}
          {selectedFeature && <DetailPanel feature={selectedFeature} />}
          {!selectedFeature && (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
              Klicke auf ein Element im Gantt-Chart für Details
            </div>
          )}
        </div>
      )}

      {/* ── TAB: SCHLAFZUSTÄNDE ── */}
      {tab === 'states' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Schlafzustände beim Neonaten</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Bis 28–29 Wochen PMA ist das EEG unabhängig vom Verhaltenszustand gleichförmig.
              Ab 30 Wochen differenzieren sich drei Zustände.
            </p>

            {[
              {
                state: 'Wachzustand',
                icon: '👁',
                color: 'bg-yellow-50 border-yellow-300',
                headColor: 'text-yellow-800',
                timeline: '30–49 Wo',
                features: [
                  'Augen geöffnet',
                  '30–32 Wo: Überwiegend kontinuierlich, niedrig amplitudig',
                  'Ab 35 Wo: Höhere Amplitude, Frequenzmix',
                  'Oft Bewegungsartefakte, unregelmäßige Atmung',
                ],
                eeg: 'Kontinuierlich, gemischte Frequenzen (Theta/Delta dominierend)',
              },
              {
                state: 'Aktiver Schlaf (= REM-Äquivalent)',
                icon: '👀',
                color: 'bg-blue-50 border-blue-300',
                headColor: 'text-blue-800',
                timeline: '30–49 Wo',
                features: [
                  'Augen geschlossen, aber Augenbewegungen (EOG!)',
                  'Unregelmäßige Atmung, Apnoe-Episoden möglich',
                  'Körperbewegungen möglich',
                  '30–36 Wo: Kontinuierliches Theta-Delta',
                  'Ab 38 Wo: Mehr Frequenzmix',
                ],
                eeg: 'Ähnlich Wachzustand — kontinuierlich, Theta/Delta',
              },
              {
                state: 'Ruheschlaf (= NREM-Äquivalent)',
                icon: '😴',
                color: 'bg-indigo-50 border-indigo-300',
                headColor: 'text-indigo-800',
                timeline: '30–49 Wo',
                features: [
                  'Augen geschlossen, minimale Augenbewegungen',
                  'Regelmäßige Atmung',
                  '30–34 Wo: Trace discontinu (IBI < 25 µV)',
                  '34–40 Wo: Trace alternans (IBI > 25 µV)',
                  'Ab 38–40 Wo: Slow Wave Sleep entwickelt sich',
                ],
                eeg: 'Diskontinuierlich (→ Trace alternans → Slow Wave Sleep)',
              },
            ].map(s => (
              <div key={s.state} className={`rounded-xl border-2 ${s.color} overflow-hidden`}>
                <div className={`px-4 py-3 flex items-center gap-3 ${s.color}`}>
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${s.headColor}`}>{s.state}</p>
                    <p className={`text-xs ${s.headColor} opacity-70`}>{s.timeline} PMA</p>
                  </div>
                </div>
                <div className="px-4 py-3 bg-white space-y-2">
                  <div className="rounded bg-slate-50 px-3 py-1.5 text-xs font-mono text-slate-600">
                    EEG: {s.eeg}
                  </div>
                  <ul className="space-y-1">
                    {s.features.map((f,i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="text-slate-400 flex-shrink-0 mt-0.5">•</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Trace discontinu vs alternans */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-800">Trace discontinu vs. Trace alternans</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 space-y-2">
                <p className="text-xs font-bold text-sky-800">Trace discontinu</p>
                <p className="text-[10px] text-sky-600 font-semibold">30–34 Wochen PMA</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• Bursts zwischen Pausen</li>
                  <li>• <strong>IBI-Amplitude &lt; 25 µV</strong></li>
                  <li>• Eher flache Pausen</li>
                  <li>• Unreiferes Muster</li>
                </ul>
              </div>
              <div className="rounded-lg bg-sky-100 border border-sky-400 p-3 space-y-2">
                <p className="text-xs font-bold text-sky-900">Trace alternans</p>
                <p className="text-[10px] text-sky-700 font-semibold">34–40 Wochen PMA</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• Bursts zwischen Pausen</li>
                  <li>• <strong>IBI-Amplitude &gt; 25 µV</strong></li>
                  <li>• Pausen haben messbare Aktivität</li>
                  <li>• Reiferes Muster</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-slate-500 italic">
              Merkhilfe: Discontinu = Diskontinuität betont (flache Pausen); Alternans = Wechsel zwischen zwei
              Amplitudenniveaus (beide messbar).
            </p>
          </div>
        </div>
      )}

      {/* ── TAB: PERLEN ── */}
      {tab === 'pearl' && (
        <div className="space-y-4">
          {[
            {
              icon: '🧮',
              title: 'PMA immer berechnen',
              color: 'bg-blue-50 border-blue-300',
              titleColor: 'text-blue-900',
              text: 'Das chronologische Alter allein ist bedeutungslos. Ein 4 Wochen altes Kind, das bei 34 SSW geboren wurde, hat ein PMA von 38 Wochen — nicht 4 Wochen. Alle Normwerte beziehen sich auf PMA.',
            },
            {
              icon: '⚡',
              title: 'Delta Brush ≠ Epilepsie — außer beim Erwachsenen',
              color: 'bg-purple-50 border-purple-300',
              titleColor: 'text-purple-900',
              text: 'Delta Brush ist beim Neonaten (28–42 Wochen PMA) ein Normalphänomen. Beim Erwachsenen ist es hingegen ein Alarmsignal für NMDA-Rezeptor-Enzephalitis. Dasselbe Muster — völlig unterschiedliche Bedeutung je nach Alter.',
            },
            {
              icon: '🔄',
              title: 'Synchrone Encoches ≠ Epilepsie',
              color: 'bg-violet-50 border-violet-300',
              titleColor: 'text-violet-900',
              text: 'Frontale Spitzentransienten (Encoches frontales) sind NORMAL von 34–46 Wochen PMA — aber nur wenn synchron. Asynchrone frontale Sharps sind dagegen epileptiform verdächtig. Synchronie ist hier das entscheidende Kriterium.',
            },
            {
              icon: '📍',
              title: 'Lokalisation von Sharps hilft bei der Beurteilung',
              color: 'bg-amber-50 border-amber-300',
              titleColor: 'text-amber-900',
              text: 'Frontale und zentrotemporale Sharps sind im Neonaten wahrscheinlich benigne. Okzipitale und Mittellinien-Sharps sind in jedem Alter eher epileptiform. Multifokale Sharps (wenige/Stunde) im ersten Lebensmonat meist normal, müssen aber bis 49 Wochen PMA verschwinden.',
            },
            {
              icon: '🌊',
              title: 'Neonatale Anfälle sind oft klinisch stumm',
              color: 'bg-red-50 border-red-300',
              titleColor: 'text-red-900',
              text: 'Viele neonatale Anfälle haben keine klinische Korrelation — das EEG ist die einzige Möglichkeit, sie zu erfassen. Rhythmische oder periodische Aktivität mit Evolution in Zeit und Raum ist das entscheidende Kriterium, wie bei Erwachsenen auch.',
            },
            {
              icon: '📈',
              title: 'Entwicklung ist schnell — wöchentliche Änderungen beachten',
              color: 'bg-emerald-50 border-emerald-300',
              titleColor: 'text-emerald-900',
              text: 'Was in Woche 26 normal ist, kann in Woche 28 pathologisch sein. Der IBI-Grenzwert ändert sich innerhalb weniger Wochen drastisch (60 s → 40 s → 20 s). Serielle EEGs sind bei Frühgeburten besonders wertvoll.',
            },
          ].map(p => (
            <div key={p.title} className={`rounded-xl border-2 ${p.color} p-4 space-y-2`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{p.icon}</span>
                <h3 className={`text-sm font-bold ${p.titleColor}`}>{p.title}</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{p.text}</p>
            </div>
          ))}

          {/* Zusammenfassung-Tabelle */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-bold text-slate-800">Meilensteine auf einen Blick</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { pma: '28–30', item: 'Reaktivität beginnt', note: 'Vorher: fehlende Reaktivität normal' },
                { pma: '30',    item: '80 % synchron', note: '< 80 % → pathologisch ab 32 Wo' },
                { pma: '34',    item: 'Encoches frontales + Trace alternans', note: 'Encoches bis 46 Wo normal' },
                { pma: '36',    item: 'Delta Brush posterior', note: 'Vorher diffus, jetzt posterior' },
                { pma: '38',    item: 'Volle Synchronie, Slow Wave Sleep beginnt', note: 'Asynchronie ab jetzt immer pathologisch' },
                { pma: '40',    item: 'Termin — IBI max. 6 s (Ruheschlaf)', note: 'Wachen + Aktivschlaf kontinuierlich' },
                { pma: '42',    item: 'Delta Brush verschwindet', note: 'Persistenz → pathologisch' },
                { pma: '46',    item: 'Vollständig kontinuierlich', note: 'Encoches verschwinden' },
                { pma: '49',    item: 'Multifokale Sharps verschwinden', note: 'Persistenz → pathologisch' },
              ].map(r => (
                <div key={r.pma} className="px-4 py-2.5 grid grid-cols-12 gap-2 items-start">
                  <span className="col-span-2 text-xs font-mono font-bold text-slate-500">{r.pma} Wo</span>
                  <span className="col-span-5 text-xs font-semibold text-slate-700">{r.item}</span>
                  <span className="col-span-5 text-xs text-slate-400">{r.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
