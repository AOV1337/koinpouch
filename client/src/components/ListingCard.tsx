import { Link } from 'react-router-dom'

export interface Listing {
  id: string
  title: string
  price: number
  currency: string
  category: string
  condition: string
  images: string[] | null
  seller_id: string
  created_at: string
}

interface ListingCardProps {
  listing: Listing
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

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link to={`/item/${listing.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '14px',
          overflow: 'hidden',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(-4px)'
          el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
        }}
      >
        {/* Image */}
        <div style={{
          height: '180px',
          backgroundColor: 'var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '4rem',
          flexShrink: 0,
        }}>
          {listing.images?.[0]
            ? <img src={listing.images[0]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : categoryEmoji[listing.category] ?? '📦'
          }
        </div>

        {/* Content */}
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.4rem' }}>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--color-primary)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {listing.category}
          </div>
          <div style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
            flex: 1,
          }}>
            {listing.title}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem',
          }}>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: 'var(--color-primary)',
            }}>
              {listing.currency === 'EUR' ? '€' : listing.currency}{listing.price.toFixed(2)}
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: '#fff',
              backgroundColor: conditionColors[listing.condition] ?? '#6b7280',
              padding: '3px 10px',
              borderRadius: '999px',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}>
              {listing.condition.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}