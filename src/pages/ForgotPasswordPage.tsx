import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { ErrorBanner } from '../components/ui'
import { authService } from '../services/auth'
import './AuthPage.css'

export function ForgotPasswordPage() {
  const location = useLocation()
  const initialEmail = (location.state as { email?: string } | null)?.email ?? ''

  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Enter a valid email.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await authService.requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <h1>Reset password</h1>

        {sent ? (
          <>
            <span className="auth-emoji" aria-hidden>
              📬
            </span>
            <h2 className="reset-title">Check your email</h2>
            <p className="auth-subtitle">
              If an account exists for {email.trim()}, you&apos;ll get a password
              reset link shortly. Open it on this device to continue.
            </p>
            <Link to="/auth" className="btn-primary link-button">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h2 className="reset-title">Forgot your password?</h2>
            <p className="auth-subtitle">
              Enter your email and we&apos;ll send you a link to choose a new
              password.
            </p>
            {error && <ErrorBanner message={error} />}
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
