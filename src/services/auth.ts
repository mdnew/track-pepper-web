import type {
  Household,
  HouseholdMember,
  HouseholdMembership,
  HouseholdRole,
  Profile,
} from '../types'
import { env } from '../config/env'
import { supabase } from '../lib/supabase'
import {
  readActiveHouseholdId,
  writeActiveHouseholdId,
} from '../utils/householdSelection'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    displayName: row.display_name as string,
    householdId: (row.household_id as string | null) ?? null,
    activeHouseholdId: (row.active_household_id as string | null) ?? null,
  }
}

function mapHousehold(row: Record<string, unknown>): Household {
  return {
    id: row.id as string,
    name: row.name as string,
    inviteCode: row.invite_code as string,
  }
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  const suffix = Array.from(bytes, (b) => chars[b % chars.length]).join('')
  return `PEPPER-${suffix}`
}

export const authService = {
  async signIn(email: string, password: string) {
    const client = requireClient()
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  async signUp(email: string, password: string, displayName: string) {
    const client = requireClient()
    const { error } = await client.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw error
  },

  async signOut() {
    const client = requireClient()
    const { error } = await client.auth.signOut({ scope: 'global' })
    if (error) throw error
  },

  async requestPasswordReset(email: string) {
    const client = requireClient()
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: env.passwordResetRedirectUrl,
    })
    if (error) throw error
  },

  async completePasswordReset(newPassword: string) {
    const client = requireClient()
    const { error } = await client.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  async getProfile(): Promise<Profile | null> {
    const client = requireClient()
    const user = (await client.auth.getUser()).data.user
    if (!user) return null

    const { data, error } = await client
      .from('profiles')
      .select()
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return mapProfile(data)
  },

  resolveActiveHouseholdId(profile: Profile | null): string | null {
    if (!profile) return null
    const stored = readActiveHouseholdId()
    if (stored && (stored === profile.activeHouseholdId || stored === profile.householdId)) {
      return stored
    }
    return profile.activeHouseholdId ?? profile.householdId
  },

  async setActiveHousehold(householdId: string) {
    const client = requireClient()
    writeActiveHouseholdId(householdId)
    const { error } = await client.rpc('set_active_household', {
      p_household_id: householdId,
    })
    if (error) throw error
  },

  async getMemberships(): Promise<HouseholdMembership[]> {
    const client = requireClient()
    const user = (await client.auth.getUser()).data.user
    if (!user) return []

    const { data, error } = await client
      .from('household_members')
      .select('role, households(id, name, invite_code)')
      .eq('user_id', user.id)
      .order('joined_at')

    if (error) throw error

    return (data ?? []).flatMap((row) => {
      const record = row as Record<string, unknown>
      const householdRow = record.households as Record<string, unknown> | null
      if (!householdRow) return []
      return [
        {
          role: record.role as HouseholdRole,
          household: mapHousehold(householdRow),
        },
      ]
    })
  },

  async hasAnyMembership(): Promise<boolean> {
    const memberships = await this.getMemberships()
    return memberships.length > 0
  },

  async updateDisplayName(displayName: string) {
    const client = requireClient()
    const user = (await client.auth.getUser()).data.user
    if (!user) throw new Error('Not signed in')

    const { error } = await client
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id)
    if (error) throw error
  },

  async updateHouseholdName(householdId: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Household name is required.')

    const client = requireClient()
    const { error } = await client
      .from('households')
      .update({ name: trimmed })
      .eq('id', householdId)
    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const client = requireClient()
    const { error } = await client.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  async getHousehold(householdId: string): Promise<Household | null> {
    const client = requireClient()
    const { data, error } = await client
      .from('households')
      .select()
      .eq('id', householdId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return mapHousehold(data)
  },

  async getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
    const client = requireClient()
    const { data, error } = await client
      .from('household_members')
      .select(
        'user_id, household_id, role, joined_at, valid_from, valid_until, valid_days_of_week, profiles(display_name)',
      )
      .eq('household_id', householdId)
      .neq('role', 'guest')
      .order('joined_at')

    if (error) throw error

    return (data ?? []).map((row) => {
      const record = row as Record<string, unknown>
      const profile = record.profiles as { display_name?: string } | null
      return {
        userId: record.user_id as string,
        householdId: record.household_id as string,
        role: record.role as HouseholdRole,
        displayName: profile?.display_name ?? 'Member',
        joinedAt: new Date(record.joined_at as string),
        validFrom: null,
        validUntil: null,
        validDaysOfWeek: null,
      }
    })
  },

  async getGuestMembers(householdId: string): Promise<HouseholdMember[]> {
    const client = requireClient()
    const { data, error } = await client
      .from('household_members')
      .select(
        'user_id, household_id, role, joined_at, valid_from, valid_until, valid_days_of_week, profiles(display_name)',
      )
      .eq('household_id', householdId)
      .eq('role', 'guest')
      .order('valid_from')

    if (error) throw error

    return (data ?? []).map((row) => {
      const record = row as Record<string, unknown>
      const profile = record.profiles as { display_name?: string } | null
      return {
        userId: record.user_id as string,
        householdId: record.household_id as string,
        role: 'guest' as const,
        displayName: profile?.display_name ?? 'Guest',
        joinedAt: new Date(record.joined_at as string),
        validFrom: record.valid_from
          ? new Date(`${record.valid_from as string}T00:00:00`)
          : null,
        validUntil: record.valid_until
          ? new Date(`${record.valid_until as string}T00:00:00`)
          : null,
        validDaysOfWeek: (record.valid_days_of_week as number[] | null) ?? null,
      }
    })
  },

  async getCurrentRole(householdId: string): Promise<HouseholdRole | null> {
    const memberships = await this.getMemberships()
    return memberships.find((m) => m.household.id === householdId)?.role ?? null
  },

  async createHousehold(name: string): Promise<Household> {
    const client = requireClient()
    const invite = generateInviteCode()
    const { data, error } = await client.rpc('create_household', {
      household_name: name,
      invite,
    })
    if (error) throw error
    const household = mapHousehold(data as Record<string, unknown>)
    await this.setActiveHousehold(household.id)
    return household
  },

  async joinHousehold(inviteCode: string): Promise<Household> {
    const client = requireClient()
    const { data: householdId, error: rpcError } = await client.rpc(
      'join_household_by_invite',
      { invite: inviteCode.trim() },
    )
    if (rpcError) {
      if (rpcError.message.includes('Invalid invite code')) {
        throw new Error(
          'Invalid invite code. Check with your family and try again.',
        )
      }
      throw rpcError
    }

    await this.setActiveHousehold(householdId as string)

    const { data, error } = await client
      .from('households')
      .select()
      .eq('id', householdId as string)
      .single()

    if (error) throw error
    return mapHousehold(data)
  },

  async leaveHousehold(householdId: string) {
    const client = requireClient()
    const { error } = await client.rpc('leave_household', {
      p_household_id: householdId,
    })
    if (error) throw error
  },

  async removeMember(householdId: string, userId: string) {
    const client = requireClient()
    const { error } = await client.rpc('remove_household_member', {
      p_household_id: householdId,
      p_user_id: userId,
    })
    if (error) throw error
  },

  async setMemberRole(
    householdId: string,
    userId: string,
    role: 'member' | 'admin',
  ) {
    const client = requireClient()
    const { error } = await client.rpc('set_household_member_role', {
      p_household_id: householdId,
      p_user_id: userId,
      p_role: role,
    })
    if (error) throw error
  },

  async addGuestByEmail(
    householdId: string,
    email: string,
    validFrom: string,
    validUntil: string,
    validDays: number[] | null,
  ) {
    const client = requireClient()
    const { error } = await client.rpc('add_guest_by_email', {
      p_household_id: householdId,
      p_email: email.trim(),
      p_valid_from: validFrom,
      p_valid_until: validUntil,
      p_valid_days: validDays,
    })
    if (error) throw error
  },

  async updateGuestAccess(
    householdId: string,
    userId: string,
    validFrom: string,
    validUntil: string,
    validDays: number[] | null,
  ) {
    const client = requireClient()
    const { error } = await client.rpc('update_guest_access', {
      p_household_id: householdId,
      p_user_id: userId,
      p_valid_from: validFrom,
      p_valid_until: validUntil,
      p_valid_days: validDays,
    })
    if (error) throw error
  },
}
