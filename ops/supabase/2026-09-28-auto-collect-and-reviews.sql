-- Every cake counts as collected once its pickup day has passed, and the
-- collected ones feed a list of numbers to ask for a Google review.
--
-- Nobody used Overdue as a worklist. It was a pile of cakes that had gone out
-- the door and needed tapping "picked up" so they would stop looking late —
-- work that only existed to keep the screen honest. Vaidik's call, 2026-09-28:
-- assume every cake past its pickup day was collected, and let the database
-- say so, so every figure (paid in full, money owing, the week ahead) agrees
-- without a single display rule to keep in step.

-- ── 1. the review ledger ────────────────────────────────────────────────────
-- Stamped when the number is handed over to be asked. Without it the list is
-- every cake ever sold, and remembering where you left off is exactly the job
-- Overdue was quietly doing.
alter table public.orders add column if not exists review_asked_at timestamptz;

-- Not an edit to the order, so it must not file a row on the Edits page every
-- time a batch of numbers is sent.
create or replace function public.log_order_event()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  -- Columns the status trigger owns, plus the ones that cannot change. Logging
  -- these as edits would file a second row for every status change.
  skip text[] := array['id','order_no','created_at','created_by','phone_key',
                       'status','baked_at','arrived_at','picked_up_at','cancelled_at',
                       'review_asked_at'];
  changed jsonb := '{}'::jsonb;
  k text;
begin
  if tg_op = 'INSERT' then
    insert into order_events (order_id, actor, kind, detail)
    values (new.id, new.created_by, 'created',
            jsonb_build_object('store', new.store, 'kind', new.kind, 'status', new.status));
    return null;
  end if;

  if new.status is distinct from old.status then
    insert into order_events (order_id, actor, kind, detail)
    values (new.id, auth.uid(), 'status',
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;

  for k in select jsonb_object_keys(to_jsonb(new)) loop
    if k = any(skip) then continue; end if;
    if to_jsonb(new) -> k is distinct from to_jsonb(old) -> k then
      changed := changed || jsonb_build_object(
        k, jsonb_build_object('from', to_jsonb(old) -> k, 'to', to_jsonb(new) -> k));
    end if;
  end loop;

  if changed <> '{}'::jsonb then
    insert into order_events (order_id, actor, kind, detail)
    values (new.id, auth.uid(), 'edit', changed);
  end if;

  return null;
end;
$function$;

-- Everything already collected went through the old routine (numbers copied
-- off Overdue, then marked picked up), so it has been asked. Without this the
-- first visit would hand Dad the whole history.
update public.orders set review_asked_at = coalesce(picked_up_at, now())
where status = 'picked_up' and review_asked_at is null;

-- ── 2. auto-collect ─────────────────────────────────────────────────────────
-- Hourly, not nightly: a missed run heals itself an hour later. The rule is a
-- Sydney calendar day, so the hour it runs at never matters.
--
-- picked_up_at is set to the pickup time — the best guess there is. Left null,
-- stamp_order_status() would write the moment the job ran, 12:05am.
--
-- A print job on a collected cake went out with it, so it is closed too, or it
-- would sit at the top of the print board as late forever.
--
-- Inline rather than a function on purpose: a security-definer function in
-- `public` is callable over PostgREST by anyone with the publishable key.
-- The Data page's "past pickup and still open" panel is this job's watchdog.
select cron.unschedule('collect-past-orders')
where exists (select 1 from cron.job where jobname = 'collect-past-orders');

select cron.schedule('collect-past-orders', '5 * * * *', $job$
  update public.orders set status = 'picked_up', picked_up_at = due_at
  where status in ('placed', 'baked', 'arrived')
    and (due_at at time zone 'Australia/Sydney')::date
      < (now() at time zone 'Australia/Sydney')::date;

  update public.print_jobs j set status = 'printed', printed_at = now()
  from public.orders o
  where o.id = j.order_id and j.status <> 'printed' and o.status = 'picked_up'
    and (o.due_at at time zone 'Australia/Sydney')::date
      < (now() at time zone 'Australia/Sydney')::date;
$job$);
