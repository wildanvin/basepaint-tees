-- Production RLS hardening applied via Supabase MCP.
-- payment_events stores raw blockchain webhook/poll data and should only be
-- accessed by server-side code using the service role.

alter table public.payment_events enable row level security;

-- Intentionally no anon/authenticated policies for payment_events.

-- Public Supabase Storage buckets can serve direct public object URLs without
-- broad SELECT policies on storage.objects. Dropping these prevents clients
-- from listing every object in each public bucket.
drop policy if exists "Public can read BasePaint art" on storage.objects;
drop policy if exists "Public can read mockups" on storage.objects;
drop policy if exists "Public can read print files" on storage.objects;
