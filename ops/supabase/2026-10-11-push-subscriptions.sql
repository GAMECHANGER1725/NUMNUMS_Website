-- Applied 2026-10-11 as migration `push_subscriptions`.
-- One row per (person, phone) that has turned on new-order notifications in ops.
-- The sender (public site, service role) picks the people who can see the
-- order's store via profiles.stores, and dedupes endpoints so a shared tablet
-- rings once.
create table public.push_subscriptions (
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);
alter table public.push_subscriptions enable row level security;
create policy push_own_select on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_own_insert on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy push_own_update on public.push_subscriptions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_own_delete on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
revoke all on public.push_subscriptions from anon;
