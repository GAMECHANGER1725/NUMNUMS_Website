"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Download a file that lives at a URL — ported from a shadcn block, without
 * its `Button`: that pulls in @radix-ui/react-slot, and Base UI is the one
 * primitives library here.
 *
 * The progress is real. The file is fetched first, counting bytes against
 * Content-Length, so a failure shows here instead of navigating to an error
 * page. The save itself is then the browser opening the same URL, which
 * answers `Content-Disposition: attachment` — the one route that actually
 * saves on an iPhone. Saving a blob this page built is a silent no-op there.
 */
type Status = "idle" | "downloading" | "downloaded" | "failed";

export default function DownloadButton({ href, className, label = "Download" }: {
  href: string;
  className?: string;
  label?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);

  async function start() {
    if (status === "downloading") return;
    setStatus("downloading");
    setProgress(0);
    try {
      const res = await fetch(href);
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const total = Number(res.headers.get("content-length")) || 0;
      const reader = res.body.getReader();
      let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        got += value.length;
        if (total) setProgress(Math.min(99, Math.round((got / total) * 100)));
      }
      setProgress(100);
      window.location.assign(href);
      setStatus("downloaded");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("failed");
      setTimeout(() => setStatus("idle"), 4000);
    }
  }

  return (
    <button type="button" onClick={start} aria-live="polite"
      className={cn(
        "relative inline-flex min-h-[44px] min-w-40 select-none items-center justify-center gap-2 overflow-hidden rounded-full px-5",
        "text-[0.88rem] font-medium text-white transition-[background-color,transform,box-shadow] duration-200",
        "bg-[#C85478] shadow-[0_4px_14px_rgba(200,84,120,0.28)] hover:bg-[#A03D5E] active:scale-[0.97]",
        "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#C85478]",
        status === "downloading" && "bg-[#C85478]/55 hover:bg-[#C85478]/55",
        status === "failed" && "bg-[#A03D5E]",
        className,
      )}>
      {status === "downloading" && (
        <span aria-hidden className="absolute inset-y-0 left-0 z-0 bg-[#C85478] transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }} />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">
        {status === "idle" && <><Download className="h-4 w-4" aria-hidden />{label}</>}
        {status === "downloading" && <><Loader2 className="h-4 w-4 animate-spin" aria-hidden />{progress}%</>}
        {status === "downloaded" && <><CheckCircle className="h-4 w-4" aria-hidden />Downloaded</>}
        {status === "failed" && <>Couldn&rsquo;t download &mdash; try again</>}
      </span>
    </button>
  );
}
