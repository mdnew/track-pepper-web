export interface Household {
  id: string
  name: string
  inviteCode: string
}

export interface Profile {
  id: string
  displayName: string
  householdId: string | null
}

export interface Pet {
  id: string
  householdId: string
  name: string
  dateOfBirth: Date
  species: PetSpecies
}

export type PetSpecies = 'dog' | 'cat'

export interface SchedulePlan {
  id: string
  species: PetSpecies
  name: string
  emoji: string
  introTitle: string | null
  introDescription: string | null
  tipsTitle: string | null
  tipsBody: string | null
  minAgeDays: number
  maxAgeDays: number | null
}

export interface ScheduleTask {
  id: string
  planId: string
  sortOrder: number
  timeLabel: string
  category: string
  title: string
  subtitle: string | null
  icon: string
  section: string
}

export interface Completion {
  id: string
  householdId: string
  petId: string
  taskId: string
  date: Date
  completedBy: string
  completedAt: Date
  completedByName: string | null
}

export type TaskCategory =
  | 'potty'
  | 'feed'
  | 'sleep'
  | 'play'
  | 'train'
  | 'wind'
  | 'night'
  | 'groom'
  | 'vet'
  | 'enrich'
  | 'note'
