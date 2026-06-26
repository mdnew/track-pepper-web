import { useCallback, useEffect, useState } from 'react'

import { petsService } from '../services/pets'
import type { Pet } from '../types'
import { formatDateOfBirth, formatPetAge } from '../utils/petAge'

type PetDraft = {
  name: string
  dateOfBirth: string
}

const emptyDraft = (): PetDraft => ({ name: '', dateOfBirth: '' })

export function PetsSection({
  onMessage,
  onError,
}: {
  onMessage: (message: string) => void
  onError: (message: string) => void
}) {
  const [pets, setPets] = useState<Pet[]>([])
  const [drafts, setDrafts] = useState<Record<string, PetDraft>>({})
  const [newPet, setNewPet] = useState<PetDraft>(emptyDraft())
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
            { name: pet.name, dateOfBirth: formatDateOfBirth(pet.dateOfBirth) },
          ]),
        ),
      )
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

  async function savePet(id: string) {
    const draft = drafts[id]
    if (!draft?.name.trim() || !draft.dateOfBirth) {
      onError('Each pet needs a name and date of birth.')
      return
    }

    setSavingId(id)
    onError('')
    try {
      await petsService.updatePet(id, draft.name, draft.dateOfBirth)
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
      await petsService.createPet(newPet.name, newPet.dateOfBirth)
      setNewPet(emptyDraft())
      await load()
      onMessage('Pet added.')
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <section className="settings-card">
        <h2>Pets</h2>
        <div className="settings-loading inline">
          <div className="spinner" />
        </div>
      </section>
    )
  }

  return (
    <section className="settings-card">
      <h2>Pets</h2>
      <p className="settings-help">
        Add each puppy or dog in your household. Ages update automatically from
        their date of birth.
      </p>

      {pets.length === 0 ? (
        <p className="settings-empty">No pets yet.</p>
      ) : (
        <ul className="pets-list">
          {pets.map((pet) => {
            const draft = drafts[pet.id] ?? {
              name: pet.name,
              dateOfBirth: formatDateOfBirth(pet.dateOfBirth),
            }
            const previewAge = draft.dateOfBirth
              ? formatPetAge(new Date(`${draft.dateOfBirth}T00:00:00`))
              : null

            return (
              <li key={pet.id} className="pet-card">
                <div className="pet-card-fields">
                  <label>
                    Name
                    <input
                      value={draft.name}
                      onChange={(e) => updateDraft(pet.id, { name: e.target.value })}
                    />
                  </label>
                  <label>
                    Date of birth
                    <input
                      type="date"
                      value={draft.dateOfBirth}
                      onChange={(e) =>
                        updateDraft(pet.id, { dateOfBirth: e.target.value })
                      }
                    />
                  </label>
                  {previewAge && <p className="pet-age">{previewAge}</p>}
                </div>
                <div className="pet-card-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={savingId === pet.id}
                    onClick={() => savePet(pet.id)}
                  >
                    {savingId === pet.id ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="btn-text-danger"
                    disabled={deletingId === pet.id}
                    onClick={() => removePet(pet.id)}
                  >
                    {deletingId === pet.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <form className="add-pet-form" onSubmit={addPet}>
        <h3>Add a pet</h3>
        <label>
          Name
          <input
            value={newPet.name}
            onChange={(e) => setNewPet((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Pepper"
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
        <button type="submit" className="btn-outline" disabled={adding}>
          {adding ? 'Adding…' : 'Add pet'}
        </button>
      </form>
    </section>
  )
}
