# FXNote Security Enhancements

## Environment Variables
Create a `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID_BASIC=price_xxx
APP_URL=http://localhost:3000

# Optional
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
TURNSTILE_SECRET_KEY=...   # or HCAPTCHA_SECRET=...
```

`src/env.ts` validates these at boot and throws if required values are missing.

## Webhook Testing

1. Start the dev server: `pnpm dev`
2. Use Stripe CLI to forward events:

```
stripe listen --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,invoice.payment_succeeded \
  --forward-to http://localhost:3000/api/stripe/webhook
```

3. Set `STRIPE_WEBHOOK_SECRET` to the secret shown by the CLI.
4. Create a test Checkout session via the app; on success you should see subscription rows upserted.

## Notes

- Security headers (CSP/HSTS/etc.) added in `next.config.mjs` apply to all routes.
- Middleware enforces basic CORS for API, rate-limits sensitive endpoints, and guards `/dashboard/*`.
- All new API routes validate inputs with Zod and avoid trusting client-provided IDs.

