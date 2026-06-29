# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Project: BasePaint Tees

BasePaint Tees is a minimal print-on-demand commerce app that turns the currently mintable BasePaint artwork into one daily collectible T-shirt.

BasePaint link: Link: https://basepaint.xyz/

The app should feel like an extension of the BasePaint experience: simple, daily, art-first, and tied to the current mint lifecycle.

This is **not** an AI fashion remix project. The artwork already exists and should not be altered creatively. The agent acts as a daily business operator: fetch art, generate fixed print files, publish one product, manage pricing, and fulfill orders, but maybe for we dont need an agent at this stage.

## Current Implementation Update

The original MVP notes below mention Stripe and Printful. The current app has changed:

- Payments use direct ETH transfers on Base, detected through Alchemy.
- Fulfillment uses Printify, not Printful.
- Checkout calculates Printify shipping before creating the Base payment quote.
- Mockups are generated and stored by the app/Supabase flow; Printify is used for fulfillment orders.
- `FULFILLMENT_MODE` currently supports `mock`, `printify_draft`, and `printify_live`.

---

## Core MVP Goal

Every day, the system should:

1. Detect the current mintable BasePaint artwork.
2. Fetch the artwork image, day number, theme, and palette.
3. Pick one shirt color from the palette.
4. Generate fixed front and back print files.
5. Generate mockup images showing the shirt.
6. Store art, print files, mockups, and metadata in Supabase.
7. Publish exactly one product for that day.
8. Let customers buy without creating an account.
9. Use Stripe Checkout for payment and shipping details.
10. After successful payment, create a Printful order.
11. In development/demo mode, simulate fulfillment or create draft-only Printful orders.

---

## Product Rule

There is only one active product at a time:

> The T-shirt for the BasePaint artwork that is currently mintable.

Once BasePaint moves to the next mintable artwork, the daily agent (cron job) should create the next product.

Future idea, not required for MVP:

- Discount while minting is open.
- Higher price after minting ends.

For the first MVP, one daily product and one price is enough.

---

## Shirt Design

Do not modify, remix, stylize, or reinterpret the BasePaint artwork.

The design is fixed.

### Front

Small text on the top-right chest area:

```text
BasePaint #1024
Theme Name
```

Use the real BasePaint day number.

### Back

At the top:

```text
BasePaint #1024
Theme Name
```

Below the text:

- The BasePaint artwork.
- As large as possible within Printful's printable back area.
- Preserve the artwork aspect ratio.
- Do not crop important parts unless unavoidable.

### Shirt color

The agent should select one color from the BasePaint palette and map it to the closest available Printful shirt color.

For MVP, keep a small allowed color list to avoid variant complexity:

- Black
- White
- Navy
- Dark Grey Heather
- Athletic Heather
- Red
- Royal
- Forest

If palette matching is uncertain, default to Black.

---

## Agent Role

The agent is a business operator, not a creative designer.

The agent should:

- Fetch BasePaint data.
- Decide the active daily product.
- Select the closest shirt color from the palette.
- Generate production-ready print files.
- Generate mockup images.
- Store assets in Supabase.
- Create or update the daily product record.
- Manage order fulfillment state.
- Avoid duplicate Printful orders.
- Produce basic operational status logs.

The agent should not:

- Redesign the artwork.
- Generate new artwork.
- Change the BasePaint image.
- Create multiple product concepts.
- Require user accounts.
- Build a shopping cart.

---

## Recommended Tech Stack

- Next.js App Router
- Vercel
- Supabase Postgres
- Supabase Storage
- Stripe Checkout
- Stripe Webhooks
- Printful API
- Optional: OpenAI/image model only for mockup generation or agent reasoning, not for altering artwork

---

## BasePaint Data

Preferred data sources to test:

```ts
const metadataUrl = `https://basepaint.xyz/api/art/${day}`
const imageUrl = `https://basepaint.xyz/api/art/image?day=${day}`
const fallbackPng = `https://basepaint.net/v3/${String(day).padStart(4, '0')}.png`
const animationUrl = `https://basepaint.net/animations/${String(day).padStart(4, '0')}.mp4`
```

Important caveat:

These endpoints appear usable from public/community tooling, but they should be treated as unofficial unless BasePaint publishes formal API docs. Code defensively and log failures clearly.

The agent needs:

- BasePaint day number
- Theme
- Artwork image URL or downloaded image
- Palette colors
- Minting status, if available

If the current mintable day cannot be discovered from a direct endpoint, inspect the BasePaint webpage or use the most recent completed art day as a fallback.

---

## App Pages

### `/`

Public product page for today's shirt.

Show:

- Product name: `BasePaint #1024 Tee`
- Theme
- Main mockup image
- Optional front/back mockups
- Size selector
- Price
- Buy button

No login.
No cart.
No account creation.

### `/success`

Post-payment confirmation page.

Show:

