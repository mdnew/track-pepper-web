import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EditIconButton } from './EditableSetting'
import { ConfirmDialog } from './ConfirmDialog'
import { petsService } from '../services/pets'
import { scheduleService } from '../services/schedule'
import type { Pet, PetSpecies } from '../types'
import {
  formatDateOfBirth,
  formatPetAge,
  formatPetSummary,
} from '../utils/petAge'
import './EditableSetting.css'

type PetDraft = {
  name: string
  dateOfBirth: string
  species: PetSpecies
}

const emptyDraft = (): PetDraft => ({ name: '', dateOfBirth: '', species: 'dog' })

type PetScheduleInfo = {
  label: string
  taskCount: number | null
}

function formatScheduleLine(info: PetScheduleInfo): string {
  if (info.taskCount == null) return info.label
  return `${info.label} · ${info.taskCount} tasks`
}

function SpeciesPicker({
  value,
  onChange,
}: {
  value: PetSpecies
  onChange: (species: PetSpecies) => void
}) {
  return (
    <div className="species-picker">
      <span className="species-picker-label">Type</span>
      <div className="species-picker-options">
        <button
          type="button"
          className={value === 'dog' ? 'active' : ''}
          onClick={() => onChange('dog')}
        >
          🐶 Dog
        </button>
        <button
          type="button"
          className={value === 'cat' ? 'active' : ''}
          onClick={() => onChange('cat')}
        >
          🐱 Cat
        </button>
      </div>
    </div>
  )
}

function PetCard({
  pet,
  draft,
  editing,
  saving,
  deleting,
  scheduleInfo,
  onEdit,
  onCancel,
  onUpdateDraft,
  onSave,
  onRemove,
}: {
  pet: Pet
  draft: PetDraft
  editing: boolean
  saving: boolean
  deleting: boolean
  scheduleInfo: PetScheduleInfo
  onEdit: () => void
  onCancel: () => void
  onUpdateDraft: (patch: Partial<PetDraft>) => void
  onSave: () => void
  onRemove: () => void
}) {
  const previewAge = draft.dateOfBirth
    ? formatPetAge(new Date(`${draft.dateOfBirth}T00:00:00`))
    : null

  if (!editing) {
    return (
      <li className="pet-card">
        <div className="pet-card-readonly">
          <div className="pet-card-row">
            <div>
              <p className="pet-summary">{formatPetSummary(pet)}</p>
              <p className="pet-dob">
                Born {formatDateOfBirth(pet.dateOfBirth)}
              </p>
            </div>
            <EditIconButton label={`Edit ${pet.name}`} onClick={onEdit} />
          </div>
          <div className="pet-card-schedule">
            <span className="pet-schedule-summary">
              {formatScheduleLine(scheduleInfo)}
            </span>
            {scheduleInfo.taskCount != null && (
              <Link
                to={`/settings/schedule/${pet.id}`}
                className="pet-schedule-edit-link"
              >
                Edit Schedule
              </Link>
            )}
          </div>
        </div>
      </li>
    )
  }

  return (
    <li className="pet-card">
      <div className="pet-card-fields">
        <SpeciesPicker
          value={draft.species}
          onChange={(species) => onUpdateDraft({ species })}
        />
        <label>
          Name
          <input
            value={draft.name}
            onChange={(e) => onUpdateDraft({ name: e.target.value })}
            autoFocus
          />
        </label>
        <label>
          Date of birth
          <input
            type="date"
            value={draft.dateOfBirth}
            onChange={(e) => onUpdateDraft({ dateOfBirth: e.target.value })}
          />
          {previewAge && <span className="pet-dob-hint">{previewAge}</span>}
        </label>
      </div>
      <div className="editable-setting-actions">
        <button
          type="button"
          className="btn-outline"
          disabled={saving || deleting}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={saving || deleting}
          onClick={onSave}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <button
        type="button"
        className="btn-outline btn-outline-danger pet-remove-btn"
        disabled={saving || deleting}
        onClick={onRemove}
      >
        Remove pet
      </button>
    </li>
  )
}

