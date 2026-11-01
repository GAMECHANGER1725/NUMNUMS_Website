# GEO / AI Search Readiness - 2026-11-01
Score: 66/100 (Citability 52, Structure 80, Multi-modal 55, Authority 70, Technical 85)
Counts (234 posts, programmatic, main-body paragraphs >=15 words): first para 40-60w = 22; >60w = 211; eggless+Sydney in first 50 words of first para = 42 (was 41); question H2 = 219; tables = 43 (was 43); lists = 233; FAQPage schema = 234; author/dateModified in schema = 234/234; posts with % stat = 233; posts linking gov/edu/wikipedia source = 201.
Findings:
1. HIGH | 211/234 first paragraphs >60 words, only 22 in 40-60 | rewrite opening para of each post to a 40-60 word direct answer containing "eggless" + "Sydney" (batch via blog-write routine, highest-traffic posts first).
2. HIGH | only 42/234 have eggless+Sydney in first 50 words | fold into fix 1; measure with the same script.
3. MED | tables on 43/234 (18%), unchanged | add one comparison table (sizes/servings/price, flavours) to posts targeting comparison/price queries.
4. LOW-MED | robots.txt: GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, anthropic-ai, CCBot, ChatGPT-User all Allow; no Google-Extended, Applebot-Extended, Bytespider, cohere-ai rules (default * allow covers them) | fine; optionally add explicit Google-Extended/Applebot-Extended Allow. Decide on CCBot/anthropic-ai (training-only) deliberately.
5. OK | RSL: robots.txt has License: https://rsl.ai/1.0/allow-search-only; no /.well-known/rsl file | verify the license URL is a real RSL document; consider hosting rsl.xml.
6. LOW | llms.txt present, 324 lines, 235 blog URLs (matches 234 posts + index), all pages listed; but says "Orders placed via WhatsApp or phone" and has no /shop (noindex, fine) | update ordering line once shop is public/indexed; add "pickup only" and "from $39.99" to the Key facts.
7. MED | Entity: Wikidata Q140076208 in index.html (6 refs) and about.html sameAs; no YouTube or Reddit links in index.html sameAs | brand-mention research shows YouTube/Reddit as strongest correlates; add channel/profile sameAs if they exist, otherwise create a YouTube presence (cake-making shorts) as the top off-site GEO item.
8. LOW | Original statistics: 233 posts have a % figure but source-linking unverified for each | spot check stats in posts have a named source in-sentence.
9. INFO | All posts have author + dateModified + FAQPage schema: strong; keep. Static HTML = SSR-equivalent, fully crawlable.
10. INFO | AI Assistant is the most-engaged GA4 channel: prioritise fixes 1-2 (cheapest, biggest citability lift).
