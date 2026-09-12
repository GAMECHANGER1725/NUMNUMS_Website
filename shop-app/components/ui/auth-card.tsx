import Link from "next/link";

/** The frame the three password screens share, so they cannot drift apart. */
export function AuthCard({
  title,
  lede,
  children,
  footer,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[26rem] rounded-[1.25rem] bg-card p-7 shadow-[0_20px_50px_-16px_rgba(44,26,14,0.26),0_2px_8px_rgba(44,26,14,0.06)] sm:p-8">
        <Link
          href="/"
          className="font-display text-[1.35rem] font-light tracking-tight text-[#C85478] underline-offset-4 hover:underline"
        >
          Num Num&rsquo;s Bakery
        </Link>
        <h1 className="font-display mt-5 text-3xl font-light tracking-tight">{title}</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{lede}</p>
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-5 text-center text-[0.82rem] text-muted-foreground">{footer}</div>}
      </div>
    </main>
  );
}

/** A link sized to be tappable — a 36x19 hit area is not one. */
export function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="-m-2 inline-flex min-h-[32px] items-center p-2 font-semibold text-[#C85478] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85478]"
    >
      {children}
    </Link>
  );
}
