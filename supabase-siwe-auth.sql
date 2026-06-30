alter table public.orders
  add column if not exists user_id uuid references auth.users(id),
  add column if not exists auth_wallet_address text;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  wallet_address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);

create index if not exists orders_auth_wallet_address_idx
  on public.orders (auth_wallet_address);

alter table public.user_profiles enable row level security;
alter table public.admin_roles enable row level security;

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
  on public.user_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can upsert own profile" on public.user_profiles;
create policy "Users can upsert own profile"
  on public.user_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
  on public.user_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own admin role" on public.admin_roles;
create policy "Users can read own admin role"
  on public.admin_roles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

alter table public.orders enable row level security;

drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
  on public.orders
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
