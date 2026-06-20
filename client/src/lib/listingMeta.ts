export type ListingCategory = 'cards' | 'figurines' | 'coins' | 'stamps' | 'general'
export type ListingCondition = 'mint' | 'near_mint' | 'good' | 'fair' | 'poor'

export const CATEGORY_META: Record<ListingCategory, { label: string; emoji: string }> = {
  cards: { label: 'Trading Cards', emoji: '🃏' },
  figurines: { label: 'Figurines', emoji: '🗿' },
  coins: { label: 'Coins', emoji: '🪙' },
  stamps: { label: 'Stamps', emoji: '✉️' },
  general: { label: 'General', emoji: '📦' },
}

export const CONDITION_META: Record<ListingCondition, { label: string; color: string; description: string }> = {
  mint: { label: 'Mint', color: '#22c55e', description: 'Perfect condition, never used' },
  near_mint: { label: 'Near Mint', color: '#84cc16', description: 'Minimal wear, almost perfect' },
  good: { label: 'Good', color: '#eab308', description: 'Some wear, all details clear' },
  fair: { label: 'Fair', color: '#f97316', description: 'Noticeable wear, still complete' },
  poor: { label: 'Poor', color: '#ef4444', description: 'Heavy wear, major flaws' },
}