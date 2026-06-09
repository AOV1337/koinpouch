import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const router = Router()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

// Server-side Supabase client uses service role key — bypasses RLS
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── POST /api/payments/create-payment-intent ──────────────────────────────────
router.post('/create-payment-intent', async (req: Request, res: Response) => {
  const { listingId, buyerId } = req.body

  if (!listingId || !buyerId) {
    return res.status(400).json({ error: 'listingId and buyerId are required' })
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, title, price, currency, status, seller_id')
    .eq('id', listingId)
    .single()

  if (listingError || !listing) {
    return res.status(404).json({ error: 'Listing not found' })
  }
  if (listing.status !== 'active') {
    return res.status(400).json({ error: 'This listing is no longer available' })
  }
  if (listing.seller_id === buyerId) {
    return res.status(400).json({ error: 'You cannot purchase your own listing' })
  }

  const amountInCents = Math.round(listing.price * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: listing.currency.toLowerCase(),
    metadata: {
      listingId: listing.id,
      buyerId,
      sellerId: listing.seller_id,
      listingTitle: listing.title,
    },
  })

  return res.json({ clientSecret: paymentIntent.client_secret })
})

// ── POST /api/payments/confirm-order ─────────────────────────────────────────
// Called by frontend after Stripe confirms payment succeeded.
// Uses service role key so RLS never blocks the writes.
router.post('/confirm-order', async (req: Request, res: Response) => {
  const { paymentIntentId, listingId, buyerId, sellerId, amount } = req.body

  if (!paymentIntentId || !listingId || !buyerId || !sellerId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Verify the payment intent actually succeeded with Stripe
  // so the frontend can't fake a confirmation
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (paymentIntent.status !== 'succeeded') {
    return res.status(400).json({ error: 'Payment not confirmed by Stripe' })
  }

  // Prevent duplicate orders for the same payment intent
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_payment_id', paymentIntentId)
    .maybeSingle()

  if (existing) {
    return res.json({ success: true, message: 'Order already exists' })
  }

  // Create the order
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
      stripe_payment_id: paymentIntentId,
      amount,
      status: 'paid',
    })

  if (orderError) {
    console.error('Order insert failed:', orderError)
    return res.status(500).json({ error: 'Failed to create order' })
  }

  // Mark listing as sold
  const { error: listingError } = await supabase
    .from('listings')
    .update({ status: 'sold' })
    .eq('id', listingId)

  if (listingError) {
    console.error('Listing update failed:', listingError)
    return res.status(500).json({ error: 'Failed to update listing status' })
  }

  // Increment seller total_sales
  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select('total_sales')
    .eq('user_id', sellerId)
    .single()

  if (sellerProfile) {
    await supabase
      .from('seller_profiles')
      .update({ total_sales: (sellerProfile.total_sales ?? 0) + 1 })
      .eq('user_id', sellerId)
  }

  return res.json({ success: true })
})

export default router