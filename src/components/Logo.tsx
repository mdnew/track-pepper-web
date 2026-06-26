import './Logo.css'

type LogoVariant = 'brand' | 'header'

interface LogoProps {
  variant?: LogoVariant
  className?: string
}

export function Logo({ variant = 'brand', className }: LogoProps) {
  return (
    <div
      className={['logo-wordmark', `logo-wordmark-${variant}`, className]
        .filter(Boolean)
        .join(' ')}
      aria-label="track Pepper"
    >
      <span className="logo-track">track</span>
      <img
        src="/assets/logo-dog.png"
        alt=""
        className="logo-dog"
        aria-hidden
      />
      <span className="logo-pepper">Pepper</span>
    </div>
  )
}
