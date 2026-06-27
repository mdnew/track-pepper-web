import type { Pet, SchedulePlan } from '../types'
import { formatPetSummaryWithPlan } from '../utils/petAge'
import './PetSelector.css'

interface Props {
  pets: Pet[]
  selectedPetId: string
  plansByPetId: Record<string, SchedulePlan | null>
  onSelect: (petId: string) => void
}

export function PetSelector({ pets, selectedPetId, plansByPetId, onSelect }: Props) {
  if (pets.length === 0 || !selectedPetId) return null

  const selectedPet = pets.find((pet) => pet.id === selectedPetId)
  if (!selectedPet) return null

  if (pets.length <= 1) {
    return (
      <div className="pet-selector">
        <div className="pet-selector-label">
          {formatPetSummaryWithPlan(selectedPet, plansByPetId[selectedPet.id] ?? null)}
        </div>
      </div>
    )
  }

  return (
    <div className="pet-selector">
      <select
        id="pet-select"
        className="pet-selector-dropdown"
        value={selectedPetId}
        aria-label="Select pet"
        onChange={(e) => onSelect(e.target.value)}
      >
        {pets.map((pet) => (
          <option key={pet.id} value={pet.id}>
            {formatPetSummaryWithPlan(pet, plansByPetId[pet.id] ?? null)}
          </option>
        ))}
      </select>
    </div>
  )
}
