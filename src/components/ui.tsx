import { Logo } from './Logo'
import { colors } from '../theme/colors'
import './ErrorBanner.css'

export function ErrorBanner({ message }: { message: string }) {
  return <div className="error-banner">{message}</div>
}

export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <Logo variant="brand" />
    </div>
  )
}

export function ConfigErrorScreen({ message }: { message: string }) {
  return (
    <main className="center-page">
      <div className="card config-error">
        <Logo variant="brand" className="config-error-logo" />
        <p>{message}</p>
      </div>
    </main>
  )
}

export function AppHeader({
  title,
  onSettings,
}: {
  title?: string
  onSettings?: () => void
}) {
  return (
    <header className="app-header">
      {title ? <h1>{title}</h1> : <Logo variant="header" />}
      {onSettings && (
        <button
          type="button"
          className="icon-button"
          onClick={onSettings}
          aria-label="Profile and household"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
    </header>
  )
}

export { colors }
