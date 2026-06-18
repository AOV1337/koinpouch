import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const sidebarItems = [
  { label: 'Overview', path: '/dashboard/buyer', icon: '📊' },
  { label: 'My Orders', path: '/dashboard/buyer/orders', icon: '📦' },
  { label: 'Bookmarks', path: '/dashboard/buyer/bookmarks', icon: '🔖' },
  { label: 'Support', path: '/dashboard/buyer/support', icon: '🎧' },
  { label: 'Settings', path: '/dashboard/buyer/settings', icon: '⚙️' },
]

interface Order {
  id: string
  amount: number
  status: string
  created_at: string
  listings: { id: string; title: string; category: string; condition: string } | null
  profiles: { full_name: string | null } | null
}

const statusColors: Record<string, string> = {
  paid: '#3b82f6',
  shipped: '#f59e0b',
  completed: '#22c55e',
  disputed: '#ef4444',
  pending: '#6b7280',
}

const statusLabels: Record<string, string> = {
  paid: 'Paid — Awaiting Shipment',
  shipped: 'Shipped',
  completed: 'Completed',
  disputed: 'Disputed',
  pending: 'Pending',
}

export default function BuyerOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'paid' | 'shipped' | 'completed' | 'disputed'>('all')

  const fetchOrders = useCallback(async () => {
    if (!user) return
    setLoading(true)

    let query = supabase
      .from('orders')
      .select(`
        id, amount, status, created_at,
        listings!orders_listing_id_fkey(id, title, category, condition),
        profiles!orders_seller_id_fkey(full_name)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })

    if (filter !== 'all') query = query.eq('status', filter)

    const { data } = await query
    setOrders((data as unknown as Order[]) ?? [])
    setLoading(false)
  }, [user, filter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders()
  }, [fetchOrders])

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="My Orders">

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {(['all', 'paid', 'shipped', 'completed', 'disputed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              border: '1px solid var(--color-border)',
              background: filter === f ? 'var(--color-primary)' : 'var(--color-surface)',
              color: filter === f ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: filter === f ? 700 : 400,
              cursor: 'pointer',
              fontSize: '0.82rem',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>Loading…</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</div>
          <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>No orders found</p>
          <Link to="/browse" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Browse listings →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map(order => {
            const listing = order.listings
            const seller = order.profiles
            return (
              <div key={order.id} style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    {listing?.title ?? 'Unknown listing'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ textTransform: 'capitalize' }}>{listing?.category ?? '—'}</span>
                    <span>·</span>
                    <span>Sold by {seller?.full_name ?? 'Unknown'}</span>
                    <span>·</span>
                    <span>{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
                    backgroundColor: `${statusColors[order.status] ?? '#6b7280'}20`,
                    color: statusColors[order.status] ?? '#6b7280',
                  }}>
                    {statusLabels[order.status] ?? order.status}
                  </span>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                    €{order.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}