- Thank you message
- Order status
- Email note

### `/cancel`

Stripe Checkout cancellation page.

### `/admin`

Simple internal dashboard for hackathon/demo.

Show:

- Current daily product
- BasePaint day
- Theme
- Shirt color
- Print file URLs
- Mockup URLs
- Stripe status
- Fulfillment mode
- Recent orders

Authentication can be skipped for MVP if the route is not linked publicly, but use an environment-token guard if time allows.

---

## API Routes

### `POST /api/agent/run`

Runs the daily product generation flow.

Responsibilities:

1. Determine current mintable BasePaint day.
2. Fetch metadata and art.
3. Pick shirt color from palette.
4. Generate `front_print.png`.
5. Generate `back_print.png`.
6. Store print files in Supabase Storage.
7. Generate mockups.
8. Store mockups in Supabase Storage.
9. Upsert daily product in Supabase.

Should be idempotent by `basepaint_day`.

### `POST /api/checkout`

Creates a Stripe Checkout Session.

Input:

```ts
type CheckoutInput = {
  dailyProductId: string
  size: 'S' | 'M' | 'L' | 'XL' | '2XL'
}
```

Responsibilities:

1. Fetch active product from Supabase.
2. Validate selected size.
3. Create Stripe Checkout Session.
4. Put `daily_product_id` and `size` in Stripe metadata.
5. Ask Stripe Checkout to collect shipping address.
6. Redirect user to Stripe Checkout.

### `POST /api/stripe/webhook`

Receives Stripe webhook events.

Handle:

- `checkout.session.completed`

Responsibilities:

1. Verify Stripe webhook signature.
2. Read session metadata.
3. Check if an order already exists for `stripe_session_id`.
4. If it already exists, stop safely.
5. Insert order in Supabase.
6. Depending on `FULFILLMENT_MODE`, either:
   - simulate fulfillment
   - create Printful draft order
   - create and confirm Printful live order
7. Store `printful_order_id` or simulated fulfillment ID.
8. Update order status.

This route must be idempotent. Stripe may retry webhooks.

### `GET /api/health`

Optional simple health check.

---

## Supabase Schema

```sql
create table daily_products (
  id uuid primary key default gen_random_uuid(),
  basepaint_day int not null unique,
  theme text,
  art_url text not null,
  art_storage_path text,
  palette_json jsonb,
  palette_color text,
  shirt_color text not null,
  front_print_url text not null,
  back_print_url text not null,
  mockup_front_url text,
  mockup_back_url text,
  price_cents int not null,
  currency text not null default 'usd',
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table printful_variants (
  id uuid primary key default gen_random_uuid(),
  shirt_model text not null,
  color_name text not null,
  size text not null,
  catalog_variant_id int not null,
  unique (shirt_model, color_name, size)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  daily_product_id uuid references daily_products(id),
  stripe_session_id text unique not null,
  stripe_payment_intent_id text,
  printful_order_id text,
  customer_email text,
  customer_name text,
  shipping_json jsonb,
  size text not null,
  status text not null default 'paid',
  fulfillment_mode text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  basepaint_day int,
  status text not null,
  message text,
  logs jsonb,
  created_at timestamptz default now()
);
```

---

## Supabase Storage

Recommended buckets:

```text
basepaint-art
print-files
mockups
```

For hackathon/MVP, use public buckets so Printful can fetch files by URL.

Avoid signed URLs for Printful print files because signed URLs can expire before fulfillment.

---

## Print Files vs Mockups

Do not confuse these.

### Print files

Used by Printful to print the actual shirt.

Required:

- `front_print_url`
- `back_print_url`

These should be production-ready transparent PNG files.

### Mockups

Used by the website to show customers what the shirt should look like.

Required for demo:

- `mockup_front_url`
- `mockup_back_url`

Mockups are not used by Printful for fulfillment.

---

## Printful Integration

Use Printful as a fulfillment backend.

Do not create a permanent Printful product every day for the MVP.

Instead:

1. Keep one shirt model.
2. Store Printful `catalog_variant_id` values for allowed color/size combinations.
3. When a customer pays, create a Printful order using:
   - catalog variant ID
   - front print file URL
   - back print file URL
   - customer recipient data
   - shipping method

Conceptual Printful order payload:

