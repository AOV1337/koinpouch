import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'
import DashboardLayout from '../layouts/DashboardLayout'
import KycReviewPanel from '../components/KycReviewPanel'
import { supabase } from '../lib/supabase'

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

const quickActions = [
  { label: 'Add Catalog Item', path: '/dashboard/admin/database', icon: '🗄️' },
  { label: 'Write a Guide', path: '/dashboard/admin/guides', icon: '📖' },
  { label: 'Manage Users', path: '/dashboard/admin/users', icon: '👥' },
  { label: 'View All Listings', path: '/dashboard/admin/listings', icon: '🏷️' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number
  activeListings: number
  pendingKyc: number
  openTickets: number
  totalOrders: number
  revenue: number
}

interface SalesDataPoint {
  date: string
  orders: number
  revenue: number
}

interface CategoryDataPoint {
  category: string
  orders: number
  revenue: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return `€${value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// Group orders by day for the last 30 days
function buildSalesTimeline(orders: { created_at: string; amount: number }[]): SalesDataPoint[] {
  const map: Record<string, { orders: number; revenue: number }> = {}

  // Seed last 30 days so gaps show as 0
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    map[key] = { orders: 0, revenue: 0 }
  }

  orders.forEach(o => {
    const key = new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    if (map[key]) {
      map[key].orders += 1
      map[key].revenue += o.amount
    }
  })

  return Object.entries(map).map(([date, v]) => ({ date, ...v }))
}

// Group orders by listing category
function buildCategoryBreakdown(
  orders: { amount: number; listing: { category: string }[] | null }[]
): CategoryDataPoint[] {
  const map: Record<string, { orders: number; revenue: number }> = {}
  orders.forEach(o => {
    const cat = o.listing?.[0]?.category ?? 'unknown'
    if (!map[cat]) map[cat] = { orders: 0, revenue: 0 }
    map[cat].orders += 1
    map[cat].revenue += o.amount
  })
  return Object.entries(map).map(([category, v]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    ...v,
  }))
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeListings: 0,
    pendingKyc: 0,
    openTickets: 0,
    totalOrders: 0,
    revenue: 0,
  })
  const [salesTimeline, setSalesTimeline] = useState<SalesDataPoint[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)

    const [
      { count: userCount },
      { count: listingCount },
      { count: kycCount },
      { count: ticketCount },
      { data: ordersData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('kyc_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('orders').select('amount, created_at, listing:listing_id(category)'),
    ])

    const orders = (ordersData ?? []) as unknown as { amount: number; created_at: string; listing: { category: string }[] | null }[]
    const revenue = orders.reduce((sum, o) => sum + (o.amount ?? 0), 0)

    setStats({
      totalUsers: userCount ?? 0,
      activeListings: listingCount ?? 0,
      pendingKyc: kycCount ?? 0,
      openTickets: ticketCount ?? 0,
      totalOrders: orders.length,
      revenue,
    })

    setSalesTimeline(buildSalesTimeline(orders))
    setCategoryBreakdown(buildCategoryBreakdown(orders))
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats()
  }, [fetchStats])

  const statCards = [
    { label: 'Total Users', value: loading ? '…' : String(stats.totalUsers), icon: '👥', color: '#3b82f6' },
    { label: 'Active Listings', value: loading ? '…' : String(stats.activeListings), icon: '🏷️', color: '#f97316' },
    { label: 'Pending KYC', value: loading ? '…' : String(stats.pendingKyc), icon: '🪪', color: '#eab308' },
    { label: 'Open Tickets', value: loading ? '…' : String(stats.openTickets), icon: '🎧', color: '#ef4444' },
    { label: 'Total Orders', value: loading ? '…' : String(stats.totalOrders), icon: '📦', color: '#8b5cf6' },
    { label: 'Revenue', value: loading ? '…' : formatCurrency(stats.revenue), icon: '💰', color: '#22c55e' },
  ]

  const hasOrderData = salesTimeline.some(d => d.orders > 0)

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
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '0.2rem' }}>
              Platform Status — All Systems Operational
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Koinpouch admin panel — restricted access only
            </div>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {statCards.map(stat => (
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
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
              {stat.value}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Sales over time */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
            📈 Sales — Last 30 Days
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            Orders completed and revenue generated per day
          </p>
          {!hasOrderData ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              No order data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesTimeline} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  interval={6}
                />
                <YAxis
                  yAxisId="orders"
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="revenue"
                  orientation="right"
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  tickFormatter={(v: number) => `€${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                  }}
                  formatter={(value, name) =>
                    name === 'revenue'
                      ? [formatCurrency(Number(value)), 'Revenue']
                      : [Number(value), 'Orders']
                  }
                />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Line yAxisId="orders" type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sales by category */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
            🗂 Sales by Category
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            Orders and revenue broken down by item category
          </p>
          {categoryBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              No order data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryBreakdown} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                  }}
                  formatter={(value, name) =>
                    name === 'revenue'
                      ? [formatCurrency(Number(value)), 'Revenue']
                      : [Number(value), 'Orders']
                  }
                />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* KYC + Tickets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }}>
          <KycReviewPanel />
        </div>

        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>🎧 Open Support Tickets</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>View all →</span>
          </div>
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
            No open support tickets
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
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