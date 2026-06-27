import { Link, NavLink, Outlet } from 'react-router-dom'

import { Logo } from '../Logo'
import './MarketingLayout.css'

export function MarketingLayout() {
  return (
    <div className="marketing-site">
      <header className="marketing-header">
        <div className="marketing-header-inner">
          <Link to="/" className="marketing-logo-link">
            <Logo variant="brand" />
          </Link>
          <nav className="marketing-nav" aria-label="Main">
            <NavLink to="/schedules">Schedules</NavLink>
            <NavLink to="/about">About Us</NavLink>
            <NavLink to="/login">Login</NavLink>
          </nav>
        </div>
      </header>
      <main className="marketing-main">
        <Outlet />
      </main>
      <footer className="marketing-footer">
        <div className="marketing-footer-inner">
          <Logo variant="brand" className="marketing-footer-logo" />
          <p>Shared daily schedules for the whole family.</p>
        </div>
      </footer>
    </div>
  )
}
