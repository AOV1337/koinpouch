import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { supabase } from '../lib/supabase'

const sidebarItems = [
  { label: 'Overview', path: '/dashboard/admin', icon: '📊' },
  { label: 'KYC Review', path: '/dashboard/admin/kyc-requests', icon: '🪪' },
  { label: 'Support Tickets', path: '/dashboard/admin/tickets', icon: '🎧' },
  { label: 'User Manager', path: '/dashboard/admin/users', icon: '👥' },
  { label: 'Hall of Fame', path: '/dashboard/admin/hall-of-fame', icon: '🏆' },
  { label: 'Guides Manager', path: '/dashboard/admin/guides', icon: '📖' },
  { label: 'Listings', path: '/dashboard/admin/listings', icon: '🏷️' },
]

type Role = 'buyer' | 'seller' | 'admin'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: Role
  is_active: boolean
  created_at: string
}

const roleColors: Record<Role, string> = {
  buyer: '#3b82f6',
  seller: '#f97316',
  admin: '#8b5cf6',
}

export default function AdminUserManager() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState<'all' | Role>('all')
  const [search, setSearch] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, is_active, created_at')
      .order('created_at', { ascending: false })

    if (filterRole !== 'all') query = query.eq('role', filterRole)

    const { data, error } = await query
    if (!error && data) {
      setUsers(data as UserRow[])
    }
    setLoading(false)
  }, [filterRole])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers()
  }, [fetchUsers])

  const filtered = users.filter(u =>
    !search ||
    (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleToggleBan(user: UserRow) {
    if (user.role === 'admin') return // guardrail — see note in render
    setActionLoadingId(user.id)
    const newState = !user.is_active

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: newState })
      .eq('id', user.id)

    if (!error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newState } : u))
    }
    setActionLoadingId(null)
  }

  const totalCount = users.length
  const activeCount = users.filter(u => u.is_active).length
  const bannedCount = users.filter(u => !u.is_active).length
  const adminCount = users.filter(u => u.role === 'admin').length

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="User Manager">

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{totalCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Total Users</div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{activeCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Active</div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>{bannedCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Banned</div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6' }}>{adminCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Admins</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {([
            { value: 'all', label: 'All' },
            { value: 'buyer', label: 'Buyers' },
            { value: 'seller', label: 'Sellers' },
            { value: 'admin', label: 'Admins' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterRole(opt.value)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: '1px solid var(--color-border)',
                background: filterRole === opt.value ? 'var(--color-primary)' : 'var(--color-surface)',
                color: filterRole === opt.value ? '#fff' : 'var(--color-text-secondary)',
                fontWeight: filterRole === opt.value ? 700 : 400,
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
            minWidth: '220px',
          }}
        />
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', padding: '32px 0', textAlign: 'center' }}>Loading users…</p>
      ) : filtered.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👥</div>
          No users match this filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filtered.map(user => (
            <div
              key={user.id}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderLeft: !user.is_active ? '3px solid #ef4444' : '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '0.875rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
                flexShrink: 0,
                overflow: 'hidden',
              }}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (user.full_name?.charAt(0).toUpperCase() ?? user.email.charAt(0).toUpperCase())
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                    {user.full_name ?? 'Unnamed user'}
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#fff',
                    backgroundColor: roleColors[user.role],
                    padding: '2px 8px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                  }}>
                    {user.role}
                  </span>
                  {!user.is_active && (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#dc2626',
                      backgroundColor: '#fef2f2',
                      padding: '2px 8px',
                      borderRadius: '999px',
                    }}>
                      🚫 Banned
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {user.email} · Joined {new Date(user.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>

              {/* Actions */}
              <div style={{ flexShrink: 0 }}>
                <button
                  onClick={() => handleToggleBan(user)}
                  disabled={user.role === 'admin' || actionLoadingId === user.id}
                  title={user.role === 'admin' ? "Admins can't be banned from this page" : undefined}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: user.role === 'admin'
                      ? 'var(--color-border)'
                      : actionLoadingId === user.id
                        ? 'var(--color-border)'
                        : user.is_active ? '#ef4444' : '#10b981',
                    color: user.role === 'admin' ? 'var(--color-text-muted)' : '#fff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: user.role === 'admin' || actionLoadingId === user.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {actionLoadingId === user.id ? '…' : user.is_active ? 'Ban' : 'Unban'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}