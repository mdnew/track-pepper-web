import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppHeader } from '../components/ui'
import { MonthCalendar } from '../components/MonthCalendar'
import { useAuth } from '../context/AuthContext'
import { scheduleService } from '../services/schedule'
import type { ScheduleTask } from '../types'
import './CalendarPage.css'

export function CalendarPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [focusedMonth, setFocusedMonth] = useState(new Date())
  const [tasks, setTasks] = useState<ScheduleTask[]>([])
  const [completionCounts, setCompletionCounts] = useState<Map<string, number>>(
    new Map(),
  )
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!profile?.householdId) return
    setLoading(true)
    try {
      const [nextTasks, counts] = await Promise.all([
        scheduleService.getTasks(),
        scheduleService.getCompletionCountsForMonth(
          profile.householdId,
          focusedMonth,
        ),
      ])
      setTasks(nextTasks)
      setCompletionCounts(counts)
    } finally {
      setLoading(false)
    }
  }, [profile?.householdId, focusedMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="page-with-header">
      <AppHeader
        title="TrackPepper"
        onSettings={() => navigate('/settings')}
      />

      <main className="calendar-page">
        <div className="header-card">
          <span className="header-emoji" aria-hidden>
            🐶
          </span>
          <div>
            <h2>Puppy Daily Schedule</h2>
            <p>8–12 weeks • Wakeup 5:30 AM • Bedtime 9:30 PM</p>
            {profile?.displayName && (
              <p className="signed-in">Signed in as {profile.displayName}</p>
            )}
          </div>
        </div>

        <div className="calendar-card">
          {loading ? (
            <div className="calendar-loading">
              <div className="spinner" />
            </div>
          ) : (
            <>
              <MonthCalendar
                focusedMonth={focusedMonth}
                completionCounts={completionCounts}
                totalTasks={tasks.length}
                onMonthChange={(month) => setFocusedMonth(month)}
                onDaySelect={(day) => {
                  const y = day.getFullYear()
                  const m = String(day.getMonth() + 1).padStart(2, '0')
                  const d = String(day.getDate()).padStart(2, '0')
                  navigate(`/day/${y}-${m}-${d}`)
                }}
              />
              <p className="calendar-hint">Tap a day to view and check off tasks</p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
