import { notFound } from "next/navigation";
import { ShopHeader } from "@/components/ui/shop-header";
import { ProductPage } from "@/components/ui/product-page";
import { SELLABLE_FLAVOURS, urlSlug } from "@/lib/catalog";
import { copyFor } from "@/lib/flavour-copy";

/** One static page per flavour — 15 of them, built at export time. */
export function generateStaticParams() {
  return SELLABLE_FLAVOURS.map((f) => ({ slug: urlSlug(f.name) }));
}

const bySlug = (slug: string) =>
  SELLABLE_FLAVOURS.find((f) => urlSlug(f.name) === slug) ?? null;

export async function generateMetadata({ params }: PageProps<"/cakes/[slug]">) {
  const { slug } = await params;
  const f = bySlug(slug);
  if (!f) return {};
  return {
    title: `${f.name} eggless cake | Num Num's Bakery`,
    description: copyFor(f.name).blurb,
  };
}

export default async function CakePage({ params }: PageProps<"/cakes/[slug]">) {
  const { slug } = await params;
  const f = bySlug(slug);
  if (!f) notFound();

  // Four others to move to, so "not this one" stays inside the shop.
  const related = SELLABLE_FLAVOURS
    .filter((o) => o.name !== f.name)
    .sort((a, b) => POPULAR.indexOf(a.name) - POPULAR.indexOf(b.name))
    .slice(0, 4)
    .map((o) => o.name);

  return (
    <>
      <ShopHeader />
      <ProductPage flavour={f.name} premium={Boolean(f.premium)} related={related} />
    </>
  );
}

/** Same order the catalogue uses — the order book on 2026-09-13. */
const POPULAR = [
  "Chocolate", "Butterscotch", "Pineapple", "Vanilla", "Rasmalai", "Black Forest",
  "Cookies & Cream", "White Forest", "Mango", "Strawberry",
  "Red Velvet", "Lychee", "Tiramisu", "Blueberry", "Ferrero Rocher",
];
