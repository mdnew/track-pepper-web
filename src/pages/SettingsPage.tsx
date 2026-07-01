import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorBanner } from '../components/ui'
import {
  EditablePasswordSetting,
  EditableTextSetting,
} from '../components/EditableSetting'
import { HouseholdSelector } from '../components/HouseholdSelector'
import { PetsSection } from '../components/PetsSection'
import { Recommendations } from '../components/Recommendations'
import { recommendationsForPetSpeciesList } from '../config/recommendations'
import { authService } from '../services/auth'
import { petsService } from '../services/pets'
import { useAuth } from '../context/AuthContext'
import type { Household, HouseholdMember, HouseholdRole, Pet } from '../types'
import './SettingsPage.css'

const ROLE_LABELS: Record<HouseholdRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  guest: 'Guest',
}

const WEEKDAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

function formatGuestAccess(member: HouseholdMember): string {
  const parts: string[] = []
  if (member.validFrom) {
    parts.push(member.validFrom.toLocaleDateString())
  }
  if (member.validUntil) {
    parts.push(member.validUntil.toLocaleDateString())
  }
  const range =
    parts.length === 2
      ? `${parts[0]} – ${parts[1]}`
      : parts.length === 1
        ? `From ${parts[0]}`
        : 'Any date'

  if (member.validDaysOfWeek && member.validDaysOfWeek.length > 0) {
    const dayLabels = member.validDaysOfWeek
      .map((d) => WEEKDAYS.find((w) => w.value === d)?.label ?? String(d))
      .join(', ')
    return `${range} · ${dayLabels}`
  }

  return range
}

function canRemoveMember(
  actorRole: HouseholdRole | null,
  targetRole: HouseholdRole,
): boolean {
  if (!actorRole || actorRole === 'member' || actorRole === 'guest') return false
  if (actorRole === 'admin' && (targetRole === 'owner' || targetRole === 'admin')) {
    return false
  }
  return true
}

function canEditMemberRole(
  actorRole: HouseholdRole | null,
  targetRole: HouseholdRole,
): boolean {
  return (
    actorRole === 'owner' &&
    (targetRole === 'member' || targetRole === 'admin')
  )
}

