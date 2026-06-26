import { format } from 'date-fns'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  CurrentTimeLine,
  ScheduleBlock,
  SectionDivider,
} from '../components/ScheduleBlock'
import { useAuth } from '../context/AuthContext'
import { scheduleService } from '../services/schedule'
import type { Completion, ScheduleTask } from '../types'
import { isSameCalendarDay, parseDateKey, formatDateKey } from '../utils/formatDate'
import { trackTaskComplete } from '../utils/analytics'
import {
  currentTimeInsertIndex,
  sortTasksChronologically,
} from '../utils/scheduleTime'
import './DayPage.css'

export function DayPage() {
  const { date: dateParam } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const date = dateParam ? parseDateKey(dateParam) : new Date()
  const isToday = isSameCalendarDay(date, new Date())

  const [tasks, setTasks] = useState<ScheduleTask[]>([])
  const [completions, setCompletions] = useState<Record<string, Completion>>({})
  const [loading, setLoading] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const nowLineRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const hasScrolledRef = useRef(false)

  const loadCompletions = useCallback(async () => {
    if (!profile?.householdId || !dateParam) return
    const rows = await scheduleService.getCompletionsForDate(
      profile.householdId,
      parseDateKey(dateParam),
    )
    setCompletions(Object.fromEntries(rows.map((c) => [c.taskId, c])))
  }, [profile?.householdId, dateParam])

  useEffect(() => {
    hasScrolledRef.current = false
  }, [dateParam])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    if (!profile?.householdId || !dateParam) return

    let channel: ReturnType<typeof scheduleService.subscribeToCompletions> | null =
      null

    async function load() {
      if (!dateParam) return
      setLoading(true)
      try {
        const day = parseDateKey(dateParam)
        const nextTasks = await scheduleService.getTasks()
        setTasks(sortTasksChronologically(nextTasks))
        await loadCompletions()
        channel = scheduleService.subscribeToCompletions(
          profile!.householdId!,
          day,
          () => {
            loadCompletions().catch(() => undefined)
          },
        )
      } finally {
        setLoading(false)
      }
    }

    load()

    return () => {
      channel?.unsubscribe()
    }
  }, [profile?.householdId, dateParam, loadCompletions])

  useEffect(() => {
    if (!isToday || loading || hasScrolledRef.current || !scrollRef.current) {
      return
    }

    const frame = requestAnimationFrame(() => {
      if (!scrollRef.current || hasScrolledRef.current) return

      const nowIndex = currentTimeInsertIndex(tasks, new Date())
      const target =
        nowLineRef.current ??
        anchorRef.current ??
        scrollRef.current.firstElementChild

      if (target) {
        const container = scrollRef.current
        const targetTop = (target as HTMLElement).offsetTop
        const offset =
          nowIndex > 0 && anchorRef.current
            ? anchorRef.current.offsetHeight + 6
            : 0
        container.scrollTop = Math.max(0, targetTop - offset - 80)
      }

      hasScrolledRef.current = true
    })

    return () => cancelAnimationFrame(frame)
  }, [isToday, loading, tasks.length, dateParam])

  async function toggleTask(task: ScheduleTask, completed: boolean) {
    if (!profile?.householdId || !user) return
    setLoadingTasks((prev) => new Set(prev).add(task.id))
    try {
      if (completed) {
        await scheduleService.completeTask(
          profile.householdId,
          task.id,
          date,
          user.id,
        )
        trackTaskComplete({
          taskId: task.id,
          category: task.category,
          section: task.section,
          date: formatDateKey(date),
          isToday,
        })
      } else {
        await scheduleService.uncompleteTask(profile.householdId, task.id, date)
      }
      await loadCompletions()
    } finally {
      setLoadingTasks((prev) => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
    }
  }

  const now = new Date()
  const nowIndex = currentTimeInsertIndex(tasks, now)
  const completedCount = Object.keys(completions).length
  let currentSection: string | null = null
  let taskIndex = 0

  const taskElements: React.ReactNode[] = []
  for (const task of tasks) {
    if (isToday && taskIndex === nowIndex) {
      taskElements.push(
        <div key="now-line" ref={nowLineRef}>
          <CurrentTimeLine time={now} />
        </div>,
      )
    }

    if (task.section !== currentSection) {
      currentSection = task.section
      taskElements.push(
        <SectionDivider key={`section-${task.section}-${taskIndex}`} label={task.section} />,
      )
    }

    const ref =
      taskIndex === nowIndex - 1
        ? anchorRef
        : undefined

    taskElements.push(
      <div key={task.id} ref={ref}>
        <ScheduleBlock
          task={task}
          completion={completions[task.id]}
          loading={loadingTasks.has(task.id)}
          onToggle={(v) => toggleTask(task, v)}
        />
      </div>,
    )
    taskIndex++
  }

  if (isToday && nowIndex === tasks.length) {
    taskElements.push(
      <div key="now-line-end" ref={nowLineRef}>
        <CurrentTimeLine time={now} />
      </div>,
    )
  }

  return (
    <div className="page-with-header fixed-page-layout day-layout">
      <div className="day-layout-top">
        <header className="app-header">
          <button type="button" className="back-button" onClick={() => navigate('/')}>
            ‹
          </button>
          <h1>{format(date, 'EEEE, MMMM d, yyyy')}</h1>
          <div className="header-spacer" />
        </header>

        {!loading && (
          <div className="progress-banner">
            <div className="progress-row">
              <span>Today&apos;s progress</span>
              <span className="progress-count">
                {completedCount} / {tasks.length}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: tasks.length
                    ? `${(completedCount / tasks.length) * 100}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="day-loading">
          <div className="spinner" />
        </div>
      ) : (
        <div className="day-scroll fixed-page-scroll" ref={scrollRef}>
          <div className="day-tasks">{taskElements}</div>
          <div className="tip-box">
            <strong>🐾 Quick Reminders</strong>
            <p>
              Outside within 5–10 min of every meal, nap, and play session.
              Training = 5 min max. Praise every potty outside. Overnight trips
              should be boring on purpose — lights low, no talking beyond a calm
              &quot;good girl.&quot; She&apos;ll drop the overnight trip around
              4–5 months.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
