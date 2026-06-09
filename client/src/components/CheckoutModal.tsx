import { useState, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const SERVER_URL = 'http://localhost:5000'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckoutModalProps {
  listing: {
    id: string
    title: string
    price: number
    currency: string
    seller_id: string
  }
  buyerId: string
  onClose: () => void
  onSuccess: () => void
}

// ─── Inner form ───────────────────────────────────────────────────────────────

function CheckoutForm({ listing, buyerId, onClose, onSuccess }: CheckoutModalProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currencySymbol = listing.currency === 'EUR' ? '€' : listing.currency

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setErrorMessage(null)

    // Step 1 — validate elements
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setErrorMessage(submitError.message ?? 'Payment failed.')
      setProcessing(false)
      return
    }

    // Step 2 — confirm payment with Stripe
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (confirmError) {
      setErrorMessage(confirmError.message ?? 'Payment failed.')
      setProcessing(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      // Step 3 — tell our server to create the order and mark listing sold
      // Server verifies with Stripe independently, so this can't be faked
      try {
        const res = await fetch(`${SERVER_URL}/api/payments/confirm-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            listingId: listing.id,
            buyerId,
            sellerId: listing.seller_id,
            amount: listing.price,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Order confirmation failed')
      } catch (err: unknown) {
        // Payment succeeded but order write failed — show warning but still
        // treat as success since money moved. In production a webhook handles this.
        console.error('Order confirmation error:', err)
      }

      onSuccess()
    }

    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Order summary */}
      <div style={{
        background: 'var(--color-background)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
            {listing.title}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            One-time payment
          </div>
        </div>
        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
          {currencySymbol}{listing.price.toLocaleString()}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <PaymentElement />
      </div>

      {errorMessage && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          color: '#991b1b',
          fontSize: '0.875rem',
        }}>
          {errorMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          style={{
            flex: 1,
            padding: '12px',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            color: 'var(--color-text-secondary)',
            fontWeight: 600,
            cursor: processing ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          style={{
            flex: 2,
            padding: '12px',
            background: !stripe || processing ? 'var(--color-border)' : 'var(--color-primary)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontWeight: 700,
            cursor: !stripe || processing ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem',
          }}
        >
          {processing ? 'Processing…' : `Pay ${currencySymbol}${listing.price.toLocaleString()}`}
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '12px' }}>
        🔒 Secured by Stripe · Test mode
      </p>
    </form>
  )
}

// ─── Outer modal ──────────────────────────────────────────────────────────────

export default function CheckoutModal({ listing, buyerId, onClose, onSuccess }: CheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [succeeded, setSucceeded] = useState(false)

  const fetchIntent = useCallback(async () => {
    setLoadError(null)
    try {
      const res = await fetch(`${SERVER_URL}/api/payments/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id, buyerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to initialise payment')
      setClientSecret(data.clientSecret)
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to initialise payment')
    }
  }, [listing.id, buyerId])

  // Fetch on mount
  useState(() => { fetchIntent() })

  function handleSuccess() {
    setSucceeded(true)
    setTimeout(() => { onSuccess() }, 2000)
  }

  const currencySymbol = listing.currency === 'EUR' ? '€' : listing.currency

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Complete Purchase
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* Success */}
        {succeeded && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
            <h3 style={{ color: '#166534', marginBottom: '8px' }}>Payment Successful!</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              You purchased <strong>{listing.title}</strong> for {currencySymbol}{listing.price.toLocaleString()}.
              Redirecting…
            </p>
          </div>
        )}

        {/* Load error */}
        {!succeeded && loadError && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>❌</div>
            <p style={{ color: '#991b1b', marginBottom: '16px' }}>{loadError}</p>
            <button
              onClick={fetchIntent}
              style={{
                padding: '10px 20px',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading */}
        {!succeeded && !loadError && !clientSecret && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
            Preparing payment…
          </div>
        )}

        {/* Stripe form */}
        {!succeeded && !loadError && clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: { colorPrimary: '#f97316', borderRadius: '8px' },
              },
            }}
          >
            <CheckoutForm
              listing={listing}
              buyerId={buyerId}
              onClose={onClose}
              onSuccess={handleSuccess}
            />
          </Elements>
        )}
      </div>
    </div>
  )
}