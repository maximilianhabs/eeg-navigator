import Link from 'next/link'
import { getAllWellen, getAllArtefakte } from '@/lib/data'

// ── Schlafstadien-Konfiguration (AASM Berry et al. 2012) ─────────────────────

interface StageSectionItem {
  icon: string
  label: string
  content: string
  highlight?: boolean
}

interface StageEntityRef {
  id: string
  name: string
  note?: string
  isNew?: boolean
}

interface SleepStage {
  id: string
  shortLabel: string
  name: string
  subtitle: string
  aasm: string
  proportion?: string
  color: {
    border: string
    bg: string
    headBg: string
    badge: string
    badgeText: string
    text: string
    tag: string
    tagText: string
  }
  sections: StageSectionItem[]
  entities: StageEntityRef[]
  stagingTip: string
}

const STAGES: SleepStage[] = [
  {
    id: 'N1',
    shortLabel: 'N1',
    name: 'NREM 1',
    subtitle: 'Leichter Übergangschlaf',
    aasm: 'Alpha <50% der Epoche · Low-Voltage Mixed Frequency · Vertex-Wellen',
    proportion: '1–5 %',
    color: {
      border: 'border-yellow-200', bg: 'bg-yellow-50/40', headBg: 'bg-yellow-50',
      badge: 'bg-yellow-100', badgeText: 'text-yellow-800',
      text: 'text-yellow-900', tag: 'bg-yellow-100', tagText: 'text-yellow-800',
    },
    sections: [
      {
        icon: '🧠', label: 'EEG',
        content: 'Alpha-Grundrhythmus fällt auf <50% der Epoche (Zerfall des PDR). Low-Voltage Mixed Frequency (LVMF) dominiert: Theta 4–7 Hz, niedrige Amplitude <50 µV, desynchronisiert. Vertex-Wellen (Scheitelzackenwellen): scharfe, negative Transienten über Cz — bilateral phasenumkehrend, bis 200 µV, nicht epileptiform. POSTS (Positive Occipital Sharp Transients of Sleep): seglartige positive Spitzen okzipital, können bis in N2 persistieren.',
        highlight: true,
      },
      {
        icon: '👁️', label: 'EOG / Augenbewegungen',
        content: 'Slow Eye Movements (SEM / SREM): langsame, sinusförmige, konjugierte Rollbewegungen <0,5 Hz — das erste verlässliche Zeichen des Einschlafens. Im EOG-Kanal gegenphasig F7/F8 sichtbar. Willkürliche Augenbewegungen sistieren.',
      },
      {
        icon: '💪', label: 'EMG-Tonus',
        content: 'Reduziert gegenüber Wachzustand, aber kein vollständiger Tonusverlust. Einschlaf-Myoklonien (hypnische Zuckungen) möglich — benigne, klinisch irrelevant.',
      },
      {
        icon: '🫀', label: 'Autonom / Sonstige',
        content: 'Herzfrequenz leicht sinkend, Atemfrequenz regelmäßig werdend. Körpertemperatur beginnt zu fallen. Betroffene nehmen N1 subjektiv oft noch als "Dösen" oder Wachzustand wahr und schrecken bei geringem Reiz auf.',
      },
    ],
    entities: [
      { id: 'EEG_0025', name: 'Vertex-Wellen' },
      { id: 'EEG_0028', name: 'POSTS' },
      { id: 'EEG_0022', name: 'Hypnagoge Hypersynchronie', note: 'bes. Kinder' },
      { id: 'EEG_0102', name: 'LVMF', note: 'neu' },
      { id: 'ART_041', name: 'Slow Eye Movements', note: 'EOG' },
    ],
    stagingTip: 'N1 erkennen: PDR weg, flache gemischte Theta-Aktivität, erste SEM im EOG — dann Vertex-Wellen als Bestätigung.',
  },
  {
    id: 'N2',
    shortLabel: 'N2',
    name: 'NREM 2',
    subtitle: 'Stabiler Leichtschlaf',
    aasm: '≥1 Schlafspindel oder K-Komplex pro Epoche · Theta-Hintergrund · Delta <20%',
    proportion: '45–55 %',
    color: {
      border: 'border-orange-200', bg: 'bg-orange-50/40', headBg: 'bg-orange-50',
      badge: 'bg-orange-100', badgeText: 'text-orange-800',
      text: 'text-orange-900', tag: 'bg-orange-100', tagText: 'text-orange-800',
    },
    sections: [
      {
        icon: '🧠', label: 'EEG',
        content: 'Schlafspindeln (Sleep Spindles): 11–16 Hz, Crescendo-Decrescendo-Morphologie (Korkenzieher-Muster bipolar), ≥0,5 s, zentroparietal dominant (schnelle Spindeln 13–16 Hz) oder frontal (langsame Spindeln <13 Hz). K-Komplexe: bifasisch, hohe Amplitude (>75 µV); scharfe negative Phase gefolgt von langsamer positiver Phase — oft unmittelbar vor einer Schlafspindel (K-Komplex-Spindel-Sequenz). Theta-Hintergrundaktivität; Delta <20% der Epoche.',
        highlight: true,
      },
      {
        icon: '👁️', label: 'EOG / Augenbewegungen',
        content: 'SEM nachlassend bis absent. Keine Rapid Eye Movements. Augenbewegungen minimal bis fehlend.',
      },
      {
        icon: '💪', label: 'EMG-Tonus',
        content: 'Niedrig, geringer als N1. Kein vollständiges Atonie-Muster.',
      },
      {
        icon: '🫀', label: 'Autonom / Sonstige',
        content: 'Herzfrequenz und Atemfrequenz weiter verlangsamt und regelmäßig. Blutdruck sinkend. Körpertemperatur auf niedrigstem Niveau. K-Komplexe werden durch äußere Reize (Geräusche, Berührung) ausgelöst — Funktion: Schlafschutz und Gedächtniskonsolidierung.',
      },
    ],
    entities: [
      { id: 'EEG_0027', name: 'Schlafspindeln', note: 'EEG-Viewer N2' },
      { id: 'EEG_0026', name: 'K-Komplex', note: 'EEG-Viewer N2' },
      { id: 'EEG_0025', name: 'Vertex-Wellen', note: 'persistiert aus N1' },
      { id: 'EEG_0028', name: 'POSTS', note: 'persistiert aus N1' },
    ],
    stagingTip: 'N2 erkennen: eine Spindel oder ein K-Komplex genügt — beide können schon in der ersten N2-Epoche auftreten. Delta <20% der Epoche, sonst N3.',
  },
  {
    id: 'N3',
    shortLabel: 'N3',
    name: 'NREM 3',
    subtitle: 'Tiefschlaf (Slow Wave Sleep)',
    aasm: 'Delta ≥20% der Epoche · Amplitude >75 µV · 0,5–2 Hz · frontale Dominanz',
    proportion: '15–20 %',
    color: {
      border: 'border-purple-200', bg: 'bg-purple-50/40', headBg: 'bg-purple-50',
      badge: 'bg-purple-100', badgeText: 'text-purple-800',
      text: 'text-purple-900', tag: 'bg-purple-100', tagText: 'text-purple-800',
    },
    sections: [
      {
        icon: '🧠', label: 'EEG',
        content: 'Hochamplitudige synchrone Delta-Wellen (0,5–2 Hz, >75 µV) nehmen ≥20% der Epoche ein. Frontale Dominanz, bilateral symmetrisch. Architektur aus N1/N2 (Vertex-Wellen, POSTS, Spindeln, K-Komplexe) kann erhalten bleiben, wird aber weniger organisiert und verschwindet oft. Bei Kindern und Jugendlichen sehr hohe Voltagen (>200 µV) — physiologisch. Benzodiazepine und Barbiturate reduzieren N3 erheblich.',
        highlight: true,
      },
      {
        icon: '👁️', label: 'EOG / Augenbewegungen',
        content: 'Augenbewegungen vollständig fehlend. Kein EOG-Artefakt erkennbar.',
      },
      {
        icon: '💪', label: 'EMG-Tonus',
        content: 'Sehr niedriger Muskeltonus, maximale Relaxation. Kein vollständiges Atonie-Muster (das ist REM-spezifisch).',
      },
      {
        icon: '🫀', label: 'Autonom / Sonstige',
        content: 'Niedrigste Herzfrequenz der Nacht, tiefste Körpertemperatur, regelmäßige langsame Atmung. Aufweckschwelle sehr hoch. Parasomnien (Somnambulismus, Pavor nocturnus, Schlaftrunkenheit) treten typischerweise aus N3 heraus auf. Wachstumshormon-Ausschüttung maximal. N3 überwiegt im ersten Schlafdrittel.',
      },
    ],
    entities: [
      { id: 'EEG_0101', name: 'Slow Wave Activity N3', note: 'EEG-Viewer N3' },
    ],
    stagingTip: 'N3 erkennen: Delta-Wellen gut sichtbar in >20% der 30-s-Epoche, Amplitude deutlich >75 µV — bei Unsicherheit Cursor über typische Wellen setzen und µV-Wert schätzen.',
  },
  {
    id: 'REM',
    shortLabel: 'R',
    name: 'REM-Schlaf',
    subtitle: 'Traumschlaf · Paradoxer Schlaf',
    aasm: 'REMs + Muskelatonie + Low-Voltage Mixed EEG · Sägezahnwellen frontozentral',
    proportion: '20–25 %',
    color: {
      border: 'border-rose-200', bg: 'bg-rose-50/40', headBg: 'bg-rose-50',
      badge: 'bg-rose-100', badgeText: 'text-rose-800',
      text: 'text-rose-900', tag: 'bg-rose-100', tagText: 'text-rose-800',
    },
    sections: [
      {
        icon: '🧠', label: 'EEG',
        content: 'Desynchronisiertes Low-Voltage Mixed Frequency (LVMF) — ähnelt dem Wach-EEG (daher "paradoxer Schlaf"). Gemischte Theta- und Beta-Aktivität, niedrige Amplitude. Sägezahnwellen (Sawtooth Waves): 2–3 Hz, asymmetrische scharfe Dreiecksform, frontozentral, in kurzen Bursts — oft unmittelbar vor oder während schneller Augenbewegungen. Kein Alpha-Grundrhythmus (oder 1–2 Hz langsamer als Wach).',
        highlight: true,
      },
      {
        icon: '👁️', label: 'EOG / Augenbewegungen',
        content: 'Rapid Eye Movements (REMs): ruckartige, sakkadische, konjugierte Augenbewegungen — definierend für das Stadium. Im Bipolar-EEG als gegenphasige scharfe Wellen F7/F8 sichtbar: Kornea (positiv) bewegt sich zu einer Elektrode hin → positive Deflexion dort, negative auf der Gegenseite. Phasische REMs in Bursts, tonische REM-Phasen dazwischen.',
      },
      {
        icon: '💪', label: 'EMG-Tonus',
        content: 'Muskelatonie (vollständiger Tonusverlust) — niedrigste EMG-Aktivität aller Schlafstadien. Physiologischer Schutzmechanismus gegen Ausagieren von Träumen. Phasische Muskelzuckungen (Extremitäten, Gesicht) möglich. REM-Schlaf-Verhaltensstörung (RBD) bei fehlender Atonie.',
      },
      {
        icon: '🫀', label: 'Autonom / Sonstige',
        content: 'Vegetative Instabilität: Herzfrequenz und Atemfrequenz variabel und unregelmäßig (Gegensatz zu NREM). Penile/klitorale Tumeszenz physiologisch. Traumaktivität maximal. REM-Anteil steigt im Verlauf der Nacht — letztes Schlafdrittel REM-dominiert.',
      },
    ],
    entities: [
      { id: 'EEG_0029', name: 'Sägezahnwellen', note: 'EEG-Viewer REM' },
      { id: 'EEG_0102', name: 'LVMF-Hintergrund' },
      { id: 'ART_002', name: 'Augenbewegungsartefakt (REMs)', note: 'EOG' },
    ],
    stagingTip: 'REM erkennen: LVMF-Hintergrund + REMs im EOG + Atonie im Kinn-EMG. Sägezahnwellen sind pathognomonisch, aber nicht immer prominent. Cave: LVMF allein ohne REMs/Atonie ≠ REM.',
  },
]

