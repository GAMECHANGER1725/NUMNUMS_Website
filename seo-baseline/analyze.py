#!/usr/bin/env python3
"""
Turn raw GSC/GA4 pulls into the CSVs + snapshot the measurement framework needs.

Re-run at each checkpoint against that checkpoint's directory so every review
uses identical computation:

    python3 seo-baseline/analyze.py seo-baseline/2026-09-02

Inputs (produced by skills/seo-audit/scripts/gsc_query.py + ga4_report.py):
    gsc-pages-90d.json, gsc-queries-90d.json, gsc-daily-90d.json,
    gsc-query-page-90d.json, ga4-organic-90d.json
"""
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

# ponytail: flag any query where a second URL holds >=MIN_IMPR impressions.
# Report gives the concept ("multiple URLs appear for one query in Search
# Console") but no numeric cut-off, so this floor is ours - it exists only to
# keep one-off long-tail noise out of the sheet.
MIN_IMPR = 5


def load(d, name):
    p = d / name
    if not p.exists():
        sys.exit(f"missing input: {p}")
    return json.loads(p.read_text())


def write_csv(path, cols, rows):
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    return len(rows)


def main(outdir):
    d = Path(outdir)

    pages = load(d, "gsc-pages-90d.json")["rows"]
    queries = load(d, "gsc-queries-90d.json")["rows"]
    daily = load(d, "gsc-daily-90d.json")["rows"]
    qp = load(d, "gsc-query-page-90d.json")["rows"]
    ga4 = load(d, "ga4-organic-90d.json")

    for row in pages:
        row["page"] = row.get("page") or row["keys"][0]
    for row in queries:
        row["query"] = row.get("query") or row["keys"][0]
    for row in daily:
        row["date"] = row.get("date") or row["keys"][0]
    for row in qp:
        row["query"], row["page"] = row["keys"][0], row["keys"][1]

    write_csv(d / "gsc-pages-90d.csv",
              ["page", "clicks", "impressions", "ctr", "position"], pages)
    write_csv(d / "gsc-queries-90d.csv",
              ["query", "clicks", "impressions", "ctr", "position"], queries)
    write_csv(d / "gsc-daily-90d.csv",
              ["date", "clicks", "impressions", "ctr", "position"], daily)
    write_csv(d / "gsc-query-page-90d.csv",
              ["query", "page", "clicks", "impressions", "ctr", "position"], qp)

    # --- cannibalisation: one query, more than one URL earning impressions ---
    by_query = defaultdict(list)
    for row in qp:
        by_query[row["query"]].append(row)

    findings = []
    for query, rows in by_query.items():
        competing = [r for r in rows if r["impressions"] >= MIN_IMPR]
        if len(competing) < 2:
            continue
        competing.sort(key=lambda r: (-r["impressions"], r["position"]))
        owner, rivals = competing[0], competing[1:]
        best = min(competing, key=lambda r: r["position"])
        findings.append({
            "query": query,
            "urls_competing": len(competing),
            "total_impressions": sum(r["impressions"] for r in competing),
            "total_clicks": sum(r["clicks"] for r in competing),
            "owner_url": owner["page"],
            "owner_impressions": owner["impressions"],
            "owner_position": owner["position"],
            "split_impressions": sum(r["impressions"] for r in rivals),
            "rival_urls": " | ".join(r["page"] for r in rivals),
            # the expensive case: a weaker page outranks the one you'd keep
            "best_position_url_is_owner": best["page"] == owner["page"],
            "best_position": best["position"],
        })
    findings.sort(key=lambda f: -f["split_impressions"])
    write_csv(d / "cannibalisation-audit.csv", list(findings[0].keys()), findings)

    # --- snapshot ---
    t_clicks = sum(r["clicks"] for r in pages)
    t_impr = sum(r["impressions"] for r in pages)
    ctr = (t_clicks / t_impr * 100) if t_impr else 0
    # impression-weighted position; a flat mean over-weights zero-traffic pages
    avg_pos = (sum(r["position"] * r["impressions"] for r in pages) / t_impr) if t_impr else 0

    half = len(daily) // 2
    first, second = daily[:half], daily[half:]

    def agg(chunk):
        i = sum(r["impressions"] for r in chunk)
        c = sum(r["clicks"] for r in chunk)
        return i, c, (c / i * 100 if i else 0), (
            sum(r["position"] * r["impressions"] for r in chunk) / i if i else 0)

    f_i, f_c, f_ctr, f_pos = agg(first)
    s_i, s_c, s_ctr, s_pos = agg(second)

    blog = [r for r in pages if "/blog/" in r["page"]]
    money = [r for r in pages if not any(
        s in r["page"] for s in ("/blog/", "/privacy", "/review"))]
    split_total = sum(f["split_impressions"] for f in findings)

    lines = [
        "# GSC + GA4 Baseline Snapshot — 2026-09-02",
        "",
        "Captured the day after the 2026-09-01 consolidation (359 → 233 posts).",
        "This is the reference every later checkpoint compares against. Per the",
        "research report, **impressions are expected to fall** from here as the 126",
        "retired URLs leave the index — that is not a regression signal. Position,",
        "CTR, query quality and conversions are.",
        "",
        "## Site totals — last 90 days",
        "",
        "| Metric | Value |",
        "|---|---|",
        f"| Clicks | {t_clicks:,} |",
        f"| Impressions | {t_impr:,} |",
        f"| CTR | {ctr:.2f}% |",
        f"| Average position (impression-weighted) | {avg_pos:.1f} |",
        f"| URLs with impressions | {len(pages):,} |",
        f"| Distinct queries | {len(queries):,} |",
        f"| GA4 organic sessions | {ga4['totals']['sessions']:,} |",
        f"| GA4 organic users | {ga4['totals']['users']:,} |",
        f"| GA4 organic pageviews | {ga4['totals']['pageviews']:,} |",
        "",
        "## Trend within the window (first half vs second half)",
        "",
        "| Half | Impressions | Clicks | CTR | Avg position |",
        "|---|---:|---:|---:|---:|",
        f"| First {len(first)}d | {f_i:,} | {f_c:,} | {f_ctr:.2f}% | {f_pos:.1f} |",
        f"| Second {len(second)}d | {s_i:,} | {s_c:,} | {s_ctr:.2f}% | {s_pos:.1f} |",
        f"| Change | {s_i - f_i:+,} | {s_c - f_c:+,} | {s_ctr - f_ctr:+.2f}pp | {s_pos - f_pos:+.1f} |",
        "",
        "## Blog vs commercial pages",
        "",
        "| Set | URLs | Impressions | Clicks | CTR | Avg position |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for label, rows in (("Blog", blog), ("Commercial + home", money)):
        i = sum(r["impressions"] for r in rows)
        c = sum(r["clicks"] for r in rows)
        p = (sum(r["position"] * r["impressions"] for r in rows) / i) if i else 0
        lines.append(f"| {label} | {len(rows):,} | {i:,} | {c:,} | "
                     f"{(c / i * 100 if i else 0):.2f}% | {p:.1f} |")

    lines += [
        "",
        "## Cannibalisation at baseline",
        "",
        f"- Queries where 2+ URLs each hold ≥{MIN_IMPR} impressions: **{len(findings)}**",
        f"- Impressions sitting on non-owner URLs: **{split_total:,}** "
        f"({split_total / t_impr * 100:.1f}% of all impressions)",
        f"- Queries where a *weaker* URL outranks the owner: "
        f"**{sum(1 for f in findings if not f['best_position_url_is_owner'])}**",
        "",
        "Full detail: `cannibalisation-audit.csv`.",
        "",
        "### Top 20 by impressions lost to the non-owner URL",
        "",
        "| Query | URLs | Total impr | Split impr | Owner |",
        "|---|---:|---:|---:|---|",
    ]
    for f in findings[:20]:
        owner = f["owner_url"].replace("https://numnumsbakery.com.au", "")
        lines.append(f"| {f['query']} | {f['urls_competing']} | "
                     f"{f['total_impressions']:,} | {f['split_impressions']:,} | {owner} |")

    lines += ["", "## Top 25 pages by impressions", "",
              "| Page | Clicks | Impr | CTR | Pos |", "|---|---:|---:|---:|---:|"]
    for r in sorted(pages, key=lambda r: -r["impressions"])[:25]:
        lines.append(f"| {r['page'].replace('https://numnumsbakery.com.au', '')} | "
                     f"{r['clicks']:,} | {r['impressions']:,} | {r['ctr']:.1f}% | {r['position']:.1f} |")

    lines += ["", "## Top 25 queries by impressions", "",
              "| Query | Clicks | Impr | CTR | Pos |", "|---|---:|---:|---:|---:|"]
    for r in sorted(queries, key=lambda r: -r["impressions"])[:25]:
        lines.append(f"| {r['query']} | {r['clicks']:,} | {r['impressions']:,} | "
                     f"{r['ctr']:.1f}% | {r['position']:.1f} |")

    (d / "BASELINE-SNAPSHOT.md").write_text("\n".join(lines) + "\n")

    print(f"pages={len(pages)} queries={len(queries)} query-page={len(qp)} "
          f"cannibalised={len(findings)} split_impr={split_total}")
    print(f"clicks={t_clicks} impr={t_impr} ctr={ctr:.2f}% pos={avg_pos:.1f}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "seo-baseline/2026-09-02")
