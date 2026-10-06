import Link from "next/link";
import { ArrowRight, CalendarCheck, EggOff, PenLine, ShieldCheck, Star } from "lucide-react";
import { ShopHeader } from "@/components/ui/shop-header";
import { CakeRow } from "@/components/ui/cake-row";
import { EarliestPickup } from "@/components/ui/earliest-pickup";
import { SELLABLE_FLAVOURS, SELLABLE_SIZES, listPriceCents, flavourSlug, urlSlug } from "@/lib/catalog";
import { money, DEPOSIT_RATE } from "@/lib/cart";
import { cakeFraming } from "@/lib/cake-framing";
import { badgeFor, assertPickIsNotPremium, GOOGLE_RATING } from "@/lib/badges";

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
 * The board is three named rows, not one wall of fifteen.
 *
 * A single grid made a $49.99 Rasmalai and a $39.99 Vanilla look like the same
 * kind of thing, and left the customer to infer the range's shape from the
 * prices. The rows answer "what kind of cake am I after" before "which
 * flavour", which is the order people actually decide in.
 *
 * Premium leads because those two are the highest-value cakes and the two a
 * chain bakery cannot sell — the same reason the old merchandised first row
 * pulled them up out of positions 5 and 15.
 *
 * Within a row it is popularity order, which below the first couple of
 * positions decides nothing.
 */
const SPECIALTY = [
  "Butterscotch", "Cookies & Cream", "Tiramisu", "Red Velvet", "Mango", "Lychee",
];

const byPopularity = (a: { name: string }, b: { name: string }) =>
  BY_POPULARITY.indexOf(a.name) - BY_POPULARITY.indexOf(b.name);

const premium = SELLABLE_FLAVOURS.filter((f) => f.premium).sort(byPopularity);
const specialty = SELLABLE_FLAVOURS
  .filter((f) => !f.premium && SPECIALTY.includes(f.name)).sort(byPopularity);
const classics = SELLABLE_FLAVOURS
  .filter((f) => !f.premium && !SPECIALTY.includes(f.name)).sort(byPopularity);

assertPickIsNotPremium(SELLABLE_FLAVOURS.filter((f) => f.premium).map((f) => f.name));

/** The cheapest cake on the board, read from the catalogue — never typed in. */
const FROM_CENTS = Math.min(
  ...SELLABLE_FLAVOURS.map((f) => listPriceCents(SELLABLE_SIZES[0].code, f.name) ?? Infinity),
);

/*
 * A flavour that matches no row would simply not render, and a board quietly
 * missing a cake looks exactly like a board that is complete. `classics` is the
 * catch-all so that cannot happen to a NEW flavour — but a rename would strand
 * an entry in SPECIALTY, moving that cake into Classics with no error, so the
 * names are checked against the catalogue too.
 */
if (premium.length + specialty.length + classics.length !== SELLABLE_FLAVOURS.length) {
  throw new Error("shop board: a flavour landed in no row, or in more than one");
}
for (const name of SPECIALTY) {
  if (!SELLABLE_FLAVOURS.some((f) => f.name === name)) {
    throw new Error(`shop board: SPECIALTY lists "${name}", which is not a sellable flavour`);
  }
}

/*
 * Row names and their one line.
 *
 * Each blurb says something checkable. "Premium" explains the higher price
 * rather than just asserting importance, and Classics says what the row is
 * instead of calling it "other", which reads as leftovers. Nothing here claims
 * popularity, scarcity or a comparison with another bakery — the same rule the
 * badges are held to, and the reason the urgency-language gate exists.
 */
const ROWS = [
  {
    id: "row-premium",
    title: "Premium",
    eyebrow: "The finest two",
    premium: true,
    blurb: "More goes into these than any other cake we make, and they are priced that way.",
    items: premium,
  },
  {
    id: "row-specialty",
    title: "Specialty flavours",
    blurb: "Something other than the usual, without going custom.",
    items: specialty,
  },
  {
    id: "row-classics",
    title: "Classics",
    blurb: "The flavours everyone knows — every one of them 100% eggless.",
    items: classics,
  },
];

