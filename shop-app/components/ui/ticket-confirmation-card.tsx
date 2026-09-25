import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The order confirmation as a ticket — ported from a shadcn community block,
 * changed where the original would have said something untrue:
 *
 * - The barcode is REAL Code 39 of the order number, not bars seeded from a
 *   hash. Any phone scanner reads it back as "HP-1725"; a pretty barcode that
 *   decodes to nothing is decoration pretending to be data.
 * - The card row shows the card actually used, from Stripe, and is left out
 *   when we do not know it — never a Mastercard logo on a Visa payment.
 * - No confetti of its own: the page already fires the brand-coloured one,
 *   and the block's rainbow one used Math.random during render, which
 *   mismatches between server and client.
 */

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const CardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 0 36 24" aria-hidden>
    <rect x="0.5" y="0.5" width="35" height="23" rx="4" fill="#FFF8F2" stroke="#EBD3DA" />
    <rect x="0.5" y="6" width="35" height="4" fill="#C85478" />
    <rect x="5" y="15" width="10" height="3" rx="1" fill="#EBD3DA" />
  </svg>
);

export const DashedLine = () => (
  <div className="w-full border-t-2 border-dashed border-[#EBD3DA]" aria-hidden="true" />
);

/**
 * Code 39: each character is nine elements, bar/space alternating from a bar,
 * exactly three of them wide ("1"). Start and stop are "*". Covers what an
 * order number can contain: A–Z, 0–9 and the hyphen.
 */
const CODE39: Record<string, string> = {
  "0": "000110100", "1": "100100001", "2": "001100001", "3": "101100000", "4": "000110001",
  "5": "100110000", "6": "001110000", "7": "000100101", "8": "100100100", "9": "001100100",
  A: "100001001", B: "001001001", C: "101001000", D: "000011001", E: "100011000",
  F: "001011000", G: "000001101", H: "100001100", I: "001001100", J: "000011100",
  K: "100000011", L: "001000011", M: "101000010", N: "000010011", O: "100010010",
  P: "001010010", Q: "000000111", R: "100000110", S: "001000110", T: "000010110",
  U: "110000001", V: "011000001", W: "111000000", X: "010010001", Y: "110010000",
  Z: "011010000", "-": "010000101", "*": "010010100",
};

/** Bars as [x, width] pairs, in narrow-module units. Exported for its check. */
export function code39Bars(value: string): { bars: [number, number][]; width: number } {
  const WIDE = 2.5;
  const chars = `*${value.toUpperCase().replace(/[^0-9A-Z-]/g, "")}*`;
  const bars: [number, number][] = [];
  let x = 0;
  for (const ch of chars) {
    const pattern = CODE39[ch];
    for (let i = 0; i < 9; i++) {
      const w = pattern[i] === "1" ? WIDE : 1;
      if (i % 2 === 0) bars.push([x, w]);
      x += w;
    }
    x += 1; // inter-character gap: one narrow space
  }
  return { bars, width: x - 1 };
}

export function Barcode({ value }: { value: string }) {
  const { bars, width } = code39Bars(value);
  const QUIET = 10; // a scanner needs ten narrow modules of white either side
  return (
    <div className="flex flex-col items-center py-1">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={`${-QUIET} 0 ${width + QUIET * 2} 40`}
        className="h-14 w-full max-w-[260px] text-[#2C1A0E]" preserveAspectRatio="none"
        role="img" aria-label={`Barcode for order ${value}`}>
        {bars.map(([x, w], i) => <rect key={i} x={x} y={0} width={w} height={40} fill="currentColor" />)}
      </svg>
      <p className="mt-2 text-[0.8rem] tracking-[0.3em] text-[#5C3A22]/80">{value}</p>
    </div>
  );
}

export interface TicketProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Order numbers on this payment — one per cake. */
  orderNos: string[];
  /** What was charged today, in cents. */
  amountCents: number;
  title: string;
  subtitle: string;
  /** "Visa •••• 4242", or nothing when Stripe did not say. */
  card?: { label: string; holder?: string | null } | null;
}

export const AnimatedTicket = React.forwardRef<HTMLDivElement, TicketProps>(
  ({ className, orderNos, amountCents, title, subtitle, card, children, ...props }, ref) => {
    const amount = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amountCents / 100);
    return (
      <div ref={ref}
        className={cn(
          "relative z-10 w-full rounded-3xl bg-white text-[#2C1A0E]",
          "shadow-[0_1px_2px_rgba(74,37,24,0.05),0_12px_40px_-12px_rgba(200,84,120,0.28)]",
          "animate-in fade-in-0 zoom-in-95 duration-500 motion-reduce:animate-none",
          className,
        )}
        {...props}>
        {/* The tear, level with the first dashed rule. */}
        <div aria-hidden className="absolute -left-4 top-[178px] h-8 w-8 rounded-full bg-background" />
        <div aria-hidden className="absolute -right-4 top-[178px] h-8 w-8 rounded-full bg-background" />

        <div className="flex h-[194px] flex-col items-center justify-center px-8 text-center">
          <div className="rounded-full bg-[#C85478]/10 p-3 animate-in zoom-in-50 delay-300 duration-500 motion-reduce:animate-none">
            <CheckCircleIcon className="h-9 w-9 text-[#C85478]" />
          </div>
          <h1 className="font-display mt-3 text-[1.9rem] leading-tight">{title}</h1>
          <p className="mt-0.5 text-[0.92rem] text-[#5C3A22]">{subtitle}</p>
        </div>

        <div className="space-y-5 px-6 pb-7 sm:px-8">
          <DashedLine />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[#5C3A22]/70">
                {orderNos.length === 1 ? "Order no." : "Order nos."}
              </p>
              {orderNos.map((n) => <p key={n} className="font-medium tabular-nums">{n}</p>)}
            </div>
            <div className="text-right">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[#5C3A22]/70">Paid today</p>
              <p className="text-[1.15rem] font-medium tabular-nums">{amount}</p>
            </div>
          </div>

          {children}

          {card && (
            <div className="flex items-center gap-4 rounded-2xl bg-[#FFF8F2] p-4">
              <CardIcon className="shrink-0" />
              <div className="min-w-0">
                {card.holder && <p className="truncate font-medium">{card.holder}</p>}
                <p className="text-[0.88rem] tracking-wide text-[#5C3A22]">{card.label}</p>
              </div>
            </div>
          )}

          <DashedLine />

          <Barcode value={orderNos[0] ?? ""} />
        </div>
      </div>
    );
  },
);
AnimatedTicket.displayName = "AnimatedTicket";
