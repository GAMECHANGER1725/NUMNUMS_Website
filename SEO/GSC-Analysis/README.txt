SEO/GSC-Analysis — weekly GSC + GA4 analysis output
====================================================

Written by the NumNums-SEO-Weekly cloud routine. Machine-readable only —
these files are meant to be pasted into a Claude chat, not read for pleasure.

FILES
-----
DD-MM-YYYY-GSC-Analysis.txt   One per run. Self-contained: a fresh Claude chat
                              with zero context can read one file and fully
                              understand that week.
history-index.txt             Append-only ledger, one line per run. Lets the
                              routine get a long-range view without parsing
                              every prior file.
FAILED-DD-MM-YYYY-...txt      Written instead of an analysis file when the run
                              aborts (e.g. git pull conflict).

DATA SOURCES (Supermetrics MCP, both already authenticated via
info.numnumsbakery@gmail.com)
-----------------------------
Google Search Console   ds_id: GW     account: sc-domain:numnumsbakery.com.au
Google Analytics 4      ds_id: GAWA   account: 531794710 (Num Nums Bakery)

Field IDs are NOT hardcoded anywhere. The routine runs field_discovery each
run and uses only real returned IDs. Never guess a field ID or settings key,
and never fabricate a metric value — write NO DATA instead.

WINDOWS CAPTURED EACH RUN
-------------------------
last 7d, previous 7d, last 28d, previous 28d, last 3mo, last 6mo, last 12mo

CONVENTIONS
-----------
Dates in filenames are zero-padded DD-MM-YYYY of the run date.
Window boundaries inside each file are explicit ISO dates.
Every number carries its window label and unit.
