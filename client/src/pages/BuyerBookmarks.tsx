import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { buyerSidebarItems as sidebarItems } from '../lib/buyerSidebar'

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
    condition: string
    status: string
    images: string[] | null
  } | null
}

const categoryEmoji: Record<string, string> = {
  cards: '🃏', figurines: '🗿', coins: '🪙', stamps: '✉️',
}

const conditionColors: Record<string, string> = {
  mint: '#22c55e', near_mint: '#84cc16', good: '#eab308', fair: '#f97316', poor: '#ef4444',
}

export default function BuyerBookmarks() {
  const { user } = useAuth()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBookmarks = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('bookmarks')
      .select('id, created_at, listing_id, listings(id, title, price, currency, category, condition, status, images)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setBookmarks((data as unknown as Bookmark[]) ?? [])
    setLoading(false)
  }, [user])

  async function removeBookmark(bookmarkId: string) {
    await supabase.from('bookmarks').delete().eq('id', bookmarkId)
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
  }

  useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookmarks()
  }, [fetchBookmarks])

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Bookmarks">

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>Loading…</div>
      ) : bookmarks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔖</div>
          <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>No bookmarks yet</p>
          <p style={{ fontSize: '0.875rem', marginBottom: '16px' }}>Save listings while browsing to find them here.</p>
          <Link to="/browse" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Browse listings →
          </Link>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
            {bookmarks.length} saved listing{bookmarks.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {bookmarks.map(bm => {
              const listing = bm.listings
              if (!listing) return null
              const image = listing.images?.[0] ?? null
              const isSold = listing.status === 'sold'

              return (
                <div key={bm.id} style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  opacity: isSold ? 0.7 : 1,
                }}>
                  {/* Image */}
                  <div style={{
                    height: '160px',
                    background: image ? `url(${image}) center/cover` : 'var(--color-primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '3rem', position: 'relative',
                  }}>
                    {!image && (categoryEmoji[listing.category] ?? '📦')}
                    {isSold && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.1em' }}>SOLD</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {listing.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 700, color: isSold ? 'var(--color-text-muted)' : 'var(--color-primary)' }}>
                        €{listing.price.toLocaleString()}
                      </span>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
                        background: conditionColors[listing.condition] ?? '#6b7280',
                        color: '#fff', textTransform: 'capitalize',
                      }}>
                        {listing.condition.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!isSold && (
                        <Link to={`/item/${listing.id}`} style={{
                          flex: 1, textAlign: 'center', padding: '7px',
                          background: 'var(--color-primary)', color: '#fff',
                          borderRadius: '8px', textDecoration: 'none',
                          fontSize: '0.8rem', fontWeight: 600,
                        }}>
                          View
                        </Link>
                      )}
                      <button
                        onClick={() => removeBookmark(bm.id)}
                        style={{
                          flex: isSold ? 1 : 0,
                          padding: '7px 10px',
                          background: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        {isSold ? 'Remove' : '🗑'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </DashboardLayout>
  )
}