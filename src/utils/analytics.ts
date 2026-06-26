const GA_MEASUREMENT_ID = 'G-30LHF99GJK'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackPageView(path: string) {
  window.gtag?.('config', GA_MEASUREMENT_ID, { page_path: path })
}

export function setAnalyticsUser(
  userId: string | null,
  properties?: Record<string, string | undefined>,
) {
  if (userId) {
    window.gtag?.('config', GA_MEASUREMENT_ID, { user_id: userId })
    const userProperties = Object.fromEntries(
      Object.entries(properties ?? {}).filter(([, value]) => value != null),
    )
    if (Object.keys(userProperties).length > 0) {
      window.gtag?.('set', 'user_properties', userProperties)
    }
    return
  }

  window.gtag?.('config', GA_MEASUREMENT_ID, { user_id: undefined })
}

export function trackTaskComplete(params: {
  taskId: string
  category: string
  section: string
  date: string
  isToday: boolean
}) {
  window.gtag?.('event', 'task_complete', {
    task_id: params.taskId,
    task_category: params.category,
    task_section: params.section,
    schedule_date: params.date,
    is_today: params.isToday,
  })
}

export function trackSignUp() {
  window.gtag?.('event', 'sign_up', { method: 'email' })
}
