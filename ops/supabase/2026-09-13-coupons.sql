-- Coupons for the web shop.
--
-- Written only by the Stripe webhook under the service-role key. The one thing
-- a customer may do is READ their own, so checkout can list what they have
-- instead of making them go and find a code in an email.
--
-- The read policy matches on the email in their own JWT, not on a user_id, for
-- the same reason the code is bound to an email: a code that has been forwarded
-- to a friend must not work for the friend, and a customer who signed up with
-- Google and one who signed up with a password are the same person here.

create table if not exists public.coupons (
  code             text primary key,
  email            text not null,
  percent          smallint not null check (percent between 1 and 100),
  issued_for_order uuid unique references public.orders (id) on delete set null,
  issued_at        timestamptz not null default now(),
  expires_at       timestamptz,
  redeemed_at      timestamptz,
  redeemed_order   uuid unique references public.orders (id) on delete set null
);

create index if not exists coupons_email_idx on public.coupons (lower(email));

alter table public.coupons enable row level security;

-- No insert/update/delete policy at all: service role bypasses RLS, everyone
-- else is refused. Adding a customer write policy would let anyone mint 100%.
drop policy if exists coupons_read_own on public.coupons;
create policy coupons_read_own on public.coupons for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));
