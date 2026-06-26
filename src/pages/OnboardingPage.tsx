import { useState } from 'react'

import { ErrorBanner } from '../components/ui'
import { authService } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import './OnboardingPage.css'

export function OnboardingPage() {
  const { refreshProfile, signOut } = useAuth()
  const [joining, setJoining] = useState(true)
  const [householdName, setHouseholdName] = useState("Pepper's Schedule")
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdInvite, setCreatedInvite] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!householdName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const household = await authService.createHousehold(householdName.trim())
      await refreshProfile()
      setCreatedInvite(household.inviteCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (inviteCode.trim().length < 6) return
    setLoading(true)
    setError(null)
    try {
      await authService.joinHousehold(inviteCode)
      await refreshProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  function copyInvite() {
    if (!createdInvite) return
    navigator.clipboard.writeText(createdInvite)
  }

  if (createdInvite) {
    return (
      <main className="onboarding-page center">
        <span className="auth-emoji" aria-hidden>
          🎉
        </span>
        <h1>Household created!</h1>
        <p>Share this invite code with your family:</p>
        <div className="invite-box">{createdInvite}</div>
        <button type="button" className="btn-outline" onClick={copyInvite}>
          Copy invite code
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => refreshProfile()}
        >
          Continue to calendar
        </button>
      </main>
    )
  }

  return (
    <div className="page-with-header">
      <header className="app-header">
        <h1>Set up your household</h1>
        <button type="button" className="text-button" onClick={() => signOut()}>
          Sign out
        </button>
      </header>

      <main className="onboarding-page">
        <p className="onboarding-intro">
          Join your family&apos;s schedule, or create a new household if
          you&apos;re the first one here.
        </p>

        <div className="segmented">
          <button
            type="button"
            className={joining ? 'active' : ''}
            onClick={() => {
              setJoining(true)
              setError(null)
            }}
          >
            Join household
          </button>
          <button
            type="button"
            className={!joining ? 'active' : ''}
            onClick={() => {
              setJoining(false)
              setError(null)
            }}
          >
            Create new
          </button>
        </div>

        {error && <ErrorBanner message={error} />}

        {joining ? (
          <form className="onboarding-form" onSubmit={handleJoin}>
            <p>
              Enter the invite code from a family member (find it in Profile
              &amp; Household).
            </p>
            <label>
              Invite code
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="PEPPER-XXXX"
              />
            </label>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Joining…' : 'Join household'}
            </button>
          </form>
        ) : (
          <form className="onboarding-form" onSubmit={handleCreate}>
            <p>
              Set up a new household for your family. You&apos;ll get an invite
              code to share with everyone else.
            </p>
            <label>
              Household name
              <input
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
              />
            </label>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create household'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
