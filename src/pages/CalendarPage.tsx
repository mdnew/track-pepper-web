import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PetSelector } from '../components/PetSelector'
import { AppHeader } from '../components/ui'
import { MonthCalendar } from '../components/MonthCalendar'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/auth'
import { petsService } from '../services/pets'
import { scheduleService } from '../services/schedule'
import type { Pet, SchedulePlan } from '../types'
import { applySpeciesTheme, speciesTheme } from '../theme/speciesTheme'
import { formatPetSummary } from '../utils/petAge'
import { resolveSelectedPetId, writeSelectedPetId } from '../utils/petSelection'
import { resolvePlanForPet } from '../utils/schedulePlan'
import './CalendarPage.css'

export function CalendarPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [focusedMonth, setFocusedMonth] = useState(new Date())
  const [pets, setPets] = useState<Pet[]>([])
  const [plans, setPlans] = useState<SchedulePlan[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [taskCount, setTaskCount] = useState(0)
  const [completionCounts, setCompletionCounts] = useState<Map<string, number>>(
    new Map(),
  )
  const [householdName, setHouseholdName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? null
  const plan = selectedPet ? resolvePlanForPet(plans, selectedPet) : null
  const theme = speciesTheme(selectedPet?.species ?? 'dog')

  const loadData = useCallback(async () => {
    if (!profile?.householdId) return
    setLoading(true)
    try {
      const [nextPets, nextPlans, household] = await Promise.all([
        petsService.getPets(),
        scheduleService.getPlans(),
        authService.getHousehold(),
      ])

      const petId = resolveSelectedPetId(nextPets)
      const pet = nextPets.find((item) => item.id === petId) ?? null
      const activePlan = pet ? resolvePlanForPet(nextPlans, pet) : null

      const [tasks, counts] = petId
        ? await Promise.all([
            activePlan
              ? scheduleService.getTasksForPlan(activePlan.id)
              : Promise.resolve([]),
            scheduleService.getCompletionCountsForMonth(
              profile.householdId,
              petId,
              focusedMonth,
            ),
          ])
        : [[], new Map<string, number>()]

      setPets(nextPets)
      setPlans(nextPlans)
      setSelectedPetId(petId)
      setTaskCount(tasks.length)
      setCompletionCounts(counts)
      setHouseholdName(household?.name ?? null)
    } finally {
      setLoading(false)
    }
  }, [profile?.householdId, focusedMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!profile?.householdId || !selectedPetId || plans.length === 0) return

    const pet = pets.find((item) => item.id === selectedPetId)
    if (!pet) return

    async function refreshForPet() {
      const activePlan = resolvePlanForPet(plans, pet!)
      const [tasks, counts] = await Promise.all([
        activePlan
          ? scheduleService.getTasksForPlan(activePlan.id)
          : Promise.resolve([]),
        scheduleService.getCompletionCountsForMonth(
          profile!.householdId!,
          selectedPetId!,
          focusedMonth,
        ),
      ])
      setTaskCount(tasks.length)
      setCompletionCounts(counts)
    }

    refreshForPet().catch(() => undefined)
  }, [selectedPetId, focusedMonth, profile?.householdId, pets, plans])

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

  function handlePetSelect(petId: string) {
    setSelectedPetId(petId)
    writeSelectedPetId(petId)
  }

  return (
    <div className="page-with-header fixed-page-layout">
      <AppHeader
        title="TrackPepper"
        onSettings={() => navigate('/settings')}
      />

      <main className="calendar-page fixed-page-scroll">
        <div className="header-card">
          <span className="header-emoji" aria-hidden>
            {selectedPet ? theme.emoji : '🐾'}
          </span>
          <div>
            <h2>{householdName ?? 'Daily Schedule'}</h2>
            <p>
              {selectedPet
                ? `${formatPetSummary(selectedPet)}${plan ? ` · ${plan.name}` : ''}`
                : 'Add a pet in Settings to get a personalized schedule'}
            </p>
            {profile?.displayName && (
              <p className="signed-in">Signed in as {profile.displayName}</p>
            )}
          </div>
        </div>

        <PetSelector
          pets={pets}
          selectedPetId={selectedPetId ?? ''}
          onSelect={handlePetSelect}
        />

        <div className="calendar-card">
          {loading ? (
            <div className="calendar-loading">
              <div className="spinner" />
            </div>
          ) : pets.length === 0 ? (
            <div className="calendar-empty">
              Add your first pet in Settings to unlock age-based dog and cat
              schedules.
            </div>
          ) : (
            <>
              <MonthCalendar
                focusedMonth={focusedMonth}
                completionCounts={completionCounts}
                totalTasks={taskCount}
                onMonthChange={(month) => setFocusedMonth(month)}
                onDaySelect={(day) => {
                  const y = day.getFullYear()
                  const m = String(day.getMonth() + 1).padStart(2, '0')
                  const d = String(day.getDate()).padStart(2, '0')
                  const query = selectedPetId ? `?pet=${selectedPetId}` : ''
                  navigate(`/day/${y}-${m}-${d}${query}`)
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
