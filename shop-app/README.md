# shop-app

The customer shop — sign-up, cart, checkout. A **separate Next.js app** in this
repo, same pattern as `reviews-app/`.

- Static export (`output: "export"`) at `basePath: "/shop"`.
- Build output in `out/` is gitignored; the published copy lives in `shop/` at
  the repo root, mirroring how `reviews-app/` publishes to `review/`.
- The rest of the site stays static HTML. Only the transaction moves here, so
  `/cakes` and the blog keep their SEO.

## Commands

```bash
npm run dev     # http://localhost:3000/shop/sign-up  — the basePath matters
npm run build   # static export into out/
npm run lint
```

## Conventions

- **Brand tokens live in `app/globals.css`** as the exact hex values used across
  the static site, not oklch. `.btn-cta` is reproduced verbatim from
  `order.html` so the shop's primary action is the same object as the rest of
  the site.
- **Prices are never written down here.** `ops/catalog.mjs` is the single source
  and is build-gated against `verify-blog.mjs`'s `FACTS`. A price literal in
  this app is a bug.
- The Supabase key in `lib/supabase.ts` is the **publishable** key and is public
  by design — RLS is what guards the data. A service-role key must never appear
  in this app; server-side writes belong in a Netlify Function.
