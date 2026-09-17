import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Jost, Dancing_Script } from "next/font/google";
import "./globals.css";

/**
 * The same GTM container the static site loads, so the shop's funnel lands in
 * the same property rather than a second one nobody reads. Until this went in,
 * the app fired nothing at all: no view_item, no add_to_cart, no purchase — the
 * only part of the site that can take money was the only part reporting
 * nothing.
 *
 * `afterInteractive` deliberately: this is a checkout, and a tag manager must
 * never sit in front of the first paint of a page someone is trying to pay on.
 * The site CSP already allows googletagmanager.com, and /shop/* inherits it.
 */
const GTM_ID = "GTM-NM5H6SSZ";

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
      <body className="min-h-full flex flex-col">
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
