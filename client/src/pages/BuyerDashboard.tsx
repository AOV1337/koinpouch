import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { buyerSidebarItems as sidebarItems } from '../lib/buyerSidebar'
import { useAvatarUrl } from '../hooks/useAvatarUrl'
import Avatar from '../components/Avatar'

interface Order {
  id: string
  amount: number
  status: string
  created_at: string
  listings: { id: string; title: string; category: string } | null
}

interface Bookmark {
  id: string
  listing_id: string
  created_at: string
  listings: {
    id: string
    title: string
    price: number
    currency: string
    category: string
    status: string
  } | null
}

const statusColors: Record<string, string> = {
  paid: '#3b82f6',
  shipped: '#f59e0b',
  completed: '#22c55e',
  disputed: '#ef4444',
  pending: '#6b7280',
}

export default function BuyerDashboard() {
  const { profile } = useProfile()
  const { user } = useAuth()
  const [avatarUrl] = useAvatarUrl(user?.id)

  const [orders, setOrders] = useState<Order[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [openTickets, setOpenTickets] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [
      { data: ordersData },
      { data: bookmarksData },
      { count: ticketCount },
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('id, amount, status, created_at, listings!orders_listing_id_fkey(id, title, category)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('bookmarks')
        .select('id, created_at, listing_id, listings(id, title, price, currency, category, status)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'open'),
    ])

    setOrders((ordersData as unknown as Order[]) ?? [])
    setBookmarks((bookmarksData as unknown as Bookmark[]) ?? [])
    setOpenTickets(ticketCount ?? 0)
    setLoading(false)
  }, [user])

  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const statCards = [
    { label: 'Total Orders', value: loading ? '…' : String(orders.length), icon: '📦' },
    { label: 'Bookmarks', value: loading ? '…' : String(bookmarks.length), icon: '🔖' },
    { label: 'Open Tickets', value: loading ? '…' : String(openTickets), icon: '🎧' },
  ]

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Avatar url={avatarUrl} name={profile?.full_name} size={48} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
              Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Collector'} 👋
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Here's a summary of your activity on Koinpouch.
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(stat => (
          <div key={stat.label} style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex', flexDirection: 'column', gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
              {stat.value}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Recent Orders</h2>
          <Link to="/dashboard/buyer/orders" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>Loading…</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
            You haven't placed any orders yet.{' '}
            <Link to="/browse" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Browse listings</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {orders.map((order, idx) => (
              <div key={order.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: idx < orders.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    {order.listings?.title ?? 'Unknown listing'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                    backgroundColor: `${statusColors[order.status] ?? '#6b7280'}20`,
                    color: statusColors[order.status] ?? '#6b7280',
                    textTransform: 'capitalize',
                  }}>
                    {order.status}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                    €{order.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookmarks */}
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Bookmarked Listings</h2>
          <Link to="/dashboard/buyer/bookmarks" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>Loading…</div>
        ) : bookmarks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔖</div>
            No bookmarks yet. Save listings you're interested in while browsing.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {bookmarks.map(bm => {
              const listing = bm.listings
              if (!listing) return null
              return (
                <Link key={bm.id} to={`/item/${listing.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      padding: '1rem',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-primary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                      {listing.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'capitalize', marginBottom: '6px' }}>
                      {listing.category}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: listing.status === 'sold' ? 'var(--color-text-muted)' : 'var(--color-primary)', fontSize: '0.9rem' }}>
                        {listing.status === 'sold' ? 'Sold' : `€${listing.price.toLocaleString()}`}
                      </span>
                      {listing.status === 'sold' && (
                        <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>SOLD</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </DashboardLayout>
  )
}