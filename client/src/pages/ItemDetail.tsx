import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Temporary mock — will be replaced with Supabase fetch by listing id
const mockListing = {
  id: '1',
  title: 'Charizard Holo 1st Edition',
  description: `One of the most iconic cards in the history of trading card games. This 1st Edition Base Set Charizard is in exceptional condition, with minimal edge wear and strong centering. The holographic surface shows no scratches under direct light.

This card was kept in a sleeve inside a binder since purchase in 1999 and has never been played. A grading submission to PSA or BGS is highly recommended before resale.`,
  price: 1200,
  currency: '€',
  category: 'cards',
  condition: 'near_mint',
  status: 'active',
  images: [] as string[],
  created_at: '2026-01-01',
  seller: {
    id: 'seller-1',
    full_name: 'Marco Rossi',
    reputation_score: 4.8,
    total_sales: 143,
    kyc_status: 'approved',
    joined_as_seller_at: '2024-03-15',
  },
  details: {
    'Set': 'Base Set 1st Edition',
    'Card Number': '4/102',
    'Rarity': 'Holographic Rare',
    'Language': 'English',
    'Year': '1999',
    'Publisher': 'Wizards of the Coast',
  }
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

export default function ItemDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [activeImage, setActiveImage] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)

  // Will be replaced with real fetch: const { data } = await supabase.from('listings').select().eq('id', id)
  const listing = mockListing
  console.log('Listing id:', id)

  const images = listing.images.length > 0 ? listing.images : [null]

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '2rem 1.5rem',
    }}>

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
        <Link to={`/browse?category=${listing.category}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none', textTransform: 'capitalize' }}>
          {listing.category}
        </Link>
        <span>›</span>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{listing.title}</span>
      </div>

      {/* Main layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '2.5rem',
        alignItems: 'flex-start',
      }}>

        {/* Left column */}
        <div>

          {/* Image carousel */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '1.5rem',
          }}>
            {/* Main image */}
            <div style={{
              height: '420px',
              backgroundColor: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8rem',
            }}>
              {images[activeImage]
                ? <img
                    src={images[activeImage]!}
                    alt={listing.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                : categoryEmoji[listing.category] ?? '📦'
              }
            </div>

            {/* Thumbnail strip — ready for real images */}
            {images.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.75rem',
                borderTop: '1px solid var(--color-border)',
                overflowX: 'auto',
              }}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    style={{
                      width: '64px',
                      height: '64px',
                      flexShrink: 0,
                      borderRadius: '8px',
                      border: `2px solid ${activeImage === idx ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: 'var(--color-primary-light)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      padding: 0,
                    }}
                  >
                    {img
                      ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '1.5rem' }}>{categoryEmoji[listing.category]}</span>
                    }
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
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
              marginBottom: '1rem',
            }}>
              Description
            </h2>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.8,
              whiteSpace: 'pre-line',
            }}>
              {listing.description}
            </p>
          </div>

          {/* Item details */}
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
              marginBottom: '1rem',
            }}>
              Item Details
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}>
              {Object.entries(listing.details).map(([key, value]) => (
                <div key={key} style={{
                  backgroundColor: 'var(--color-background)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--color-border)',
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 600,
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {key}
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: 'var(--color-text-primary)',
                    fontWeight: 600,
                  }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{
          position: 'sticky',
          top: '80px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>

          {/* Price card */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}>
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.35rem',
            }}>
              {listing.category} · Listed {new Date(listing.created_at).toLocaleDateString('en-GB')}
            </div>

            <h1 style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
              marginBottom: '1rem',
            }}>
              {listing.title}
            </h1>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}>
              <span style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: 'var(--color-primary)',
              }}>
                {listing.currency}{listing.price.toLocaleString()}
              </span>
              <span style={{
                fontSize: '0.8rem',
                color: '#fff',
                backgroundColor: conditionColors[listing.condition] ?? '#6b7280',
                padding: '4px 12px',
                borderRadius: '999px',
                fontWeight: 700,
                textTransform: 'capitalize',
              }}>
                {listing.condition.replace('_', ' ')}
              </span>
            </div>

            {/* Action buttons */}
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}>
                  Buy Now
                </button>
                <button
                  onClick={() => setBookmarked(prev => !prev)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'transparent',
                    color: bookmarked ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    border: `1px solid ${bookmarked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {bookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}
                </button>
              </div>
            ) : (
              <div>
                <Link to="/login" style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}>
                  Log in to Buy
                </Link>
                <p style={{
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '0.75rem',
                }}>
                  You need an account to purchase or bookmark items
                </p>
              </div>
            )}
          </div>

          {/* Seller card */}
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
              Sold by
            </h2>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
                flexShrink: 0,
              }}>
                {listing.seller.full_name.charAt(0)}
              </div>
              <div>
                <div style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'var(--color-text-primary)',
                }}>
                  {listing.seller.full_name}
                </div>
                {listing.seller.kyc_status === 'approved' && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#22c55e',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}>
                    ✅ Verified Seller
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}>
              {[
                { label: 'Reputation', value: `⭐ ${listing.seller.reputation_score}` },
                { label: 'Total Sales', value: `${listing.seller.total_sales}` },
              ].map(item => (
                <div key={item.label} style={{
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.75rem',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: 'var(--color-text-primary)',
                  }}>
                    {item.value}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                  }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <Link
              to={`/seller/${listing.seller.id}`}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '9px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              View seller profile →
            </Link>
          </div>

          {/* Report link */}
          <div style={{ textAlign: 'center' }}>
            <button style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}>
              Report this listing
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}