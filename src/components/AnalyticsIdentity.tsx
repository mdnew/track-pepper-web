import { useEffect } from 'react'

import { useAuth } from '../context/AuthContext'
import { setAnalyticsUser } from '../utils/analytics'

export function AnalyticsIdentity() {
  const { user, profile } = useAuth()

  useEffect(() => {
    setAnalyticsUser(user?.id ?? null, {
      has_household: profile?.activeHouseholdId || profile?.householdId ? 'true' : 'false',
      household_id: profile?.activeHouseholdId ?? profile?.householdId ?? undefined,
    })
  }, [user?.id, profile?.householdId])

  return null
}
