import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'

interface SidebarItem {
  label: string
  path: string
  icon: string
}

interface DashboardLayoutProps {
  children: React.ReactNode
  sidebarItems: SidebarItem[]
  title: string
}

export default function DashboardLayout({ children, sidebarItems, title }: DashboardLayoutProps) {
  const { signOut } = useAuth()
  const { profile } = useProfile()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: 'calc(100vh - 64px)',
      backgroundColor: 'var(--color-background)',
    }}>

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '64px' : '240px',
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
        position: 'sticky',
        top: '64px',
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>

        {/* Profile summary */}
        <div style={{
          padding: collapsed ? '1rem 0' : '1.25rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.9rem',
            flexShrink: 0,
          }}>
            {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {profile?.full_name ?? 'User'}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--color-primary)',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}>
                {profile?.role}
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0.75rem 0' }}>
          {sidebarItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: collapsed ? '0.75rem 0' : '0.75rem 1.25rem',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  textDecoration: 'none',
                  backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  borderRight: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-light)'
                    e.currentTarget.style.color = 'var(--color-primary)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--color-text-secondary)'
                  }
                }}
              >
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          padding: '0.75rem 0',
        }}>
          <button
            onClick={() => setCollapsed(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: collapsed ? '0.75rem 0' : '0.75rem 1.25rem',
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: '0.9rem',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>Collapse</span>}
          </button>

          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: collapsed ? '0.75rem 0' : '0.75rem 1.25rem',
              justifyContent: collapsed ? 'center' : 'flex-start',
              textDecoration: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '0.9rem',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🏠</span>
            {!collapsed && <span>Back to site</span>}
          </Link>

          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: collapsed ? '0.75rem 0' : '0.75rem 1.25rem',
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#ef4444',
              fontSize: '0.9rem',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🚪</span>
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        padding: '2rem',
        overflowY: 'auto',
        minWidth: 0,
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'var(--color-text-primary)',
          marginBottom: '2rem',
          letterSpacing: '-0.02em',
        }}>
          {title}
        </h1>
        {children}
      </main>
    </div>
  )
}