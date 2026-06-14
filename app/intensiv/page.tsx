import Link from 'next/link'
import { getAllWellen } from '@/lib/data'

// ICU-relevante Entity-IDs aus wellen.json
const ICU_ENTITY_IDS = [
  'EEG_0059', // LPDs
  'EEG_0060', // GPDs
  'EEG_0061', // BIPDs
  'EEG_0063', // LRDA
  'EEG_0064', // GRDA
  'EEG_0065', // BIRDs
  'EEG_0067', // Triphasische Wellen
  'EEG_0068', // Bursts
  'EEG_0069', // Burst-Suppression
  'EEG_0070', // Alpha-Koma
  'EEG_0071', // Spindel-Koma
  'EEG_0072', // Beta-Koma
  'EEG_0073', // Burst-Attenuation
  'EEG_0013', // Elektrozerebrale Inaktivität
  'EEG_0011', // Grundrhythmus-Suppression
  'EEG_0099', // NCSE
  'EEG_0100', // GCSE Treiman
]

const ACNS_GROUPS: {
  label: string
  color: string
  bgColor: string
  borderColor: string
  ids: string[]
  description: string
}[] = [
  {
    label: 'Hochmaligne',
    color: 'text-red-800',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'ACNS Highly Malignant — sehr schlechte Prognose, oft irreversibler Hirnschaden',
    ids: ['EEG_0069', 'EEG_0073', 'EEG_0013', 'EEG_0099', 'EEG_0100'],
  },
  {
    label: 'Maligne',
    color: 'text-orange-800',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'ACNS Malignant — signifikant pathologisch, Therapieentscheidung erforderlich',
    ids: ['EEG_0070', 'EEG_0071', 'EEG_0072', 'EEG_0059', 'EEG_0060', 'EEG_0061', 'EEG_0063', 'EEG_0064', 'EEG_0067', 'EEG_0011'],
  },
  {
    label: 'Kontextabhängig / Indeterminate',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'ACNS Indeterminate / Context-dependent — Bedeutung abhängig von Ätiologie und klinischem Kontext',
    ids: ['EEG_0065', 'EEG_0068'],
  },
]

export default function IntensivPage() {
  const alleWellen = getAllWellen()
  const entityMap = Object.fromEntries(alleWellen.map(e => [e.id, e]))

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-slate-900">Intensiv & Bewusstseinsstörungen</h1>
          <span className="text-xs font-semibold bg-amber-100 text-amber-700 ring-1 ring-amber-200 ring-inset rounded-full px-2.5 py-0.5">
            In Entwicklung
          </span>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
          Maligne EEG-Muster nach ACNS Standardized Critical Care EEG Terminology 2021 (Hirsch et al.).
          Konzeptseite — vollständige Implementierung mit Vigilanz-Spektrum, Ätiologie-Tabs und
          Salzburger Kriterien folgt in einer späteren Version.
        </p>
      </div>

      {/* NCSE Wizard CTA */}
      <Link
        href="/intensiv/ncse"
        className="flex items-center justify-between rounded-2xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 px-5 py-4 hover:border-red-300 hover:shadow-sm transition-all group"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-red-600 text-white rounded-full px-2 py-0.5">NEU</span>
            <span className="text-sm font-bold text-red-800">NCSE-Klassifikator</span>
          </div>
          <p className="text-xs text-red-600 leading-relaxed">
            Interaktiver Wizard · Salzburger Kriterien · ACNS 2021
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            GPDs / LPDs / GRDA / LRDA → Definitiv NCSE · IIUZ · Kein NCSE
          </p>
        </div>
        <svg className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
        </svg>
      </Link>

      {/* Konzept-Hinweis */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800 leading-relaxed">
        <strong>Geplante Struktur:</strong> Vigilanz-Spektrum (Wach → Enzephalopathie → Koma) ·
        ACNS-Malignitätsgruppen · Ätiologie-Tabs (HIBI / Metabolisch / Status epilepticus) ·
        Reaktivitäts-Assessment
      </div>

      {/* ACNS-Gruppen */}
      <div className="space-y-6">
        <h2 className="text-base font-semibold text-slate-700">ACNS-Klassifikation nach Malignitätsgrad</h2>

        {ACNS_GROUPS.map(group => {
          const entities = group.ids.map(id => entityMap[id]).filter(Boolean)
          return (
            <div key={group.label} className={`rounded-xl border ${group.borderColor} ${group.bgColor} p-5`}>
              <div className="flex items-baseline gap-3 mb-1">
                <span className={`text-sm font-bold ${group.color}`}>{group.label}</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">{group.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {entities.map(e => (
                  <Link
                    key={e.id}
                    href={`/entity/${e.id}`}
                    className="flex items-start gap-3 rounded-lg border border-white/80 bg-white/70 px-3 py-2.5 hover:bg-white hover:shadow-sm transition-all"
                  >
                    <span className="mt-0.5 text-[10px] font-mono text-slate-400 flex-shrink-0">{e.id}</span>
                    <span className="text-xs font-medium text-slate-700 leading-snug">{e.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Anfallsmuster im ICU-Kontext */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Anfallsmuster im ICU-Kontext</h2>
        <p className="text-xs text-slate-400 mb-4">
          Nicht-konvulsiver Status epilepticus (NCSE) und GCSE — Diagnose nach Salzburger Kriterien
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {['EEG_0098', 'EEG_0099', 'EEG_0100'].map(id => {
            const e = entityMap[id]
            if (!e) return null
            return (
              <Link
                key={id}
                href={`/entity/${id}`}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all"
              >
                <span className="mt-0.5 text-[10px] font-mono text-slate-400 flex-shrink-0">{e.id}</span>
                <span className="text-xs font-medium text-slate-700 leading-snug">{e.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Fehlende Entities — Hinweis */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
        <p className="text-xs font-semibold text-slate-500 mb-2">Noch nicht implementiert (geplant)</p>
        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
          <li>EEG_0087 Suppressed Background (&lt;10 µV) — Highly Malignant</li>
          <li>EEG_0088 Low-Voltage Continuous Background (10–20 µV) — Malignant</li>
          <li>EEG_0089 Diskontinuierlicher Hintergrund (ICU) — Malignant</li>
          <li>EEG_0090 EEG-Reaktivität / fehlende Reaktivität — Prognose-Modifier</li>
          <li>Vigilanz-Spektrum mit Ätiologie-Tabs</li>
        </ul>
      </div>

    </div>
  )
}
