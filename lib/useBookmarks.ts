'use client'

import { useLocalStorage } from './useLocalStorage'

const KEY = 'eeg_bookmarks'

export function useBookmarks() {
  const [ids, setIds] = useLocalStorage<string[]>(KEY, [])

  const toggle = (id: string) => {
    setIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const isBookmarked = (id: string) => ids.includes(id)

  return { ids, toggle, isBookmarked }
}
