import { supabase } from './supabase'

export type NotificationType =
  | 'item_sold'
  | 'review_received'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'account_banned'
  | 'support_reply'

/**
 * Inserts a notification row for `userId`. No DB trigger is used — this is a
 * direct client-side write, same tradeoff pattern as the reputation_score
 * recalculation in ReviewForm.tsx. The `notifications` INSERT policy allows
 * any authenticated user to write a notification for any other user, since
 * the actor (buyer, admin, etc.) is rarely the same person as the recipient.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message?: string,
  link?: string
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message: message ?? null,
    link: link ?? null,
  })
  if (error) {
    console.error('Failed to create notification:', error)
  }
}