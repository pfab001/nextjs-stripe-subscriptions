# Next.js + Stripe Subscriptions

A clean, production-shaped reference for recurring subscription billing with the
**Next.js App Router**, **TypeScript**, and **Stripe Checkout + webhooks**.

It implements the full happy path — pricing page → hosted checkout → confirmed
subscription — plus the webhook plumbing that keeps your database in sync with
Stripe as the source of truth. No billing logic lives in the client.

## What it does

- **Hosted Checkout** in subscription mode (Stripe handles card entry, 3D
  Secure, receipts, and dunning).
- **Webhook handler** with signature verification and routing for the events
  that actually matter: `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`, and
  `invoice.payment_failed`.
- **Server-side session confirmation** on the success page — entitlement is
  never granted from a query string.
- A typed **plan catalogue** mapping app tiers to Stripe Price IDs via env, so
  staging and production can point at different Stripe data with no code change.

## Tech stack

| | |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Payments | Stripe (Checkout + Webhooks) |
| Styling | Tailwind CSS v4 |
| Runtime | Node.js (webhook route) |

## How it fits together

```
Pricing page ──POST /api/checkout──▶ Stripe Checkout Session ──▶ hosted checkout
                                                                      │
                            success page ◀──redirect with session_id──┘
                                  │ retrieves session server-side to confirm

Stripe ──events──▶ POST /api/webhook ──▶ verify signature ──▶ route event
                                                              (sync to your DB)
```

Two details that trip people up, handled here:

1. **The webhook reads the raw body** (`await request.text()`), not parsed JSON —
   signature verification depends on the exact bytes Stripe sent.
2. **The webhook route is pinned to the Node.js runtime** — the Edge runtime
   can't run Stripe's signature crypto.

## Getting started

```bash
git clone https://github.com/<you>/nextjs-stripe-subscriptions.git
cd nextjs-stripe-subscriptions
npm install
cp .env.example .env.local   # then fill in your Stripe keys
```

In the [Stripe Dashboard](https://dashboard.stripe.com) (test mode), create two
products each with a recurring price, and copy the Price IDs into `.env.local`.

Run the app and forward webhooks locally with the
[Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
npm run dev
# in a second terminal:
stripe listen --forward-to localhost:3000/api/webhook
```

`stripe listen` prints a `whsec_...` signing secret — put it in
`STRIPE_WEBHOOK_SECRET`.

Open <http://localhost:3000>, subscribe, and pay with the test card
`4242 4242 4242 4242` (any future expiry, any CVC). Watch the events land in the
terminal running `stripe listen`.

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── checkout/route.ts   # creates a Checkout Session
│   │   └── webhook/route.ts    # verifies + routes Stripe events
│   ├── success/page.tsx        # server-confirms the completed session
│   ├── layout.tsx
│   └── page.tsx                # pricing page
├── components/
│   └── PricingCard.tsx         # client component, handles the redirect
└── lib/
    ├── plans.ts                # tier → Price ID catalogue
    └── stripe.ts               # server-side Stripe client
```

## Taking it further

The webhook handlers log instead of persisting so the repo stays dependency-free.
In a real app you'd:

- attach your user ID via `client_reference_id` / `metadata` at checkout, then
  reconcile it in the webhook;
- upsert subscription status into your database (handlers should be
  idempotent — Stripe can deliver an event more than once);
- add a [Billing Portal](https://docs.stripe.com/customer-management) session so
  customers can manage or cancel their own plan.

## License

MIT
