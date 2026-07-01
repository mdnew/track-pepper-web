const persistedCustomTaskIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** True when id is a UUID stored in pet_schedule_tasks (not a plan template id). */
export function isPersistedCustomTaskId(id: string): boolean {
  return persistedCustomTaskIdPattern.test(id)
}
