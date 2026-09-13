import Link from "next/link";
import { Star } from "lucide-react";
import { ShopHeader } from "@/components/ui/shop-header";
import { SELLABLE_FLAVOURS, listPriceCents, flavourSlug, urlSlug } from "@/lib/catalog";
import { money } from "@/lib/cart";

export const metadata = {
  title: "Order an eggless cake online | Num Num's Bakery",
  description:
    "Pick from 15 eggless cake flavours, choose your size, and collect from Harris Park or Riverstone in 48 hours.",
};

/**
 * Display order, taken from the order book on 2026-09-13 (32 orders).
 * Chocolate was 41% of everything sold; the old form defaulted to Vanilla, which
 * was 9%. This only decides what people see first — every flavour is on the
 * board, and a wrong guess costs nothing but a scroll.
 */
const BY_POPULARITY = [
  "Chocolate", "Butterscotch", "Pineapple", "Vanilla", "Rasmalai", "Black Forest",
  "Cookies & Cream", "White Forest", "Mango", "Strawberry",
  "Red Velvet", "Lychee", "Tiramisu", "Blueberry", "Ferrero Rocher",
];
const flavours = [...SELLABLE_FLAVOURS].sort(
  (a, b) => BY_POPULARITY.indexOf(a.name) - BY_POPULARITY.indexOf(b.name),
);

export default function ShopPage() {
  return (
    <>
      <ShopHeader />
      <main className="mx-auto w-full max-w-[72rem] px-4 pb-20 pt-8 sm:px-6">
        <header>
          <p className="section-label">100% eggless · ready in 48 hours</p>
          <h1 className="font-display mt-2 text-[2.6rem] font-light leading-[1.05] tracking-tight sm:text-[3.4rem]">
            Pick your cake
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.84rem] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex text-[#E3B664]" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </span>
              <b className="font-semibold text-foreground">4.6</b> · 50+ Google reviews
            </span>
            <span aria-hidden className="hidden text-border sm:inline">|</span>
            <span>Collect from Harris Park or Riverstone</span>
          </div>
        </header>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {flavours.map((f) => (
            <li key={f.name}>
              <Link href={`/cakes/${urlSlug(f.name)}`} className="cake-card block">
                <span className="relative block aspect-square overflow-hidden bg-secondary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/shop/cakes/${flavourSlug(f.name)}.webp`}
                    alt={`${f.name} eggless cake`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  {f.premium && <span className="badge-premium absolute left-2 top-2">Premium</span>}
                </span>
                <span className="block px-3 py-2.5">
                  <span className="block text-[0.86rem] font-medium leading-tight">{f.name}</span>
                  <span className="block text-[0.74rem] text-muted-foreground">
                    from {money(listPriceCents("6 inch", f.name) ?? 0)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-12 grid gap-4 border-t border-border pt-8 sm:grid-cols-3">
          {[
            ["100% eggless", "Every cake we make, without exception. It is the whole reason the bakery exists."],
            ["48 hours' notice", "Each cake is made to order, so we need two days. Weekends book out first."],
            ["Collect in store", "Harris Park or Riverstone. We text you the moment it's ready."],
          ].map(([h, p]) => (
            <div key={h}>
              <h2 className="text-[0.92rem] font-semibold">{h}</h2>
              <p className="mt-1 text-[0.84rem] leading-relaxed text-muted-foreground">{p}</p>
            </div>
          ))}
        </section>

        <p className="mt-10 rounded-xl border border-border bg-secondary/50 p-4 text-[0.86rem] leading-relaxed text-muted-foreground">
          <b className="font-semibold text-foreground">Want something made to your own design?</b>{" "}
          Tiered cakes, photo prints and 3D toppers are quoted individually —{" "}
          <a href="/order" className="font-semibold text-[#C85478] underline-offset-2 hover:underline">
            tell us what you have in mind
          </a>
          .
        </p>
      </main>
    </>
  );
}
