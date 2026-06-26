import type { RealtimeChannel } from '@supabase/supabase-js'

import type { Completion, Pet, SchedulePlan, ScheduleTask } from '../types'
import { formatDateKey, normalizeDate } from '../utils/formatDate'
import { resolvePlanForPet } from '../utils/schedulePlan'
import { supabase } from '../lib/supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

function mapPlan(row: Record<string, unknown>): SchedulePlan {
  return {
    id: row.id as string,
    species: row.species as SchedulePlan['species'],
    name: row.name as string,
    emoji: row.emoji as string,
    introTitle: (row.intro_title as string | null) ?? null,
    introDescription: (row.intro_description as string | null) ?? null,
    tipsTitle: (row.tips_title as string | null) ?? null,
    tipsBody: (row.tips_body as string | null) ?? null,
    minAgeDays: row.min_age_days as number,
    maxAgeDays: (row.max_age_days as number | null) ?? null,
  }
}

function mapTask(row: Record<string, unknown>): ScheduleTask {
  return {
    id: row.id as string,
    planId: row.plan_id as string,
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
    petId: row.pet_id as string,
    taskId: row.task_id as string,
    date: new Date(`${row.date as string}T00:00:00`),
    completedBy: row.completed_by as string,
    completedAt: new Date(row.completed_at as string),
    completedByName: completedByName ?? null,
  }
}

export const scheduleService = {
  async getPlans(): Promise<SchedulePlan[]> {
    const client = requireClient()
    const { data, error } = await client
      .from('schedule_plans')
      .select()
      .order('species')
      .order('min_age_days')

    if (error) throw error
    return (data ?? []).map(mapPlan)
  },

  async getTasksForPlan(planId: string): Promise<ScheduleTask[]> {
    if (!planId.trim()) return []

    const client = requireClient()
    const { data, error } = await client
      .from('schedule_tasks')
      .select()
      .eq('plan_id', planId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data ?? [])
      .map(mapTask)
      .filter((task) => task.planId === planId)
  },

  async getScheduleForPet(
    pet: Pet,
    plans: SchedulePlan[],
    referenceDate: Date,
  ): Promise<{ plan: SchedulePlan | null; tasks: ScheduleTask[] }> {
    const plan = resolvePlanForPet(plans, pet, referenceDate)
    if (!plan) {
      return { plan: null, tasks: [] }
    }

    const tasks = await this.getTasksForPlan(plan.id)
    return { plan, tasks }
  },

  async getCompletionsForDate(
    householdId: string,
    petId: string,
    date: Date,
  ): Promise<Completion[]> {
    const client = requireClient()
    const { data, error } = await client
      .from('completions')
      .select('*, profiles!completed_by(display_name)')
      .eq('household_id', householdId)
      .eq('pet_id', petId)
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
    petId: string,
    month: Date,
  ): Promise<Map<string, number>> {
    const client = requireClient()
    const start = new Date(month.getFullYear(), month.getMonth(), 1)
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)

    const { data, error } = await client
      .from('completions')
      .select('date')
      .eq('household_id', householdId)
      .eq('pet_id', petId)
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
    petId: string,
    taskId: string,
    date: Date,
    userId: string,
  ) {
    const client = requireClient()
    const { error } = await client.from('completions').upsert(
      {
        household_id: householdId,
        pet_id: petId,
        task_id: taskId,
        date: formatDateKey(date),
        completed_by: userId,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'pet_id,task_id,date' },
    )
    if (error) throw error
  },

  async uncompleteTask(
    householdId: string,
    petId: string,
    taskId: string,
    date: Date,
  ) {
    const client = requireClient()
    const { error } = await client
      .from('completions')
      .delete()
      .eq('household_id', householdId)
      .eq('pet_id', petId)
      .eq('task_id', taskId)
      .eq('date', formatDateKey(date))
    if (error) throw error
  },

  subscribeToCompletions(
    householdId: string,
    petId: string,
    date: Date,
    onChange: () => void,
  ): RealtimeChannel {
    const client = requireClient()
    const channel = client
      .channel(`completions-${petId}-${formatDateKey(date)}`)
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
