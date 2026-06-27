import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { Logo } from '../Logo'
import './MarketingLayout.css'

const navLinks = [
  { to: '/schedules', label: 'Family pet schedules' },
  { to: '/about', label: 'About' },
  { to: '/login', label: 'Login' },
] as const

export function MarketingLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="marketing-site">
      <header className="marketing-header">
        <div className="marketing-header-inner">
          <Link to="/" className="marketing-logo-link">
            <Logo variant="brand" />
          </Link>

          <nav className="marketing-nav marketing-nav-desktop" aria-label="Main">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to}>
                {label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="marketing-menu-button"
            aria-expanded={menuOpen}
            aria-controls="marketing-mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="marketing-menu-icon" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>

        <nav
          id="marketing-mobile-menu"
          className={['marketing-nav-mobile', menuOpen ? 'open' : '']
            .filter(Boolean)
            .join(' ')}
          aria-label="Main"
          hidden={!menuOpen}
        >
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="marketing-main">
        <Outlet />
      </main>
      <footer className="marketing-footer">
        <div className="marketing-footer-inner">
          <Logo variant="brand" className="marketing-footer-logo" />
          <p>Shared daily schedules for dogs, cats, and the whole family.</p>
          <nav className="marketing-footer-links" aria-label="Legal">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
