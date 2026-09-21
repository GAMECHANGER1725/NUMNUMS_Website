import Link from "next/link";
import { Star } from "lucide-react";
import { ShopHeader } from "@/components/ui/shop-header";
import { SELLABLE_FLAVOURS, listPriceCents, flavourSlug, urlSlug } from "@/lib/catalog";
import { money } from "@/lib/cart";
import { cakeFraming } from "@/lib/cake-framing";
import { badgeFor, assertPickIsNotPremium } from "@/lib/badges";

export const metadata = {
  title: "Signature Cakes — order eggless cakes online | Num Num's Bakery",
  description:
    "Pick from 15 eggless cake flavours, choose your size, and collect from Harris Park or Riverstone tomorrow.",
};

/**
 * Popularity from the order book on 2026-09-13 (32 orders). Chocolate was 41%
 * of everything sold; the old form defaulted to Vanilla, which was 9%.
 */
const BY_POPULARITY = [
  "Chocolate", "Butterscotch", "Pineapple", "Vanilla", "Rasmalai", "Black Forest",
  "Cookies & Cream", "White Forest", "Mango", "Strawberry",
  "Red Velvet", "Lychee", "Tiramisu", "Blueberry", "Ferrero Rocher",
];

/**
 * The board is merchandised, not just sorted.
 *
 * The first row is what most people will ever look at, so it holds the three
 * most-ordered flavours **and both premiums**. Rasmalai and Ferrero Rocher are
 * the two highest-value cakes on the list and the two the chain bakeries cannot
 * sell, and Ferrero was buried at position 15 where nobody scrolls.
 *
 * The flavour carrying "Our pick" is pulled up behind them, because a
 * recommendation nobody sees recommends nothing.
 *
 * Everything after that is plain popularity order. Only the first eight or so
 * positions are worth arguing about; below that it decides nothing.
 */
const HERO = ["Chocolate", "Butterscotch", "Pineapple", "Rasmalai", "Ferrero Rocher"];

const rank = (name: string) => {
  const hero = HERO.indexOf(name);
  if (hero !== -1) return hero;
  if (badgeFor(name)?.kind === "ours") return HERO.length;
  return HERO.length + 1 + BY_POPULARITY.indexOf(name);
};

const flavours = [...SELLABLE_FLAVOURS].sort((a, b) => rank(a.name) - rank(b.name));

assertPickIsNotPremium(SELLABLE_FLAVOURS.filter((f) => f.premium).map((f) => f.name));

