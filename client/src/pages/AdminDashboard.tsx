import { Link } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'

const sidebarItems = [
  { label: 'Overview', path: '/dashboard/admin', icon: '📊' },
  { label: 'KYC Review', path: '/dashboard/admin/kyc', icon: '🪪' },
  { label: 'Support Tickets', path: '/dashboard/admin/tickets', icon: '🎧' },
  { label: 'User Manager', path: '/dashboard/admin/users', icon: '👥' },
  { label: 'Item Database', path: '/dashboard/admin/database', icon: '🗄️' },
  { label: 'Guides Manager', path: '/dashboard/admin/guides', icon: '📖' },
  { label: 'Listings', path: '/dashboard/admin/listings', icon: '🏷️' },
  { label: 'Analytics', path: '/dashboard/admin/analytics', icon: '📈' },
]

const mockStats = [
  { label: 'Total Users', value: '2', icon: '👥', color: '#3b82f6' },
  { label: 'Active Listings', value: '0', icon: '🏷️', color: '#f97316' },
  { label: 'Pending KYC', value: '0', icon: '🪪', color: '#eab308' },
  { label: 'Open Tickets', value: '0', icon: '🎧', color: '#ef4444' },
  { label: 'Total Orders', value: '0', icon: '📦', color: '#8b5cf6' },
  { label: 'Revenue', value: '€0', icon: '💰', color: '#22c55e' },
]

const mockKycQueue: {
  id: string
  name: string
  email: string
  submitted: string
  tier: string
}[] = []

const mockTickets: {
  id: string
  subject: string
  user: string
  category: string
  created: string
}[] = []

const quickActions = [
  { label: 'Add Catalog Item', path: '/dashboard/admin/database', icon: '🗄️' },
  { label: 'Write a Guide', path: '/dashboard/admin/guides', icon: '📖' },
  { label: 'Manage Users', path: '/dashboard/admin/users', icon: '👥' },
  { label: 'View All Listings', path: '/dashboard/admin/listings', icon: '🏷️' },
]

export default function AdminDashboard() {
  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Admin Dashboard">

      {/* Platform health banner */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🟢</span>
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--color-text-primary)',
              marginBottom: '0.2rem',
            }}>
              Platform Status — All Systems Operational
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Koinpouch admin panel — restricted access only
            </div>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {mockStats.map(stat => (
          <div key={stat.label} style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderTop: `3px solid ${stat.color}`,
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
            <span style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              lineHeight: 1,
            }}>
              {stat.value}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Two column layout for queues */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem',
      }}>

        {/* KYC Queue */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              🪪 KYC Review Queue
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>
              View all →
            </span>
          </div>
          {mockKycQueue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              No pending KYC requests
            </div>
          ) : (
            mockKycQueue.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {item.email} · {item.tier}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{
                    padding: '4px 10px',
                    backgroundColor: '#22c55e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}>
                    Approve
                  </button>
                  <button style={{
                    padding: '4px 10px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}>
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Support Tickets */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              🎧 Open Support Tickets
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>
              View all →
            </span>
          </div>
          {mockTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
              No open support tickets
            </div>
          ) : (
            mockTickets.map(ticket => (
              <div key={ticket.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    {ticket.subject}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {ticket.user} · {ticket.category}
                  </div>
                </div>
                <button style={{
                  padding: '4px 10px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  Open
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '1.5rem',
      }}>
        <h2 style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '1.25rem',
        }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
        }}>
          {quickActions.map(action => (
            <Link
              key={action.label}
              to={action.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                textDecoration: 'none',
                color: 'var(--color-text-primary)',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-primary)'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'}
            >
              <span style={{ fontSize: '1.1rem' }}>{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>

    </DashboardLayout>
  )
}