import { format } from 'date-fns'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import {
  CurrentTimeLine,
  ScheduleBlock,
  SectionDivider,
} from '../components/ScheduleBlock'
import { Recommendations } from '../components/Recommendations'
import { recommendationsForSpecies } from '../config/recommendations'
import { useAuth } from '../context/AuthContext'
import { petsService } from '../services/pets'
import { scheduleService } from '../services/schedule'
import type { Completion, Pet, SchedulePlan, ScheduleTask } from '../types'
import { applySpeciesTheme, speciesTheme } from '../theme/speciesTheme'
import { isSameCalendarDay, parseDateKey, formatDateKey } from '../utils/formatDate'
import { trackTaskComplete } from '../utils/analytics'
import { resolveSelectedPetId, writeSelectedPetId } from '../utils/petSelection'
import {
  currentTimeInsertIndex,
  sortTasksChronologically,
} from '../utils/scheduleTime'
import './DayPage.css'

export function DayPage() {
  const { date: dateParam } = useParams<{ date: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const date = dateParam ? parseDateKey(dateParam) : new Date()
  const isToday = isSameCalendarDay(date, new Date())

  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [plan, setPlan] = useState<SchedulePlan | null>(null)
  const [tasks, setTasks] = useState<ScheduleTask[]>([])
  const [completions, setCompletions] = useState<Record<string, Completion>>({})
  const [loading, setLoading] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set())
  const [markingAll, setMarkingAll] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const nowLineRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const hasScrolledRef = useRef(false)
  const loadGenerationRef = useRef(0)

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? null
  const theme = speciesTheme(selectedPet?.species ?? 'dog')
  const dayRecommendations = recommendationsForSpecies(selectedPet?.species)

  const loadCompletions = useCallback(async () => {
    if (!profile?.householdId || !dateParam || !selectedPetId) return
    const rows = await scheduleService.getCompletionsForDate(
      profile.householdId,
      selectedPetId,
      parseDateKey(dateParam),
    )
    setCompletions(Object.fromEntries(rows.map((c) => [c.taskId, c])))
  }, [profile?.householdId, dateParam, selectedPetId])

  useEffect(() => {
    hasScrolledRef.current = false
  }, [dateParam, selectedPetId])

  useEffect(() => {
    applySpeciesTheme(theme)
  }, [theme])

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
    const loadGeneration = ++loadGenerationRef.current
    const petQuery = searchParams.get('pet')

    async function load() {
      if (!dateParam) return
      setLoading(true)
      setTasks([])
      setPlan(null)
      try {
        const day = parseDateKey(dateParam)
        const [nextPets, nextPlans] = await Promise.all([
          petsService.getPets(),
          scheduleService.getPlans(),
        ])
        if (loadGeneration !== loadGenerationRef.current) return

        setPets(nextPets)

        const petId = resolveSelectedPetId(nextPets, petQuery)
        if (petId) writeSelectedPetId(petId)
        setSelectedPetId(petId)

        const pet = nextPets.find((item) => item.id === petId) ?? null
        const schedule = pet
          ? await scheduleService.getScheduleForPet(pet, nextPlans, day)
          : { plan: null, tasks: [] as ScheduleTask[] }
        if (loadGeneration !== loadGenerationRef.current) return

        setPlan(schedule.plan)
        setTasks(sortTasksChronologically(schedule.tasks))

        if (petId) {
          const rows = await scheduleService.getCompletionsForDate(
            profile!.householdId!,
            petId,
            day,
          )
          if (loadGeneration !== loadGenerationRef.current) return
          setCompletions(Object.fromEntries(rows.map((c) => [c.taskId, c])))
          channel = scheduleService.subscribeToCompletions(
            profile!.householdId!,
            petId,
            day,
            () => {
              loadCompletions().catch(() => undefined)
            },
          )
        } else {
          setCompletions({})
        }
      } finally {
        if (loadGeneration === loadGenerationRef.current) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      channel?.unsubscribe()
    }
  }, [profile?.householdId, dateParam, searchParams.get('pet'), loadCompletions])

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
  }, [isToday, loading, tasks.length, dateParam, selectedPetId])

  async function toggleTask(task: ScheduleTask, completed: boolean) {
    if (!profile?.householdId || !user || !selectedPetId) return
    setLoadingTasks((prev) => new Set(prev).add(task.id))
    try {
      if (completed) {
        await scheduleService.completeTask(
          profile.householdId,
          selectedPetId,
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
        await scheduleService.uncompleteTask(
          profile.householdId,
          selectedPetId,
          task.id,
          date,
        )
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

  async function markAllCompleted() {
    if (!profile?.householdId || !user || !selectedPetId || markingAll) return

    const incompleteTaskIds = tasks
      .filter((task) => completions[task.id] == null)
      .map((task) => task.id)
    if (incompleteTaskIds.length === 0) return

    setMarkingAll(true)
    try {
      await scheduleService.completeAllTasks(
        profile.householdId,
        selectedPetId,
        incompleteTaskIds,
        date,
        user.id,
      )
      await loadCompletions()
    } finally {
      setMarkingAll(false)
    }
  }

  const now = new Date()
  const nowIndex = currentTimeInsertIndex(tasks, now)
  const completedCount = Object.keys(completions).length
  const allCompleted = tasks.length > 0 && completedCount >= tasks.length
  let currentSection: string | null = null
  let taskIndex = 0

  const taskElements: React.ReactNode[] = []
  for (const task of tasks) {
    if (isToday && taskIndex === nowIndex) {
      taskElements.push(
        <div key="now-line" ref={nowLineRef}>
          <CurrentTimeLine time={now} species={selectedPet?.species ?? 'dog'} />
        </div>,
      )
    }

    if (task.section !== currentSection) {
      currentSection = task.section
      taskElements.push(
        <SectionDivider key={`section-${task.section}-${taskIndex}`} label={task.section} />,
      )
    }

    const ref = taskIndex === nowIndex - 1 ? anchorRef : undefined

    taskElements.push(
      <div key={task.id} ref={ref}>
        <ScheduleBlock
          task={task}
          species={selectedPet?.species ?? 'dog'}
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
        <CurrentTimeLine time={now} species={selectedPet?.species ?? 'dog'} />
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

        {!loading && pets.length === 0 && (
          <div className="empty-pets-banner">
            Add a pet in Settings to see an age-appropriate schedule.
          </div>
        )}

        {!loading && selectedPet && tasks.length > 0 && (
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
          {plan?.tipsBody && (
            <div className="tip-box">
              <strong>{plan.tipsTitle ?? 'Key Notes'}</strong>
              <p>{plan.tipsBody}</p>
            </div>
          )}
          {dayRecommendations.length > 0 && (
            <div className="day-recommendations">
              <Recommendations items={dayRecommendations} compact />
            </div>
          )}
          {tasks.length > 0 && (
            <div className="mark-all-wrap">
              <button
                type="button"
                className="mark-all-button"
                onClick={markAllCompleted}
                disabled={allCompleted || markingAll}
              >
                {markingAll ? 'Marking…' : 'Mark All Completed'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
