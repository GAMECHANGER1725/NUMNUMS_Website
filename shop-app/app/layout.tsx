import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Dancing_Script } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

/**
 * The icing face. A third family is justified because it represents a physical
 * material — piped buttercream — rather than another voice in the interface.
 * It is used in exactly one place: the writing preview on the cake.
 */
const icing = Dancing_Script({
  variable: "--font-icing",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Order eggless cakes online | Num Num's Bakery",
  description:
    "Order a 100% eggless cake from Num Num's Bakery — pick your size and flavour, pay online, collect from Harris Park or Riverstone.",
  robots: { index: false, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-AU"
      className={`${cormorant.variable} ${jost.variable} ${icing.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
