import type { Household, Profile } from '../types'
import { env } from '../config/env'
import { supabase } from '../lib/supabase'
import { getAuthParamsFromUrl, parseAuthCallbackUrl } from '../utils/authCallback'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    displayName: row.display_name as string,
    householdId: (row.household_id as string | null) ?? null,
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

  async recoverSessionFromResetLink(rawUrl: string) {
    const client = requireClient()
    const uri = parseAuthCallbackUrl(rawUrl)
    const params = getAuthParamsFromUrl(uri)

    if (params.code) {
      const { error } = await client.auth.exchangeCodeForSession(params.code)
      if (error) throw error
      return
    }

    if (params.access_token && params.refresh_token) {
      const { error } = await client.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      })
      if (error) throw error
      if (params.type !== 'recovery') {
        throw new Error('That link is not a password reset link.')
      }
      return
    }

    throw new Error('That link is not a password reset link.')
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

  async updatePassword(newPassword: string) {
    const client = requireClient()
    const { error } = await client.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  async getHousehold(): Promise<Household | null> {
    const profile = await this.getProfile()
    if (!profile?.householdId) return null

    const client = requireClient()
    const { data, error } = await client
      .from('households')
      .select()
      .eq('id', profile.householdId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return mapHousehold(data)
  },

  async getHouseholdMembers(): Promise<Profile[]> {
    const profile = await this.getProfile()
    if (!profile?.householdId) return []

    const client = requireClient()
    const { data, error } = await client
      .from('profiles')
      .select()
      .eq('household_id', profile.householdId)
      .order('display_name')

    if (error) throw error
    return (data ?? []).map(mapProfile)
  },

  async createHousehold(name: string): Promise<Household> {
    const client = requireClient()
    const invite = generateInviteCode()
    const { data, error } = await client.rpc('create_household', {
      household_name: name,
      invite,
    })
    if (error) throw error
    return mapHousehold(data as Record<string, unknown>)
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

    const { data, error } = await client
      .from('households')
      .select()
      .eq('id', householdId as string)
      .single()

    if (error) throw error
    return mapHousehold(data)
  },
}
