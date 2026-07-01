import type { Pet, PetSpecies } from '../types'
import { authService } from './auth'
import { supabase } from '../lib/supabase'
import { parseDateOfBirth } from '../utils/petAge'

function parseSpecies(value: unknown): PetSpecies {
  return value === 'cat' ? 'cat' : 'dog'
}

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
    species: parseSpecies(row.species),
  }
}

async function requireHouseholdId(householdId?: string | null): Promise<string> {
  if (householdId) return householdId

  const profile = await authService.getProfile()
  const resolved = authService.resolveActiveHouseholdId(profile)
  if (!resolved) throw new Error('Not in a household')
  return resolved
}

export const petsService = {
  async getPets(householdId?: string | null): Promise<Pet[]> {
    const resolvedHouseholdId = await requireHouseholdId(householdId)
    const client = requireClient()
    const { data, error } = await client
      .from('pets')
      .select()
      .eq('household_id', resolvedHouseholdId)
      .order('name')

    if (error) throw error
    return (data ?? []).map(mapPet)
  },

  async createPet(
    name: string,
    dateOfBirth: string,
    species: PetSpecies,
    householdId?: string | null,
  ) {
    const resolvedHouseholdId = await requireHouseholdId(householdId)
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Pet name is required.')

    const client = requireClient()
    const { data, error } = await client
      .from('pets')
      .insert({
        household_id: resolvedHouseholdId,
        name: trimmed,
        date_of_birth: dateOfBirth,
        species,
      })
      .select()
      .single()

    if (error) throw error
    return mapPet(data)
  },

  async updatePet(
    id: string,
    name: string,
    dateOfBirth: string,
    species: PetSpecies,
  ) {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Pet name is required.')

    const client = requireClient()
    const { error } = await client
      .from('pets')
      .update({ name: trimmed, date_of_birth: dateOfBirth, species })
      .eq('id', id)

    if (error) throw error
  },

  async deletePet(id: string) {
    const client = requireClient()
    const { error } = await client.from('pets').delete().eq('id', id)
    if (error) throw error
  },
}
