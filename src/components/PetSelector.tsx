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
    <div className="pet-selector" role="tablist" aria-label="Select pet">
      {pets.map((pet) => {
        const active = pet.id === selectedPetId
        return (
          <button
            key={pet.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`pet-selector-chip${active ? ' active' : ''}`}
            onClick={() => onSelect(pet.id)}
          >
            {formatPetSummary(pet)}
          </button>
        )
      })}
    </div>
  )
}
