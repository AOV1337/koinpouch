import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SellerProfileRow {
  bio: string | null
  location: string | null
  reputation_score: number | null
  total_sales: number | null
  joined_as_seller_at: string | null
  kyc_status: 'pending' | 'approved' | 'rejected'
}

interface SellerInfo {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  // Supabase returns one-to-many joins as arrays even for one-to-one relations
  seller_profiles: SellerProfileRow[] | null
}

interface Listing {
  id: string
  title: string
  price: number
  currency: string
  category: string
  condition: string
  images: string[] | null
  created_at: string
}

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  // Supabase returns joined profiles as an array; we normalize to [0] after fetch
  buyer: { full_name: string | null }[] | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            color: star <= rating ? '#f97316' : 'var(--color-border)',
            fontSize: '1rem',
          }}
        >
          ★
        </span>
      ))}
    </span>
  )
}

function AverageRating({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return <span style={{ color: 'var(--color-text-muted)' }}>No reviews yet</span>
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <StarRating rating={Math.round(avg)} />
      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
        {avg.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
      </span>
    </span>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    cards: '#3b82f6',
    figurines: '#8b5cf6',
    coins: '#f59e0b',
    stamps: '#10b981',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        background: colors[category] ?? '#6b7280',
        color: '#fff',
      }}
    >
      {category}
    </span>
  )
}

function ConditionBadge({ condition }: { condition: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 500,
        textTransform: 'capitalize',
        background: 'var(--color-surface)',
        color: 'var(--color-text-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      {condition.replace('_', ' ')}
    </span>
  )
}

function KycBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const map = {
    approved: { label: '✓ Verified Seller', color: '#10b981', bg: '#d1fae5' },
    pending: { label: '⏳ Verification Pending', color: '#f59e0b', bg: '#fef3c7' },
    rejected: { label: '✗ Not Verified', color: '#ef4444', bg: '#fee2e2' },
  }
  const { label, color, bg } = map[status]
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 600,
        color,
        background: bg,
      }}
    >
      {label}
    </span>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatMemberSince(dateStr: string | null) {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SellerProfile() {
  const { id } = useParams<{ id: string }>()

  const [seller, setSeller] = useState<SellerInfo | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSellerData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)

    try {
      // Fetch seller profile + seller_profiles join
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          created_at,
          seller_profiles (
            bio,
            location,
            reputation_score,
            total_sales,
            joined_as_seller_at,
            kyc_status
          )
        `)
        .eq('id', id)
        .single()

      if (sellerError) throw sellerError
      setSeller(sellerData as unknown as SellerInfo)

      // Fetch active listings by this seller
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, price, currency, category, condition, images, created_at')
        .eq('seller_id', id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (listingsError) throw listingsError
      setListings(listingsData ?? [])

      // Fetch reviews for this seller
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          buyer:profiles!reviews_buyer_id_fkey (
            full_name
          )
        `)
        .eq('seller_id', id)
        .order('created_at', { ascending: false })

      if (reviewsError) throw reviewsError
      setReviews((reviewsData as unknown as Review[]) ?? [])
    } catch (err: unknown) {
      console.error(err)
      setError('Could not load seller profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSellerData()
  }, [fetchSellerData])

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading seller profile…</p>
      </div>
    )
  }

  if (error || !seller) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <p style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{error ?? 'Seller not found.'}</p>
        <Link to="/browse" style={{ color: '#f97316', textDecoration: 'underline' }}>Back to Browse</Link>
      </div>
    )
  }

  const sp = Array.isArray(seller.seller_profiles) ? (seller.seller_profiles[0] ?? null) : null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* ── Breadcrumb ── */}
      <nav style={{ marginBottom: '24px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
        <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 6px' }}>›</span>
        <Link to="/browse" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Browse</Link>
        <span style={{ margin: '0 6px' }}>›</span>
        <span style={{ color: 'var(--color-text-primary)' }}>{seller.full_name ?? 'Seller'}</span>
      </nav>

      {/* ── Seller Card ── */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '32px',
          alignItems: 'flex-start',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: seller.avatar_url ? undefined : '#f97316',
            backgroundImage: seller.avatar_url ? `url(${seller.avatar_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          {!seller.avatar_url && (seller.full_name?.[0]?.toUpperCase() ?? '?')}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {seller.full_name ?? 'Anonymous Seller'}
            </h1>
            {sp?.kyc_status && <KycBadge status={sp.kyc_status} />}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <AverageRating reviews={reviews} />
          </div>

          {sp?.bio && (
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '12px', maxWidth: '600px' }}>
              {sp.bio}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {sp?.location && (
              <span>📍 {sp.location}</span>
            )}
            <span>📦 {sp?.total_sales ?? 0} sales</span>
            <span>🗓 Member since {formatMemberSince(sp?.joined_as_seller_at ?? seller.created_at)}</span>
          </div>
        </div>

        {/* Stats box */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minWidth: '140px',
          }}
        >
          <StatBox label="Active Listings" value={listings.length.toString()} />
          <StatBox label="Total Sales" value={(sp?.total_sales ?? 0).toString()} />
          <StatBox label="Reviews" value={reviews.length.toString()} />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          borderBottom: '2px solid var(--color-border)',
          marginBottom: '28px',
        }}
      >
        {(['listings', 'reviews'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #f97316' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? '#f97316' : 'var(--color-text-secondary)',
              fontSize: '0.95rem',
              textTransform: 'capitalize',
              transition: 'color 0.15s',
            }}
          >
            {tab === 'listings' ? `Listings (${listings.length})` : `Reviews (${reviews.length})`}
          </button>
        ))}
      </div>

      {/* ── Listings Tab ── */}
      {activeTab === 'listings' && (
        <>
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
              This seller has no active listings at the moment.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '20px',
              }}
            >
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Reviews Tab ── */}
      {activeTab === 'reviews' && (
        <>
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
              No reviews yet for this seller.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--color-background)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        padding: '12px 16px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{label}</div>
    </div>
  )
}

function ListingCard({ listing }: { listing: Listing }) {
  const image = Array.isArray(listing.images) && listing.images.length > 0 ? listing.images[0] : null

  return (
    <Link
      to={`/item/${listing.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'box-shadow 0.2s, transform 0.2s',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.boxShadow = '0 4px 20px rgba(249,115,22,0.15)'
          el.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.boxShadow = 'none'
          el.style.transform = 'translateY(0)'
        }}
      >
        {/* Image */}
        <div
          style={{
            height: '180px',
            background: image ? undefined : 'var(--color-border)',
            backgroundImage: image ? `url(${image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: image ? undefined : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!image && (
            <span style={{ color: 'var(--color-text-muted)', fontSize: '2rem' }}>🖼</span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px' }}>
          <p
            style={{
              margin: '0 0 8px',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {listing.title}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f97316' }}>
              {listing.currency} {listing.price.toFixed(2)}
            </span>
            <ConditionBadge condition={listing.condition} />
          </div>

          <CategoryBadge category={listing.category} />
        </div>
      </div>
    </Link>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '20px 24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginRight: '10px' }}>
            {(review.buyer?.[0]?.full_name) ?? 'Anonymous'}
          </span>
          <StarRating rating={review.rating} />
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {formatDate(review.created_at)}
        </span>
      </div>
      {review.comment && (
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          {review.comment}
        </p>
      )}
    </div>
  )
}