import type { Pet } from '../types'
import { authService } from './auth'
import { supabase } from '../lib/supabase'
import { parseDateOfBirth } from '../utils/petAge'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

function mapPet(row: Record<string, unknown>): Pet {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    name: row.name as string,
    dateOfBirth: parseDateOfBirth(row.date_of_birth as string),
  }
}

async function requireHouseholdId(): Promise<string> {
  const profile = await authService.getProfile()
  if (!profile?.householdId) throw new Error('Not in a household')
  return profile.householdId
}

export const petsService = {
  async getPets(): Promise<Pet[]> {
    const householdId = await requireHouseholdId()
    const client = requireClient()
    const { data, error } = await client
      .from('pets')
      .select()
      .eq('household_id', householdId)
      .order('name')

    if (error) throw error
    return (data ?? []).map(mapPet)
  },

  async createPet(name: string, dateOfBirth: string) {
    const householdId = await requireHouseholdId()
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Pet name is required.')

    const client = requireClient()
    const { data, error } = await client
      .from('pets')
      .insert({
        household_id: householdId,
        name: trimmed,
        date_of_birth: dateOfBirth,
      })
      .select()
      .single()

    if (error) throw error
    return mapPet(data)
  },

  async updatePet(id: string, name: string, dateOfBirth: string) {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Pet name is required.')

    const client = requireClient()
    const { error } = await client
      .from('pets')
      .update({ name: trimmed, date_of_birth: dateOfBirth })
      .eq('id', id)

    if (error) throw error
  },

  async deletePet(id: string) {
    const client = requireClient()
    const { error } = await client.from('pets').delete().eq('id', id)
    if (error) throw error
  },
}
