import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'

const sidebarItems = [
  { label: 'Overview', path: '/dashboard/seller', icon: '📊' },
  { label: 'My Listings', path: '/dashboard/seller/listings', icon: '🏷️' },
  { label: 'Create Listing', path: '/dashboard/seller/create', icon: '➕' },
  { label: 'Orders Received', path: '/dashboard/seller/orders', icon: '📦' },
  { label: 'KYC Verification', path: '/dashboard/seller/kyc', icon: '🪪' },
  { label: 'Reputation', path: '/dashboard/seller/reputation', icon: '⭐' },
  { label: 'Support', path: '/dashboard/seller/support', icon: '🎧' },
  { label: 'Settings', path: '/dashboard/seller/settings', icon: '⚙️' },
]

interface Listing {
  id: string
  title: string
  price: number
  currency: string
  category: string
  condition: string
  status: string
  created_at: string
}

const conditionColors: Record<string, string> = {
  mint: '#22c55e',
  near_mint: '#84cc16',
  good: '#eab308',
  fair: '#f97316',
  poor: '#ef4444',
}

const categoryEmoji: Record<string, string> = {
  cards: '🃏',
  figurines: '🗿',
  coins: '🪙',
  stamps: '✉️',
}

const statusColors: Record<string, { bg: string; color: string }> = {
  active: { bg: '#f0fdf4', color: '#16a34a' },
  sold: { bg: '#eff6ff', color: '#2563eb' },
  removed: { bg: '#fef2f2', color: '#dc2626' },
  suspended: { bg: '#fefce8', color: '#ca8a04' },
}

export default function SellerListings() {
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const fetchListings = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setListings((data as Listing[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchListings()
  }, [user])

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      setListings(prev => prev.filter(l => l.id !== id))
      setConfirmDeleteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete listing')
    } finally {
      setDeletingId(null)
    }
  }

  const activeCount = listings.filter(l => l.status === 'active').length
  const soldCount = listings.filter(l => l.status === 'sold').length

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="My Listings">

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {[
          { label: 'Total Listings', value: listings.length, icon: '🏷️' },
          { label: 'Active', value: activeCount, icon: '✅' },
          { label: 'Sold', value: soldCount, icon: '💰' },
        ].map(stat => (
          <div key={stat.label} style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
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

      {/* Error */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '0.875rem',
          marginBottom: '1.25rem',
        }}>
          {error}
        </div>
      )}

      {/* Listings table */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '14px',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            All Listings
          </h2>
          <Link
            to="/dashboard/seller/create"
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 700,
            }}
          >
            + New Listing
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
            Loading your listings...
          </div>
        )}

        {/* Empty */}
        {!loading && listings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏷️</div>
            <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              No listings yet
            </div>
            <div style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Create your first listing to start selling on Koinpouch.
            </div>
            <Link
              to="/dashboard/seller/create"
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              Create Listing
            </Link>
          </div>
        )}

        {/* Listings */}
        {!loading && listings.map((listing, idx) => (
          <div key={listing.id}>
            {/* Confirm delete overlay */}
            {confirmDeleteId === listing.id && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: 600 }}>
                  Are you sure you want to delete "{listing.title}"? This cannot be undone.
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    disabled={deletingId === listing.id}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#dc2626',
                      color: '#fff',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {deletingId === listing.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.5rem',
              borderBottom: idx < listings.length - 1 ? '1px solid var(--color-border)' : 'none',
              flexWrap: 'wrap',
            }}>
              {/* Emoji */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
              }}>
                {categoryEmoji[listing.category] ?? '📦'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                  {listing.title}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                    {listing.category}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#fff',
                    backgroundColor: conditionColors[listing.condition] ?? '#6b7280',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    textTransform: 'capitalize',
                  }}>
                    {listing.condition.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {new Date(listing.created_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div style={{
                fontWeight: 800,
                fontSize: '1.1rem',
                color: 'var(--color-primary)',
                minWidth: '80px',
                textAlign: 'right',
              }}>
                {listing.currency === 'EUR' ? '€' : listing.currency}{listing.price.toFixed(2)}
              </div>

              {/* Status */}
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: statusColors[listing.status]?.color ?? 'var(--color-text-muted)',
                backgroundColor: statusColors[listing.status]?.bg ?? 'var(--color-surface)',
                padding: '4px 12px',
                borderRadius: '999px',
                textTransform: 'capitalize',
                minWidth: '70px',
                textAlign: 'center',
              }}>
                {listing.status}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link
                  to={`/item/${listing.id}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  View
                </Link>
                <button
                  onClick={() => setConfirmDeleteId(listing.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #fecaca',
                    backgroundColor: 'transparent',
                    color: '#dc2626',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}