import type { RealtimeChannel } from '@supabase/supabase-js'

import type {
  Completion,
  Pet,
  PetScheduleMeta,
  SchedulePlan,
  ScheduleTask,
} from '../types'
import { formatDateKey, normalizeDate } from '../utils/formatDate'
import { resolvePlanForPet } from '../utils/schedulePlan'
import { isPersistedCustomTaskId } from '../utils/scheduleTaskId'
import { supabase } from '../lib/supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

let scheduleRevision = 0
const scheduleRevisionListeners = new Set<() => void>()

function bumpScheduleRevision() {
  scheduleRevision += 1
  scheduleRevisionListeners.forEach((listener) => listener())
}

export function getScheduleRevision() {
  return scheduleRevision
}

export function subscribeScheduleRevision(listener: () => void) {
  scheduleRevisionListeners.add(listener)
  return () => {
    scheduleRevisionListeners.delete(listener)
  }
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

function mapPlanTask(row: Record<string, unknown>): ScheduleTask {
  return {
    id: row.id as string,
    planId: row.plan_id as string,
    petId: null,
    sortOrder: row.sort_order as number,
    timeLabel: row.time_label as string,
    category: row.category as string,
    title: row.title as string,
    subtitle: (row.subtitle as string | null) ?? null,
    icon: row.icon as string,
    section: row.section as string,
    isCustom: false,
  }
}

function mapCustomTask(row: Record<string, unknown>): ScheduleTask {
  return {
    id: row.id as string,
    planId: null,
    petId: row.pet_id as string,
    sortOrder: row.sort_order as number,
    timeLabel: row.time_label as string,
    category: row.category as string,
    title: row.title as string,
    subtitle: (row.subtitle as string | null) ?? null,
    icon: row.icon as string,
    section: row.section as string,
    isCustom: true,
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
      .map(mapPlanTask)
      .filter((task) => task.planId === planId)
  },

  async getPetScheduleMeta(petId: string): Promise<PetScheduleMeta | null> {
    const client = requireClient()
    const { data, error } = await client
      .from('pet_schedules')
      .select()
      .eq('pet_id', petId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return {
      petId: data.pet_id as string,
      basePlanId: (data.base_plan_id as string | null) ?? null,
      isCustomized: Boolean(data.is_customized),
    }
  },

  async getCustomTasksForPet(petId: string): Promise<ScheduleTask[]> {
    const client = requireClient()
    const { data, error } = await client
      .from('pet_schedule_tasks')
      .select()
      .eq('pet_id', petId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapCustomTask)
  },

  async repairBrokenCustomSchedule(petId: string) {
    const client = requireClient()
    const { error } = await client.from('pet_schedules').delete().eq('pet_id', petId)
    if (error) throw error
  },

  /** Saved custom tasks, or null when the pet should use its default plan. */
  async getValidCustomTasksForPet(petId: string): Promise<ScheduleTask[] | null> {
    const meta = await this.getPetScheduleMeta(petId)
    const tasks = await this.getCustomTasksForPet(petId)

    if (meta?.isCustomized) {
      if (tasks.length > 0) return tasks
      await this.repairBrokenCustomSchedule(petId)
      return null
    }

    // Tasks saved without meta (partial client write) — still show them.
    if (tasks.length > 0) return tasks

    return null
  },

  async getScheduleForPet(
    pet: Pet,
    plans: SchedulePlan[],
    referenceDate: Date,
  ): Promise<{ plan: SchedulePlan | null; tasks: ScheduleTask[] }> {
    const plan = resolvePlanForPet(plans, pet, referenceDate)

    const customTasks = await this.getValidCustomTasksForPet(pet.id)
    if (customTasks) {
      return { plan, tasks: customTasks }
    }

    if (!plan) {
      return { plan: null, tasks: [] }
    }

    const tasks = await this.getTasksForPlan(plan.id)
    return { plan, tasks }
  },

  async getTaskCountForPetOnDate(
    pet: Pet,
    plans: SchedulePlan[],
    date: Date,
  ): Promise<number> {
    const { tasks } = await this.getScheduleForPet(pet, plans, date)
    return tasks.length
  },

  async getHouseholdCompletionsForMonth(
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

    const completions = new Map<string, number>()
    for (const row of data ?? []) {
      const key = row.date as string
      completions.set(key, (completions.get(key) ?? 0) + 1)
    }
    return completions
  },

  daysInMonth(month: Date): Date[] {
    const start = new Date(month.getFullYear(), month.getMonth(), 1)
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const days: Date[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      days.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    return days
  },

  async getDayTotalsForPet(
    pet: Pet,
    plans: SchedulePlan[],
    month: Date,
  ): Promise<Map<string, number>> {
    const days = this.daysInMonth(month)

    const customTasks = await this.getValidCustomTasksForPet(pet.id)
    if (customTasks) {
      const totals = new Map<string, number>()
      for (const day of days) {
        totals.set(formatDateKey(day), customTasks.length)
      }
      return totals
    }

    const tasksByPlanId = new Map<string, Promise<ScheduleTask[]>>()
    const loadTasksForPlan = (planId: string) => {
      const existing = tasksByPlanId.get(planId)
      if (existing) return existing
      const pending = this.getTasksForPlan(planId)
      tasksByPlanId.set(planId, pending)
      return pending
    }

    const totals = new Map<string, number>()
    for (const day of days) {
      const plan = resolvePlanForPet(plans, pet, day)
      if (!plan) {
        totals.set(formatDateKey(day), 0)
      } else {
        totals.set(formatDateKey(day), (await loadTasksForPlan(plan.id)).length)
      }
    }
    return totals
  },

  async getAggregatedCountsForMonth(
    householdId: string,
    pets: Pet[],
    plans: SchedulePlan[],
    month: Date,
  ): Promise<{ completions: Map<string, number>; totals: Map<string, number> }> {
    const completions = await this.getHouseholdCompletionsForMonth(householdId, month)

    const totals = new Map<string, number>()
    for (const pet of pets) {
      const petTotals = await this.getDayTotalsForPet(pet, plans, month)
      for (const [key, count] of petTotals) {
        totals.set(key, (totals.get(key) ?? 0) + count)
      }
    }

    return { completions, totals }
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

  async completeAllTasks(
    householdId: string,
    petId: string,
    taskIds: string[],
    date: Date,
    userId: string,
  ) {
    if (taskIds.length === 0) return

    const client = requireClient()
    const completedAt = new Date().toISOString()
    const dateKey = formatDateKey(date)
    const rows = taskIds.map((taskId) => ({
      household_id: householdId,
      pet_id: petId,
      task_id: taskId,
      date: dateKey,
      completed_by: userId,
      completed_at: completedAt,
    }))

    const { error } = await client
      .from('completions')
      .upsert(rows, { onConflict: 'pet_id,task_id,date' })
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

  async saveCustomSchedule(
    petId: string,
    basePlanId: string | null,
    tasks: Omit<ScheduleTask, 'planId' | 'petId' | 'isCustom'>[],
    userId: string,
  ) {
    const client = requireClient()

    const taskPayload = tasks.map((task, index) => ({
      ...(isPersistedCustomTaskId(task.id) ? { id: task.id } : {}),
      sort_order: index,
      time_label: task.timeLabel,
      category: task.category,
      title: task.title,
      subtitle: task.subtitle ?? '',
      icon: task.icon,
      section: task.section,
    }))

    const { error: rpcError } = await client.rpc('save_pet_custom_schedule', {
      p_pet_id: petId,
      p_base_plan_id: basePlanId,
      p_tasks: taskPayload,
    })

    if (!rpcError) {
      bumpScheduleRevision()
      return
    }

    const rpcMissing =
      rpcError.code === 'PGRST202' ||
      rpcError.message?.includes('save_pet_custom_schedule')
    if (!rpcMissing) {
      throw rpcError
    }

    // Fallback until migration 013 is applied.
    void userId

    const { error: upsertError } = await client.from('pet_schedules').upsert(
      {
        pet_id: petId,
        base_plan_id: basePlanId,
        is_customized: true,
        customized_at: new Date().toISOString(),
        customized_by: userId,
      },
      { onConflict: 'pet_id', defaultToNull: false },
    )
    if (upsertError) throw upsertError

    const { error: deleteError } = await client
      .from('pet_schedule_tasks')
      .delete()
      .eq('pet_id', petId)
    if (deleteError) throw deleteError

    if (tasks.length > 0) {
      const rows = tasks.map((task, index) => {
        const row: Record<string, unknown> = {
          pet_id: petId,
          sort_order: index,
          time_label: task.timeLabel,
          category: task.category,
          title: task.title,
          subtitle: task.subtitle,
          icon: task.icon,
          section: task.section,
        }
        if (isPersistedCustomTaskId(task.id)) {
          row.id = task.id
        }
        return row
      })

      const { error: insertError } = await client
        .from('pet_schedule_tasks')
        .insert(rows, { defaultToNull: false })
      if (insertError) throw insertError
    }

    bumpScheduleRevision()
  },

  async resetScheduleToDefault(petId: string) {
    const client = requireClient()

    const { error: taskError } = await client
      .from('pet_schedule_tasks')
      .delete()
      .eq('pet_id', petId)
    if (taskError) throw taskError

    const { error: metaError } = await client
      .from('pet_schedules')
      .delete()
      .eq('pet_id', petId)
    if (metaError) throw metaError

    bumpScheduleRevision()
  },

  async copyPlanToCustomDraft(
    pet: Pet,
    plans: SchedulePlan[],
    referenceDate: Date,
  ): Promise<{ plan: SchedulePlan | null; tasks: ScheduleTask[] }> {
    const plan = resolvePlanForPet(plans, pet, referenceDate)
    if (!plan) return { plan: null, tasks: [] }

    const planTasks = await this.getTasksForPlan(plan.id)
    const tasks = planTasks.map((task) => ({
      ...task,
      id: `new-${crypto.randomUUID()}`,
      planId: null,
      petId: pet.id,
      isCustom: true,
    }))
    return { plan, tasks }
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