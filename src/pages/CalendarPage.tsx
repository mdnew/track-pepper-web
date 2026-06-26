import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PetSelector } from '../components/PetSelector'
import { AppHeader } from '../components/ui'
import { MonthCalendar } from '../components/MonthCalendar'
import { useAuth } from '../context/AuthContext'
import { petsService } from '../services/pets'
import { scheduleService } from '../services/schedule'
import type { Pet } from '../types'
import { applySpeciesTheme, speciesTheme } from '../theme/speciesTheme'
import { resolveSelectedPetId, readSelectedPetId, writeSelectedPetId } from '../utils/petSelection'
import './CalendarPage.css'

export function CalendarPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [focusedMonth, setFocusedMonth] = useState(new Date())
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string | null>(() =>
    readSelectedPetId(),
  )
  const [taskCount, setTaskCount] = useState(0)
  const [completionCounts, setCompletionCounts] = useState<Map<string, number>>(
    new Map(),
  )
  const [loading, setLoading] = useState(true)

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? null
  const theme = speciesTheme(selectedPet?.species ?? 'dog')

  const loadData = useCallback(async () => {
    if (!profile?.householdId) return
    setLoading(true)
    try {
      const [nextPets, nextPlans] = await Promise.all([
        petsService.getPets(),
        scheduleService.getPlans(),
      ])

      const petId = resolveSelectedPetId(nextPets, selectedPetId)
      if (petId) writeSelectedPetId(petId)
      const pet = nextPets.find((item) => item.id === petId) ?? null
      const schedule = pet
        ? await scheduleService.getScheduleForPet(pet, nextPlans, new Date())
        : { plan: null, tasks: [] }

      const counts = petId
        ? await scheduleService.getCompletionCountsForMonth(
            profile.householdId,
            petId,
            focusedMonth,
          )
        : new Map<string, number>()

      setPets(nextPets)
      setSelectedPetId(petId)
      setTaskCount(schedule.tasks.length)
      setCompletionCounts(counts)
    } finally {
      setLoading(false)
    }
  }, [profile?.householdId, focusedMonth, selectedPetId])

  useEffect(() => {
    loadData()
  }, [loadData])

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
      <AppHeader onSettings={() => navigate('/settings')} />

      <main className="calendar-page fixed-page-scroll">
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
