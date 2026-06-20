import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useProfile } from '../hooks/useProfile'
import { OPEN_CHAT_WIDGET_EVENT } from './ChatWidget'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { profile, loading: profileLoading } = useProfile()
  const [logoShaking, setLogoShaking] = useState(false)

  function handleOpenAssistant() {
    window.dispatchEvent(new Event(OPEN_CHAT_WIDGET_EVENT))
  }

  function handleLogoClick() {
    setLogoShaking(true)
    window.setTimeout(() => setLogoShaking(false), 500)
  }

  const dashboardPath =
    profileLoading ? '#' :
    profile?.role === 'admin' ? '/dashboard/admin' :
    profile?.role === 'seller' ? '/dashboard/seller' :
    '/dashboard/buyer'

  const navLinkStyle = {
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: 700,
    letterSpacing: '0.01em',
    transition: 'color 0.15s ease, transform 0.15s ease',
    display: 'inline-block',
  } as const

  function handleNavEnter(e: React.MouseEvent<HTMLElement>) {
    e.currentTarget.style.color = 'var(--color-primary)'
    e.currentTarget.style.transform = 'translateY(-2px)'
  }
  function handleNavLeave(e: React.MouseEvent<HTMLElement>) {
    e.currentTarget.style.color = 'var(--color-text-secondary)'
    e.currentTarget.style.transform = 'translateY(0)'
  }

  return (
    <nav style={{
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Logo sheen + shake keyframes — scoped via plain <style>, this codebase has no CSS-in-JS / utility classes */}
      <style>{`
        @keyframes kp-sheen {
          0% { background-position: 200% center; }
          100% { background-position: -100% center; }
        }
        @keyframes kp-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          20% { transform: translateX(-4px) rotate(-3deg); }
          40% { transform: translateX(4px) rotate(3deg); }
          60% { transform: translateX(-3px) rotate(-2deg); }
          80% { transform: translateX(3px) rotate(2deg); }
        }
        .kp-logo {
          display: inline-block;
          color: var(--color-primary);
        }
        .kp-logo:hover {
          background-image: linear-gradient(100deg, var(--color-primary) 30%, #ffe6cc 50%, var(--color-primary) 70%);
          background-size: 220% auto;
          background-position: 200% center;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: kp-sheen 1.1s ease-in-out;
        }
        .kp-logo-shake { animation: kp-shake 0.5s ease; }
        @media (prefers-reduced-motion: reduce) {
          .kp-logo:hover { animation: none; }
          .kp-logo-shake { animation: none; }
        }
      `}</style>

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
        <Link to="/" onClick={handleLogoClick} style={{ textDecoration: 'none' }}>
          <span
            className={`kp-logo${logoShaking ? ' kp-logo-shake' : ''}`}
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            Koinpouch
          </span>
        </Link>

        {/* Center — Nav links */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {[
            { label: 'Marketplace', path: '/browse' },
            { label: 'Guides', path: '/guides' },
            { label: 'Hall of Fame', path: '/hall-of-fame' },
          ].map(item => (
            <Link
              key={item.label}
              to={item.path}
              style={navLinkStyle}
              onMouseEnter={handleNavEnter}
              onMouseLeave={handleNavLeave}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleOpenAssistant}
            style={{
              ...navLinkStyle,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'inherit',
            }}
            onMouseEnter={handleNavEnter}
            onMouseLeave={handleNavLeave}
          >
            Assistant
          </button>
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

          {/* Notifications */}
          {user && <NotificationBell userId={user.id} />}

          {/* Auth buttons or avatar/dashboard */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Avatar + name — avatar is a placeholder circle until profile pictures land */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}>
                  👤
                </div>
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                }}>
                  {user.email?.split('@')[0]}
                </span>
              </div>

              <Link
                to={dashboardPath}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}