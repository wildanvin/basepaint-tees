# BasePaint Tees

BasePaint Tees turns the currently mintable BasePaint artwork into one daily collectible T-shirt.

The app fetches the current BasePaint artwork, generates fixed print assets, syncs one daily product, accepts direct ETH payment on Base, and creates Printify fulfillment orders.

## Current Stack

- Next.js App Router
- Supabase Postgres, Storage, Auth, and RLS
- Supabase SIWE auth for accounts/admin
- Wagmi + Viem for wallet connection and Base payments
- Alchemy for ETH price data and payment detection
- Printify for product/order fulfillment
- Sharp for print asset generation

## Product Flow

1. Admin runs daily sync.
2. App fetches the current BasePaint day, theme, palette, and art.
3. App selects a shirt color and generates front/back print files.
4. App syncs a Printify product for that BasePaint day.
5. Customer selects size and enters shipping details.
6. App quotes shipping and calculates the ETH total.
7. Customer signs in with Ethereum and sends the exact ETH amount on Base.
8. App detects the payment by polling Alchemy or receiving an Alchemy webhook.
9. App creates a Printify order.
10. Admin can send draft orders to production when ready.

## Local Setup

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`. If port `3000` is already in use, Next will pick another port.

Run checks:

```bash
npm run lint
npm run build
```

## Environment Variables

Create `.env.local` with the values below.

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ALCHEMY_API_KEY=
ALCHEMY_WEBHOOK_SIGNING_KEY=
PAYMENT_RECEIVER_ADDRESS=
PAYMENT_EXPIRATION_MINUTES=30

PRINTIFY_API_TOKEN=
PRINTIFY_SHOP_ID=
PRINTIFY_BLUEPRINT_ID=
PRINTIFY_PRINT_PROVIDER_ID=
PRINTIFY_SHIPPING_METHOD=1

FULFILLMENT_MODE=printify_draft
AGENT_SECRET=

# Optional: force a specific BasePaint day while testing.
BASEPAINT_DAY=
```

Never expose server secrets in client code:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ALCHEMY_API_KEY`
- `ALCHEMY_WEBHOOK_SIGNING_KEY`
- `PRINTIFY_API_TOKEN`
- `AGENT_SECRET`

## Supabase

Required public buckets:

- `basepaint-art`
- `print-files`
- `mockups`

The buckets need public object URLs because Printify must fetch print files and the storefront must render mockups.

Schema/reference files:

- `db-schema.md`
- `supabase-blockchain-payments.sql`
- `supabase-siwe-auth.sql`
- `supabase-production-rls.sql`

Production RLS expectations:

- `daily_products`: public can read active products.
- `orders`: authenticated users can read only their own orders.
- `user_profiles`: users can read/update their own wallet profile.
- `admin_roles`: users can read only their own admin role.
- `agent_runs` and `payment_events`: server-only, no public policies.
- Storage buckets are public for direct object access, but broad object listing policies should stay removed.

## Printify

Printify is used for product sync, shipping quotes, and fulfillment order creation.

Useful env vars:

- `PRINTIFY_SHOP_ID`: your Printify shop id.
- `PRINTIFY_BLUEPRINT_ID`: selected shirt blueprint.
- `PRINTIFY_PRINT_PROVIDER_ID`: selected provider for that blueprint.
- `PRINTIFY_SHIPPING_METHOD`: defaults to `1`.

The daily sync should create or update one Printify product per BasePaint day. Orders reuse the synced product instead of creating a new product for every purchase.

Fulfillment modes:

- `mock`: no Printify call; useful for early local testing.
- `printify_draft`: create Printify draft orders.
- `printify_live`: send orders to production. Use only when production payment and fulfillment are ready.

## Base Payments

Payments are direct ETH transfers on Base to `PAYMENT_RECEIVER_ADDRESS`.

The app creates a quote with:

- exact wei amount
- payment reference
- expiration timestamp
- expected receiver
- shipping and product total

Payment detection can happen two ways:

- Manual/admin polling via `/api/payments/poll`.
- Alchemy Address Activity webhook via `/api/alchemy/webhook`.

The Alchemy webhook should track `PAYMENT_RECEIVER_ADDRESS` on Base mainnet.

## Admin

The admin dashboard is at:

```text
/admin
```

It is protected with Supabase SIWE auth and `admin_roles`.

To make a wallet admin, insert its authenticated `auth.users.id` into `public.admin_roles`.

The admin page can:

- run daily product sync
- poll recent payments
- inspect recent orders
- send eligible Printify draft orders to production

## Daily Sync

The daily sync route is:

```text
POST /api/agent/run
Authorization: Bearer ${AGENT_SECRET}
```

This route should be called manually from admin during development. In production, wire it to Vercel Cron after the manual flow is stable.

## Public Pages

- `/`: active daily tee
- `/success`: post-wallet-transfer waiting page
- `/order/[reference]`: order status tracking
- `/account`: SIWE account and linked orders

## Design Notes

The UI intentionally references BasePaint without cloning it:

- dark shell
- pixel/mono typography
- Base blue accents
- daily mint/order countdown
- art-first product gallery

The product carousel defaults to the back design because that is the main sellable artwork view.

## Production Checklist

- Confirm all env vars are set in Vercel.
- Confirm Supabase RLS policies are enabled.
- Confirm storage buckets are public but not broadly listable.
- Confirm `FULFILLMENT_MODE` is correct.
- Confirm Printify product/order creation works with a real address.
- Configure Alchemy webhook for Base address activity.
- Test `/api/payments/poll` after a small Base transfer.
- Run `npm run lint` and `npm run build`.
- Keep `/admin` unlinked publicly and protected by SIWE admin role.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```