function MemberEditForm({
  member,
  role,
  saving,
  onRoleChange,
  onDone,
  onCancel,
}: {
  member: HouseholdMember
  role: 'member' | 'admin'
  saving: boolean
  onRoleChange: (role: 'member' | 'admin') => void
  onDone: () => void
  onCancel: () => void
}) {
  return (
    <li className="member-edit-row">
      <span className="member-avatar">
        {member.displayName.charAt(0).toUpperCase()}
      </span>
      <div className="member-edit-fields">
        <p className="member-edit-name">{member.displayName}</p>
        <fieldset className="member-role-fieldset">
          <legend>Role</legend>
          <div className="member-role-options">
            {(['member', 'admin'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={role === option ? 'active' : ''}
                onClick={() => onRoleChange(option)}
              >
                {ROLE_LABELS[option]}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="editable-setting-actions">
          <button
            type="button"
            className="btn-outline"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={saving}
            onClick={onDone}
          >
            {saving ? 'Saving…' : 'Done'}
          </button>
        </div>
      </div>
    </li>
  )
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function GuestEditForm({
  guest,
  validFrom,
  validUntil,
  guestDays,
  saving,
  onValidFromChange,
  onValidUntilChange,
  onToggleGuestDay,
  onDone,
  onCancel,
}: {
  guest: HouseholdMember
  validFrom: string
  validUntil: string
  guestDays: number[]
  saving: boolean
  onValidFromChange: (value: string) => void
  onValidUntilChange: (value: string) => void
  onToggleGuestDay: (day: number) => void
  onDone: () => void
  onCancel: () => void
}) {
  return (
    <li className="guest-edit-row">
      <span className="member-avatar">
        {guest.displayName.charAt(0).toUpperCase()}
      </span>
      <form
        className="guest-form guest-edit-form"
        onSubmit={(e) => {
          e.preventDefault()
          onDone()
        }}
      >
        <p className="member-edit-name">{guest.displayName}</p>
        <div className="guest-date-row">
          <label>
            From
            <input
              type="date"
              value={validFrom}
              onChange={(e) => onValidFromChange(e.target.value)}
              required
            />
          </label>
          <label>
            Until
            <input
              type="date"
              value={validUntil}
              onChange={(e) => onValidUntilChange(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="guest-days">
          <span className="guest-days-label">Days (optional)</span>
          <div className="guest-days-options">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                className={guestDays.includes(day.value) ? 'active' : ''}
                onClick={() => onToggleGuestDay(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
        <div className="editable-setting-actions">
          <button
            type="button"
            className="btn-outline"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Done'}
          </button>
        </div>
      </form>
    </li>
  )
}

export function SettingsPage() {
  const navigate = useNavigate()
  const {
    user,
    signOut,
    activeHouseholdId,
    memberships,
    currentRole,
    setActiveHousehold,
    refreshProfile,
  } = useAuth()
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [guests, setGuests] = useState<HouseholdMember[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [petsByHouseholdId, setPetsByHouseholdId] = useState<Record<string, Pet[]>>({})
  const [displayName, setDisplayName] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [savingHouseholdName, setSavingHouseholdName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const [removeConfirmMember, setRemoveConfirmMember] =
    useState<HouseholdMember | null>(null)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editMemberRole, setEditMemberRole] = useState<'member' | 'admin'>('member')
  const [savingMemberRole, setSavingMemberRole] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [addingGuest, setAddingGuest] = useState(false)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [guestEmail, setGuestEmail] = useState('')
  const [guestFrom, setGuestFrom] = useState('')
  const [guestUntil, setGuestUntil] = useState('')
  const [guestDays, setGuestDays] = useState<number[]>([])
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [editGuestFrom, setEditGuestFrom] = useState('')
  const [editGuestUntil, setEditGuestUntil] = useState('')
  const [editGuestDays, setEditGuestDays] = useState<number[]>([])
  const [savingGuestAccess, setSavingGuestAccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const canManage = currentRole === 'owner' || currentRole === 'admin'
  const canManagePets = currentRole !== 'guest'
  const isGuest = currentRole === 'guest'
  const myGuestAccess = guests.find((guest) => guest.userId === user?.id)

  const load = useCallback(async () => {
    if (!activeHouseholdId) return
    setLoading(true)
    try {
      const [p, h, m, g, petsEntries] = await Promise.all([
        authService.getProfile(),
        authService.getHousehold(activeHouseholdId),
        currentRole !== 'guest'
          ? authService.getHouseholdMembers(activeHouseholdId)
          : Promise.resolve([]),
        currentRole === 'guest' || currentRole === 'owner' || currentRole === 'admin'
          ? authService.getGuestMembers(activeHouseholdId)
          : Promise.resolve([]),
        Promise.all(
          memberships.map(async (membership) => {
            const householdPets = await petsService.getPets(membership.household.id)
            return [membership.household.id, householdPets] as const
          }),
        ),
      ])
      const nextPetsByHousehold = Object.fromEntries(petsEntries)
      setHousehold(h)
      setMembers(m)
      setGuests(g)
      setPets(nextPetsByHousehold[activeHouseholdId] ?? [])
      setPetsByHouseholdId(nextPetsByHousehold)
      setDisplayName(p?.displayName ?? '')
      setHouseholdName(h?.name ?? '')
    } finally {
      setLoading(false)
    }
  }, [activeHouseholdId, currentRole, memberships])

  useEffect(() => {
    load()
  }, [load])

  async function saveName(nextName: string) {
    setSavingName(true)
    setError(null)
    setMessage(null)
    try {
      await authService.updateDisplayName(nextName)
      await load()
      setMessage('Display name updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    } finally {
      setSavingName(false)
    }
  }

  async function saveHouseholdName(nextName: string) {
    if (!activeHouseholdId) return
    if (!nextName.trim()) {
      setError('Household name is required.')
      throw new Error('Household name is required.')
    }
    setSavingHouseholdName(true)
    setError(null)
    setMessage(null)
    try {
      await authService.updateHouseholdName(activeHouseholdId, nextName)
      await load()
      setMessage('Household name updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    } finally {
      setSavingHouseholdName(false)
    }
  }

  async function changePassword(newPassword: string) {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      throw new Error('Password must be at least 6 characters.')
    }
    setSavingPassword(true)
    setError(null)
    setMessage(null)
    try {
      await authService.updatePassword(newPassword)
      setMessage('Password updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    } finally {
      setSavingPassword(false)
    }
  }

  async function confirmRemoveMember() {
    if (!activeHouseholdId || !removeConfirmMember) return

    const member = removeConfirmMember
    setRemovingUserId(member.userId)
    setError(null)
    setMessage(null)
    try {
      await authService.removeMember(activeHouseholdId, member.userId)
      setRemoveConfirmMember(null)
      await load()
      setMessage(`${member.displayName} removed.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRemovingUserId(null)
    }
  }

  function requestRemoveMember(member: HouseholdMember) {
    setRemoveConfirmMember(member)
  }

  function startEditMember(member: HouseholdMember) {
    setEditingMemberId(member.userId)
    setEditMemberRole(member.role === 'admin' ? 'admin' : 'member')
  }

  function cancelEditMember() {
    setEditingMemberId(null)
  }

  async function saveMemberRole() {
    if (!activeHouseholdId || !editingMemberId) return

    setSavingMemberRole(true)
    setError(null)
    setMessage(null)
    try {
      await authService.setMemberRole(
        activeHouseholdId,
        editingMemberId,
        editMemberRole,
      )
      setEditingMemberId(null)
      await load()
      setMessage('Role updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingMemberRole(false)
    }
  }

  async function confirmLeaveHousehold() {
    if (!activeHouseholdId) return

    setLeaving(true)
    setError(null)
    setMessage(null)
    try {
      await authService.leaveHousehold(activeHouseholdId)
      setShowLeaveConfirm(false)
      await refreshProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLeaving(false)
    }
  }

  function requestLeaveHousehold() {
    if (currentRole === 'owner') {
      setError("Owners can't leave a household they own.")
      return
    }
    setShowLeaveConfirm(true)
  }

  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault()
    if (!activeHouseholdId) return
    if (!guestEmail.trim() || !guestFrom || !guestUntil) {
      setError('Guest email and date range are required.')
      return
    }

    setAddingGuest(true)
    setError(null)
    setMessage(null)
    try {
      await authService.addGuestByEmail(
        activeHouseholdId,
        guestEmail,
        guestFrom,
        guestUntil,
        guestDays.length > 0 ? guestDays : null,
      )
      setGuestEmail('')
      setGuestFrom('')
      setGuestUntil('')
      setGuestDays([])
      setShowGuestForm(false)
      await load()
      setMessage('Guest access added.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setAddingGuest(false)
    }
  }

  function cancelGuestForm() {
    setGuestEmail('')
    setGuestFrom('')
    setGuestUntil('')
    setGuestDays([])
    setShowGuestForm(false)
  }

  function toggleGuestDay(day: number) {
    setGuestDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  function toggleEditGuestDay(day: number) {
    setEditGuestDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  function startEditGuest(guest: HouseholdMember) {
    setShowGuestForm(false)
    setEditingGuestId(guest.userId)
    setEditGuestFrom(toDateInputValue(guest.validFrom))
    setEditGuestUntil(toDateInputValue(guest.validUntil))
    setEditGuestDays(guest.validDaysOfWeek ? [...guest.validDaysOfWeek] : [])
  }

  function cancelEditGuest() {
    setEditingGuestId(null)
  }

  async function saveGuestAccess() {
    if (!activeHouseholdId || !editingGuestId) return
    if (!editGuestFrom || !editGuestUntil) {
      setError('Guest date range is required.')
      return
    }

    setSavingGuestAccess(true)
    setError(null)
    setMessage(null)
    try {
      await authService.updateGuestAccess(
        activeHouseholdId,
        editingGuestId,
        editGuestFrom,
        editGuestUntil,
        editGuestDays.length > 0 ? editGuestDays : null,
      )
      setEditingGuestId(null)
      await load()
      setMessage('Guest access updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingGuestAccess(false)
    }
  }

  function copyInvite() {
    if (!household) return
    navigator.clipboard.writeText(household.inviteCode)
    setMessage('Invite code copied!')
  }

  async function handleHouseholdSelect(householdId: string) {
    if (householdId === activeHouseholdId) return
    await setActiveHousehold(householdId)
  }

  const settingsRecommendations = recommendationsForPetSpeciesList(
    pets.map((pet) => pet.species),
  )

  return (
    <div className="page-with-header">
      <header className="app-header">
        <button type="button" className="back-button" onClick={() => navigate('/')}>
          ‹
        </button>
        <h1>Profile &amp; Household</h1>
        <div className="header-spacer" />
      </header>

      <main className="settings-page">
        {loading ? (
          <div className="settings-loading">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {error && <ErrorBanner message={error} />}
            {message && <div className="success-banner">{message}</div>}

            <section className="settings-card">
              <h2>Profile</h2>
              <EditableTextSetting
                label="Display name"
                value={displayName}
                onSave={saveName}
                saving={savingName}
              />
              <p className="read-only-label">Email</p>
              <p className="read-only-value">{user?.email}</p>
              <div className="settings-field-spacer">
                <EditablePasswordSetting
                  onSave={changePassword}
                  saving={savingPassword}
                />
              </div>
            </section>

            {household && activeHouseholdId && (
              <section className="settings-card">
                <h2>Household</h2>

                <HouseholdSelector
                  memberships={memberships}
                  selectedHouseholdId={activeHouseholdId}
                  petsByHouseholdId={petsByHouseholdId}
                  onSelect={(id) => {
                    handleHouseholdSelect(id).catch(() => undefined)
                  }}
                />

                {canManage ? (
                  <EditableTextSetting
                    label="Household name"
                    value={householdName}
                    onSave={saveHouseholdName}
                    saving={savingHouseholdName}
                  />
                ) : !isGuest ? (
                  <>
                    <p className="read-only-label">Household name</p>
                    <p className="read-only-value">{household.name}</p>
                  </>
                ) : null}

                {isGuest && (
                  <div className="household-subsection">
                    <h3 className="household-subsection-title">Your access</h3>
                    <p className="read-only-value">
                      {myGuestAccess
                        ? formatGuestAccess(myGuestAccess)
                        : 'Check-off access for this household'}
                    </p>
                  </div>
                )}

                {canManage && (
                  <>
                    <p className="read-only-label">Invite code</p>
                    <div className="invite-box">{household.inviteCode}</div>
                    <button type="button" className="btn-outline" onClick={copyInvite}>
                      Copy invite code
                    </button>
                  </>
                )}

                {!isGuest && (
                  <div className="household-subsection">
                    <h3 className="household-subsection-title">Family members</h3>
                    <ul className="members-list">
                      {members.map((member) => {
                        if (editingMemberId === member.userId) {
                          return (
                            <MemberEditForm
                              key={member.userId}
                              member={member}
                              role={editMemberRole}
                              saving={savingMemberRole}
                              onRoleChange={setEditMemberRole}
                              onDone={() => {
                                saveMemberRole().catch(() => undefined)
                              }}
                              onCancel={cancelEditMember}
                            />
                          )
                        }

                        const canEdit = canEditMemberRole(currentRole, member.role)
                        const canRemove =
                          member.userId !== user?.id &&
                          canRemoveMember(currentRole, member.role)

                        return (
                          <li key={member.userId}>
                            <span className="member-avatar">
                              {member.displayName.charAt(0).toUpperCase()}
                            </span>
                            <span>{member.displayName}</span>
                            <span className="role-badge">{ROLE_LABELS[member.role]}</span>
                            {(canEdit || canRemove || member.userId === user?.id) && (
                              <div className="member-actions">
                                {canEdit && (
                                  <button
                                    type="button"
                                    className="member-edit-btn"
                                    onClick={() => startEditMember(member)}
                                  >
                                    Edit
                                  </button>
                                )}
                                {canRemove && (
                                  <button
                                    type="button"
                                    className="member-delete-btn"
                                    disabled={removingUserId === member.userId}
                                    onClick={() => requestRemoveMember(member)}
                                    aria-label={`Remove ${member.displayName}`}
                                  >
                                    <TrashIcon />
                                  </button>
                                )}
                                {member.userId === user?.id && (
                                  <span className="you-badge">You</span>
                                )}
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {canManage && (
                  <div className="household-subsection">
                    <h3 className="household-subsection-title">Guests</h3>
                    <p className="settings-help">
                      Give a pet sitter check-off access for specific dates. They
                      need a TrackPepper account with this email.
                    </p>

                    {guests.length > 0 && (
                      <ul className="members-list guest-list">
                        {guests.map((guest) => {
                          if (editingGuestId === guest.userId) {
                            return (
                              <GuestEditForm
                                key={guest.userId}
                                guest={guest}
                                validFrom={editGuestFrom}
                                validUntil={editGuestUntil}
                                guestDays={editGuestDays}
                                saving={savingGuestAccess}
                                onValidFromChange={setEditGuestFrom}
                                onValidUntilChange={setEditGuestUntil}
                                onToggleGuestDay={toggleEditGuestDay}
                                onDone={() => {
                                  saveGuestAccess().catch(() => undefined)
                                }}
                                onCancel={cancelEditGuest}
                              />
                            )
                          }

                          return (
                            <li key={guest.userId}>
                              <span className="member-avatar">
                                {guest.displayName.charAt(0).toUpperCase()}
                              </span>
                              <div className="guest-info">
                                <span>{guest.displayName}</span>
                                <span className="guest-access">
                                  {formatGuestAccess(guest)}
                                </span>
                              </div>
                              <div className="member-actions">
                                <button
                                  type="button"
                                  className="member-edit-btn"
                                  onClick={() => startEditGuest(guest)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="member-delete-btn"
                                  disabled={removingUserId === guest.userId}
                                  onClick={() => requestRemoveMember(guest)}
                                  aria-label={`Remove ${guest.displayName}`}
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    {showGuestForm ? (
                      <form className="guest-form" onSubmit={handleAddGuest}>
                        <label>
                          Email
                          <input
                            type="email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            placeholder="sitter@example.com"
                            autoFocus
                          />
                        </label>
                        <div className="guest-date-row">
                          <label>
                            From
                            <input
                              type="date"
                              value={guestFrom}
                              onChange={(e) => setGuestFrom(e.target.value)}
                            />
                          </label>
                          <label>
                            Until
                            <input
                              type="date"
                              value={guestUntil}
                              onChange={(e) => setGuestUntil(e.target.value)}
                            />
                          </label>
                        </div>
                        <div className="guest-days">
                          <span className="guest-days-label">Days (optional)</span>
                          <div className="guest-days-options">
                            {WEEKDAYS.map((day) => (
                              <button
                                key={day.value}
                                type="button"
                                className={
                                  guestDays.includes(day.value) ? 'active' : ''
                                }
                                onClick={() => toggleGuestDay(day.value)}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="editable-setting-actions">
                          <button
                            type="button"
                            className="btn-outline"
                            disabled={addingGuest}
                            onClick={cancelGuestForm}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn-primary"
                            disabled={addingGuest}
                          >
                            {addingGuest ? 'Adding…' : 'Add guest'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="btn-outline add-guest-button"
                        onClick={() => {
                          setEditingGuestId(null)
                          setShowGuestForm(true)
                        }}
                      >
                        Add guest
                      </button>
                    )}
                  </div>
                )}

                {canManagePets && (
                  <PetsSection
                    embedded
                    householdId={activeHouseholdId}
                    canManagePets={canManagePets}
                    onMessage={setMessage}
                    onError={(value) => setError(value || null)}
                  />
                )}

                {currentRole === 'owner' ? (
                  <p className="settings-help leave-household-note">
                    As the owner, you can&apos;t leave this household.
                  </p>
                ) : currentRole !== 'guest' ? (
                  <button
                    type="button"
                    className="btn-outline leave-household-btn"
                    disabled={leaving}
                    onClick={requestLeaveHousehold}
                  >
                    {leaving ? 'Leaving…' : 'Leave household'}
                  </button>
                ) : null}
              </section>
            )}

            {settingsRecommendations.length > 0 && (
              <section className="settings-card">
                <Recommendations items={settingsRecommendations} />
              </section>
            )}

            <button
              type="button"
              className="btn-signout"
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </>
        )}
      </main>

      <ConfirmDialog
        open={removeConfirmMember != null}
        title={removeConfirmMember?.role === 'guest' ? 'Remove guest?' : 'Remove member?'}
        message={
          removeConfirmMember
            ? removeConfirmMember.role === 'guest'
              ? `${removeConfirmMember.displayName} will lose guest access to this household.`
              : `${removeConfirmMember.displayName} will be removed from this household.`
            : ''
        }
        confirmLabel="Remove"
        confirmingLabel="Removing…"
        confirming={removingUserId === removeConfirmMember?.userId}
        onCancel={() => {
          if (!removingUserId) setRemoveConfirmMember(null)
        }}
        onConfirm={() => {
          confirmRemoveMember().catch(() => undefined)
        }}
      />

      <ConfirmDialog
        open={showLeaveConfirm}
        title="Leave household?"
        message="You will lose access to this household's pets and schedules."
        confirmLabel="Leave household"
        confirmingLabel="Leaving…"
        confirming={leaving}
        onCancel={() => {
          if (!leaving) setShowLeaveConfirm(false)
        }}
        onConfirm={() => {
          confirmLeaveHousehold().catch(() => undefined)
        }}
      />
    </div>
  )
}
