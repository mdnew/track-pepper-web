/** Pepper's birthday — used only on the marketing About page. */
export const PEPPER_BIRTHDAY = new Date(2026, 3, 14)

/** e.g. "10-week-old", "5-month-old" for About page copy */
export function pepperAgeDescriptor(now = new Date()): string {
  const dob = new Date(PEPPER_BIRTHDAY)
  dob.setHours(0, 0, 0, 0)

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((today.getTime() - dob.getTime()) / 86_400_000)
  if (diffDays < 0) return 'soon-to-be'

  if (diffDays < 365) {
    const weeks = Math.floor(diffDays / 7)
    if (weeks < 26) {
      const safeWeeks = Math.max(1, weeks)
      return `${safeWeeks}-week-old`
    }
    const months = Math.floor(diffDays / 30.44)
    return `${months}-month-old`
  }

  const years = Math.floor(diffDays / 365.25)
  return years === 1 ? '1-year-old' : `${years}-year-old`
}
