'use client'

import { useState } from 'react'
import type { StepAnswer } from '@/hooks/useWizardState'

// ─── Artefakt-Definitionen (pragmatisch kurz) ─────────────────────────────────
//
// Jeder Eintrag enthält:
//   - icon: schnelles visuelles Erkennen (kein Emoji-Overload — Buchstaben/Symbol)
//   - key: Unterscheidungsmerkmal in einem Satz
//   - regions: für welche Lokalisationen relevant (leer = immer)
//   - vigilanz: für welche Vigilanzzustände relevant
//   - kontext: 'intensiv' zeigt es nur bei Bewusstseinsstörung/ICU

interface ArtDef {
  id: string
  gruppe: 'Technisch' | 'Okulär' | 'EMG' | 'Kardio' | 'ICU'
  name: string
  key: string               // Merkmal in einem Satz
  aussehen: string          // Wie sieht's aus
  regions?: string[]        // lokRegionen
  vigilanz?: string[]
  kontext?: string[]        // 'bewusstseinsgestoert' etc.
  always?: boolean
}

const ARTEFAKTE: ArtDef[] = [
  // ── Technisch — immer prüfen ──────────────────────────────────────────────
  {
    id: 'tech_netz',
    gruppe: 'Technisch',
    name: '50-Hz-Netz',
    key: 'Exakt 50 Hz, einzelne Elektrode, verschwindet mit Notch',
    aussehen: 'Feine Sinusschwingung, dicht überlagert, monomorph',
    always: true,
  },
  {
    id: 'tech_elektr',
    gruppe: 'Technisch',
    name: 'Elektrodenartefakt',
    key: 'Nur ein Kanal, in allen Montagen an derselben Stelle',
    aussehen: 'Unregelmäßige Ausschläge, kein kortikales Feld',
    always: true,
  },
  {
    id: 'tech_ekg',
    gruppe: 'Kardio',
    name: 'EKG-Artefakt',
    key: 'Streng pulsratenfrequent (~1 Hz), QRS-synchron',
    aussehen: 'Nadeln temporal oder generalisiert im Herzrhythmus',
    always: true,
  },

  // ── Okulär — nur wenn frontopolar / frontal / schläfrig / wach ───────────
  {
    id: 'ok_blinzel',
    gruppe: 'Okulär',
    name: 'Blinzelartefakt',
    key: 'Bilateral Fp1/Fp2, posterior invertiert, mit Lidschluss',
    aussehen: 'Große langsame Welle frontopolar, ~0,3–2 Hz',
    regions: ['frontopolar', 'frontal'],
    vigilanz: ['wach', 'schlaefrig'],
  },
  {
    id: 'ok_horiz',
    gruppe: 'Okulär',
    name: 'Horizontale Augenbewegung',
    key: 'Fp1/Fp2 gegenphasig — linkes Auge rechts = Fp1 negativ',
    aussehen: 'Gegenphasige langsame Welle F7 vs. F8',
    regions: ['frontopolar', 'frontal', 'temporal_anterior'],
    vigilanz: ['wach', 'schlaefrig'],
  },
  {
    id: 'ok_sem',
    gruppe: 'Okulär',
    name: 'Slow Eye Movements (SEM)',
    key: 'Sinusoidal 0,1–0,5 Hz, typisch N1/Einschlaf',
    aussehen: 'Träge sinusförmige Welle bilateral frontopolar',
    regions: ['frontopolar', 'frontal'],
    vigilanz: ['schlaefrig', 'schlafend'],
  },
  {
    id: 'ok_lat_rect',
    gruppe: 'Okulär',
    name: 'Lateral-Rectus-Spike',
    key: 'Kurze Nadel F7/F8 zu Beginn einer Augenbewegung',
    aussehen: 'Einzelner scharfer Ausschlag <50 ms, kein kortikales Feld',
    regions: ['temporal_anterior'],
    vigilanz: ['wach'],
  },

  // ── EMG / Bewegung ────────────────────────────────────────────────────────
  {
    id: 'emg_muskel',
    gruppe: 'EMG',
    name: 'EMG-Artefakt',
    key: 'Hochfrequent >70 Hz, irregulär, temporal/frontal, durch Anspannung',
    aussehen: 'Rasches Rauschen über dem Grundrhythmus, kein klares Feld',
    regions: ['frontal', 'temporal_anterior', 'temporal_mittel', 'frontopolar'],
  },
  {
    id: 'emg_kau',
    gruppe: 'EMG',
    name: 'Kaumuskel / Orofazial',
    key: 'Temporal T7/T8, burst-artig beim Sprechen oder Kauen',
    aussehen: 'Episodische hochfrequente Bursts temporal, kurz',
    regions: ['temporal_anterior', 'temporal_mittel', 'frontal'],
  },
  {
    id: 'emg_tremor',
    gruppe: 'EMG',
    name: 'Tremorartifakt',
    key: 'Rhythmisch 4–12 Hz, klinisch sichtbarer Tremor',
    aussehen: 'Rhythmische Bursts, kann Spike-Wave imitieren — klinisch abgleichen',
    vigilanz: ['wach', 'schlaefrig'],
  },
  {
    id: 'emg_glosso',
    gruppe: 'EMG',
    name: 'Glossokinetisch',
    key: 'Zungenbewegung → frontale langsame Welle, imitiert Delta',
    aussehen: 'Frontale/temporale Deltawelle beim Sprechen oder Schlucken',
    regions: ['frontal', 'temporal_anterior', 'frontopolar'],
  },

  // ── ICU / Intensiv ────────────────────────────────────────────────────────
  {
    id: 'icu_beatmung',
    gruppe: 'ICU',
    name: 'Beatmungsartefakt',
    key: 'Sehr langsam 0,2–0,4 Hz, synchron mit Beatmungsfrequenz',
    aussehen: 'Träge rhythmische Welle, generalisiert, streng beatmungssynchron',
    kontext: ['bewusstseinsgestoert'],
  },
  {
    id: 'icu_balisto',
    gruppe: 'ICU',
    name: 'Pulsartefakt (Ballistokardiographie)',
    key: 'Pulssynchrone langsame Welle temporal, Elektrode über Arterie',
    aussehen: 'Langsame ~1 Hz Welle temporal, streng herzfrequent aber breiter als EKG-Nadel',
    regions: ['temporal_mittel', 'temporal_posterior', 'temporal_anterior'],
    kontext: ['bewusstseinsgestoert'],
  },
  {
    id: 'icu_geraet',
    gruppe: 'ICU',
    name: 'Medizingeräte-Artefakt',
    key: 'Starre Frequenz, endet beim Abschalten des Geräts (Pumpen, TENS, Wärme)',
    aussehen: 'Rhythmisch oder irregulär, oft generalisiert, unphysiologische Morphologie',
    kontext: ['bewusstseinsgestoert'],
  },
]

