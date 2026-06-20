// Badge tier logic, kept separate from SellerBadge.tsx so that file can
// export only a React component (required for Vite Fast Refresh to work).

export interface BadgeTier {
  label: string
  emoji: string
  color: string
  bg: string
}

const TIER_1: BadgeTier = { label: 'Elite Seller', emoji: '🏆', color: '#92400e', bg: '#fef3c7' }
const TIER_2: BadgeTier = { label: 'Trusted Seller', emoji: '⭐', color: '#3730a3', bg: '#e0e7ff' }

/**
 * Determine which badge tier a seller qualifies for, if any.
 * Tier 1: 4.75+ average with at least 25 reviews
 * Tier 2: 4.5+ average with at least 10 reviews
 */
export function getSellerBadgeTier(averageRating: number, reviewCount: number): BadgeTier | null {
  if (averageRating >= 4.75 && reviewCount >= 25) return TIER_1
  if (averageRating >= 4.5 && reviewCount >= 10) return TIER_2
  return null
}