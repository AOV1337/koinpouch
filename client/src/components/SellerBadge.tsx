import { getSellerBadgeTier } from '../lib/sellerBadgeTiers'

export default function SellerBadge({ averageRating, reviewCount, size = 'normal' }: {
  averageRating: number
  reviewCount: number
  size?: 'small' | 'normal'
}) {
  const tier = getSellerBadgeTier(averageRating, reviewCount)
  if (!tier) return null

  const padding = size === 'small' ? '2px 8px' : '4px 12px'
  const fontSize = size === 'small' ? '0.7rem' : '0.8rem'

  return (
    <span
      title={`${tier.label} — ${averageRating.toFixed(2)} average over ${reviewCount} reviews`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding,
        borderRadius: '999px',
        fontSize,
        fontWeight: 700,
        color: tier.color,
        background: tier.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {tier.emoji} {tier.label}
    </span>
  )
}