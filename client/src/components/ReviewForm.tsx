import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface ReviewFormProps {
  sellerId: string
  buyerId: string
  listingId: string
  onSubmitted: () => void
  onCancel: () => void
}

export default function ReviewForm({ sellerId, buyerId, listingId, onSubmitted, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (rating === 0) {
      setError('Please select a star rating.')
      return
    }
    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('reviews')
      .insert({
        seller_id: sellerId,
        buyer_id: buyerId,
        listing_id: listingId,
        rating,
        comment: comment.trim() || null,
      })

    if (insertError) {
      setError(
        insertError.message.includes('duplicate') || insertError.message.includes('unique')
          ? 'You have already reviewed this purchase.'
          : 'Failed to submit your review. Please try again.'
      )
      setSubmitting(false)
      return
    }

    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('seller_id', sellerId)

    if (allReviews && allReviews.length > 0) {
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      await supabase
        .from('seller_profiles')
        .update({ reputation_score: Math.round(avg * 100) / 100 })
        .eq('user_id', sellerId)
    }

    setSubmitting(false)
    onSubmitted()
  }

  const displayRating = hoverRating || rating

  return (
    <div style={{
      marginTop: '12px',
      padding: '16px',
      borderRadius: '10px',
      border: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-background)',
    }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
        Rate this purchase
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.5rem',
              padding: 0,
              color: star <= displayRating ? '#f97316' : 'var(--color-border)',
              transition: 'color 0.1s ease',
            }}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Optional — share details about shipping, packaging, condition, communication…"
        rows={3}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          fontSize: '0.85rem',
          resize: 'vertical',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          marginBottom: '10px',
        }}
      />

      {error && (
        <div style={{ fontSize: '0.8rem', color: '#dc2626', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: submitting ? 'var(--color-border)' : 'var(--color-primary)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
        <button
          onClick={onCancel}
          disabled={submitting}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'transparent',
            color: 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}