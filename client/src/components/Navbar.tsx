import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useProfile } from '../hooks/useProfile'
import { useAvatarUrl } from '../hooks/useAvatarUrl'
import { supabase } from '../lib/supabase'
import { OPEN_CHAT_WIDGET_EVENT } from './ChatWidget'
import NotificationBell from './NotificationBell'
import Avatar from './Avatar'

const AVATAR_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const AVATAR_MAX_SIZE_MB = 5

export default function Navbar() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { profile, loading: profileLoading } = useProfile()
  const [logoShaking, setLogoShaking] = useState(false)
  const [avatarUrl, setAvatarUrl] = useAvatarUrl(user?.id)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      alert('Please choose a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > AVATAR_MAX_SIZE_MB * 1024 * 1024) {
      alert(`Image must be under ${AVATAR_MAX_SIZE_MB}MB.`)
      return
    }

    setUploadingAvatar(true)

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `avatars/${user.id}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setUploadingAvatar(false)
      alert('Failed to upload photo. Please try again.')
      return
    }

    const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(path)
    const publicUrl = urlData.publicUrl

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    setUploadingAvatar(false)

    if (updateError) {
      alert('Photo uploaded, but saving it to your profile failed. Please try again.')
      return
    }

    setAvatarUrl(publicUrl)
  }

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
        .kp-logo-shake { animation: kp-shake 0.5s ease; }
        @media (prefers-reduced-motion: reduce) {
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
              {/* Avatar + name — click the avatar to upload/replace a profile picture */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
                  title="Change profile picture"
                  style={{
                    cursor: uploadingAvatar ? 'default' : 'pointer',
                    opacity: uploadingAvatar ? 0.5 : 1,
                    position: 'relative',
                  }}
                >
                  <Avatar url={avatarUrl} name={profile?.full_name ?? user.email} size={32} />
                  <span style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    fontSize: '0.6rem',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: '50%',
                    width: '14px',
                    height: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--color-border)',
                  }}>
                    📷
                  </span>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarSelect}
                />
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