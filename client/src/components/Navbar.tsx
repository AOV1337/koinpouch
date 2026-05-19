import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useProfile } from '../hooks/useProfile'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { profile, loading: profileLoading } = useProfile()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

const dashboardPath =
  profileLoading ? '#' :
  profile?.role === 'admin' ? '/dashboard/admin' :
  profile?.role === 'seller' ? '/dashboard/seller' :
  '/dashboard/buyer'

  const dropdownLinks = [
    { label: 'Dashboard', path: dashboardPath },
    { label: 'Settings', path: '/settings' },
  ]

  return (
    <nav style={{
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 1.5rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>

        {/* Left — Logo */}
        <Link to="/" style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'var(--color-primary)',
          textDecoration: 'none',
          letterSpacing: '-0.02em',
        }}>
          Koinpouch
        </Link>

        {/* Center — Nav links */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {['Browse', 'Guides', 'Database'].map(item => (
            <Link
              key={item}
              to={`/${item.toLowerCase()}`}
              style={{
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Right — Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '1rem',
              color: 'var(--color-text-secondary)',
            }}
            title="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Notification bell placeholder */}
          {user && (
            <button style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '1rem',
              color: 'var(--color-text-secondary)',
            }}>
              🔔
            </button>
          )}

          {/* Auth buttons or avatar */}
          {!user ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}>
                Log in
              </Link>
              <Link to="/register" style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}>
                Sign up
              </Link>
            </div>
          ) : (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              >
                👤 {user.email?.split('@')[0]} ▾
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  minWidth: '180px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  zIndex: 100,
                }}>
                  {dropdownLinks.map(item => (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'block',
                        padding: '10px 16px',
                        color: 'var(--color-text-primary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-light)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div style={{ borderTop: '1px solid var(--color-border)' }}>
                    <button
                      onClick={handleSignOut}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        color: '#ef4444',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}