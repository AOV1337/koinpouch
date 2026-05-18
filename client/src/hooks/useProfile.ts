import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, SellerProfile } from '../types/profile'
import { useAuth } from './useAuth'

interface UseProfileReturn {
  profile: Profile | null
  sellerProfile: SellerProfile | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setSellerProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData as Profile)

      if (profileData?.role === 'seller') {
        const { data: sellerData, error: sellerError } = await supabase
          .from('seller_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (sellerError && sellerError.code !== 'PGRST116') {
          throw sellerError
        }

        setSellerProfile(sellerData as SellerProfile ?? null)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile()
  }, [fetchProfile])

  return { profile, sellerProfile, loading, error, refetch: fetchProfile }
}