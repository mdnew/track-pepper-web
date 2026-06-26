import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ErrorBanner } from '../components/ui'
import { PetsSection } from '../components/PetsSection'
import { authService } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import type { Household, Profile } from '../types'
import './SettingsPage.css'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [savingHouseholdName, setSavingHouseholdName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, h, m] = await Promise.all([
        authService.getProfile(),
        authService.getHousehold(),
        authService.getHouseholdMembers(),
      ])
      setHousehold(h)
      setMembers(m)
      setDisplayName(p?.displayName ?? '')
      setHouseholdName(h?.name ?? '')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setSavingName(true)
    setError(null)
    setMessage(null)
    try {
      await authService.updateDisplayName(displayName.trim())
      await load()
      setMessage('Display name updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingName(false)
    }
  }

  async function saveHouseholdName(e: React.FormEvent) {
    e.preventDefault()
    if (!householdName.trim()) {
      setError('Household name is required.')
      return
    }
    setSavingHouseholdName(true)
    setError(null)
    setMessage(null)
    try {
      await authService.updateHouseholdName(householdName)
      await load()
      setMessage('Household name updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingHouseholdName(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSavingPassword(true)
    setError(null)
    setMessage(null)
    try {
      await authService.updatePassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Password updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingPassword(false)
    }
  }

  function copyInvite() {
    if (!household) return
    navigator.clipboard.writeText(household.inviteCode)
    setMessage('Invite code copied!')
  }

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
              <h2>Your profile</h2>
              <form onSubmit={saveName}>
                <label>
                  Display name
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </label>
                <p className="read-only-label">Email</p>
                <p className="read-only-value">{user?.email}</p>
                <button type="submit" className="btn-primary" disabled={savingName}>
                  {savingName ? 'Saving…' : 'Save name'}
                </button>
              </form>
            </section>

            <section className="settings-card">
              <h2>Password</h2>
              <form onSubmit={changePassword}>
                <label>
                  New password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </label>
                <label>
                  Confirm new password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingPassword}
                >
                  {savingPassword ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </section>

            {household && (
              <section className="settings-card">
                <h2>Household</h2>
                <form onSubmit={saveHouseholdName}>
                  <label>
                    Household name
                    <input
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={savingHouseholdName}
                  >
                    {savingHouseholdName ? 'Saving…' : 'Save household name'}
                  </button>
                </form>
                <p className="read-only-label">Invite code</p>
                <div className="invite-box">{household.inviteCode}</div>
                <button type="button" className="btn-outline" onClick={copyInvite}>
                  Copy invite code
                </button>
              </section>
            )}

            {household && (
              <PetsSection
                onMessage={setMessage}
                onError={(value) => setError(value || null)}
              />
            )}

            <section className="settings-card">
              <h2>Family members</h2>
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
            </section>

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
