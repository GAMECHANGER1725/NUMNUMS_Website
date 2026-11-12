-- Phone assistant (phone-agent/), 2026-11-07.
--
-- phone_notes: what the voice agent hands to a person. A change request, a
-- custom-cake brief, or the end-of-call note that replaces voicemail. Written
-- only by netlify/functions/phone-agent.mjs with the service role; read by
-- admins only, because a note carries a caller's name and mobile.
--
-- phone_lookups: one row per order-status attempt, so the public phone line
-- cannot be used to walk the order book by guessing order numbers and names.
-- The rate limit counts these rows. No policy at all: service role only.

create table public.phone_notes (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  conversation_id text,
  kind            text not null check (kind in ('change', 'custom_cake', 'call')),
  priority        text not null default 'normal' check (priority in ('normal', 'urgent')),
  store           store_code,
  caller_name     text,
  caller_phone    text,
  caller_id       text,              -- the number the call came from (Twilio), not typed by the model
  order_no        text,
  summary         text,
  outcome         text check (outcome in ('resolved', 'callback_needed', 'transferred')),
  details         jsonb not null default '{}'::jsonb,
  handled_at      timestamptz
);
create index phone_notes_created_at on public.phone_notes (created_at desc);
create index phone_notes_conversation on public.phone_notes (conversation_id);
alter table public.phone_notes enable row level security;
create policy phone_notes_admin_read on public.phone_notes
  for select to authenticated using (public.is_admin());

create table public.phone_lookups (
  id              bigint generated always as identity primary key,
  at              timestamptz not null default now(),
  caller          text not null,     -- caller id, or the conversation id when there is none
  ok              boolean not null
);
create index phone_lookups_at on public.phone_lookups (at desc);
alter table public.phone_lookups enable row level security;
