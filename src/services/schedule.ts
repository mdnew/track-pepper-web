import type { RealtimeChannel } from '@supabase/supabase-js'

import type { Completion, ScheduleTask } from '../types'
import { formatDateKey, normalizeDate } from '../utils/formatDate'
import { supabase } from '../lib/supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

function mapTask(row: Record<string, unknown>): ScheduleTask {
  return {
    id: row.id as string,
    sortOrder: row.sort_order as number,
    timeLabel: row.time_label as string,
    category: row.category as string,
    title: row.title as string,
    subtitle: (row.subtitle as string | null) ?? null,
    icon: row.icon as string,
    section: row.section as string,
  }
}

function mapCompletion(
  row: Record<string, unknown>,
  completedByName?: string | null,
): Completion {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    taskId: row.task_id as string,
    date: new Date(`${row.date as string}T00:00:00`),
    completedBy: row.completed_by as string,
    completedAt: new Date(row.completed_at as string),
    completedByName: completedByName ?? null,
  }
}

export const scheduleService = {
  async getTasks(): Promise<ScheduleTask[]> {
    const client = requireClient()
    const { data, error } = await client
      .from('schedule_tasks')
      .select()
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapTask)
  },

  async getCompletionsForDate(
    householdId: string,
    date: Date,
  ): Promise<Completion[]> {
    const client = requireClient()
    const { data, error } = await client
      .from('completions')
      .select('*, profiles!completed_by(display_name)')
      .eq('household_id', householdId)
      .eq('date', formatDateKey(date))

    if (error) throw error

    return (data ?? []).map((row) => {
      const record = row as Record<string, unknown>
      const profiles = record.profiles as { display_name?: string } | null
      const { profiles: _, ...rest } = record
      return mapCompletion(rest, profiles?.display_name)
    })
  },

  async getCompletionCountsForMonth(
    householdId: string,
    month: Date,
  ): Promise<Map<string, number>> {
    const client = requireClient()
    const start = new Date(month.getFullYear(), month.getMonth(), 1)
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)

    const { data, error } = await client
      .from('completions')
      .select('date')
      .eq('household_id', householdId)
      .gte('date', formatDateKey(start))
      .lte('date', formatDateKey(end))

    if (error) throw error

    const counts = new Map<string, number>()
    for (const row of data ?? []) {
      const date = normalizeDate(new Date(`${row.date as string}T00:00:00`))
      const key = formatDateKey(date)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
  },

  async completeTask(
    householdId: string,
    taskId: string,
    date: Date,
    userId: string,
  ) {
    const client = requireClient()
    const { error } = await client.from('completions').upsert({
      household_id: householdId,
      task_id: taskId,
      date: formatDateKey(date),
      completed_by: userId,
      completed_at: new Date().toISOString(),
    })
    if (error) throw error
  },

  async uncompleteTask(householdId: string, taskId: string, date: Date) {
    const client = requireClient()
    const { error } = await client
      .from('completions')
      .delete()
      .eq('household_id', householdId)
      .eq('task_id', taskId)
      .eq('date', formatDateKey(date))
    if (error) throw error
  },

  subscribeToCompletions(
    householdId: string,
    date: Date,
    onChange: () => void,
  ): RealtimeChannel {
    const client = requireClient()
    const channel = client
      .channel(`completions-${formatDateKey(date)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completions',
          filter: `household_id=eq.${householdId}`,
        },
        () => onChange(),
      )
      .subscribe()

    return channel
  },
}
