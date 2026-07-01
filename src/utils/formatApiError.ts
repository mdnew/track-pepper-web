/** Turn Supabase/PostgREST errors (plain objects) into readable text. */
export function formatApiError(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message
  }
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>
    if (typeof record.message === 'string' && record.message) {
      const parts = [record.message]
      if (typeof record.details === 'string' && record.details) {
        parts.push(record.details)
      }
      if (typeof record.hint === 'string' && record.hint) {
        parts.push(record.hint)
      }
      return parts.join(' — ')
    }
  }
  return String(err)
}