// ── Hypnogramm — klassisches Treppenschema (AASM) ────────────────────────────
// Y-Achse: Wach (oben) → REM → N1 → N2 → N3 (unten = tiefer Schlaf)
// X-Achse: Zeit 0–8h (480 min), typische Nacht eines Erwachsenen
// Stufenwechsel = vertikale Transitionen, Stufen = horizontale Linien

// Segment-Sequenz: typische Nacht mit 4–5 NREM-REM-Zyklen à ~90 min
// SWS dominiert 1. Nachthälfte, REM nimmt zu und dominiert 2. Nachthälfte
const HSEGS: { stage: string; start: number; end: number }[] = [
  { stage: 'W',   start: 0,   end: 5   },  //  5 min Einschlafen
  { stage: 'N1',  start: 5,   end: 15  },  // 10 min N1
  { stage: 'N2',  start: 15,  end: 40  },  // 25 min N2
  { stage: 'N3',  start: 40,  end: 90  },  // 50 min N3 — erster langer SWS-Block
  // Zyklus 1 Ende / Zyklus 2 Beginn
  { stage: 'N2',  start: 90,  end: 108 },  // 18 min N2
  { stage: 'REM', start: 108, end: 123 },  // 15 min REM 1 (kurz)
  { stage: 'N2',  start: 123, end: 143 },  // 20 min N2
  { stage: 'N3',  start: 143, end: 175 },  // 32 min N3 — zweiter SWS-Block
  { stage: 'N2',  start: 175, end: 193 },  // 18 min N2
  // Zyklus 2 Ende / Zyklus 3 Beginn
  { stage: 'REM', start: 193, end: 220 },  // 27 min REM 2
  { stage: 'N1',  start: 220, end: 228 },  //  8 min N1
  { stage: 'N2',  start: 228, end: 250 },  // 22 min N2
  { stage: 'N3',  start: 250, end: 268 },  // 18 min N3 — dritter SWS-Block (kürzer)
  { stage: 'N2',  start: 268, end: 283 },  // 15 min N2
  // Zyklus 3 Ende / Zyklus 4 Beginn
  { stage: 'REM', start: 283, end: 320 },  // 37 min REM 3 (länger)
  { stage: 'N2',  start: 320, end: 345 },  // 25 min N2
  // Zyklus 4 Ende / Zyklus 5 Beginn — REM dominiert
  { stage: 'REM', start: 345, end: 400 },  // 55 min REM 4 (längster Block)
  { stage: 'N2',  start: 400, end: 427 },  // 27 min N2
  { stage: 'REM', start: 427, end: 462 },  // 35 min REM 5
  { stage: 'N1',  start: 462, end: 473 },  // 11 min N1
  { stage: 'W',   start: 473, end: 480 },  //  7 min Aufwachen
]

