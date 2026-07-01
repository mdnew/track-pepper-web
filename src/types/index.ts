export type HouseholdRole = 'owner' | 'admin' | 'member' | 'guest'

export interface Household {
  id: string
  name: string
  inviteCode: string
}

export interface Profile {
  id: string
  displayName: string
  householdId: string | null
  activeHouseholdId: string | null
}

export interface HouseholdMember {
  userId: string
  householdId: string
  role: HouseholdRole
  displayName: string
  joinedAt: Date
  validFrom: Date | null
  validUntil: Date | null
  validDaysOfWeek: number[] | null
}

export interface HouseholdMembership {
  household: Household
  role: HouseholdRole
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
  planId: string | null
  petId: string | null
  sortOrder: number
  timeLabel: string
  category: string
  title: string
  subtitle: string | null
  icon: string
  section: string
  isCustom?: boolean
}

export interface PetScheduleMeta {
  petId: string
  basePlanId: string | null
  isCustomized: boolean
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

export const TASK_CATEGORIES: TaskCategory[] = [
  'potty',
  'feed',
  'sleep',
  'play',
  'train',
  'wind',
  'night',
  'groom',
  'vet',
  'enrich',
  'note',
]

export const CATEGORY_DEFAULTS: Record<
  TaskCategory,
  { title: string; icon: string; section: string }
> = {
  potty: { title: 'Potty break', icon: '🚽', section: 'Routine' },
  feed: { title: 'Feed', icon: '🍽', section: 'Meals' },
  sleep: { title: 'Nap', icon: '😴', section: 'Rest' },
  play: { title: 'Play', icon: '🎾', section: 'Activity' },
  train: { title: 'Training', icon: '🎓', section: 'Training' },
  wind: { title: 'Wind down', icon: '🌙', section: 'Evening' },
  night: { title: 'Bedtime', icon: '🛏', section: 'Night' },
  groom: { title: 'Grooming', icon: '✂️', section: 'Care' },
  vet: { title: 'Vet / meds', icon: '💊', section: 'Health' },
  enrich: { title: 'Enrichment', icon: '🧩', section: 'Activity' },
  note: { title: 'Note', icon: '📝', section: 'Notes' },
}