export function PetsSection({
  embedded = false,
  householdId,
  canManagePets = true,
  onMessage,
  onError,
}: {
  embedded?: boolean
  householdId?: string | null
  canManagePets?: boolean
  onMessage: (message: string) => void
  onError: (message: string) => void
}) {
  const [pets, setPets] = useState<Pet[]>([])
  const [scheduleSummaries, setScheduleSummaries] = useState<
    Record<string, PetScheduleInfo>
  >({})
  const [drafts, setDrafts] = useState<Record<string, PetDraft>>({})
  const [newPet, setNewPet] = useState<PetDraft>(emptyDraft())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [removeConfirmPetId, setRemoveConfirmPetId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nextPets, plans] = await Promise.all([
        petsService.getPets(householdId),
        scheduleService.getPlans(),
      ])
      const summaries: Record<string, PetScheduleInfo> = {}
      for (const pet of nextPets) {
        const meta = await scheduleService.getPetScheduleMeta(pet.id)
        if (meta?.isCustomized) {
          const tasks = await scheduleService.getCustomTasksForPet(pet.id)
          summaries[pet.id] = {
            label: 'Custom schedule',
            taskCount: tasks.length,
          }
        } else {
          const schedule = await scheduleService.getScheduleForPet(
            pet,
            plans,
            new Date(),
          )
          summaries[pet.id] = schedule.plan
            ? {
                label: `${schedule.plan.emoji} ${schedule.plan.name}`,
                taskCount: schedule.tasks.length,
              }
            : { label: 'No schedule yet', taskCount: null }
        }
      }
      setPets(nextPets)
      setScheduleSummaries(summaries)
      setDrafts(
        Object.fromEntries(
          nextPets.map((pet) => [
            pet.id,
            {
              name: pet.name,
              dateOfBirth: formatDateOfBirth(pet.dateOfBirth),
              species: pet.species,
            },
          ]),
        ),
      )
      setEditingId(null)
    } finally {
      setLoading(false)
    }
  }, [householdId])

  useEffect(() => {
    load()
  }, [load])

  function updateDraft(id: string, patch: Partial<PetDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }))
  }

  function startEdit(id: string) {
    const pet = pets.find((item) => item.id === id)
    if (!pet) return
    setEditingId(id)
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        name: pet.name,
        dateOfBirth: formatDateOfBirth(pet.dateOfBirth),
        species: pet.species,
      },
    }))
  }

  function cancelEdit(id: string) {
    const pet = pets.find((item) => item.id === id)
    if (pet) {
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          name: pet.name,
          dateOfBirth: formatDateOfBirth(pet.dateOfBirth),
          species: pet.species,
        },
      }))
    }
    setEditingId(null)
  }

  async function savePet(id: string) {
    const draft = drafts[id]
    if (!draft?.name.trim() || !draft.dateOfBirth) {
      onError('Each pet needs a name and date of birth.')
      return
    }

    setSavingId(id)
    onError('')
    try {
      await petsService.updatePet(
        id,
        draft.name,
        draft.dateOfBirth,
        draft.species,
      )
      await load()
      onMessage('Pet updated.')
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingId(null)
    }
  }

  async function confirmRemovePet(id: string) {
    setDeletingId(id)
    onError('')
    try {
      await petsService.deletePet(id)
      setRemoveConfirmPetId(null)
      await load()
      onMessage('Pet removed.')
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      setDeletingId(null)
    }
  }

  function requestRemovePet(id: string) {
    setRemoveConfirmPetId(id)
  }

  async function addPet(e: React.FormEvent) {
    e.preventDefault()
    if (!newPet.name.trim() || !newPet.dateOfBirth) {
      onError('Enter a name and date of birth for the new pet.')
      return
    }

    setAdding(true)
    onError('')
    try {
      await petsService.createPet(
        newPet.name,
        newPet.dateOfBirth,
        newPet.species,
        householdId,
      )
      setNewPet(emptyDraft())
      setShowAddForm(false)
      await load()
      onMessage('Pet added.')
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      setAdding(false)
    }
  }

  function cancelAdd() {
    setNewPet(emptyDraft())
    setShowAddForm(false)
  }

  if (loading) {
    const loadingContent = (
      <div className="settings-loading inline">
        <div className="spinner" />
      </div>
    )

    if (embedded) {
      return (
        <div className="household-subsection">
          <h3 className="household-subsection-title">Pets</h3>
          {loadingContent}
        </div>
      )
    }

    return (
      <section className="settings-card">
        <h2>Pets</h2>
        {loadingContent}
      </section>
    )
  }

  const content = (
    <>
      {!embedded && <h2>Pets</h2>}
      {embedded && <h3 className="household-subsection-title">Pets</h3>}
      <p className="settings-help">
        Add each dog or cat in your household. Ages update automatically from
        their date of birth.
      </p>

      {pets.length > 0 && (
        <ul className="pets-list">
          {pets.map((pet) => {
            const draft = drafts[pet.id] ?? {
              name: pet.name,
              dateOfBirth: formatDateOfBirth(pet.dateOfBirth),
              species: pet.species,
            }

            return (
              <PetCard
                key={pet.id}
                pet={pet}
                draft={draft}
                editing={editingId === pet.id}
                saving={savingId === pet.id}
                deleting={deletingId === pet.id}
                scheduleInfo={
                  scheduleSummaries[pet.id] ?? {
                    label: 'No schedule yet',
                    taskCount: null,
                  }
                }
                onEdit={() => startEdit(pet.id)}
                onCancel={() => cancelEdit(pet.id)}
                onUpdateDraft={(patch) => updateDraft(pet.id, patch)}
                onSave={() => savePet(pet.id)}
                onRemove={() => requestRemovePet(pet.id)}
              />
            )
          })}
        </ul>
      )}

      {canManagePets && (
        showAddForm ? (
        <form
          className={`add-pet-form${embedded ? ' add-pet-form-embedded' : ''}`}
          onSubmit={addPet}
        >
          <h3>Add a pet</h3>
          <SpeciesPicker
            value={newPet.species}
            onChange={(species) => setNewPet((prev) => ({ ...prev, species }))}
          />
          <label>
            Name
            <input
              value={newPet.name}
              onChange={(e) =>
                setNewPet((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Pepper"
              autoFocus
            />
          </label>
          <label>
            Date of birth
            <input
              type="date"
              value={newPet.dateOfBirth}
              onChange={(e) =>
                setNewPet((prev) => ({ ...prev, dateOfBirth: e.target.value }))
              }
            />
            {newPet.dateOfBirth && (
              <span className="pet-dob-hint">
                {formatPetAge(new Date(`${newPet.dateOfBirth}T00:00:00`))}
              </span>
            )}
          </label>
          <div className="editable-setting-actions">
            <button
              type="button"
              className="btn-outline"
              disabled={adding}
              onClick={cancelAdd}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={adding}>
              {adding ? 'Adding…' : 'Add pet'}
            </button>
          </div>
        </form>
        ) : (
          <button
            type="button"
            className="btn-outline add-pet-button"
            onClick={() => setShowAddForm(true)}
          >
            Add pet
          </button>
        )
      )}
    </>
  )

  const removeConfirmPet = pets.find((pet) => pet.id === removeConfirmPetId)

  const removeDialog = (
    <ConfirmDialog
      open={removeConfirmPetId != null}
      title="Remove pet?"
      message={
        removeConfirmPet
          ? `${removeConfirmPet.name} will be removed from your household, including their schedule and completion history.`
          : ''
      }
      confirmLabel="Remove pet"
      confirmingLabel="Removing…"
      confirming={deletingId === removeConfirmPetId}
      onCancel={() => {
        if (!deletingId) setRemoveConfirmPetId(null)
      }}
      onConfirm={() => {
        if (removeConfirmPetId) {
          confirmRemovePet(removeConfirmPetId).catch(() => undefined)
        }
      }}
    />
  )

  if (embedded) {
    return (
      <div className="household-subsection">
        {content}
        {removeDialog}
      </div>
    )
  }

  return (
    <section className="settings-card">
      {content}
      {removeDialog}
    </section>
  )
}