// SVG-Koordinatensystem
// Plot-Bereich: x = 68 → 668 (600px breit), y = 22 → 162 (140px hoch)
const SVG_W = 700
const SVG_H = 220
const PLOT_X0 = 68
const PLOT_X1 = 668
const PLOT_Y0 = 22
const PLOT_Y1 = 162   // untere Grundlinie
const TOTAL_MIN = 480

// Y-Position jedes Stadiums (Mitte der Treppenstufe)
const STAGE_Y: Record<string, number> = {
  W:   30,
  REM: 58,
  N1:  86,
  N2: 114,
  N3: 142,
}

const STAGE_FILL: Record<string, string> = {
  W:   '#e2e8f0',
  REM: '#fecdd3',
  N1:  '#fef9c3',
  N2:  '#ffedd5',
  N3:  '#f3e8ff',
}

const STAGE_STROKE: Record<string, string> = {
  W:   '#94a3b8',
  REM: '#fb7185',
  N1:  '#fbbf24',
  N2:  '#f97316',
  N3:  '#a855f7',
}

function toX(min: number): number {
  return PLOT_X0 + (min / TOTAL_MIN) * (PLOT_X1 - PLOT_X0)
}

// Staircase polyline: alle x,y Punkte der Treppenlinie
function staircasePoints(): string {
  const pts: [number, number][] = []
  HSEGS.forEach((seg, i) => {
    const x1 = toX(seg.start)
    const x2 = toX(seg.end)
    const y  = STAGE_Y[seg.stage]
    if (i === 0) {
      pts.push([x1, y])
    } else {
      const prevY = STAGE_Y[HSEGS[i - 1].stage]
      if (prevY !== y) pts.push([x1, y])   // vertikale Transition
    }
    pts.push([x2, y])                       // horizontale Stufe
  })
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}

