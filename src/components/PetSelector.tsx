import type { Pet } from '../types'
import { formatPetSummary } from '../utils/petAge'
import './PetSelector.css'

interface Props {
  pets: Pet[]
  selectedPetId: string
  onSelect: (petId: string) => void
}

export function PetSelector({ pets, selectedPetId, onSelect }: Props) {
  if (pets.length <= 1) return null

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
            {formatPetSummary(pet)}
          </option>
        ))}
      </select>
    </div>
  )
}
