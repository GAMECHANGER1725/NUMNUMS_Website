-- ============================================================================
-- RLS verification — run this after ANY policy change, and after enabling
-- public signup.
--
-- Paste into the Supabase SQL editor and run the whole file. Every section is
-- wrapped in a transaction that ROLLS BACK, so it writes nothing.
--
-- Why it exists: the UI proves nothing. Anyone holding the publishable key can
-- call PostgREST directly, so the only honest test is to ask the database what
-- a customer can see and do. This reproduces exactly what PostgREST does —
-- `set role authenticated` plus the JWT claims — using a customer-shaped uuid
-- with no `profiles` row.
--
-- TWO TRAPS this file exists to avoid, both of which produced false passes on
-- the way to writing it:
--
--   1. A type or NOT NULL error in FRONT of the policy. The first `orders`
--      insert attempt failed on an invalid store enum and the second on a
--      column that does not exist — neither ever reached RLS, and both looked
--      like a refusal. Every insert below supplies every NOT NULL column with
--      a valid value so the POLICY is the thing being tested.
--   2. Testing as the uploader. A storage policy that matches `owner =
--      auth.uid()` looks perfect to whoever uploaded the file and is broken for
--      everyone else. Run section 4 as a SECOND user.
--
-- Last run: 2026-09-21 — sections 1, 2, 3 and 5 passed. Section 4 confirmed by
-- reading the policies, NOT by a live upload: `cake_photos_insert` is
-- `my_role() IS NOT NULL`, and a customer has no profiles row. The live
-- second-user curl is still outstanding.
--
-- ⚠️ When reading policies, select `qual` and `with_check` as SEPARATE columns.
-- `coalesce(with_check, qual)` shows WITH CHECK where one exists and HIDES the
-- USING clause — on `cake_photos_update` that renders as a bare
-- `bucket_id = 'cake-photos'` with no owner check, which looks like a wide-open
-- policy and is not one. That misread has now happened twice.
-- ============================================================================

-- ── 1. READS ─ a customer must see nothing, anywhere ────────────────────────
begin;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"11111111-2222-4333-8444-555555555555","role":"authenticated","email":"probe@nobody.test"}';

select 'orders' as t, count(*) as visible from public.orders
union all select 'coupons',            count(*) from public.coupons
union all select 'marketing_contacts', count(*) from public.marketing_contacts
union all select 'profiles',           count(*) from public.profiles
union all select 'order_costs',        count(*) from public.order_costs
union all select 'order_events',       count(*) from public.order_events
union all select 'deleted_orders',     count(*) from public.deleted_orders
union all select 'print_jobs',         count(*) from public.print_jobs
union all select 'customers',          count(*) from public.customers
union all select 'auth_events',        count(*) from public.auth_events
order by 1;
-- EXPECT: visible = 0 on every row. Anything else is a breach.
rollback;


-- ── 2. WRITES ─ a customer must not be able to write anything ───────────────
begin;
create temp table probe(t text, outcome text) on commit drop;
grant insert, select on probe to authenticated;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"11111111-2222-4333-8444-555555555555","role":"authenticated","email":"probe@nobody.test"}';

do $$
declare msg text; n int;
begin
  -- Every NOT NULL column supplied with a valid value — see trap 1 above.
  begin
    insert into public.orders (order_no, store, kind, customer_name, due_at, created_by)
    values ('RLS-PROBE-1','harris-park','normal','RLS Probe', now() + interval '3 days',
            '11111111-2222-4333-8444-555555555555');
    insert into probe values ('orders INSERT','*** ACCEPTED — BREACH ***');
  exception when others then get stacked diagnostics msg = message_text;
    insert into probe values ('orders INSERT','refused: ' || left(msg,60));
  end;

  begin
    insert into public.coupons (code, email, percent) values ('RLSPROBE','probe@nobody.test',99);
    insert into probe values ('coupons INSERT (mint a discount)','*** ACCEPTED — BREACH ***');
  exception when others then get stacked diagnostics msg = message_text;
    insert into probe values ('coupons INSERT (mint a discount)','refused: ' || left(msg,60));
  end;

  begin
    insert into public.marketing_contacts (email) values ('probe@nobody.test');
    insert into probe values ('marketing_contacts INSERT','*** ACCEPTED — BREACH ***');
  exception when others then get stacked diagnostics msg = message_text;
    insert into probe values ('marketing_contacts INSERT','refused: ' || left(msg,60));
  end;

  begin
    insert into public.profiles (id, role)
    values ('11111111-2222-4333-8444-555555555555','admin');
    insert into probe values ('profiles INSERT (self-promote to admin)','*** ACCEPTED — BREACH ***');
  exception when others then get stacked diagnostics msg = message_text;
    insert into probe values ('profiles INSERT (self-promote to admin)','refused: ' || left(msg,60));
  end;

  update public.orders set price = 0.01;
  get diagnostics n = row_count;
  insert into probe values ('orders UPDATE',
    n || ' row(s)' || case when n > 0 then ' *** BREACH ***' else ' (nothing visible)' end);

  delete from public.orders;
  get diagnostics n = row_count;
  insert into probe values ('orders DELETE',
    n || ' row(s)' || case when n > 0 then ' *** BREACH ***' else ' (nothing visible)' end);