// Für jedes Segment ein gefülltes Rect unter der Linie bis zur Y-Baseline des Stadiums
// (nicht bis zum untersten Rand — jede Stufe hat ihre eigene Farbfläche)

function HypnogramSVG() {
  const pts = staircasePoints()
  const hourTicks = [0, 60, 120, 180, 240, 300, 360, 420, 480]

  // REM-Segmente für Beschriftung
  const remSegs = HSEGS.filter(s => s.stage === 'REM')
  const n3Segs  = HSEGS.filter(s => s.stage === 'N3')

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ minWidth: 360 }}>

      {/* Hintergrund-Raster (horizontale Gitternetzlinien pro Stadium) */}
      {Object.entries(STAGE_Y).map(([stage, y]) => (
        <line key={stage} x1={PLOT_X0} y1={y} x2={PLOT_X1} y2={y}
          stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 3" />
      ))}

      {/* Gefüllte Flächen unter der Treppenlinie (farbig pro Stadium) */}
      {HSEGS.map((seg, i) => {
        const x1 = toX(seg.start)
        const x2 = toX(seg.end)
        const y  = STAGE_Y[seg.stage]
        return (
          <rect key={i} x={x1} y={y} width={x2 - x1} height={PLOT_Y1 - y}
            fill={STAGE_FILL[seg.stage]} opacity="0.55" />
        )
      })}

      {/* Treppenlinie */}
      <polyline points={pts} fill="none" stroke="#334155" strokeWidth="1.8"
        strokeLinejoin="miter" strokeLinecap="square" />

      {/* Y-Achse */}
      <line x1={PLOT_X0} y1={PLOT_Y0 - 8} x2={PLOT_X0} y2={PLOT_Y1}
        stroke="#cbd5e1" strokeWidth="1" />

      {/* Y-Achsen-Beschriftungen */}
      {Object.entries(STAGE_Y).map(([stage, y]) => (
        <g key={stage}>
          <rect x={PLOT_X0 - 48} y={y - 8} width={42} height={16} rx="4"
            fill={STAGE_FILL[stage]} stroke={STAGE_STROKE[stage]} strokeWidth="0.8" />
          <text x={PLOT_X0 - 27} y={y + 4} textAnchor="middle"
            fontSize="9" fontWeight="700" fill={STAGE_STROKE[stage]}>
            {stage}
          </text>
        </g>
      ))}

      {/* Schlaftiefe-Pfeil */}
      <text x={PLOT_X0 - 58} y={PLOT_Y0 + 10} fontSize="8" fill="#94a3b8"
        textAnchor="middle" transform={`rotate(-90, ${PLOT_X0 - 58}, ${(PLOT_Y0 + PLOT_Y1) / 2})`}>
        Schlaftiefe ↓
      </text>

      {/* X-Achse */}
      <line x1={PLOT_X0} y1={PLOT_Y1} x2={PLOT_X1} y2={PLOT_Y1}
        stroke="#cbd5e1" strokeWidth="1" />

      {/* Stundenticks */}
      {hourTicks.map(min => {
        const x = toX(min)
        return (
          <g key={min}>
            <line x1={x} y1={PLOT_Y1} x2={x} y2={PLOT_Y1 + 4}
              stroke="#94a3b8" strokeWidth="1" />
            <text x={x} y={PLOT_Y1 + 13} textAnchor="middle"
              fontSize="8.5" fill="#94a3b8">
              {min / 60}h
            </text>
          </g>
        )
      })}

      {/* REM-Beschriftungen (klein, über den REM-Blöcken) */}
      {remSegs.map((seg, i) => {
        const cx = (toX(seg.start) + toX(seg.end)) / 2
        const dur = seg.end - seg.start
        return (
          <text key={i} x={cx} y={STAGE_Y.REM - 5}
            textAnchor="middle" fontSize="7.5" fill="#e11d48" fontWeight="600">
            {dur} min
          </text>
        )
      })}

      {/* N3-Dauer-Labels */}
      {n3Segs.map((seg, i) => {
        const cx = (toX(seg.start) + toX(seg.end)) / 2
        const dur = seg.end - seg.start
        if (dur < 12) return null
        return (
          <text key={i} x={cx} y={STAGE_Y.N3 + 10}
            textAnchor="middle" fontSize="7" fill="#7e22ce">
            {dur} min
          </text>
        )
      })}

      {/* Zyklus-Klammern (unter X-Achse) */}
      {[
        { label: 'Zyklus 1', start: 0,   end: 108 },
        { label: 'Zyklus 2', start: 108, end: 193 },
        { label: 'Zyklus 3', start: 193, end: 283 },
        { label: 'Zyklus 4', start: 283, end: 400 },
        { label: 'Zyklus 5', start: 400, end: 480 },
      ].map(({ label, start, end }) => {
        const x1 = toX(start) + 1
        const x2 = toX(end) - 1
        const cx = (x1 + x2) / 2
        const y  = PLOT_Y1 + 24
        return (
          <g key={label}>
            <line x1={x1} y1={y - 3} x2={x1} y2={y} stroke="#cbd5e1" strokeWidth="1" />
            <line x1={x1} y1={y} x2={x2} y2={y} stroke="#cbd5e1" strokeWidth="1" />
            <line x1={x2} y1={y - 3} x2={x2} y2={y} stroke="#cbd5e1" strokeWidth="1" />
            <text x={cx} y={y + 9} textAnchor="middle" fontSize="7" fill="#94a3b8">
              {label}
            </text>
          </g>
        )
      })}

      {/* Annotationen */}
      {/* SWS-Schwerpunkt erste Nachthälfte */}
      <text x={toX(115)} y={PLOT_Y0 - 4} fontSize="7.5" fill="#7e22ce" fontStyle="italic">
        SWS dominiert 1. Nachthälfte
      </text>
      {/* REM zunehmen zweite Nachthälfte */}
      <text x={toX(350)} y={PLOT_Y0 - 4} fontSize="7.5" fill="#e11d48" fontStyle="italic">
        REM nimmt zu (2. Hälfte)
      </text>
      {/* Erster REM-Zeitpunkt */}
      <text x={toX(108)} y={STAGE_Y.REM - 13} fontSize="7" fill="#94a3b8" textAnchor="middle">
        ~90 min
      </text>
      <line x1={toX(108)} y1={PLOT_Y1} x2={toX(108)} y2={STAGE_Y.REM - 3}
        stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 2" />

    </svg>
  )
}

