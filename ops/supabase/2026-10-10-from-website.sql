-- Tag the orders that came from the website (Vaidik, 2026-10-10: "when orders
-- from the site come, it should be automatically tagged in the OPS").
--
-- A website order is a paid /shop order, written by fulfilSession with a
-- stripe_session_id. The insert trigger tags it, so it holds whichever build
-- of the public site is live and no person has to remember to. Custom-cake
-- enquiries from /order (relayed over WhatsApp) are deliberately NOT tagged:
-- a staff toggle and an automatic enquiry-matching table were both proposed
-- the same day and declined.

alter table public.orders
  add column if not exists from_website boolean not null default false;

comment on column public.orders.from_website is
  'Bought and paid for on the website shop. Set by set_order_defaults whenever stripe_session_id is present; never typed by staff.';

update public.orders set from_website = true where stripe_session_id is not null;

create or replace function public.set_order_defaults()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  if new.order_no is null then
    if new.store = 'harris-park' then
      new.order_no := 'HP-' || lpad(nextval('order_no_harris_park')::text, 4, '0');
    else
      new.order_no := 'RV-' || lpad(nextval('order_no_riverstone')::text, 4, '0');
    end if;
  end if;

  -- A walk-in is a cake bought off the shelf: it is already in the customer's
  -- hands, so it counts toward sales but must never reach the baker's queue.
  if new.walk_in then
    new.status       := 'picked_up';
    new.picked_up_at := coalesce(new.picked_up_at, now());
  end if;

  -- A Stripe-paid order can only have come from the website shop.
  if new.stripe_session_id is not null then
    new.from_website := true;
  end if;

  return new;
end;
$function$;

-- The baker may only change status; from_website joins the list of columns
-- that guard refuses to let him touch.
create or replace function public.guard_order_updates()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  r text;
begin
  if auth.uid() is null then
    return new;
  end if;

  r := my_role();
  if r = 'admin' then
    return new;
  end if;

  if r = 'baker' then
    if new.store          is distinct from old.store
    or new.order_no       is distinct from old.order_no
    or new.kind           is distinct from old.kind
    or new.walk_in        is distinct from old.walk_in
    or new.from_website   is distinct from old.from_website
    or new.customer_name  is distinct from old.customer_name
    or new.customer_phone is distinct from old.customer_phone
    or new.flavour        is distinct from old.flavour
    or new.size           is distinct from old.size
    or new.wording        is distinct from old.wording
    or new.design_notes   is distinct from old.design_notes
    or new.photo_path     is distinct from old.photo_path
    or new.photo_paths    is distinct from old.photo_paths
    or new.notes          is distinct from old.notes
    or new.due_at         is distinct from old.due_at
    or new.ordered_at     is distinct from old.ordered_at
    or new.price          is distinct from old.price
    or new.discount       is distinct from old.discount
    or new.deposit        is distinct from old.deposit
    or new.created_at     is distinct from old.created_at
    or new.created_by     is distinct from old.created_by
    then
      raise exception 'baker may only change order status';
    end if;

    if new.status not in ('placed','baked') then
      raise exception 'baker may only mark an order placed or baked';
    end if;
    return new;
  end if;

  if r = 'staff' then
    if new.store      is distinct from old.store
    or new.order_no   is distinct from old.order_no
    or new.created_at is distinct from old.created_at
    or new.created_by is distinct from old.created_by
    then
      raise exception 'staff may not change store, order number or author';
    end if;

    if new.status not in ('placed','arrived','picked_up','cancelled') then
      raise exception 'staff may not mark an order baked';
    end if;
    return new;
  end if;

  raise exception 'not permitted';
end;
$function$;
