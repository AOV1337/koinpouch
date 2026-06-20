import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import SellerBadge from '../components/SellerBadge'

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

interface ReviewRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  profiles: { full_name: string | null }[] | { full_name: string | null } | null
}

const RECENT_REVIEWS_SHOWN = 20

export default function SellerReputation() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [totalSales, setTotalSales] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [{ data: reviewData }, { count: salesCount }] = await Promise.all([
      supabase
        .from('reviews')
        .select('id, rating, comment, created_at, profiles!reviews_buyer_id_fkey(full_name)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id),
    ])

    setReviews((reviewData as unknown as ReviewRow[]) ?? [])
    setTotalSales(salesCount ?? 0)
    setLoading(false)
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const reviewCount = reviews.length
  // Computed live from the reviews actually returned, rather than trusting
  // seller_profiles.reputation_score (see chat note: that column is stale).
  const reputationScore = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0
  const histogram = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }))
  const maxBarCount = Math.max(1, ...histogram.map(h => h.count))


  const statCardStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  }

  const sectionStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Reputation">

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', padding: '32px 0', textAlign: 'center' }}>Loading reputation…</p>
      ) : (
        <>
          {/* Top stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={statCardStyle}>
              <span style={{ fontSize: '1.5rem' }}>⭐</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                  {reviewCount > 0 ? reputationScore.toFixed(1) : '—'}
                </span>
                {reviewCount > 0 && <SellerBadge averageRating={reputationScore} reviewCount={reviewCount} size="small" />}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Average Rating
              </span>
            </div>

            <div style={statCardStyle}>
              <span style={{ fontSize: '1.5rem' }}>📝</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                {reviewCount}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Total Reviews
              </span>
            </div>

            <div style={statCardStyle}>
              <span style={{ fontSize: '1.5rem' }}>💰</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                {totalSales}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Total Sales
              </span>
            </div>
          </div>

          {reviewCount === 0 ? (
            <div style={{ ...sectionStyle, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⭐</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                No reviews yet
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                Once buyers start reviewing your completed orders, your rating breakdown and reviews will show up here.
              </div>
            </div>
          ) : (
            <>
              {/* Rating breakdown */}
              <div style={sectionStyle}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
                  Rating Breakdown
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {histogram.map(h => (
                    <div key={h.star} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ width: '40px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, flexShrink: 0 }}>
                        {h.star} ★
                      </span>
                      <div style={{ flex: 1, height: '10px', backgroundColor: 'var(--color-background)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${(h.count / maxBarCount) * 100}%`,
                          height: '100%',
                          backgroundColor: 'var(--color-primary)',
                          borderRadius: '999px',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <span style={{ width: '24px', textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                        {h.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent reviews */}
              <div style={sectionStyle}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                  Recent Reviews
                </h2>
                {reviewCount > RECENT_REVIEWS_SHOWN && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    Showing the {RECENT_REVIEWS_SHOWN} most recent of {reviewCount} reviews.
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {reviews.slice(0, RECENT_REVIEWS_SHOWN).map((review, idx, arr) => {
                    const buyer = Array.isArray(review.profiles) ? review.profiles[0] : review.profiles
                    return (
                      <div
                        key={review.id}
                        style={{
                          padding: '1rem 0',
                          borderBottom: idx < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                            {buyer?.full_name ?? 'Anonymous buyer'}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div style={{ color: '#eab308', fontSize: '0.9rem', marginBottom: '0.4rem', letterSpacing: '1px' }}>
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </div>
                        {review.comment && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                            {review.comment}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </DashboardLayout>
  )
}