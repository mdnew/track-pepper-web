import type { Pet, PetSpecies, SchedulePlan } from '../types'
import { normalizeDate } from './formatDate'

export function petAgeDays(dateOfBirth: Date, referenceDate = new Date()): number {
  const dob = normalizeDate(dateOfBirth)
  const ref = normalizeDate(referenceDate)
  if (ref < dob) return 0
  return Math.floor((ref.getTime() - dob.getTime()) / 86_400_000)
}

export function resolveSchedulePlan(
  plans: SchedulePlan[],
  species: PetSpecies,
  ageDays: number,
): SchedulePlan | null {
  const speciesPlans = plans
    .filter((plan) => plan.species === species)
    .sort((a, b) => b.minAgeDays - a.minAgeDays)

  for (const plan of speciesPlans) {
    if (ageDays >= plan.minAgeDays) {
      if (plan.maxAgeDays == null || ageDays < plan.maxAgeDays) {
        return plan
      }
    }
  }

  return speciesPlans.at(-1) ?? null
}

export function resolvePlanForPet(
  plans: SchedulePlan[],
  pet: Pet,
  referenceDate = new Date(),
): SchedulePlan | null {
  return resolveSchedulePlan(
    plans,
    pet.species,
    petAgeDays(pet.dateOfBirth, referenceDate),
  )
}
