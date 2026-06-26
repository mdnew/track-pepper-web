const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  isConfigured:
    supabaseUrl.length > 0 &&
    !supabaseUrl.includes('YOUR_PROJECT') &&
    supabaseAnonKey.length > 0 &&
    supabaseAnonKey !== 'your_anon_key_here',
  get passwordResetRedirectUrl() {
    if (typeof window === 'undefined') return 'http://localhost:5173/reset-password'
    return `${window.location.origin}/reset-password`
  },
}
