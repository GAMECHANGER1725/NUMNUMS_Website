// Deletes cake photos once their retention window closes, then clears the
// order's photo_path and photo_paths. An order can carry several reference
// photos, so photos_to_purge returns one row per file, not per order. The
// order row and every number on it are kept forever — only the image goes.
//
// The rule itself lives in the database (public.photos_to_purge), not here, so
// there is one definition of "expired" rather than two that can drift.
//
// Deleting a row from storage.objects does not reliably free the underlying
// file, which is why this goes through the storage API instead of plain SQL.
//
// Scheduled daily. Safe to run repeatedly: it only ever acts on rows that are
// already past their window, so a double run is a no-op.

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: expired, error } = await supabase.rpc('photos_to_purge');
  if (error) {
    return Response.json({ ok: false, stage: 'select', error: error.message }, { status: 500 });
  }
  if (!expired?.length) {
    return Response.json({ ok: true, purged: 0 });
  }

  const paths = expired.map((r: { photo_path: string }) => r.photo_path);
  const { error: rmError } = await supabase.storage.from('cake-photos').remove(paths);
  if (rmError) {
    return Response.json({ ok: false, stage: 'storage', error: rmError.message }, { status: 500 });
  }

  // Only clear the columns after the files are actually gone. If this update
  // fails the next run simply retries; clearing first would orphan the files
  // with nothing left pointing at them.
  const { error: updError } = await supabase
    .from('orders')
    .update({ photo_path: null, photo_paths: [] })
    .in('id', [...new Set(expired.map((r: { id: string }) => r.id))]);
  if (updError) {
    return Response.json({ ok: false, stage: 'update', error: updError.message }, { status: 500 });
  }

  return Response.json({ ok: true, purged: paths.length });
});
