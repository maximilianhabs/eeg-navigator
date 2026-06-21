'use client'

import { useLocalStorage } from './useLocalStorage'

const KEY = 'eeg_recently_viewed'
const MAX = 8

export function useRecentlyViewed() {
  const [ids, setIds] = useLocalStorage<string[]>(KEY, [])

  const track = (id: string) => {
    setIds(prev => [id, ...prev.filter(x => x !== id)].slice(0, MAX))
  }

  return { ids, track }
}
