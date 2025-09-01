import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  throw new Error('[stripe] Missing STRIPE_SECRET_KEY')
}

export const stripe = new Stripe(key, {
  // Use package default API version to match installed types
  typescript: true,
})
