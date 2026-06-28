-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.daily_products (
id uuid NOT NULL DEFAULT gen_random_uuid(),
basepaint_day integer NOT NULL UNIQUE,
theme text,
art_url text NOT NULL,
art_storage_path text,
palette_json jsonb,
palette_color text,
shirt_color text NOT NULL,
front_print_url text NOT NULL,
back_print_url text NOT NULL,
mockup_front_url text,
mockup_back_url text,
price_cents integer NOT NULL,
currency text NOT NULL DEFAULT 'usd'::text,
status text NOT NULL DEFAULT 'active'::text,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT daily_products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.printful_variants (
id uuid NOT NULL DEFAULT gen_random_uuid(),
shirt_model text NOT NULL,
color_name text NOT NULL,
size text NOT NULL,
catalog_variant_id integer NOT NULL,
CONSTRAINT printful_variants_pkey PRIMARY KEY (id)
);
CREATE TABLE public.orders (
id uuid NOT NULL DEFAULT gen_random_uuid(),
daily_product_id uuid,
stripe_session_id text NOT NULL UNIQUE,
stripe_payment_intent_id text,
printful_order_id text,
customer_email text,
customer_name text,
shipping_json jsonb,
size text NOT NULL,
status text NOT NULL DEFAULT 'paid'::text,
fulfillment_mode text NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT orders_pkey PRIMARY KEY (id),
CONSTRAINT orders_daily_product_id_fkey FOREIGN KEY (daily_product_id) REFERENCES public.daily_products(id)
);
CREATE TABLE public.agent_runs (
id uuid NOT NULL DEFAULT gen_random_uuid(),
basepaint_day integer,
status text NOT NULL,
message text,
logs jsonb,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT agent_runs_pkey PRIMARY KEY (id)
);
