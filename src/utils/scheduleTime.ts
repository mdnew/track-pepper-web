import { format, parse } from 'date-fns'

import type { ScheduleTask } from '../types'

export function timeLabelToInputValue(timeLabel: string): string {
  const minutes = scheduleMinutesFromLabel(timeLabel)
  if (minutes == null) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function inputValueToTimeLabel(inputValue: string): string | null {
  if (!inputValue.trim()) return null
  const [hoursPart, minutesPart] = inputValue.split(':')
  const hours = Number(hoursPart)
  const minutes = Number(minutesPart)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return format(date, 'h:mm a')
}

export function sanitizeTimeLabelInput(value: string): string {
  return value.replace(/[^\d:apmAPM~\s]/g, '')
}

export function isValidTimeLabel(timeLabel: string): boolean {
  return scheduleMinutesFromLabel(timeLabel) != null
}

export function normalizeTimeLabel(timeLabel: string): string | null {
  const trimmed = timeLabel.trim()
  if (!trimmed) return null

  const hasTilde = trimmed.startsWith('~')
  const withoutTilde = trimmed.replace(/^~+/, '').replace(/\s+/g, ' ')

  const parsed = parse(withoutTilde, 'h:mm a', new Date())
  if (Number.isNaN(parsed.getTime())) return null

  return `${hasTilde ? '~' : ''}${format(parsed, 'h:mm a')}`
}

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