end $$;

select * from probe order by t;
-- EXPECT: every row says "refused" or "(nothing visible)".
rollback;


-- ── 3. COUPONS ─ the one table a customer may read, scoped to their email ───
-- If this is scoped by anything weaker, a customer can enumerate every
-- discount code on the system.
begin;
create temp table probe(t text, outcome text) on commit drop;
grant insert, select on probe to authenticated;

insert into public.coupons (code, email, percent)
values ('OWN-ONE','alice@example.org',10), ('OTHER-ONE','bob@example.org',10);

set local role authenticated;

set local request.jwt.claims =
  '{"sub":"11111111-2222-4333-8444-555555555555","role":"authenticated","email":"alice@example.org"}';
insert into probe select 'as alice (owner)',
  coalesce(string_agg(code,', '),'NOTHING VISIBLE') from public.coupons;

set local request.jwt.claims =
  '{"sub":"11111111-2222-4333-8444-555555555555","role":"authenticated","email":"mallory@example.org"}';
insert into probe select 'as mallory (nobody)',
  coalesce(string_agg(code,', '),'NOTHING VISIBLE') from public.coupons;

-- The policy lowercases both sides; a case-sensitive match would hand a
-- customer their own coupon only when the casing happened to agree.
set local request.jwt.claims =
  '{"sub":"11111111-2222-4333-8444-555555555555","role":"authenticated","email":"ALICE@Example.ORG"}';
insert into probe select 'as ALICE@Example.ORG (case)',
  coalesce(string_agg(code,', '),'NOTHING VISIBLE') from public.coupons;

select * from probe order by t;
-- EXPECT: alice -> OWN-ONE only.  mallory -> NOTHING VISIBLE.  case -> OWN-ONE.
rollback;


-- ── 4. STORAGE ─ must be run as a SECOND user, with a VALID mime type ───────
-- Not expressible in SQL: the upload has to go through the storage API.
--
--   curl -X POST "$SUPABASE_URL/storage/v1/object/cake-photos/probe.jpg" \
--     -H "apikey: $ANON_KEY" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
--     -H "content-type: image/jpeg" --data-binary @probe.jpg
--
-- EXPECT: refused. An INVALID mime type is rejected by a content-type check in
-- front of the policy, which is a FALSE PASS — always probe with image/jpeg.
--
-- The policy to confirm is cake_photos_insert:
--     with check (bucket_id = 'cake-photos' and my_role() is not null)
-- my_role() reads the caller's profiles row, so a customer (who has none)
-- returns null and is refused.
select policyname, cmd, coalesce(with_check, qual) as expression
from pg_policies
where schemaname='storage' and tablename='objects' and policyname like 'cake_photos%'
order by cmd;


-- ── 5. VIEWS ─ a view that is not security_invoker BYPASSES RLS ─────────────
-- public.customers reads orders. If it ever stops being security_invoker it
-- runs as its owner and hands the whole customer directory to anyone.
select c.relname,
       coalesce((select option_value from pg_options_to_table(c.reloptions)
                  where option_name='security_invoker'), 'NOT SET — DANGER') as security_invoker
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='v';
-- EXPECT: security_invoker = true.
