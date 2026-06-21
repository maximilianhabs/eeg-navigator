'use client'

import { useBookmarks } from '@/lib/useBookmarks'

export function BookmarkButton({ id, name }: { id: string; name: string }) {
  const { toggle, isBookmarked } = useBookmarks()
  const saved = isBookmarked(id)

  return (
    <button
      onClick={() => toggle(id)}
      title={saved ? 'Lesezeichen entfernen' : 'Als Favorit merken'}
      aria-label={saved ? 'Lesezeichen entfernen' : 'Als Favorit merken'}
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-all"
      style={{
        backgroundColor: saved ? 'var(--brand-light)' : 'var(--bg-subtle)',
        borderColor: saved ? 'var(--brand)' : 'var(--border)',
        color: saved ? 'var(--brand)' : 'var(--text-tertiary)',
      }}
    >
      <svg className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"/>
      </svg>
    </button>
  )
}
