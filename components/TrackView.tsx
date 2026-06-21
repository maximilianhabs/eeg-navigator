'use client'

import { useEffect } from 'react'
import { useRecentlyViewed } from '@/lib/useRecentlyViewed'

export function TrackView({ id }: { id: string }) {
  const { track } = useRecentlyViewed()
  useEffect(() => { track(id) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
