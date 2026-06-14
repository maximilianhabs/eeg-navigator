import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAllWellen, getAllArtefakte } from '@/lib/data'
import AdminLoginForm from '@/components/admin/AdminLoginForm'
import Link from 'next/link'

export default async function AdminPage() {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) return <AdminLoginForm />

  const wellen = getAllWellen()
  const artefakte = getAllArtefakte()
  const partials = [
    ...wellen.filter(e => e.data_status !== 'complete' && e.data_status !== 'verified'),
    ...artefakte.filter(e => e.data_status !== 'complete' && e.data_status !== 'verified'),
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Entity Editor</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {wellen.length} Wellen · {artefakte.length} Artefakte
          </p>
        </div>
        <a href="/api/admin/logout"
          className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border)' }}>
          Abmelden
        </a>
      </div>

      {/* Unvollständige Entitäten */}
      {partials.length > 0 && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-amber-800">
              ⚠ Unvollständig ({partials.length})
            </span>
            <span className="text-xs text-amber-600">— bitte ergänzen vor Release</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {partials.map(e => (
              <Link key={e.id} href={`/admin/entity/${e.id}`}
                className="flex items-center gap-2 rounded-lg bg-white border border-amber-200 px-3 py-2 hover:border-amber-400 hover:shadow-sm transition-all group">
                <span className="font-mono text-[10px] text-amber-600 w-16 flex-shrink-0">{e.id}</span>
                <span className="text-xs text-slate-700 flex-1 truncate">{e.name}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{e.data_status}</span>
                <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Alle Wellen */}
      <EntityList title="Wellen" count={wellen.length} entities={wellen} />

      {/* Alle Artefakte */}
      <EntityList title="Artefakte" count={artefakte.length} entities={artefakte} />

    </div>
  )
}

function EntityList({ title, count, entities }: {
  title: string
  count: number
  entities: Array<{ id: string; name: string; data_status: string }>
}) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>{count}</span>
      </div>
      <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
        {entities.map(e => (
          <Link key={e.id} href={`/admin/entity/${e.id}`}
            className="flex items-center gap-3 px-4 py-2.5 transition-colors group"
            style={{ backgroundColor: 'var(--bg-surface)' }}
            onMouseEnter={undefined}>
            <span className="font-mono text-[10px] w-18 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{e.id}</span>
            <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{e.name}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              e.data_status === 'complete' || e.data_status === 'verified'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {e.data_status}
            </span>
            <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-30 group-hover:opacity-70 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
