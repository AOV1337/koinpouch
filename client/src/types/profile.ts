export type UserRole = 'buyer' | 'seller' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface SellerProfile {
  id: string
  user_id: string
  kyc_status: 'pending' | 'approved' | 'rejected'
  kyc_documents: Record<string, unknown> | null
  reputation_score: number
  total_sales: number
  total_disputes: number
  bio: string | null
  location: string | null
  joined_as_seller_at: string
}