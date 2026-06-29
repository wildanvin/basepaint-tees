alter table public.orders
  alter column stripe_session_id drop not null;

alter table public.orders
  add column if not exists payment_reference text unique,
  add column if not exists payment_method text,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists chain_id integer,
  add column if not exists receiver_address text,
  add column if not exists expected_amount_wei text,
  add column if not exists display_amount_eth text,
  add column if not exists eth_usd_price text,
  add column if not exists received_amount_wei text,
  add column if not exists payer_address text,
  add column if not exists payment_tx_hash text unique,
  add column if not exists paid_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists fulfillment_error text;

create index if not exists orders_pending_payment_match_idx
  on public.orders (receiver_address, expected_amount_wei, payment_status, expires_at);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  tx_hash text not null unique,
  from_address text,
  to_address text,
  amount_wei text,
  matched_order_id uuid references public.orders(id),
  source text not null,
  raw_payload jsonb,
  created_at timestamptz default now()
);
