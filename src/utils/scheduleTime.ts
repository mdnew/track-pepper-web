import { parse } from 'date-fns'

import type { ScheduleTask } from '../types'

export function scheduleMinutesFromLabel(timeLabel: string): number {
  const parsed = parse(timeLabel.trim(), 'h:mm a', new Date())
  return parsed.getHours() * 60 + parsed.getMinutes()
}

export function sortTasksChronologically(tasks: ScheduleTask[]): ScheduleTask[] {
  return [...tasks].sort(
    (a, b) =>
      scheduleMinutesFromLabel(a.timeLabel) -
      scheduleMinutesFromLabel(b.timeLabel),
  )
}

export function currentTimeInsertIndex(
  sortedTasks: ScheduleTask[],
  now: Date,
): number {
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  for (let i = 0; i < sortedTasks.length; i++) {
    if (scheduleMinutesFromLabel(sortedTasks[i].timeLabel) > nowMinutes) {
      return i
    }
  }
  return sortedTasks.length
}
