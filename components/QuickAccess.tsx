'use client'

import Link from 'next/link'
import { useRecentlyViewed } from '@/lib/useRecentlyViewed'
import { useBookmarks } from '@/lib/useBookmarks'

interface EntityMini { id: string; name: string }

export function QuickAccess({ allEntities }: { allEntities: EntityMini[] }) {
  const { ids: recentIds } = useRecentlyViewed()
  const { ids: bookmarkIds } = useBookmarks()

  const resolve = (ids: string[]) =>
    ids.map(id => allEntities.find(e => e.id === id)).filter(Boolean) as EntityMini[]

  const recent    = resolve(recentIds)
  const bookmarks = resolve(bookmarkIds)

  if (recent.length === 0 && bookmarks.length === 0) return null

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {bookmarks.length > 0 && (
        <QuickSection
          icon="★"
          label="Lesezeichen"
          color="var(--brand)"
          items={bookmarks}
        />
      )}
      {recent.length > 0 && (
        <QuickSection
          icon="◷"
          label="Zuletzt angesehen"
          color="var(--text-tertiary)"
          items={recent}
        />
      )}
    </div>
  )
}

function QuickSection({ icon, label, color, items }: {
  icon: string; label: string; color: string; items: EntityMini[]
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
          {icon} {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(e => (
          <Link key={e.id} href={`/entity/${e.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-all hover:-translate-y-0.5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}>
            {e.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
