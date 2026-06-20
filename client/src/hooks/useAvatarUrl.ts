import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAvatarUrl(userId: string | null | undefined) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvatarUrl(null)
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setAvatarUrl(data?.avatar_url ?? null)
      })
    return () => { cancelled = true }
  }, [userId])

  return [avatarUrl, setAvatarUrl] as const
}