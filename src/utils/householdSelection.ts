const ACTIVE_KEY = 'trackpepper:activeHouseholdId'

export function readActiveHouseholdId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}

export function writeActiveHouseholdId(householdId: string) {
  try {
    localStorage.setItem(ACTIVE_KEY, householdId)
  } catch {
    // ignore storage failures
  }
}

export function resolveActiveHouseholdId(
  memberships: { household: { id: string } }[],
  preferredId?: string | null,
  profileActiveId?: string | null,
): string | null {
  if (memberships.length === 0) return null
  const ids = new Set(memberships.map((m) => m.household.id))
  const fromProfile = profileActiveId && ids.has(profileActiveId) ? profileActiveId : null
  const fromStorage = preferredId && ids.has(preferredId) ? preferredId : null
  return fromProfile ?? fromStorage ?? memberships[0]?.household.id ?? null
}
