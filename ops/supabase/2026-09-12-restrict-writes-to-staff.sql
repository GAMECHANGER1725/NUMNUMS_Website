-- Applied 2026-09-12 against stnmoxsojqbbtgjwkzrc.
--
-- Public signups are ENABLED on this project (verified by probing the signup
-- endpoint: it validated the password rather than refusing the signup), and the
-- publishable key is committed to a public repo. So `to authenticated` grants
-- reach anyone with an email address, not just the 7 staff.
--
-- Both policies below were written when "authenticated" still meant "staff".
-- `my_role()` returns null for an account with no profiles row, which is every
-- customer, and non-null for all staff.
--
-- Checked and found SAFE without changes, because they already test a role:
--   orders_*, order_costs_admin, order_events_admin_read, deleted_orders_admin_read,
--   print_jobs_*, profiles_*, invoices_* (storage)
-- cake_photos_read/update/delete are reachable only via `owner = auth.uid()` or
-- an EXISTS over `orders`, which RLS already scopes to nothing for a customer.

-- Any authenticated user could upload arbitrary files into the cake-photos bucket.
drop policy if exists cake_photos_insert on storage.objects;
create policy cake_photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cake-photos' and my_role() is not null);

-- Any authenticated user could write rows into the staff audit log.
drop policy if exists auth_events_insert_self on public.auth_events;
create policy auth_events_insert_self on public.auth_events
  for insert to authenticated
  with check (user_id = auth.uid() and my_role() is not null);