export default function ShopPage() {
  return (
    <>
      <ShopHeader />
      <main className="mx-auto w-full max-w-[72rem] px-4 pb-20 pt-8 sm:px-6">
        <header>
          <p className="section-label">Signature Cakes</p>
          <h1 className="font-display mt-2 text-[2.6rem] font-light leading-[1.05] tracking-tight sm:text-[3.4rem]">
            Pick your cake
          </h1>
          <p className="mt-2 max-w-[46ch] text-[0.95rem] leading-relaxed text-muted-foreground">
            Fifteen flavours we bake and decorate ourselves, 100% eggless, ready
            tomorrow. Want one designed to your own brief instead?{" "}
            <a href="/order" className="font-semibold text-[#C85478] underline-offset-2 hover:underline">
              That&rsquo;s a custom cake
            </a>
            .
          </p>
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
          {flavours.map((f) => {
            const badge = badgeFor(f.name);
            return (
            <li key={f.name}>
              <Link href={`/cakes/${urlSlug(f.name)}`} className="cake-card block">
                <span className="cake-photo block aspect-square overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/shop/cakes/${flavourSlug(f.name)}.webp`}
                    alt={`${f.name} eggless cake`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: cakeFraming(flavourSlug(f.name)) }}
                  />
                  <span className="cake-ground" aria-hidden />
                  {f.premium && <span className="badge-premium absolute left-2 top-2">Premium</span>}
                  {badge && (
                    <span className={`badge-claim badge-claim-${badge.kind} absolute right-2 top-2`}>
                      {badge.label}
                    </span>
                  )}
                </span>
                <span className="block px-3 py-2.5">
                  <span className="block text-[0.86rem] font-medium leading-tight">{f.name}</span>
                  <span className="block text-[0.74rem] text-muted-foreground">
                    from {money(listPriceCents("6 inch", f.name) ?? 0)}
                  </span>
                </span>
              </Link>
            </li>
            );
          })}
        </ul>

        {/* What the OTHER kind looks like, directly under the board of cakes
            you can buy — the comparison is the point, so it has to be within
            a glance of them.

            Deliberately NOT shaped like a product card. Four cakes on a shop
            page read as four more things to add to the cart, and a customer
            who taps one expecting a price and lands on a brief form has been
            misled by our own layout. So: circles rather than tiles, no price,
            no card, a muted strip, and the words "quoted, not sold online"
            sitting in the row itself. Round is doing real work here — nothing
            else on this page is round, so these cannot be mistaken for stock.

            Real cakes we made, from the /order gallery. A stock photo of
            somebody else's cake on a page selling ours is the same ACL
            problem as a fake price. */}
        <section className="mt-12 rounded-xl border border-border bg-secondary/40 p-4 sm:p-5">
          <div className="sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <h2 className="text-[0.95rem] font-semibold">Wanted something like this?</h2>
              <p className="mt-0.5 text-[0.82rem] leading-relaxed text-muted-foreground">
                Themes, tiers and 3D toppers are custom cakes &mdash; quoted, not sold online.
              </p>
            </div>
            <a
              href="/order"
              className="mt-3 inline-block rounded-full border border-[#C85478] px-5 py-2 text-[0.84rem] font-semibold text-[#C85478] transition-colors hover:bg-[#FDF3F6] sm:mt-0 sm:flex-none"
            >
              Get a custom quote
            </a>
          </div>
          {/* Illustration, not navigation. Four more links to /order beside a
              button that already goes there is four redundant stops for a
              keyboard or screen-reader user, and aria-hidden'ing them to
              compensate throws away the alt text — the only description of
              these cakes anyone gets. The images describe themselves; the
              button does the going. */}
          <ul className="mt-4 grid grid-cols-4 gap-3 sm:max-w-md">
            {[
              ["spiderman", "A Spider-Man birthday cake with a 3D topper"],
              ["tiered", "A three-tier wedding cake with sugar roses"],
              ["dinosaur", "A dinosaur scene cake with sculpted figures"],
              ["baby-shower", "A baby shower cake with fondant bottles and bears"],
            ].map(([slug, alt]) => (
              <li key={slug}>
                <img
                  src={`/shop/custom/${slug}.webp`}
                  alt={alt}
                  width={420}
                  height={420}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full rounded-full object-cover"
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 grid gap-4 border-t border-border pt-8 sm:grid-cols-3">
          {[
            ["100% eggless", "Every cake we make, without exception. It is the whole reason the bakery exists."],
            ["Ready tomorrow", "Every cake is baked to order, so we need a day. Weekends book out first."],
            ["Collect in store", "Harris Park or Riverstone. We text you the moment it's ready."],
          ].map(([h, p]) => (
            <div key={h}>
              <h2 className="text-[0.92rem] font-semibold">{h}</h2>
              <p className="mt-1 text-[0.84rem] leading-relaxed text-muted-foreground">{p}</p>
            </div>
          ))}
        </section>

        {/* Two ways to order, side by side.
            This replaced a paragraph that said the same thing in prose. A
            customer who wants a themed cake does not read a notice at the
            bottom of a board of cakes — they read the cakes. Put the two
            paths in the same shape, at the same size, and the difference is
            legible without being read: who designs it, what it costs, when
            it is ready. The Signature column is deliberately the calmer of
            the two — it is the page they are already on, so it states rather
            than sells. */}
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="section-label">Two ways to order</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#C85478]/35 bg-[#FDF3F6]/60 p-4">
              <h3 className="font-display text-[1.24rem] font-light tracking-[-0.02em]">Signature</h3>
              <p className="mt-0.5 text-[0.8rem] font-semibold text-[#C85478]">You&rsquo;re here</p>
              <dl className="mt-3 space-y-1.5 text-[0.84rem] leading-relaxed">
                <div className="flex gap-2">
                  <dt className="w-[4.6rem] flex-none text-muted-foreground">Design</dt>
                  <dd>Ours — 15 flavours</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[4.6rem] flex-none text-muted-foreground">Writing</dt>
                  <dd>Your words piped on top</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[4.6rem] flex-none text-muted-foreground">Price</dt>
                  <dd>From $39.99, shown up front</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[4.6rem] flex-none text-muted-foreground">Ready</dt>
                  <dd>Tomorrow</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[4.6rem] flex-none text-muted-foreground">Paying</dt>
                  <dd>50% now, the rest on collection</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <h3 className="font-display text-[1.24rem] font-light tracking-[-0.02em]">Custom</h3>
              <p className="mt-0.5 text-[0.8rem] font-semibold text-muted-foreground">A different way to order</p>
              <dl className="mt-3 space-y-1.5 text-[0.84rem] leading-relaxed">
                <div className="flex gap-2">
                  <dt className="w-[4.6rem] flex-none text-muted-foreground">Design</dt>
                  <dd>Yours — any theme, tiers, photo prints, 3D toppers</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[4.6rem] flex-none text-muted-foreground">Writing</dt>
                  <dd>Anything, as part of the design</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[4.6rem] flex-none text-muted-foreground">Price</dt>
                  <dd>Quoted per cake, once we&rsquo;ve seen the brief</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[4.6rem] flex-none text-muted-foreground">Ready</dt>
                  <dd>48 hours from the go-ahead</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[4.6rem] flex-none text-muted-foreground">Paying</dt>
                  <dd>Nothing online — we quote you first</dd>
                </div>
              </dl>
              <a
                href="/order"
                className="mt-4 block rounded-full border border-[#C85478] py-2.5 text-center text-[0.88rem] font-semibold text-[#C85478] transition-colors hover:bg-[#FDF3F6]"
              >
                Get a custom quote
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
