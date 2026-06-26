const STORAGE_KEY = 'trackpepper:selectedPetId'

export function readSelectedPetId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeSelectedPetId(petId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, petId)
  } catch {
    // ignore storage failures
  }
}

export function resolveSelectedPetId(
  pets: { id: string }[],
  preferredId?: string | null,
): string | null {
  if (pets.length === 0) return null
  const fromQuery = preferredId ?? readSelectedPetId()
  if (fromQuery && pets.some((pet) => pet.id === fromQuery)) {
    return fromQuery
  }
  return pets[0]?.id ?? null
}
