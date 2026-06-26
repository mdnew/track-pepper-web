import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ErrorBanner } from '../components/ui'
import { authService } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import { getAuthParamsFromUrl } from '../utils/authCallback'
import { supabase } from '../lib/supabase'
import './AuthPage.css'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const {
    session,
    pendingPasswordRecovery,
    clearPasswordRecovery,
    refreshProfile,
    setPasswordRecovery,
  } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [handlingCallback, setHandlingCallback] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setHandlingCallback(false)
      return
    }

    const hash = window.location.hash
    if (!hash || (!hash.includes('access_token') && !hash.includes('code'))) {
      setHandlingCallback(false)
      return
    }

    async function handleCallback() {
      try {
        const params = getAuthParamsFromUrl(new URL(window.location.href))
        if (params.code) {
          const { error: codeError } = await supabase!.auth.exchangeCodeForSession(
            params.code,
          )
          if (codeError) throw codeError
        } else if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase!.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          })
          if (sessionError) throw sessionError
        }
        setPasswordRecovery(true)
        window.history.replaceState({}, '', '/reset-password')
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setHandlingCallback(false)
      }
    }

    handleCallback()
  }, [setPasswordRecovery])

  useEffect(() => {
    if (!handlingCallback && !session && !pendingPasswordRecovery) {
      navigate('/', { replace: true })
    }
  }, [handlingCallback, session, pendingPasswordRecovery, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await authService.completePasswordReset(password)
      clearPasswordRecovery()
      await refreshProfile()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  if (handlingCallback) {
    return (
      <main className="auth-page">
        <div className="auth-container">
          <p className="auth-subtitle">Verifying reset link…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <span className="auth-emoji" aria-hidden>
          🐶
        </span>
        <h1>Choose a new password</h1>
        <p className="auth-subtitle">
          You opened a reset link from your email. Enter a new password to
          finish.
        </p>
        {error && <ErrorBanner message={error} />}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            New password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </main>
  )
}
