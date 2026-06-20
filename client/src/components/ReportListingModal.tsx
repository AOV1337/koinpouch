import { useState } from 'react'
import { supabase } from '../lib/supabase'

const REPORT_REASONS = [
  { value: 'fraud', label: 'Fraud / Scam' },
  { value: 'counterfeit', label: 'Counterfeit / Fake item' },
  { value: 'misleading', label: 'Misleading description' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
]

interface Props {
  listingId: string
  listingTitle: string
  reporterId: string
  onClose: () => void
  onSuccess: () => void
}

export default function ReportListingModal({ listingId, listingTitle, reporterId, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!reason) {
      setError('Please select a reason.')
      return
    }
    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase.from('listing_reports').insert({
      listing_id: listingId,
      reporter_id: reporterId,
      reason,
      message: message.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    onSuccess()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: '16px',
          padding: '1.75rem',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            Report listing
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--color-text-muted)', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          {listingTitle}
        </p>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.6rem' }}>
            What's wrong with this listing?
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {REPORT_REASONS.map(r => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '999px',
                  border: `1.5px solid ${reason === r.value ? '#ef4444' : 'var(--color-border)'}`,
                  backgroundColor: reason === r.value ? '#fef2f2' : 'var(--color-background)',
                  color: reason === r.value ? '#dc2626' : 'var(--color-text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: reason === r.value ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Additional details (optional)
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            placeholder="Tell us more about the issue..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'none',
              color: 'var(--color-text-primary)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: !reason || submitting ? 'var(--color-text-muted)' : '#ef4444',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: !reason || submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  )
}