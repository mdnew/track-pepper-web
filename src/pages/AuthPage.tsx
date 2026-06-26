import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ErrorBanner } from '../components/ui'
import { authService } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import { trackSignUp } from '../utils/analytics'
import './AuthPage.css'

export function AuthPage() {
  const { refreshProfile } = useAuth()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!signInEmail.includes('@') || signInPassword.length < 6) {
      setError('Enter a valid email and password (min 6 characters).')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await authService.signIn(signInEmail.trim(), signInPassword)
      await refreshProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!signUpName.trim() || !signUpEmail.includes('@') || signUpPassword.length < 6) {
      setError('Fill in all fields. Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const email = signUpEmail.trim()
      await authService.signUp(email, signUpPassword, signUpName.trim())
      await authService.signIn(email, signUpPassword)
      trackSignUp()
      await refreshProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <span className="auth-emoji" aria-hidden>
          🐶
        </span>
        <h1>TrackPepper</h1>
        <div className="auth-blurb">
          <p>
            A shared daily schedule for your puppy. Track feedings, potty breaks,
            naps, and training as a family — check tasks off as you go and see
            your progress on a calendar, synced in real time across phones and
            the web.
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={tab === 'signin' ? 'active' : ''}
            onClick={() => {
              setTab('signin')
              setError(null)
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={tab === 'signup' ? 'active' : ''}
            onClick={() => {
              setTab('signup')
              setError(null)
            }}
          >
            Sign Up
          </button>
        </div>

        {error && <ErrorBanner message={error} />}

        {tab === 'signin' ? (
          <form className="auth-form" onSubmit={handleSignIn}>
            <label>
              Email
              <input
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <div className="auth-forgot">
              <Link to="/forgot-password" state={{ email: signInEmail }}>
                Forgot password?
              </Link>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignUp}>
            <label>
              Your name (e.g. Mom)
              <input
                type="text"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Account'}
            </button>
            <p className="auth-hint">
              Next: join an existing household or create a new one.
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