export default function ShopPage() {
  return (
    <>
      <ShopHeader />
      <main className="mx-auto w-full max-w-[72rem] px-4 pb-20 pt-8 sm:px-6">
        {/* The outcome first, then the deal (Hormozi's value equation, read
            honestly). "Pick your cake" named the customer's chore; the reason
            anyone is on this page is a cake for a room that includes somebody
            who cannot eat egg, and the fear is that it will taste like it.
            The headline answers that fear — the same line the homepage hero
            has always used, so the two do not argue. */}
        <header>
          <p className="section-label">Signature Cakes</p>
          <h1 className="font-display mt-2 text-[2.6rem] font-light leading-[1.05] tracking-tight sm:text-[3.4rem]">
            No one will guess it&rsquo;s eggless
          </h1>
          <p className="mt-2 max-w-[48ch] text-[0.95rem] leading-relaxed text-muted-foreground">
            Fifteen flavours we bake to order and decorate by hand. Order today,
            collect <b className="font-semibold text-foreground"><EarliestPickup /></b>.
            Want one designed to your own brief?{" "}
            <a href="/order" className="font-semibold text-[#C85478] underline-offset-2 hover:underline">
              That&rsquo;s a custom cake
            </a>
            .
          </p>
          {GOOGLE_RATING && (
            <a href={GOOGLE_RATING.url} target="_blank" rel="noopener"
              className="mt-3 inline-flex items-center gap-1.5 text-[0.84rem] text-muted-foreground underline-offset-2 hover:underline">
              <span className="inline-flex text-[#E3B664]" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </span>
              <b className="font-semibold text-foreground">{GOOGLE_RATING.rating}</b>
              · {GOOGLE_RATING.count} Google reviews ↗
            </a>
          )}

          {/* What every cake comes with, stated where the choosing starts.
              These were scattered: "ready tomorrow" in the intro, eggless in
              a footer strip under the board, the deposit only on the product
              page, and the refund window nowhere before the cart — which is
              where hesitation turns into a closed tab, not where it starts.
              Nothing here is a bonus invented to look generous: each is
              already true of every order, and each mirrors a rule in
              lib/cart.ts (DEPOSIT_RATE, the 24-hour window the cart and
              Stripe's button already state). */}
          <ul className="promise-strip mt-5" aria-label="Included with every cake">
            <li><EggOff aria-hidden /><span><b>100% eggless</b> Every cake, every flavour</span></li>
            <li><PenLine aria-hidden /><span><b>Your words, piped</b> By hand, no extra charge</span></li>
            <li><CalendarCheck aria-hidden /><span><b>Ready tomorrow</b> Harris Park or Riverstone</span></li>
            <li><ShieldCheck aria-hidden /><span><b>Refundable deposit</b> Until 24h before pickup</span></li>
          </ul>
        </header>

        {ROWS.map((row) => (
          <CakeRow
            key={row.id} id={row.id} title={row.title} blurb={row.blurb}
            eyebrow={row.eyebrow} premium={row.premium}
          >
            {row.items.map((f) => (
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
                    {/* No Premium chip inside the Premium row — the heading
                        above it already says so, and a badge repeating its own
                        section is the clutter the one-badge rule exists to
                        stop. It still appears anywhere else a card is shown. */}
                    {f.premium && row.id !== "row-premium" && (
                      <span className="badge-premium absolute left-2 top-2">Premium</span>
                    )}
                    {badgeFor(f.name) && (
                      <span className={`badge-claim badge-claim-${badgeFor(f.name)!.kind} absolute right-2 top-2`}>
                        {badgeFor(f.name)!.label}
                      </span>
                    )}
                  </span>
                  <span className="block px-3 pb-3 pt-2.5">
                    <span className="block text-[0.86rem] font-medium leading-tight">{f.name}</span>
                    {/* The price and the way in sit on one line, so the card
                        reads as something you buy, not a picture you open.
                        It says Order, not Add to cart: a cake needs a size
                        first, and adding one blind is the error Baymard sees
                        most on list-page quick-adds. The whole card is the
                        link; this is its visible verb. */}
                    <span className="mt-1.5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <span className="whitespace-nowrap text-[0.74rem] text-muted-foreground">
                        from {money(listPriceCents("6 inch", f.name) ?? 0)}
                      </span>
                      <span className="cake-order">
                        Order<ArrowRight className="cake-order-arrow h-3.5 w-3.5" aria-hidden />
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </CakeRow>
        ))}

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
                  <dd>From {money(FROM_CENTS)}, shown up front</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[4.6rem] flex-none text-muted-foreground">Ready</dt>
                  <dd>Tomorrow</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[4.6rem] flex-none text-muted-foreground">Paying</dt>
                  <dd>{Math.round(DEPOSIT_RATE * 100)}% now, the rest on collection</dd>
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
                  <dd>2 days from the go-ahead</dd>
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
