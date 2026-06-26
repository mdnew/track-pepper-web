import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ConfigErrorScreen, LoadingScreen } from './components/ui'
import { PageViewTracker } from './components/PageViewTracker'
import { env } from './config/env'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { CalendarPage } from './pages/CalendarPage'
import { DayPage } from './pages/DayPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SettingsPage } from './pages/SettingsPage'

function AppRoutes() {
  const { session, profile, loading, pendingPasswordRecovery } = useAuth()

  if (loading) return <LoadingScreen />

  if (pendingPasswordRecovery && session) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/reset-password" replace />} />
      </Routes>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  if (!profile?.householdId) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<CalendarPage />} />
      <Route path="/day/:date" element={<DayPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  if (!env.isConfigured) {
    return (
      <ConfigErrorScreen
        message={
          'Supabase is not configured.\n\nCopy .env.example to .env and add your credentials, then restart the dev server.'
        }
      />
    )
  }

  return (
    <BrowserRouter>
      <PageViewTracker />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
