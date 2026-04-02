import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import './Navbar.css'

const LINKS = [
  { to: '/',          label: 'Home'      },
  { to: '/catalogue', label: 'Portfolio' },
  { to: '/booking',   label: 'Booking'   },
  { to: '/terms',     label: 'T&Cs'      },
]

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav__inner wrap">
        <Link to="/" className="nav__logo">
          <Logo size="sm" />
        </Link>

        <ul className={`nav__links ${menuOpen ? 'open' : ''}`}>
          {LINKS.map(l => (
            <li key={l.to}>
              <Link to={l.to} className={location.pathname === l.to ? 'active' : ''}>
                {l.label}
              </Link>
            </li>
          ))}
          {user && (
            <li>
              <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
                Admin
              </Link>
            </li>
          )}
        </ul>

        <div className="nav__right">
          <Link to="/booking" className="btn-primary nav__cta">Book Now</Link>
          <button
            className={`nav__burger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  )
}
