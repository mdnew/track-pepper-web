import { formatDateKey, normalizeDate } from './formatDate'
import type { SchedulePlan } from '../types'

export function parseDateOfBirth(key: string): Date {
  return normalizeDate(new Date(`${key}T00:00:00`))
}

export function formatDateOfBirth(date: Date): string {
  return formatDateKey(date)
}

export function petSpeciesEmoji(species: 'dog' | 'cat'): string {
  return species === 'cat' ? '🐱' : '🐶'
}

export function formatPetAge(dateOfBirth: Date, now = new Date()): string {
  const dob = normalizeDate(dateOfBirth)
  const today = normalizeDate(now)

  if (today < dob) return 'Not born yet'

  const diffDays = Math.floor((today.getTime() - dob.getTime()) / 86_400_000)

  if (diffDays < 14) {
    const weeks = Math.max(1, Math.floor(diffDays / 7))
    return `${weeks} week${weeks === 1 ? '' : 's'} old`
  }

  if (diffDays < 365) {
    const weeks = Math.floor(diffDays / 7)
    if (weeks < 26) {
      return `${weeks} weeks old`
    }
    const months = Math.floor(diffDays / 30.44)
    return `${months} month${months === 1 ? '' : 's'} old`
  }

  const years = Math.floor(diffDays / 365.25)
  const months = Math.floor((diffDays % 365.25) / 30.44)
  if (months === 0) {
    return `${years} year${years === 1 ? '' : 's'} old`
  }
  return `${years}y ${months}mo old`
}

export function formatPetSummary(pet: {
  name: string
  dateOfBirth: Date
  species: 'dog' | 'cat'
}): string {
  return `${petSpeciesEmoji(pet.species)} ${pet.name} · ${formatPetAge(pet.dateOfBirth)}`
}

export function formatPlanPhaseLabel(plan: SchedulePlan): string {
  const parenIndex = plan.name.indexOf(' (')
  if (parenIndex !== -1) {
    return plan.name.slice(0, parenIndex)
  }
  return plan.name
}

export function formatPetSummaryWithPlan(
  pet: {
    name: string
    dateOfBirth: Date
    species: 'dog' | 'cat'
  },
  plan: SchedulePlan | null,
): string {
  const summary = formatPetSummary(pet)
  if (!plan) return summary
  return `${summary} · ${plan.emoji} ${formatPlanPhaseLabel(plan)}`
}

export function formatPetsLine(
  pets: { name: string; dateOfBirth: Date; species: 'dog' | 'cat' }[],
): string | null {
  if (pets.length === 0) return null
  return pets.map(formatPetSummary).join(' · ')
}