// ─── Filter ───────────────────────────────────────────────────────────────────

function filterArts(vigilanz: string, regionen: string[], kontext: string): ArtDef[] {
  return ARTEFAKTE.filter(a => {
    if (a.always) return true
    const matchR  = !a.regions  || a.regions.some(r => regionen.includes(r))
    const matchV  = !a.vigilanz || a.vigilanz.includes(vigilanz)
    const matchK  = !a.kontext  || a.kontext.includes(kontext)
    // Wenn ICU-Kriterien: nur zeigen wenn kontext=bewusstseinsgestoert
    if (a.kontext) return matchK
    // sonst: mind. ein Kontext-Kriterium muss passen
    const hasFilter = a.regions || a.vigilanz
    if (!hasFilter) return true
    return matchR || matchV
  })
}

// ─── Karten ───────────────────────────────────────────────────────────────────

const GRUPPE_STYLE: Record<string, { bg: string; border: string; label: string; icon: string }> = {
  Technisch: { bg: 'bg-slate-50',  border: 'border-slate-200',  label: 'text-slate-600',  icon: '⚙' },
  Okulär:    { bg: 'bg-blue-50',   border: 'border-blue-200',   label: 'text-blue-700',   icon: '👁' },
  EMG:       { bg: 'bg-orange-50', border: 'border-orange-200', label: 'text-orange-700', icon: '⚡' },
  Kardio:    { bg: 'bg-rose-50',   border: 'border-rose-200',   label: 'text-rose-700',   icon: '♥' },
  ICU:       { bg: 'bg-violet-50', border: 'border-violet-200', label: 'text-violet-700', icon: '🏥' },
}

type Verdikt = 'ok' | 'passt' | ''

