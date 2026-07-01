import type { HouseholdMembership, Pet } from '../types'
import { formatPetNamesLine } from '../utils/petAge'
import './PetSelector.css'

function householdName({ household, role }: HouseholdMembership): string {
  if (role === 'guest') return 'Guest access'
  return household.name
}

function formatHouseholdOptionLabel(
  membership: HouseholdMembership,
  pets: Pet[] | undefined,
): string {
  const petsLine = formatPetNamesLine(pets ?? [])
  const householdLine = householdName(membership)
  if (!petsLine) return householdLine
  return `${householdLine} · ${petsLine}`
}

interface Props {
  memberships: HouseholdMembership[]
  selectedHouseholdId: string
  petsByHouseholdId?: Record<string, Pet[]>
  onSelect: (householdId: string) => void
  /** When false, dropdown shows household name only (e.g. calendar page). */
  showPetNames?: boolean
}

export function HouseholdSelector({
  memberships,
  selectedHouseholdId,
  petsByHouseholdId = {},
  onSelect,
  showPetNames = true,
}: Props) {
  if (memberships.length === 0 || !selectedHouseholdId) return null

  const selected = memberships.find((m) => m.household.id === selectedHouseholdId)
  if (!selected) return null

  if (memberships.length <= 1) {
    return null
  }

  return (
    <div className="pet-selector">
      <select
        id="household-select"
        className="pet-selector-dropdown"
        value={selectedHouseholdId}
        aria-label="Select household"
        onChange={(e) => onSelect(e.target.value)}
      >
        {memberships.map((membership) => (
          <option key={membership.household.id} value={membership.household.id}>
            {showPetNames
              ? formatHouseholdOptionLabel(
                  membership,
                  petsByHouseholdId[membership.household.id],
                )
              : householdName(membership)}
          </option>
        ))}
      </select>
    </div>
  )
}
