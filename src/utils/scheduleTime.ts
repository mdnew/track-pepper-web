import { parse } from 'date-fns'

import type { ScheduleTask } from '../types'

export function scheduleMinutesFromLabel(timeLabel: string): number | null {
  const trimmed = timeLabel.trim().replace(/^~+/, '')
  if (!trimmed || !/\d/.test(trimmed) || !/(am|pm)/i.test(trimmed)) {
    return null
  }

  const parsed = parse(trimmed, 'h:mm a', new Date())
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.getHours() * 60 + parsed.getMinutes()
}

export function sortTasksChronologically(tasks: ScheduleTask[]): ScheduleTask[] {
  return [...tasks].sort((a, b) => {
    const aMinutes = scheduleMinutesFromLabel(a.timeLabel)
    const bMinutes = scheduleMinutesFromLabel(b.timeLabel)

    if (aMinutes != null && bMinutes != null) return aMinutes - bMinutes
    if (aMinutes != null) return -1
    if (bMinutes != null) return 1
    return a.sortOrder - b.sortOrder
  })
}

export function currentTimeInsertIndex(
  sortedTasks: ScheduleTask[],
  now: Date,
): number {
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  let lastClockIndex = -1

  for (let i = 0; i < sortedTasks.length; i++) {
    const minutes = scheduleMinutesFromLabel(sortedTasks[i].timeLabel)
    if (minutes == null) continue
    lastClockIndex = i
    if (minutes > nowMinutes) return i
  }

  return lastClockIndex >= 0 ? sortedTasks.length : 0
}
