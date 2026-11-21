-- Where a website customer heard about us (2026-11-21, from the AI-search work;
-- applied to the live project with Vaidik's yes).
--
-- An AI assistant that recommends us shows up in GA4 as a Google search,
-- because the customer reads the answer and then googles the name. Asking is
-- the only way to see it. Optional on the cart; written by fulfilSession from
-- the Stripe metadata key `h`. The allowed codes live in netlify/lib/shared.mjs
-- (HEARD_FROM); the check stops anything else reaching the table.

alter table public.orders
  add column if not exists heard_from text
  check (heard_from in ('google','maps','ai','instagram','facebook','friend','walk-by','ubereats','other'));

comment on column public.orders.heard_from is
  'Website shop only: the customer''s answer to "How did you hear about us?". Null = not asked or skipped.';
