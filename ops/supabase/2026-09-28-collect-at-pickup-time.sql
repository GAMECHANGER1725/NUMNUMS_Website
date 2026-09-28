-- A cake is collected once its pickup TIME has passed, not the day after
-- (Vaidik, 2026-09-28 — supersedes the day rule in
-- 2026-09-28-auto-collect-and-reviews.sql, whose backfill must not be re-run).
--
-- Still hourly, on Vaidik's call: a cake due at 2:30pm reads as collected from
-- the 3:05pm run.

select cron.schedule('collect-past-orders', '5 * * * *', $job$
  update public.orders set status = 'picked_up', picked_up_at = due_at
  where status in ('placed', 'baked', 'arrived') and due_at < now();

  update public.print_jobs j set status = 'printed', printed_at = now()
  from public.orders o
  where o.id = j.order_id and j.status <> 'printed'
    and o.status = 'picked_up' and o.due_at < now();
$job$);
