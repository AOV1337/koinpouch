import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const router = Router()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/payments/create-payment-intent
router.post('/create-payment-intent', async (req: Request, res: Response) => {
  const { listingId, buyerId } = req.body

  if (!listingId || !buyerId) {
    return res.status(400).json({ error: 'listingId and buyerId are required' })
  }

  // Fetch listing from Supabase
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

  // Stripe expects amount in smallest currency unit (cents)
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

export default router