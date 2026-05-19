import { useParams, Link } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import type { Listing } from '../components/ListingCard'

const mockSeller = {
  id: 'seller-1',
  full_name: 'Marco Rossi',
  avatar_url: null,
  bio: 'Passionate collector for over 20 years. Specialising in vintage trading cards and rare coins. All items carefully stored and accurately described. Fast shipping, always tracked.',
  location: 'Milan, Italy',
  kyc_status: 'approved',
  reputation_score: 4.8,
  total_sales: 143,
  total_disputes: 2,
  avg_shipping_days: 2,
  joined_as_seller_at: '2024-03-15',
  reviews: [
    { id: 'r1', buyer_name: 'Alex K.', rating: 5, comment: 'Perfect condition, fast shipping. Highly recommended!', created_at: '2026-04-10' },
    { id: 'r2', buyer_name: 'Sophie M.', rating: 5, comment: 'Great communication, item exactly as described.', created_at: '2026-03-22' },
    { id: 'r3', buyer_name: 'James T.', rating: 4, comment: 'Good seller, shipping took a bit longer than expected but item was perfect.', created_at: '2026-03-01' },
    { id: 'r4', buyer_name: 'Lena B.', rating: 5, comment: 'Incredible item, even better in person. Will buy again.', created_at: '2026-02-14' },
  ],
  rating_breakdown: { 5: 118, 4: 19, 3: 4, 2: 1, 1: 1 },
}

const mockListings: Listing[] = [
  { id: '1', title: 'Charizard Holo 1st Edition', price: 1200, currency: '€', category: 'cards', condition: 'near_mint', images: null, seller_id: 'seller-1', created_at: '2026-01-01' },
  { id: '2', title: 'Pikachu Illustrator Card', price: 4500, currency: '€', category: 'cards', condition: 'mint', images: null, seller_id: 'seller-1', created_at: '2026-01-05' },
  { id: '6', title: 'Gold Sovereign — Queen Victoria', price: 520, currency: '€', category: 'coins', condition: 'near_mint', images: null, seller_id: 'seller-1', created_at: '2026-01-06' },
]

const starColor = '#f97316'

function StarBar({ star, count, total }: { star: number, count: number, total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', width: '16px', textAlign: 'right' }}>{star}</span>
      <span style={{ fontSize: '0.75rem' }}>★</span>
      <div style={{
        flex: 1,
        height: '8px',
        backgroundColor: 'var(--color-border)',
        borderRadius: '999px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: starColor,
          borderRadius: '999px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', width: '24px' }}>{count}</span>
    </div>
  )
}

function ReviewCard({ review }: { review: typeof mockSeller.reviews[0] }) {
  return (
    <div style={{
      backgroundColor: 'var(--color-background)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '1.25rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}>
            {review.buyer_name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
              {review.buyer_name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {new Date(review.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1, 2, 3, 4, 5].map(s => (
            <span key={s} style={{ color: s <= review.rating ? starColor : 'var(--color-border)', fontSize: '0.9rem' }}>★</span>
          ))}
        </div>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
        {review.comment}
      </p>
    </div>
  )
}

export default function SellerProfile() {
  const { id } = useParams()
  console.log('Seller id:', id)

  const seller = mockSeller
  const totalReviews = Object.values(seller.rating_breakdown).reduce((a, b) => a + b, 0)

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Breadcrumb */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        marginBottom: '1.5rem',
        fontSize: '0.875rem',
        color: 'var(--color-text-muted)',
      }}>
        <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <Link to="/browse" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Browse</Link>
        <span>›</span>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{seller.full_name}</span>
      </div>

      {/* Seller header */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        {/* Avatar */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {seller.full_name.charAt(0)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              {seller.full_name}
            </h1>
            {seller.kyc_status === 'approved' && (
              <span style={{
                fontSize: '0.75rem',
                color: '#22c55e',
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                padding: '3px 10px',
                borderRadius: '999px',
                fontWeight: 700,
              }}>
                ✅ Verified Seller
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {seller.location && (
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                📍 {seller.location}
              </span>
            )}
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              📅 Selling since {new Date(seller.joined_as_seller_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              🚚 Avg. shipping {seller.avg_shipping_days} days
            </span>
          </div>

          {seller.bio && (
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
              margin: 0,
              maxWidth: '600px',
            }}>
              {seller.bio}
            </p>
          )}
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Reputation', value: `⭐ ${seller.reputation_score}` },
            { label: 'Total Sales', value: seller.total_sales.toString() },
            { label: 'Disputes', value: seller.total_disputes.toString() },
          ].map(stat => (
            <div key={stat.label} style={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '0.875rem 1.25rem',
              textAlign: 'center',
              minWidth: '90px',
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '1.5rem',
        alignItems: 'flex-start',
      }}>

        {/* Left — listings + reviews */}
        <div>

          {/* Active listings */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '1.25rem',
            }}>
              Active Listings ({mockListings.length})
            </h2>
            {mockListings.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
              }}>
                {mockListings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem 0',
                color: 'var(--color-text-muted)',
                fontSize: '0.9rem',
              }}>
                No active listings at the moment.
              </div>
            )}
          </div>

          {/* Reviews */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '1.25rem',
            }}>
              Reviews ({totalReviews})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {seller.reviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        </div>

        {/* Right — reputation breakdown */}
        <div style={{
          position: 'sticky',
          top: '80px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}>
            <h2 style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem',
            }}>
              Rating Breakdown
            </h2>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 900,
                color: 'var(--color-text-primary)',
                lineHeight: 1,
              }}>
                {seller.reputation_score}
              </div>
              <div>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '0.25rem' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} style={{
                      color: s <= Math.round(seller.reputation_score) ? starColor : 'var(--color-border)',
                      fontSize: '1rem',
                    }}>★</span>
                  ))}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {totalReviews} reviews
                </div>
              </div>
            </div>

            {[5, 4, 3, 2, 1].map(star => (
              <StarBar
                key={star}
                star={star}
                count={seller.rating_breakdown[star as keyof typeof seller.rating_breakdown]}
                total={totalReviews}
              />
            ))}
          </div>

          {/* Trust indicators */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}>
            <h2 style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem',
            }}>
              Trust & Safety
            </h2>
            {[
              { label: 'Identity Verified', status: seller.kyc_status === 'approved', icon: '🪪' },
              { label: 'Email Confirmed', status: true, icon: '📧' },
              { label: 'Active Seller', status: seller.total_sales > 0, icon: '✅' },
              { label: 'Low Dispute Rate', status: (seller.total_disputes / seller.total_sales) < 0.05, icon: '🛡️' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: item.status ? '#22c55e' : '#ef4444',
                }}>
                  {item.status ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}