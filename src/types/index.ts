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

export interface ScheduleTask {
  id: string
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
