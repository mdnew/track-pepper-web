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

import type { HouseholdMembership, HouseholdRole, Profile } from '../types'
import { authService } from '../services/auth'
import { supabase } from '../lib/supabase'
import {
  readActiveHouseholdId,
  resolveActiveHouseholdId,
  writeActiveHouseholdId,
} from '../utils/householdSelection'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  memberships: HouseholdMembership[]
  activeHouseholdId: string | null
  currentRole: HouseholdRole | null
  loading: boolean
  profileLoading: boolean
  pendingPasswordRecovery: boolean
  refreshProfile: () => Promise<void>
  refreshMemberships: () => Promise<void>
  setActiveHousehold: (householdId: string) => Promise<void>
  clearPasswordRecovery: () => void
  setPasswordRecovery: (value: boolean) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [memberships, setMemberships] = useState<HouseholdMembership[]>([])
  const [activeHouseholdId, setActiveHouseholdIdState] = useState<string | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [pendingPasswordRecovery, setPendingPasswordRecovery] = useState(false)

  const refreshMemberships = useCallback(async () => {
    if (!supabase || !session) {
      setMemberships([])
      setActiveHouseholdIdState(null)
      return
    }

    const nextMemberships = await authService.getMemberships()
    setMemberships(nextMemberships)

    const nextProfile = profile ?? (await authService.getProfile())
    const resolved = resolveActiveHouseholdId(
      nextMemberships,
      readActiveHouseholdId(),
      nextProfile?.activeHouseholdId ?? nextProfile?.householdId,
    )

    if (resolved) {
      writeActiveHouseholdId(resolved)
    }
    setActiveHouseholdIdState(resolved)
  }, [session, profile])

  const refreshProfile = useCallback(async () => {
    if (!supabase || !session) {
      setProfile(null)
      setMemberships([])
      setActiveHouseholdIdState(null)
      return
    }

    const next = await authService.getProfile()
    setProfile(next)

    const nextMemberships = await authService.getMemberships()
    setMemberships(nextMemberships)

    const resolved = resolveActiveHouseholdId(
      nextMemberships,
      readActiveHouseholdId(),
      next?.activeHouseholdId ?? next?.householdId,
    )

    if (resolved) {
      writeActiveHouseholdId(resolved)
    }
    setActiveHouseholdIdState(resolved)
  }, [session])

  const setActiveHousehold = useCallback(
    async (householdId: string) => {
      await authService.setActiveHousehold(householdId)
      writeActiveHouseholdId(householdId)
      setActiveHouseholdIdState(householdId)
      const next = await authService.getProfile()
      setProfile(next)
    },
    [],
  )

  const signOut = useCallback(async () => {
    await authService.signOut()
    setProfile(null)
    setMemberships([])
    setActiveHouseholdIdState(null)
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
        setMemberships([])
        setActiveHouseholdIdState(null)
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
      setMemberships([])
      setActiveHouseholdIdState(null)
      setProfileLoading(false)
      return
    }

    let mounted = true
    setProfileLoading(true)

    refreshProfile()
      .catch(() => {
        if (mounted) {
          setProfile(null)
          setMemberships([])
          setActiveHouseholdIdState(null)
        }
      })
      .finally(() => {
        if (mounted) setProfileLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [session, refreshProfile])

  const currentRole = useMemo(() => {
    if (!activeHouseholdId) return null
    return (
      memberships.find((m) => m.household.id === activeHouseholdId)?.role ?? null
    )
  }, [memberships, activeHouseholdId])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      memberships,
      activeHouseholdId,
      currentRole,
      loading,
      profileLoading,
      pendingPasswordRecovery,
      refreshProfile,
      refreshMemberships,
      setActiveHousehold,
      clearPasswordRecovery: () => setPendingPasswordRecovery(false),
      setPasswordRecovery: setPendingPasswordRecovery,
      signOut,
    }),
    [
      session,
      profile,
      memberships,
      activeHouseholdId,
      currentRole,
      loading,
      profileLoading,
      pendingPasswordRecovery,
      refreshProfile,
      refreshMemberships,
      setActiveHousehold,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
