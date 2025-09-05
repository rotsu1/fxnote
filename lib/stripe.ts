import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  throw new Error('[stripe] Missing STRIPE_SECRET_KEY')
}

export const stripe = new Stripe(key, {
  // Match the installed Stripe types' latest API version literal
  apiVersion: '2025-08-27.basil',
  typescript: true,
})
