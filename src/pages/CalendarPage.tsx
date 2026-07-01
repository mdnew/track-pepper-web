import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { HouseholdSelector } from '../components/HouseholdSelector'
import { AppHeader, LoadingScreen } from '../components/ui'
import { MonthCalendar } from '../components/MonthCalendar'
import { useAuth } from '../context/AuthContext'
import { petsService } from '../services/pets'
import {
  getScheduleRevision,
  scheduleService,
  subscribeScheduleRevision,
} from '../services/schedule'
import type { Pet } from '../types'
import { applySpeciesTheme, speciesTheme } from '../theme/speciesTheme'
import { readSelectedPetId } from '../utils/petSelection'
import { formatPetNamesLine } from '../utils/petAge'
import './CalendarPage.css'

export function CalendarPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    activeHouseholdId,
    memberships,
    loading: authLoading,
    setActiveHousehold,
  } = useAuth()
  const [focusedMonth, setFocusedMonth] = useState(new Date())
  const [petsByHouseholdId, setPetsByHouseholdId] = useState<Record<string, Pet[]>>({})
  const [completionCounts, setCompletionCounts] = useState<Map<string, number>>(new Map())
  const [dayTotals, setDayTotals] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [scheduleRevision, setScheduleRevision] = useState(getScheduleRevision)

  const pets = activeHouseholdId ? petsByHouseholdId[activeHouseholdId] ?? [] : []
  const showLoading = authLoading || loading
  const petsLine = formatPetNamesLine(pets)
  const theme = speciesTheme('dog')

  const loadData = useCallback(async () => {
    if (authLoading) return
    if (!activeHouseholdId || memberships.length === 0) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const petsEntries = await Promise.all(
        memberships.map(async (membership) => {
          const householdPets = await petsService.getPets(membership.household.id)
          return [membership.household.id, householdPets] as const
        }),
      )
      const nextPetsByHousehold = Object.fromEntries(petsEntries)
      setPetsByHouseholdId(nextPetsByHousehold)
    } finally {
      setLoading(false)
    }
  }, [activeHouseholdId, memberships, authLoading])

  useEffect(() => {
    return subscribeScheduleRevision(() => {
      setScheduleRevision(getScheduleRevision())
    })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadCompletionStatus = useCallback(async () => {
    if (!activeHouseholdId || pets.length === 0) {
      setCompletionCounts(new Map())
      setDayTotals(new Map())
      return
    }
    try {
      const plans = await scheduleService.getPlans()
      const { completions, totals } = await scheduleService.getAggregatedCountsForMonth(
        activeHouseholdId,
        pets,
        plans,
        focusedMonth,
      )
      setCompletionCounts(completions)
      setDayTotals(totals)
    } catch {
      setCompletionCounts(new Map())
      setDayTotals(new Map())
    }
  }, [activeHouseholdId, pets, focusedMonth, scheduleRevision])

  useEffect(() => {
    if (loading) return
    loadCompletionStatus().catch(() => undefined)
  }, [loading, loadCompletionStatus])

  useEffect(() => {
    if (location.pathname !== '/') return
    loadCompletionStatus().catch(() => undefined)
  }, [location.pathname, loadCompletionStatus])

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

  async function handleHouseholdSelect(householdId: string) {
    if (householdId === activeHouseholdId) return
    await setActiveHousehold(householdId)
  }

  function handleDaySelect(day: Date) {
    const y = day.getFullYear()
    const m = String(day.getMonth() + 1).padStart(2, '0')
    const d = String(day.getDate()).padStart(2, '0')
    const storedPetId = activeHouseholdId
      ? readSelectedPetId(activeHouseholdId)
      : null
    const query = storedPetId ? `?pet=${storedPetId}` : ''
    navigate(`/day/${y}-${m}-${d}${query}`)
  }

  if (showLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="page-with-header fixed-page-layout">
      <AppHeader onSettings={() => navigate('/settings')} />

      <main className="calendar-page fixed-page-scroll">
        <HouseholdSelector
          memberships={memberships}
          selectedHouseholdId={activeHouseholdId ?? ''}
          petsByHouseholdId={petsByHouseholdId}
          showPetNames={false}
          onSelect={(id) => {
            handleHouseholdSelect(id).catch(() => undefined)
          }}
        />

        <div className="calendar-card">
          {pets.length === 0 ? (
            <div className="calendar-empty">
              Add your first pet in Settings to unlock age-based dog and cat
              schedules.
            </div>
          ) : (
            <>
              {petsLine && (
                <p className="calendar-pets-subtitle">{petsLine}</p>
              )}
              <MonthCalendar
                focusedMonth={focusedMonth}
                completionCounts={completionCounts}
                dayTotals={dayTotals}
                onMonthChange={(month) => setFocusedMonth(month)}
                onDaySelect={handleDaySelect}
              />
              <p className="calendar-hint">Tap a day to view and check off tasks</p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
