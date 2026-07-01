const STORAGE_PREFIX = 'trackpepper:selectedPetId'

function storageKey(householdId: string) {
  return `${STORAGE_PREFIX}:${householdId}`
}

export function readSelectedPetId(householdId?: string | null): string | null {
  try {
    if (householdId) {
      return localStorage.getItem(storageKey(householdId))
    }
    return localStorage.getItem(`${STORAGE_PREFIX}:legacy`)
  } catch {
    return null
  }
}

export function writeSelectedPetId(householdId: string, petId: string) {
  try {
    localStorage.setItem(storageKey(householdId), petId)
  } catch {
    // ignore storage failures
  }
}

export function resolveSelectedPetId(
  pets: { id: string }[],
  preferredId?: string | null,
): string | null {
  if (pets.length === 0) return null
  if (preferredId && pets.some((pet) => pet.id === preferredId)) {
    return preferredId
  }
  return pets[0]?.id ?? null
}