function ArtCard({
  art, verdikt, onVerdikt,
}: { art: ArtDef; verdikt: Verdikt; onVerdikt: (v: Verdikt) => void }) {
  const [open, setOpen] = useState(false)
  const st = GRUPPE_STYLE[art.gruppe]

  return (
    <div className={`rounded-xl border transition-all ${
      verdikt === 'passt' ? 'border-red-300 bg-red-50' :
      verdikt === 'ok'    ? 'border-emerald-200 bg-emerald-50 opacity-80' :
      `${st.border} ${st.bg}`
    }`}>
      <div className="flex items-start gap-3 p-3">
        {/* Gruppe-Icon */}
        <span className="text-base mt-0.5 flex-shrink-0">{st.icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wide ${st.label}`}>{art.gruppe}</span>
            <span className="text-sm font-semibold text-slate-800">{art.name}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{art.key}</p>

          {/* Ausklapp: visuelles Aussehen */}
          {open && (
            <p className="text-xs text-slate-600 mt-1.5 bg-white/80 rounded-lg px-2 py-1.5 border border-current border-opacity-10">
              📐 {art.aussehen}
            </p>
          )}
        </div>

        {/* Info-Toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          className="text-slate-300 hover:text-slate-500 p-1 flex-shrink-0 transition-colors"
          title="Aussehen einblenden"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 16 16">
            <path strokeLinecap="round" d="M4 6l4 4 4-4"/>
          </svg>
        </button>
      </div>

      {/* Verdikt-Buttons */}
      <div className="flex border-t border-current border-opacity-10 divide-x divide-current divide-opacity-10">
        <button
          onClick={() => onVerdikt(verdikt === 'ok' ? '' : 'ok')}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors rounded-bl-xl ${
            verdikt === 'ok'
              ? 'bg-emerald-500 text-white'
              : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
        >
          ✓ Ausgeschlossen
        </button>
        <button
          onClick={() => onVerdikt(verdikt === 'passt' ? '' : 'passt')}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors rounded-br-xl ${
            verdikt === 'passt'
              ? 'bg-red-500 text-white'
              : 'text-slate-500 hover:bg-red-50 hover:text-red-700'
          }`}
        >
          ✗ Passt — Artefakt
        </button>
      </div>

      {/* Artefakt-Bestätigung */}
      {verdikt === 'passt' && (
        <div className="px-3 pb-3">
          <p className="text-xs text-red-700 bg-red-100 rounded-lg px-3 py-2 mt-1">
            Artefakt bestätigt — kein kortikales Phänomen. Bitte dokumentieren und ggf. Ableitung verbessern.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

interface Props {
  value: StepAnswer
  onChange: (v: StepAnswer) => void
  patientAnswer?: string
  lokalisationAnswer?: string
  morphologieAnswer?: string
}

function parse(v: StepAnswer): Record<string, Verdikt> {
  try { if (typeof v === 'string' && v.startsWith('{')) return JSON.parse(v) } catch {}
  return {}
}

export default function StepArtefakte({ value, onChange, patientAnswer, lokalisationAnswer }: Props) {
  const [answer, setAnswer] = useState<Record<string, Verdikt>>(parse(value))

  const vigilanz  = (() => { try { return JSON.parse(patientAnswer ?? '{}').vigilanz ?? '' } catch { return '' } })()
  const regionen: string[] = (() => { try { return JSON.parse(lokalisationAnswer ?? '{}').regionen ?? [] } catch { return [] } })()

  const relevant = filterArts(vigilanz, regionen, vigilanz)
  const gruppen = Array.from(new Set(relevant.map(a => a.gruppe)))

  function setVerdikt(id: string, v: Verdikt) {
    const next = { ...answer, [id]: v }
    setAnswer(next)
    onChange(JSON.stringify(next))
  }

  const nPasst = relevant.filter(a => answer[a.id] === 'passt').length
  const nOk    = relevant.filter(a => answer[a.id] === 'ok').length
  const nOffen = relevant.filter(a => !answer[a.id]).length

  return (
    <div className="space-y-5">

      {/* Kurz-Info */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>{relevant.length} relevante Artefakte für diesen Kontext</span>
        <span className="flex gap-2 ml-auto">
          {nOk > 0 && <span className="text-emerald-600 font-medium">✓ {nOk}</span>}
          {nPasst > 0 && <span className="text-red-600 font-medium">✗ {nPasst}</span>}
          {nOffen > 0 && <span className="text-slate-400">{nOffen} offen</span>}
        </span>
      </div>

      {/* Artefakte nach Gruppe */}
      {gruppen.map(gruppe => (
        <div key={gruppe} className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <span>{GRUPPE_STYLE[gruppe]?.icon}</span> {gruppe}
          </p>
          {relevant
            .filter(a => a.gruppe === gruppe)
            .map(art => (
              <ArtCard
                key={art.id}
                art={art}
                verdikt={answer[art.id] ?? ''}
                onVerdikt={v => setVerdikt(art.id, v)}
              />
            ))}
        </div>
      ))}

      {/* Alles ausgeschlossen */}
      {nOffen === 0 && nPasst === 0 && relevant.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Alle Artefakte ausgeschlossen — weiter zur Differentialdiagnose.
        </div>
      )}

      {/* Kein Kontext → Hinweis */}
      {relevant.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4">
          Keine spezifischen Artefakte für diesen Kontext — technische Basisartefakte immer prüfen.
        </p>
      )}

    </div>
  )
}
