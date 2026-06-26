import { useCallback, useEffect, useState } from 'react'

import { EditIconButton } from './EditableSetting'
import { petsService } from '../services/pets'
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
          <div>
            <p className="pet-summary">{formatPetSummary(pet)}</p>
            <p className="pet-dob">
              Born {formatDateOfBirth(pet.dateOfBirth)}
            </p>
          </div>
          <EditIconButton label={`Edit ${pet.name}`} onClick={onEdit} />
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
        </label>
        {previewAge && <p className="pet-age">{previewAge}</p>}
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
        className="btn-text-danger pet-remove-btn"
        disabled={saving || deleting}
        onClick={onRemove}
      >
        {deleting ? 'Removing…' : 'Remove pet'}
      </button>
    </li>
  )
}

export function PetsSection({
  embedded = false,
  onMessage,
  onError,
}: {
  embedded?: boolean
  onMessage: (message: string) => void
  onError: (message: string) => void
}) {
  const [pets, setPets] = useState<Pet[]>([])
  const [drafts, setDrafts] = useState<Record<string, PetDraft>>({})
  const [newPet, setNewPet] = useState<PetDraft>(emptyDraft())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const nextPets = await petsService.getPets()
      setPets(nextPets)
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
  }, [])

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

  async function removePet(id: string) {
    if (!window.confirm('Remove this pet from your household?')) return

    setDeletingId(id)
    onError('')
    try {
      await petsService.deletePet(id)
      await load()
      onMessage('Pet removed.')
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      setDeletingId(null)
    }
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
      await petsService.createPet(newPet.name, newPet.dateOfBirth, newPet.species)
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
                onEdit={() => startEdit(pet.id)}
                onCancel={() => cancelEdit(pet.id)}
                onUpdateDraft={(patch) => updateDraft(pet.id, patch)}
                onSave={() => savePet(pet.id)}
                onRemove={() => removePet(pet.id)}
              />
            )
          })}
        </ul>
      )}

      {showAddForm ? (
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
      )}
    </>
  )

  if (embedded) {
    return <div className="household-subsection">{content}</div>
  }

  return <section className="settings-card">{content}</section>
}