export default function SchlafPage() {
  const alleWellen = getAllWellen()
  const alleArtefakte = getAllArtefakte()
  const entityMap = Object.fromEntries([
    ...alleWellen.map(e => [e.id, e.name]),
    ...alleArtefakte.map(e => [e.id, e.name]),
  ])

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-slate-900">Schlafstadien & Schlaf-EEG</h1>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 ring-inset rounded-full px-2.5 py-0.5">
            AASM 2012
          </span>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
          Schlafstadien nach AASM (Berry et al. 2012) — EEG, EOG und EMG-Charakteristika für die visuelle Schlafstadien-Klassifikation.
          Ziel: anhand dieser Kriterien das Schlafstadium aus dem Polysomnographie-EEG sicher ermitteln.
        </p>
      </div>

      {/* Hypnogramm */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Typisches Hypnogramm · 8h Nachtschlaf · schematisch
          </span>
        </div>
        <div className="px-2 pt-3 pb-2">
          <HypnogramSVG />
          {/* Legende */}
          <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-slate-100 px-2">
            {(['W', 'REM', 'N1', 'N2', 'N3'] as const).map(stage => (
              <span key={stage} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-3 h-3 rounded-sm flex-shrink-0 border"
                  style={{ background: STAGE_FILL[stage], borderColor: STAGE_STROKE[stage] }} />
                {stage === 'W' ? 'Wach' : stage === 'REM' ? 'REM' : stage}
              </span>
            ))}
            <span className="ml-auto text-[10px] text-slate-400 self-center">
              N3-Anteil nimmt mit Alter ab · REM nimmt zur 2. Nachthälfte hin zu
            </span>
          </div>
        </div>
      </div>

      {/* Staging-Überblick Tabelle */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Schnell-Referenz · AASM-Kriterien</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500 w-16">Stadium</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500">EEG-Merkmal</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500">EOG</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500">EMG</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500 w-16">Anteil</th>
              </tr>
            </thead>
            <tbody>
              {[
                { stage: 'N1', eeg: 'LVMF 4–7 Hz, Vertex-Wellen, POSTS; Alpha <50%', eog: 'SEM (langsam, rollend)', emg: 'Reduziert', ant: '1–5%', color: '#fef08a' },
                { stage: 'N2', eeg: 'Schlafspindeln 11–16 Hz, K-Komplexe; Delta <20%', eog: 'Minimal/fehlend', emg: 'Niedrig', ant: '45–55%', color: '#fdba74' },
                { stage: 'N3', eeg: 'Delta 0,5–2 Hz, >75 µV, ≥20% der Epoche', eog: 'Fehlend', emg: 'Sehr niedrig', ant: '15–20%', color: '#d8b4fe' },
                { stage: 'REM', eeg: 'LVMF; Sägezahnwellen 2–3 Hz frontozentral', eog: 'REMs (rapid, sakkadisch)', emg: 'Atonie', ant: '20–25%', color: '#fda4af' },
              ].map(row => (
                <tr key={row.stage} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-bold" style={{ background: row.color }}>
                      {row.stage}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{row.eeg}</td>
                  <td className="px-3 py-2.5 text-slate-600">{row.eog}</td>
                  <td className="px-3 py-2.5 text-slate-600">{row.emg}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-500">{row.ant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stadien-Karten */}
      <div className="space-y-6">
        <h2 className="text-base font-semibold text-slate-700">Detailansicht nach Stadium</h2>

        {STAGES.map(stage => (
          <div key={stage.id} className={`rounded-xl border ${stage.color.border} ${stage.color.bg} overflow-hidden`}>

            {/* Karten-Header */}
            <div className={`${stage.color.headBg} px-5 py-4 border-b ${stage.color.border}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${stage.color.badgeText} ${stage.color.badge} rounded-full px-2.5 py-0.5`}>
                      {stage.id}
                    </span>
                    {stage.proportion && (
                      <span className="text-xs text-slate-500 font-mono">{stage.proportion} der Schlafzeit</span>
                    )}
                  </div>
                  <h3 className={`text-lg font-bold ${stage.color.text}`}>{stage.name}</h3>
                  <p className="text-sm text-slate-500">{stage.subtitle}</p>
                </div>
                <div className="text-xs text-slate-500 max-w-sm">
                  <span className="font-semibold text-slate-600">AASM-Kriterium: </span>
                  {stage.aasm}
                </div>
              </div>
            </div>

            {/* Signalabschnitte */}
            <div className="px-5 py-4 grid gap-3 sm:grid-cols-2">
              {stage.sections.map(sec => (
                <div
                  key={sec.label}
                  className={`rounded-lg px-4 py-3 ${sec.highlight ? 'bg-white/80 shadow-sm ring-1 ring-black/5' : 'bg-white/50'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-base">{sec.icon}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{sec.label}</span>
                    {sec.highlight && (
                      <span className="ml-auto text-[9px] font-semibold bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">
                        Staging-Kriterium
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{sec.content}</p>
                </div>
              ))}
            </div>

            {/* Entities + Staging-Tipp */}
            <div className={`px-5 pb-4 flex flex-wrap items-start justify-between gap-4 border-t ${stage.color.border} pt-4`}>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Verknüpfte Entitäten</p>
                <div className="flex flex-wrap gap-1.5">
                  {stage.entities.map(ref => {
                    const isArt = ref.id.startsWith('ART_')
                    return (
                      <Link
                        key={ref.id}
                        href={`/entity/${ref.id}`}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:shadow-sm
                          ${stage.color.tag} ${stage.color.tagText} hover:ring-1 hover:ring-current/20`}
                      >
                        <span className="font-mono text-[9px] opacity-60">{ref.id}</span>
                        {entityMap[ref.id] ?? ref.name}
                        {ref.note && <span className="opacity-60">· {ref.note}</span>}
                        {isArt && <span className="text-[9px] opacity-50">Artefakt</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>
              <div className="max-w-xs">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Staging-Tipp</p>
                <p className="text-xs text-slate-600 leading-relaxed italic">{stage.stagingTip}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Wichtige Übergänge */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Kritische Übergänge & Fallstricke</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: 'Wach → N1', body: 'Alpha-Zerfall: PDR-Amplitude sinkt, Frequenz kann leicht verlangsamen. Erste SEM im EOG — oft noch bevor Alpha <50%. RMTD (EEG_0033) kann Theta-Aktivität in N1 imitieren.' },
            { title: 'N1 → N2', body: 'Erste Spindel oder K-Komplex beendet N1. POSTS und Vertex-Wellen persistieren in N2 — nicht fehldeuten. Keine Mindestanzahl von Spindeln für N2 gefordert: eine genügt.' },
            { title: 'N2 → N3', body: 'Delta-Wellen (>75 µV) nehmen ≥20% der Epoche ein. Spindeln werden seltener, können aber erhalten bleiben. Cave: Benzodiazepine hemmen N3 — SWS-Mangel trotz langer Schlafzeit.' },
            { title: 'N3 → REM', body: 'Häufig über N2 als Zwischenstadium. LVMF-Hintergrund wie N1, aber entscheidend: REMs und Atonie. Sägezahnwellen als Hinweis. REM-Anteil steigt im späten Schlaf.' },
          ].map(item => (
            <div key={item.title} className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-700 mb-1">→ {item.title}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hinweis */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
        <p className="text-xs font-semibold text-slate-500 mb-1">Geplante Erweiterungen</p>
        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
          <li>Interaktive Schlafstadien-Klassifikation an Beispiel-Epochen</li>
          <li>Schlaf-Scoring-Modus im EEG-Viewer (30-s-Epoche, manuelle Stadien-Zuweisung)</li>
          <li>Arousal-Reaktionen und Mikro-Arousals</li>
          <li>Somnolenz / Vigilanzreduktion als expliziter Übergangszustand</li>
          <li>Pediatric sleep scoring (altersabhängige Normwerte, Hypnagoge Hypersynchronie)</li>
        </ul>
      </div>

    </div>
  )
}
