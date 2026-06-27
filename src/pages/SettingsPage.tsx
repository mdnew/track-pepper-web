import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ErrorBanner } from '../components/ui'
import {
  EditablePasswordSetting,
  EditableTextSetting,
} from '../components/EditableSetting'
import { PetsSection } from '../components/PetsSection'
import { Recommendations } from '../components/Recommendations'
import { recommendationsForPetSpeciesList } from '../config/recommendations'
import { authService } from '../services/auth'
import { petsService } from '../services/pets'
import { useAuth } from '../context/AuthContext'
import type { Household, Pet, Profile } from '../types'
import './SettingsPage.css'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [displayName, setDisplayName] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [savingHouseholdName, setSavingHouseholdName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, h, m, nextPets] = await Promise.all([
        authService.getProfile(),
        authService.getHousehold(),
        authService.getHouseholdMembers(),
        petsService.getPets(),
      ])
      setHousehold(h)
      setMembers(m)
      setPets(nextPets)
      setDisplayName(p?.displayName ?? '')
      setHouseholdName(h?.name ?? '')
    } finally {
      setLoading(false)
    }
  }, [])

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
    if (!nextName.trim()) {
      setError('Household name is required.')
      throw new Error('Household name is required.')
    }
    setSavingHouseholdName(true)
    setError(null)
    setMessage(null)
    try {
      await authService.updateHouseholdName(nextName)
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

  function copyInvite() {
    if (!household) return
    navigator.clipboard.writeText(household.inviteCode)
    setMessage('Invite code copied!')
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

            {household && (
              <section className="settings-card">
                <h2>Household</h2>
                <EditableTextSetting
                  label="Household name"
                  value={householdName}
                  onSave={saveHouseholdName}
                  saving={savingHouseholdName}
                />
                <p className="read-only-label">Invite code</p>
                <div className="invite-box">{household.inviteCode}</div>
                <button type="button" className="btn-outline" onClick={copyInvite}>
                  Copy invite code
                </button>

                <div className="household-subsection">
                  <h3 className="household-subsection-title">Family members</h3>
                  <ul className="members-list">
                    {members.map((member) => (
                      <li key={member.id}>
                        <span className="member-avatar">
                          {member.displayName.charAt(0).toUpperCase()}
                        </span>
                        <span>{member.displayName}</span>
                        {member.id === user?.id && (
                          <span className="you-badge">You</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <PetsSection
                  embedded
                  onMessage={setMessage}
                  onError={(value) => setError(value || null)}
                />
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
    </div>
  )
}
