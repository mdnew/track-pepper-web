import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'

import type { Profile } from '../types'
import { authService } from '../services/auth'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  pendingPasswordRecovery: boolean
  refreshProfile: () => Promise<void>
  clearPasswordRecovery: () => void
  setPasswordRecovery: (value: boolean) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [pendingPasswordRecovery, setPendingPasswordRecovery] = useState(false)

  const refreshProfile = useCallback(async () => {
    if (!supabase || !session) {
      setProfile(null)
      return
    }
    const next = await authService.getProfile()
    setProfile(next)
  }, [session])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setProfile(null)
    setPendingPasswordRecovery(false)
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      if (event === 'PASSWORD_RECOVERY') {
        setPendingPasswordRecovery(true)
      }
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setPendingPasswordRecovery(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    let mounted = true
    setProfileLoading(true)

    refreshProfile()
      .catch(() => {
        if (mounted) setProfile(null)
      })
      .finally(() => {
        if (mounted) setProfileLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [session, refreshProfile])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileLoading,
      pendingPasswordRecovery,
      refreshProfile,
      clearPasswordRecovery: () => setPendingPasswordRecovery(false),
      setPasswordRecovery: setPendingPasswordRecovery,
      signOut,
    }),
    [session, profile, loading, profileLoading, pendingPasswordRecovery, refreshProfile, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
