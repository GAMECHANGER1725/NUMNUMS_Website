import Link from "next/link";

/**
 * Where you are in buying a cake: cart → details → done.
 *
 * Three steps because there are exactly three pages, so it can never lie about
 * how much is left. Completed steps are links back; the step you are on and the
 * ones ahead are not, because "Order complete" is not somewhere you can click
 * to.
 */
const STEPS = [
  { n: 1, label: "Your cart", href: "/cart" },
  { n: 2, label: "Your details", href: "/checkout" },
  { n: 3, label: "Collected", href: null },
] as const;

export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Checkout progress" className="mt-5 flex justify-center">
      <ol className="flex items-center gap-1 sm:gap-3">
        {STEPS.map((s, i) => {
          const done = s.n < current;
          const here = s.n === current;
          const body = (
            <span className="flex items-center gap-2 px-1 py-2">
              <span
                aria-hidden
                className={
                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-semibold tabular-nums " +
                  (here || done ? "bg-[#C85478] text-white" : "bg-secondary text-muted-foreground")
                }
              >
                {s.n}
              </span>
              <span
                className={
                  "text-[0.8rem] " +
                  (here ? "font-semibold text-foreground" : "text-muted-foreground")
                }
              >
                {s.label}
              </span>
            </span>
          );
          return (
            <li key={s.n} className="flex items-center gap-1 sm:gap-3">
              {done && s.href ? (
                <Link href={s.href} className="rounded-full hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]">
                  {body}
                </Link>
              ) : (
                <span aria-current={here ? "step" : undefined}>{body}</span>
              )}
              {i < STEPS.length - 1 && (
                <span aria-hidden className="h-px w-4 bg-border sm:w-10" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