```ts
const payload = {
  external_id: stripeSessionId,
  shipping: 'STANDARD',
  recipient: {
    name: customerName,
    address1: shippingAddress.line1,
    address2: shippingAddress.line2,
    city: shippingAddress.city,
    state_code: shippingAddress.state,
    country_code: shippingAddress.country,
    zip: shippingAddress.postal_code,
    email: customerEmail,
    phone: customerPhone ?? undefined,
  },
  order_items: [
    {
      source: 'catalog',
      catalog_variant_id: variantId,
      quantity: 1,
      name: `BasePaint #${basepaintDay} T-Shirt`,
      placements: [
        {
          placement: 'front',
          technique: 'dtg',
          print_area_type: 'simple',
          layers: [
            {
              type: 'file',
              url: frontPrintUrl,
            },
          ],
        },
        {
          placement: 'back',
          technique: 'dtg',
          print_area_type: 'simple',
          layers: [
            {
              type: 'file',
              url: backPrintUrl,
            },
          ],
        },
      ],
    },
  ],
}
```

After creating the order:

- In draft mode, stop there.
- In live mode, confirm the Printful order.

Never auto-confirm Printful orders while using Stripe test mode.

---

## Fulfillment Modes

Use an environment variable:

```env
FULFILLMENT_MODE=mock
```

Supported modes:

### `mock`

Use for local development and hackathon demos.

Behavior:

- Do not call Printful.
- Generate fake fulfillment ID.
- Store order as `simulated_fulfillment`.

### `printful_draft`

Use for integration testing.

Behavior:

- Create Printful draft order.
- Do not confirm order.
- Store Printful order ID.

### `printful_live`

Use only in production.

Behavior:

- Create Printful order.
- Confirm Printful order.
- Printful charges production/fulfillment cost.
- Printful prints and ships to customer.

Hard rule:

```text
Stripe test mode must never trigger Printful live confirmation.
```

---

## Stripe Integration

Use Stripe Checkout.

Do not build a custom payment form.

Checkout should collect:

- Email
- Payment
- Shipping address
- Customer name

The app collects only:

- Shirt size

Stripe Checkout Session metadata should include:

```ts
metadata: {
  daily_product_id: dailyProduct.id,
  basepaint_day: String(dailyProduct.basepaint_day),
  size,
}
```

The webhook creates the actual internal order.

Do not trust frontend success redirects as proof of payment.

---

## Order Idempotency

This is critical.

Stripe webhooks can retry. The same event may arrive more than once.

Rules:

1. `orders.stripe_session_id` must be unique.
2. Before creating a Printful order, check if the Stripe session was already processed.
3. If already processed, return success without doing anything.
4. Store all Printful order IDs.
5. If Printful creation fails, store status as `fulfillment_failed` and log the error.

Possible order statuses:

```text
paid
simulated_fulfillment
printful_draft_created
printful_confirmed
fulfillment_failed
cancelled
refunded
```

---

## Environment Variables

```env
NEXT_PUBLIC_SITE_URL=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

PRINTFUL_TOKEN=
PRINTFUL_STORE_ID=

FULFILLMENT_MODE=mock
AGENT_SECRET=
```

Never expose:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PRINTFUL_TOKEN`
- `AGENT_SECRET`

---

## Daily Agent Scheduling

For MVP, provide a manual button or route:

```text
POST /api/agent/run
```

For production, use a Vercel Cron Job to run daily.

The route should be protected with `AGENT_SECRET`.

Example request header:

```http
Authorization: Bearer ${AGENT_SECRET}
```

---

## Build Order

Implement in this order:

1. Blank Next.js app.
2. Supabase schema.
3. Hardcoded product page.
4. Stripe Checkout route.
5. Stripe webhook route.
6. Mock fulfillment mode.
7. Print file generation for one sample BasePaint day.
8. Supabase Storage upload.
9. Daily product generation route.
10. Printful draft order integration.
11. Mockup generation.
12. Admin dashboard.
13. Vercel deployment.
14. Optional Vercel Cron.

Do not start with Printful live fulfillment.

Thihs order can change

---

## MVP Demo Script

The hackathon demo should show:

1. Admin clicks `Run Daily Agent`.
2. Agent fetches current BasePaint art.
3. Agent picks shirt color from palette.
4. Agent generates fixed front/back print files.
5. Agent generates mockups.
6. Product page updates.
7. Customer selects size and pays with Stripe test card.
8. Stripe webhook creates order.
9. Fulfillment mode creates simulated order or Printful draft.
10. Dashboard shows the complete lifecycle.

Pitch:

> BasePaint creates one digital artwork every day. BasePaint Tees turns each mintable artwork into one physical collectible automatically, with a business agent that handles publishing, pricing, checkout, and fulfillment.

---

## Non-Goals for MVP

Do not build:

- User accounts
- Shopping cart
- Multiple products per day
- Multiple shirt models
- AI-generated art variants
- Artist revenue splits
- Onchain payment
- NFT ownership gating
- Complex admin roles
- Returns/refunds system
- Inventory management

These can come later.

---

## Future Features

After the MVP works:

- Discount while BasePaint minting is open.
- Higher price after minting ends.
- Full archive of past BasePaint shirts.
- Artist/contributor attribution.
- Revenue split simulation or real payouts.
- Onchain mint ownership discount.
- Better palette-to-shirt-color matching.
- Real Printful live fulfillment.
- Email order notifications.
- Social posts generated by the agent.
