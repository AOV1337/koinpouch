import DashboardLayout from '../layouts/DashboardLayout'
import { useProfile } from '../hooks/useProfile'

const sidebarItems = [
  { label: 'Overview', path: '/dashboard/buyer', icon: '📊' },
  { label: 'My Orders', path: '/dashboard/buyer/orders', icon: '📦' },
  { label: 'Bookmarks', path: '/dashboard/buyer/bookmarks', icon: '🔖' },
  { label: 'Support', path: '/dashboard/buyer/support', icon: '🎧' },
  { label: 'Settings', path: '/dashboard/buyer/settings', icon: '⚙️' },
]

const mockStats = [
  { label: 'Total Orders', value: '0', icon: '📦' },
  { label: 'Bookmarks', value: '0', icon: '🔖' },
  { label: 'Open Tickets', value: '0', icon: '🎧' },
]

const mockOrders: never[] = []
const mockBookmarks: never[] = []

export default function BuyerDashboard() {
  const { profile } = useProfile()

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Buyer Dashboard">

      {/* Welcome banner */}
      <div style={{
        backgroundColor: 'var(--color-primary-light)',
        border: '1px solid var(--color-primary)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontWeight: 700,
            fontSize: '1.1rem',
            color: 'var(--color-primary)',
            marginBottom: '0.25rem',
          }}>
            Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Collector'} 👋
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
          }}>
            Here's a summary of your activity on Koinpouch.
          </div>
        </div>
      </div>

      {/* Stats row */}
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
            <span style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              fontWeight: 500,
            }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}>
            Recent Orders
          </h2>
          <span style={{
            fontSize: '0.85rem',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            fontWeight: 600,
          }}>
            View all →
          </span>
        </div>

        {mockOrders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem 0',
            color: 'var(--color-text-muted)',
            fontSize: '0.9rem',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
            You haven't placed any orders yet.{' '}
            <a href="/browse" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
              Browse listings
            </a>
          </div>
        ) : null}
      </div>

      {/* Bookmarks */}
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
          <h2 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}>
            Bookmarked Listings
          </h2>
          <span style={{
            fontSize: '0.85rem',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            fontWeight: 600,
          }}>
            View all →
          </span>
        </div>

        {mockBookmarks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem 0',
            color: 'var(--color-text-muted)',
            fontSize: '0.9rem',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔖</div>
            No bookmarks yet. Save listings you're interested in while browsing.
          </div>
        ) : null}
      </div>

    </DashboardLayout>
  )
}