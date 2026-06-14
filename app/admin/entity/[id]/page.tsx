import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getWelleById, getArtefaktById } from '@/lib/data'
import { isWaveEntity } from '@/lib/types'
import EntityEditorForm from '@/components/admin/EntityEditorForm'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const entity = getWelleById(id) ?? getArtefaktById(id)
  return { title: `Editieren: ${entity?.name ?? id}` }
}

export default async function AdminEntityPage({ params }: Props) {
  const { id } = await params
  const entity = getWelleById(id) ?? getArtefaktById(id)
  if (!entity) notFound()

  const isWave = isWaveEntity(entity)

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/admin"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:-translate-x-0.5"
          style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
          Admin
        </Link>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>/</span>
        <span className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>{entity.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{entity.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}>
              {entity.id}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              entity.data_status === 'complete' || entity.data_status === 'verified'
                ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {entity.data_status}
            </span>
            <span className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
              {isWave ? 'Welle' : 'Artefakt'}
            </span>
          </div>
        </div>
        <Link href={`/entity/${entity.id}`}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-blue-50"
          style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
          target="_blank">
          Ansicht ↗
        </Link>
      </div>

      {/* Form */}
      <EntityEditorForm entity={entity} />
    </div>
  )
}
