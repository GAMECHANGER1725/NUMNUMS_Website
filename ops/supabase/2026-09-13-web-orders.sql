-- Web orders: what the Stripe webhook writes, and who agreed to hear from us.
--
-- A cart of three cakes becomes three `orders` rows sharing an `order_group_id`
-- and a `stripe_session_id`, differing by `cart_line` — one row per cake is how
-- the kitchen works, so listToBake(), the print board and kindTag need no
-- changes at all.
--
-- No row exists until Stripe confirms payment. There is no payment state in
-- `order_status` and adding one is a ~15-call-site diff plus the `customers`
-- view; the pending cart lives in the Stripe session instead, so an abandoned
-- checkout leaves nothing to clean up and no unpaid cake ever reaches a baker.

alter table public.orders add column if not exists customer_email    text;
alter table public.orders add column if not exists stripe_session_id text;
alter table public.orders add column if not exists order_group_id    uuid;
alter table public.orders add column if not exists cart_line         smallint;

-- Idempotency lives in Postgres, not in the webhook. A retried Stripe event
-- re-inserts the same (session, line) pairs, hits 23505, is caught, returns 200.
create unique index if not exists orders_session_line_key
  on public.orders (stripe_session_id, cart_line)
  where stripe_session_id is not null;
create index if not exists orders_group_idx on public.orders (order_group_id);

-- Written only by the webhook under the service-role key. RLS on with NO
-- policies means anyone holding the publishable key is refused — that is the
-- whole point, not an oversight.
create table if not exists public.marketing_contacts (
  email           text primary key,
  name            text,
  phone           text,
  user_id         uuid,
  email_opt_in    boolean not null default false,
  sms_opt_in      boolean not null default false,
  consent_at      timestamptz,
  consent_source  text,
  unsubscribed_at timestamptz,
  updated_at      timestamptz not null default now()
);
alter table public.marketing_contacts enable row level security;
