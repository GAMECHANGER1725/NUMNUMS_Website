---
name: blog-write
description: >
  Write new blog articles from scratch optimized for Google rankings and AI
  citations. Generates full articles with template selection, answer-first
  formatting, Key Takeaways summary box, information gain markers, citation capsules, sourced
  statistics, Pixabay/Unsplash images, built-in SVG chart generation, FAQ schema,
  internal linking zones, and proper heading hierarchy. Supports MDX, markdown,
  and HTML output.
  Use when user says "write blog", "new blog post", "create article",
  "write about", "draft blog", "generate blog post".
user-invokable: true
argument-hint: "<topic>"
license: MIT
---

# Blog Writer: New Article Generation

Writes complete blog articles from a topic, brief, or outline. Every article
follows the 6 pillars of dual optimization (Google rankings + AI citations).

**Key references** (paths relative to repo root; references live in the
main `blog` skill's references directory, not in `blog-write/`):

- `skills/blog/references/synthesis-contract.md`: 6 LAWs for synthesis output (v1.8.0; applies whenever the article embeds research-synthesis prose)
- `skills/blog/references/content-templates.md`: Template selection guide and usage
- `skills/blog/references/quality-scoring.md`: 5-category scoring (Content 30, SEO 25, E-E-A-T 15, Technical 15, AI Citation 15)
- `skills/blog/references/eeat-signals.md`: Experience, expertise, authority, trust markers
- `skills/blog/references/internal-linking.md`: Linking strategy and anchor text rules
- `skills/blog/references/visual-media.md`: Image sourcing and chart styling

## Workflow

### Phase 0: Surface Targeting (do this BEFORE research)

Decide which of the FLOW 5 surfaces this post is meant to win. The choice
shapes structure, length, citation density, and call-to-action. The 5 surfaces
in 2026:

1. Owned site (organic Google ranking)
2. SERP including AI Overviews
3. AI assistant citations (ChatGPT, Perplexity, Claude, Gemini, Copilot, You.com)
4. Local pack (out of scope for blog content; use claude-seo for local)
5. Communities and video (Reddit, YouTube, LinkedIn, Quora, niche forums)

Most posts target surfaces 1, 2, and 3 by default. If the same query also
surfaces in a community (Reddit thread, YouTube comment), apply dual-surface
thinking: optimize the post for extraction AND plan a community echo (covered
in `/blog repurpose`).

For a deeper surface-by-surface workflow, see
`skills/blog/references/flow-alignment.md` and `/blog flow find`.

### Phase 1: Topic Understanding

1. **Clarify the topic** - If the user provides just a topic, ask:
   - Target audience (who is this for?)
   - Primary keyword / search intent
   - Desired word count (default: 2,000-2,500 words)
   - Platform/format (MDX, markdown, HTML - auto-detect if in a project)
2. **If a brief exists** - Load it and skip to Phase 1.5

### Phase 1.5: Template Selection

Select the appropriate content template from the 12 templates in
`skills/blog/templates/` (the main `blog` skill owns the templates directory).

1. **Auto-detect content type** from the topic and search intent:
   | Signal | Template |
   |--------|----------|
   | "How to...", process, steps | `how-to-guide` |
   | "Best X", "Top N", list format | `listicle` |
   | Client result, before/after, metrics | `case-study` |
   | "X vs Y", comparison, alternatives | `comparison` |
   | Broad topic, comprehensive guide | `pillar-page` |
   | "Is X worth it", product evaluation | `product-review` |
   | Opinion, prediction, industry take | `thought-leadership` |
   | Expert quotes, multi-source collection | `roundup` |
   | Code walkthrough, tool demo, technical | `tutorial` |
   | Breaking news, algorithm update, event | `news-analysis` |
   | Survey results, experiment, original data | `data-research` |
   | Q&A, knowledge base, "What is X" | `faq-knowledge` |

2. **Load the matching template**: Read from `skills/blog/templates/<type>.md`
3. **Adapt the outline** - Use the template's section structure, heading patterns,
   and word count guidance to shape Phase 3's outline
4. **Fallback** - If no template clearly fits, use the generic outline structure
   in Phase 3 below. Inform the user which template was selected (or that none matched).

See `skills/blog/references/content-templates.md` for detailed selection criteria and intent mapping.

### Phase 2: Research

Spawn a `blog-researcher` agent (or do inline research with WebSearch):

0. **Build the used-image blocklist before searching for any image** (mandatory, prevents repeat images across the blog):
   - Run: `grep -ohE '(images\.unsplash\.com/photo-[a-zA-Z0-9_-]+|cdn\.pixabay\.com/photo/[^"'"'"' )]+|images\.pexels\.com/photos/[0-9]+)' blog/*.html | sort -u`
   - Every ID/URL this returns is ALREADY USED somewhere in the blog and must NOT be reused for the cover or any inline image in this post.
   - Do not pick the first or most obvious search result by habit — the top Unsplash/Pixabay hit for common queries like "cake", "birthday cake", "bakery" is the same photo every time, which is exactly how the corpus ended up with the same handful of images repeated 50-90 times each. Scroll past the first page of results or vary the search query (add topic-specific modifiers: occasion, ingredient, colour, culture) until you find an ID not in the blocklist.
1. **Find 8-12 current statistics** (2025-2026 data preferred)
   - Search: `[topic] study 2025 2026 data statistics`
   - Prioritize tier 1-3 sources (see `skills/blog/references/quality-scoring.md`)
   - Record: statistic, source name, URL, date, methodology
2. **Find a cover image** (wide, high-quality, topic-relevant, NOT in the used-image blocklist from step 0):
   - Search: `site:pixabay.com [topic] wide banner` (preferred)
   - Alternative: `site:unsplash.com [topic] wide`
   - Fallback: `site:pexels.com [topic] wide banner`
   - Target dimensions: 1200x630 (OG-compatible) or 1920x1080
   - Or generate a custom SVG cover via `blog-chart` (text-on-gradient with key stat)
   - Or generate a custom AI image via `blog-image` sub-skill (if nanobanana-mcp configured)
   - See `skills/blog/references/visual-media.md` for cover image sizing details
3. **Find 3-5 inline images** from open-source platforms, each a distinct ID not in the used-image blocklist from step 0 and not already chosen earlier in this same post:
   - **Pixabay** (preferred): Search `site:pixabay.com [topic keywords]`
     - Extract image URL from page
     - Direct URLs: `https://cdn.pixabay.com/photo/YYYY/MM/DD/HH/MM/filename.jpg`
     - Verify with `curl -sI "<url>" | head -1` returns HTTP 200
   - **Unsplash** (alternative): Search `site:unsplash.com [topic keywords]`
     - Build URL: `https://images.unsplash.com/photo-<id>?w=1200&h=630&fit=crop&q=80`
   - **Pexels** (fallback): Search `site:pexels.com [topic keywords]`
   - Before finalizing each image, re-check its ID against the step 0 blocklist — do not trust memory of what "seems new," grep again if unsure.
4. **Plan 2-4 data visualizations** from researched statistics
   - Select diverse chart types (see `skills/blog/references/visual-media.md`)
   - Map data points to chart formats
5. **AI image generation** (optional, if nanobanana-mcp configured):
   - If stock photo results are insufficient (< 3 good matches) or topic is too niche
   - Generate custom hero image and/or inline illustrations via `blog-image` sub-skill
   - Stock photos remain default - AI generation supplements, never replaces
6. **NotebookLM research** (optional, if user has relevant notebooks):
   - If the user mentions a NotebookLM notebook or the topic aligns with a configured notebook
   - Query via `blog-notebooklm` for source-grounded data from user-uploaded documents
   - Treat NotebookLM responses as Tier 1 sources (user's own primary documents)
   - Falls back silently if not configured or not authenticated
7. **Find relevant YouTube videos** (2-3 per post):
   - Use `blog-google` youtube command or WebSearch `site:youtube.com [topic] [year]`
   - Apply quality criteria from `skills/blog/references/video-embeds.md` (min score 50/100)
   - Select 2-3 best videos. Falls back silently if none found.

### Phase 3: Outline Generation

Create a structured outline before writing. If a template was loaded in Phase 1.5,
adapt this skeleton to match the template's section structure:

```
# [Title as Question - Include Primary Keyword]

## Introduction (100-150 words)
- Hook with surprising statistic
- Problem/opportunity statement
- What the reader will learn

> **Key Takeaways**
> - [Core finding with statistic and source]
> - [Second key insight or recommendation]
> - [Third actionable takeaway]
> (3-5 bullets, 40-60 words combined)

## H2: [Question Format] (300-400 words)
- Answer-first paragraph (40-60 words with stat + source)
- Supporting evidence
- [Image placement]
- Practical advice
- [CITATION CAPSULE placeholder]
- [INTERNAL-LINK: anchor text → target description]

## H2: [Question Format] (300-400 words)
- Answer-first paragraph
- [Chart: type + data description]
- Analysis and implications
- [CITATION CAPSULE placeholder]
- [INTERNAL-LINK: anchor text → target description]

## H2: [Statement for Variety] (300-400 words)
- Answer-first paragraph
- Real-world example or case study
- [Image placement]
- [CITATION CAPSULE placeholder]

## H2: [Question Format] (300-400 words)
- Answer-first paragraph
- [Chart: type + data description]
- Step-by-step guidance
- [CITATION CAPSULE placeholder]
- [INTERNAL-LINK: anchor text → target description]

## H2: [Question Format] (200-300 words)
- Answer-first paragraph
- Forward-looking analysis

## [CTA Section or Inline Placement]
- See `skills/blog/references/cta-placement.md` for placement rules by content type
- Place CTA after value delivery, not at arbitrary positions
- Single focused CTA per post (266% more conversions)
- [CTA: contextual call-to-action matching article topic]

## FAQ Section (3-5 questions, 40-60 words each answer)
- [INTERNAL-LINK: anchor text → detailed content]

## Conclusion (100-150 words)
- Key takeaways (bulleted)
- Call to action
- [INTERNAL-LINK: anchor text → next logical content]
```

Present the outline to the user for approval before writing.

**Visual element pacing**: Insert `[IMAGE]`, `[CHART]`, `[VIDEO]`, or `[CALLOUT]` markers
every 300-500 words. Alternate types (no consecutive same-type). See
`skills/blog/references/content-rules.md` Visual Rhythm section and
`skills/blog/references/cta-placement.md` for CTA positioning.

### Phase 4: Chart Generation (Built-In)

When the researcher identifies chart-worthy data (3+ comparable metrics, trend data,
before/after comparisons):

1. Select chart type using the diversity rule (no repeated types per post)
2. Invoke `blog-chart` sub-skill with: chart type, title, data values, source, platform format
3. Embed the returned SVG directly in the post within a `<figure>` wrapper
4. Target 2-4 charts per 2,000-word post
5. Distribute charts evenly - never cluster them

See `skills/blog/references/visual-media.md` for chart type selection and styling rules.

### Phase 5: Content Writing

Write the full article following these rules:

#### 5a. Frontmatter
```yaml
---
title: "[Question-format title with primary keyword]"
description: "[Fact-dense, 150-160 chars, includes 1 statistic]"
coverImage: "[URL from Pixabay/Unsplash/Pexels or generated SVG path]"
coverImageAlt: "[Descriptive sentence about the cover image]"
ogImage: "[Same as coverImage, or custom OG image URL]"
date: "YYYY-MM-DD"
lastUpdated: "YYYY-MM-DD"
author: "[Author name]"
tags: ["keyword1", "keyword2", "keyword3"]
---
```

If the platform uses a different field name (e.g., `image`, `hero`, `thumbnail`),
adapt to match the project's existing frontmatter convention.

#### 5b. Summary Box (Key Takeaways)

Immediately after the introduction (before the first H2 body section), add a summary box:

```markdown
> **Key Takeaways**
> - [Core finding with statistic] ([Source], year)
> - [Second key insight or recommendation]
> - [Third actionable takeaway]
```

Requirements:
- 3-5 bullet points, 40-60 words combined
- Must be self-contained - understandable without reading the article
- Include 1 specific statistic with source name
- State the key finding, recommendation, or answer
- Default label: "Key Takeaways". If a persona is active, use the persona's summary_label
- Backward compatible: accept existing TL;DR boxes during rewrites

#### 5c. Answer-First Formatting (Critical)
Every H2 section MUST open with a 40-60 word paragraph containing:
- At least one specific statistic with source attribution
- A direct answer to the heading's implicit question

Pattern:
```markdown
## How Does X Impact Y in 2026?

[Stat from source] ([Source Name](url), year). [Direct answer to the heading
question in 1-2 more sentences, explaining the implication and what this means
for the reader.]
```

**FLOW evidence triple (drafting requirement, not just audit):**

Every public statistic must carry three components AT DRAFTING TIME:

1. **Year anchor in prose.** Write "In 2026," or "As of Q1 2026," BEFORE
   the statistic, in the sentence body. Year buried inside parentheses
   does not count. Example:
   - GOOD: "In 2026, Ahrefs found a 58% lower CTR for position one when
     an AI Overview was present."
   - WEAK: "Position-one CTR dropped 58% (Ahrefs, 2026)."

2. **Inline citation with publisher and title.** Name both the publisher
   and the document title (or report name), not just a brand. Example:
   - GOOD: "Ahrefs, AI Overviews CTR update, December 2025"
   - WEAK: "Ahrefs reported..."

3. **URL plus retrieval date in the source block at the bottom of the post.**
   Provenance discipline lets future readers and AI crawlers verify the
   source still says what was claimed. Format:
   - "[Publisher], [Title], retrieved YYYY-MM-DD, [full URL]"

**FLOW quality bar (drop or replace):**
Public claims must use verified sources OR stay qualitative. If a statistic
cannot be verified, drop it. If it is contradicted by a more recent source,
replace it with the verified alternative. Do not soften vague language to
keep an unsourceable number.

For evidence-led optimization prompts (CTR audit, AI detector test, schema,
PAA rewording, ChatGPT visibility), see `/blog flow optimize`.

#### 5d. Information Gain Markers

Distribute at least 2-3 information gain markers throughout the article. These
signal to search engines and AI systems that the content contains original value
not available elsewhere.

Tag each with a comment or visible marker:

- `[ORIGINAL DATA]` - Proprietary surveys, experiments, A/B test results, case
  study metrics the author collected first-hand
- `[PERSONAL EXPERIENCE]` - First-hand observations, lessons learned from direct
  involvement, "when we tried X, Y happened" narratives
- `[UNIQUE INSIGHT]` - Analysis others haven't made, contrarian perspectives
  backed by data, novel connections between existing research

Placement:
- Weave into the body text naturally
- Use as inline comments: `<!-- [ORIGINAL DATA] -->` before the relevant paragraph
- Or as visible callouts if the format supports it:
  ```markdown
  > **Our finding:** [original observation backed by specific data]
  ```
- Minimum 2 per post, target 3 for comprehensive articles

These markers map directly to the "Originality/unique value markers" criterion
in the Content Quality scoring category (see `skills/blog/references/quality-scoring.md`).

#### 5e. Citation Capsules

For each major H2 section, generate a citation capsule - a 40-60 word self-contained
passage designed so AI systems can extract and quote it directly.

Requirements per capsule:
- 40-60 words, self-contained (makes sense in isolation)
- Contains: one specific claim + one data point + source attribution
- Written in a declarative, quotable style
- Placed within the H2 section body (not as a separate block)

Example:
```markdown
According to a 2026 Gartner study, 58% of enterprise buyers now consult AI
assistants before contacting a vendor ([Gartner](https://www.gartner.com), 2026).
This shift means B2B content must answer specific questions concisely enough
for AI systems to extract and cite in their responses.
```

Capsules map to the "AI Citation Readiness" scoring category (15 points) in
`skills/blog/references/quality-scoring.md`.

#### 5f. Internal Linking Zones

Mark internal linking opportunities throughout the article using placeholder
notation. The user (or a follow-up pass) will resolve these to actual URLs.

Zone placement:
- **Introduction** - Link to related pillar content or topic hub
- **Each H2 section** - Link to supporting articles, deeper dives, related tools
- **FAQ section** - Link answers to detailed content that expands on the answer
- **Conclusion** - Link to the next logical piece of content the reader should consume

Format:
```markdown
[INTERNAL-LINK: anchor text → target description]
```

Example:
```markdown
For a deeper dive into keyword clustering, see our
[INTERNAL-LINK: complete guide to keyword clustering → pillar page on keyword research methodology].
```

Target 5-10 internal link zones per 2,000-word post. Use descriptive anchor text
(never "click here" or "read more"). See `skills/blog/references/internal-linking.md` for
anchor text rules and linking strategy.

#### 5g. Paragraph Rules
- Every paragraph: 40-80 words (never exceed 150)
- Every sentence: max 15-20 words
- Start each paragraph with the most important information
- Target Flesch Reading Ease: 60-70

#### 5h. Heading Rules
- One H1 (title only)
- H2s for main sections (60-70% as questions)
- H3s for subsections only - never skip levels
- Include primary keyword naturally in 2-3 headings

#### 5i. Image Embedding

Standard markdown:
```markdown
![Descriptive alt text - topic keywords naturally](https://cdn.pixabay.com/photo/...)
```

MDX with Next.js Image (if detected):
```mdx
![Descriptive alt text - topic keywords naturally](https://cdn.pixabay.com/photo/...)
```

- Place images after H2 headings, before body text
- Space evenly throughout the post (not clustered)
- Alt text should be a full descriptive sentence

#### 5j. Chart Embedding

Standard markdown/HTML:
```html
<figure>
  <svg viewBox="0 0 560 380" ...>...</svg>
  <figcaption>Source: [Source Name], [Year]</figcaption>
</figure>
```

MDX format:
```mdx
<figure className="chart-container" style={{margin: '2.5rem 0', textAlign: 'center', padding: '1.5rem', borderRadius: '12px'}}>
  <svg viewBox="0 0 560 380" ...>...</svg>
</figure>
```

#### 5k. Video Embedding
Embed YouTube videos using srcdoc lazy-loading pattern from `skills/blog/references/video-embeds.md`.
Include aria-label, noscript fallback for AI crawlers. Place after relevant H2, 500+ words apart.

#### 5l. Citation Format
Inline attribution (always):
```markdown
Organic CTR declined 61% with AI Overviews ([Seer Interactive](https://www.seerinteractive.com/), 2025).
```

#### 5m. FAQ Section
Add 3-5 FAQ items with 40-60 word answers. Each answer must contain a statistic.

For MDX with FAQSchema component:
```mdx
<FAQSchema faqs={[
  { question: "Question?", answer: "40-60 word answer with statistic and source." },
]} />
```

For standard markdown:
```markdown
## Frequently Asked Questions

### Question text here?

Answer with statistic and source attribution (40-60 words).
```

#### 5n. Internal Linking
- 5-10 internal links per 2,000-word post
- Link to relevant existing content naturally
- Use descriptive anchor text (not "click here")

### Phase 6: Quality Check

Before delivering, verify:

#### Structure and Content
1. Every H2 opens with a statistic + source
2. No paragraph exceeds 150 words
3. All statistics have named tier 1-3 sources
4. 2-4 charts with type diversity
5. 3-5 inline images with descriptive alt text
6. Cover image present in frontmatter (coverImage + ogImage)
7. FAQ section present with 3-5 items
8. Heading hierarchy is clean (H1 -> H2 -> H3)
9. Meta description is 150-160 chars with a stat

#### New Element Verification
10. TL;DR box present after introduction (40-60 words, contains statistic + source)
11. At least 2-3 information gain markers (`[ORIGINAL DATA]`, `[PERSONAL EXPERIENCE]`, or `[UNIQUE INSIGHT]`)
12. Citation capsules present in major H2 sections (40-60 words, self-contained, quotable)
13. Internal linking zones marked in introduction, H2 sections, FAQ, and conclusion
14. No AI-detectable phrases from banned list (see `agents/blog-writer.md`)

#### Burstiness and Naturalness Check
15. **Sentence length variance** - Verify a mix of short (8-word) and long (25-word) sentences. Uniform sentence length signals AI authorship.
16. **Banned AI phrase scan** - Check for and remove:
    - "in today's digital landscape", "it's important to note", "dive into"
    - "game-changer", "navigate the landscape", "revolutionize", "seamlessly"
    - "cutting-edge", "harness the power of", "leverage" (as verb)
    - "delve", "crucial", "elevate", "foster", "landscape" (overused)
    - "multifaceted", "robust", "tapestry", "embark"
    - Full list in `agents/blog-writer.md`
17. **Contractions** - Verify natural use of contractions ("it's", "we've", "don't", "isn't"). Formal AI prose avoids contractions; natural writing uses them.
18. **Rhetorical questions** - Verify at least one rhetorical question every 200-300 words to break up declarative patterns.
19. **YouTube videos** - 2-3 embeds with lazy loading, aria-labels, and noscript fallback (see `skills/blog/references/video-embeds.md`)

#### Num Nums Bakery HTML Project — Non-negotiable Pre-publish Checklist

These rules are derived from real audit failures on this project. Every point must pass before delivery. Do NOT ask the user to fix these — resolve them before showing the draft.

**Structural verification — one command, run it before every commit**
- [ ] `node verify-blog.mjs` exits **0**. It mechanically checks every structural rule in this section: post files = index cards = `sitemap.xml` = `llms.txt`, redirects = that + 1, no duplicates, no orphans, no stray `.html`, every `rel="canonical"` matching its clean URL, and every Topics chip count matching the real card distribution. It names the exact file and slug on failure. Run it after writing the batch **and** again after any `blog-drafts` → `main` merge. The hand-counting it replaces is what let 5 posts get listed twice in `llms.txt` on 2026-07-26.

**Visual verification (Phase 6.5 Gate 3) is unavailable in this cloud sandbox — do not block on it**
- [ ] A 2026-07-30 run (5-post batch: South Windsor, West Ryde, Confirmation, Diabetics, Cake Smash vs First Birthday) found `node screenshot.mjs` / Puppeteer fails with "Could not find Chrome" in this project's cloud sandbox — no Chrome binary is installed, unlike the `C:/Users/nateh/...` Windows path CLAUDE.md documents for local sessions. The same applies to the `blog-write` skill's own Phase 6.5 Gate 3 (patchright visual verification at 3 viewport widths) — it cannot run here either. Do not treat a missing screenshot pass as a blocker in this environment: substitute the structural/programmatic checks this checklist already requires (word count, Flesch score via `textstat`, JSON-LD `json.loads` parsing, `grep` for hex/colour/tag-balance issues, link/image existence checks) and note in the delivery summary that visual verification wasn't possible in this session, the same way the image-verification fallback below is already handled.

**Branch state — do this BEFORE picking a topic (Step 0 in `HOW-TO-ADD-BLOG-POSTS.md`)**
- [ ] `git fetch origin && git checkout blog-drafts && git merge origin/main && git merge origin/blog-drafts` **before** any coverage check or topic pick. `main` does not show posts sitting unmerged on `blog-drafts`, so a suburb that looks free from `main` may already be claimed. Merging `main` in at the **start** keeps the conflict surface to one day of drift instead of a month.
- [ ] Never run the coverage `ls blog/` / grep pass on `main` or a detached HEAD. Re-run it *after* the checkout and merge above.
- [ ] If the merge conflicts, resolve it with the **Step 5b playbook** in `HOW-TO-ADD-BLOG-POSTS.md` — do not abort and write anyway. Conflicts in `sitemap.xml` / `llms.txt` / `SKILL.md` / `HOW-TO-ADD-BLOG-POSTS.md` are additive on both sides, not contradictory. Two consecutive runs (2026-07-24, 2026-07-25) each aborted a resolvable merge and stranded 10 finished posts for two days.

**Canonical URL format — clean, never `.html`**
- [ ] Every public reference to a post is `https://numnumsbakery.com.au/blog/<slug>` with **no `.html`**: `rel="canonical"`, `og:url`, sitemap `<loc>`, `llms.txt`, index-card `href`, and internal body links. `netlify.toml` 301s `.html` → clean with `force = true`, so a published `.html` URL is a redirect URL that Google reports as "Page with redirect" and refuses to index.
- [ ] Index-card links are absolute `href="/blog/<slug>"`, **not** relative `href="<slug>.html"`. The stale card template caused 103 cards to carry a needless 301 hop.
- [ ] Add the `.html` → clean 301 to `netlify.toml` for each new post (Step 4b). Omitting it leaves both URLs serving 200 against one canonical — duplicate content. Verify: `grep -q "from = \"/blog/<slug>.html\"" netlify.toml`.
- [ ] After editing: `grep -c '\.html</loc>' sitemap.xml` must print **0**.

**No duplicate list entries**
- [ ] Before appending to `llms.txt`, confirm the slug isn't already listed — an unmerged earlier batch may have added it. After appending, `grep -o '^- https://numnumsbakery.com.au/blog/[a-z0-9-]*' llms.txt | sort | uniq -d` must print nothing. On 2026-07-26 five posts were listed twice because two runs each appended them.
- [ ] These counts must line up before committing: post files = index cards = sitemap blog entries = `llms.txt` entries, and `netlify.toml` blog redirects = that number **+ 1** (the extra is `/blog/index.html` → `/blog/`). As of 2026-07-26: 226 / 226 / 226 / 226 / 227. **Do not count these by hand — run `node verify-blog.mjs`**, which checks all five plus duplicates and orphans in one pass.

**Never leave a required workflow file untracked**
- [ ] A file that exists in the local working tree but was never `git add`ed is **invisible to the cloud routine and never deploys** — and nothing surfaces the problem until a step mysteriously fails. `indexnow.mjs` and its IndexNow key file sat untracked from 2026-07-11 to 2026-08-17, so the key 404'd on the live site and every IndexNow submission would have been rejected, silently, for every post. If a routine step references a file, confirm `git ls-files <file>` prints it. `node verify-blog.mjs` now enforces this for `indexnow.mjs`, the IndexNow key, `serve.mjs` and `netlify.toml`.
- [ ] IndexNow (Step 6) only works **after the Netlify deploy is published** — auto-publish is off. Confirm the key returns 200 at `https://numnumsbakery.com.au/8a811016cc8e6931dbe358599d9112e9.txt` before pinging; a 404 means every submission is rejected. Never report a ping as done without that check.
- [ ] **In cloud/sandboxed sessions, the key-check `curl` can fail outright with a connection error (e.g. `curl: (56) CONNECT tunnel failed`), not just a 404**, if the egress proxy blocks `numnumsbakery.com.au` the same way it blocks `images.unsplash.com`/`cdn.pixabay.com` (see image-reuse section). A 2026-08-02 run (5-post batch: Old Guildford, Tregear, Eid Milad-un-Nabi, Eggless Cake vs Sponge Cake, Sheet Cake Sydney) hit exactly this. Do not run `node indexnow.mjs` in that case — skip the ping for the run and state the skip explicitly in the delivery summary, so a later run or the site owner pings once the deploy is confirmed published and reachable.

**Meta & SEO**
- [ ] Meta description must contain at least **2 concrete numbers** (distances, times, counts, percentages). "Order in 48 hrs" alone is not enough. Pattern: `"100% eggless [product] near [suburb] — [N] flavours, [distance] from [location]. Order with [timeframe] notice."`
- [ ] Title tag: must include primary keyword + location. Max 60 chars.
- [ ] **Count title length on the decoded string, not the raw HTML.** A 2026-07-27 batch (5-post run: Birrong, Kenthurst, Thaipusam, Cake Transport, Cake Toppers) found a title written as `Eggless Cake Transport &amp; Packaging Guide Sydney | Num Num's Bakery` measured at 70 characters by a naive `len()` on the raw `<title>` text — over the 60-char limit — but the entity `&amp;` renders as a single `&` in the browser, so the real displayed length was 66, still over but by less. Always run `html.unescape()` (or equivalent) on the title string before counting length; counting raw HTML entities as their multi-character source silently overstates length and can also mask a genuine overage in the other direction. Prefer avoiding `&amp;`/`&` in titles entirely — rewrite around it (e.g. "Transport Guide" instead of "Transport & Packaging Guide") rather than relying on entity-aware counting every time.

**LCP / Image Performance**
- [ ] The **first image in the article body** (likely the LCP element) must have `fetchpriority="high"` and must NOT have `loading="lazy"`. All subsequent images use `loading="lazy"`.
- [ ] All images must be `.webp` format with descriptive alt text (full sentence, includes product + location).
- [ ] **Unsplash CDN URLs must use `?fm=webp`**, not `?fm=jpg`. The researcher returns `fm=jpg` by default — always replace before embedding. Pattern: `https://images.unsplash.com/photo-<id>?fm=webp&q=80&w=1200&auto=format&fit=crop`

**Meta & description length**
- [ ] Meta description must be ≤ 160 characters. Count it. Truncation at 160 chars in SERPs means the phone number or key CTA gets cut — trim from the middle, keep the numbers and CTA at the end.

**Entity / Organization schema (every post)**
- [ ] Every post's JSON-LD `@graph` must include an **`Organization` entity node** with `@id: https://numnumsbakery.com.au/#organization`, referenced as the Article `publisher`. Its `sameAs` array must list the brand's Instagram, Facebook, AND the Wikidata entity `https://www.wikidata.org/wiki/Q140076208`. The Wikidata link anchors Num Num's Bakery as a recognised entity for AI / knowledge-graph citation — never omit it. The reference Quakers Hill template references `#organization` as publisher but does NOT define the node; you must add it when copying the template.

**External Links — mandatory**
- [ ] Every post must include **at least 2 outbound links** to authoritative tier 1-3 external sources. Acceptable sources for this project:
  - ABS (abs.gov.au) — population, suburb growth, demographic data
  - NSW Education (education.nsw.gov.au) — school term/holiday dates
  - Food Standards Australia (foodstandards.gov.au) — dietary/allergen info
  - NSW Health (health.nsw.gov.au) — food safety context
  - Google Maps (maps.google.com) — travel time reference
  - These links should be placed naturally in the body — never in a "Sources" section bolted on at the end.

**Answer-First H2 openers — every section, no exceptions**
- [ ] Every H2 must open with a paragraph that directly answers the heading's question AND includes either an external stat OR a specific first-party claim with clear provenance. "The most common question we get…" is NOT an answer-first opener. Correct pattern: `[Direct answer statement with a specific number or fact] ([Source]). [1-2 sentences expanding the answer.]`
- [ ] If no external stat exists for a section, use a qualified first-party statement: "From our [N] years of orders / From our internal data / From orders across [area]…" — this makes provenance explicit without fabricating a source.
- [ ] **Sections that rely on personal/internal experience must still open with a sourced stat.** The internal data paragraph comes second, after the stat. Never let a [PERSONAL EXPERIENCE] or [ORIGINAL DATA] marker become the first sentence of an H2 section.

**Chart / SVG colour palette (interior is always pink)**
- [ ] Charts and SVGs in the post interior use the standard pink/cream palette (`#C85478`, `#E8A4B5`, espresso `#2C1A0E` on `#FFF8F2`) regardless of the hero gradient. The post interior is always pink-themed — only the hero and the index card use the topic gradient colour (blue/green/burgundy/etc.). At most ONE bar may use the hero accent colour (as the reference Quakers Hill projection bar uses `#7C3A1E`). Do NOT colour entire charts blue/green/burgundy to match the hero — that contradicts the "post interior uses the standard pink palette" rule.
- [ ] **Orphan `#7C3A1E` chart bar when copying the reference template.** The Quakers Hill reference has an orange hero, so its interior charts use `#7C3A1E` for the single "accent" bar. When you copy that template into a NON-orange post (Blue/Northwest, Pink/Eggless, Burgundy, etc.), `grep` for `#7C3A1E` in the finished file: it should appear ONCE (the skeleton-overlay hero block, which you recolour to the new hero's darkest colour) — never inside a `<rect>` in the chart SVG. A leftover orange bar matches neither the pink interior palette nor the new hero accent. Recolour it to `#C85478` (pink) or to the new post's hero accent colour. After recolouring the skeleton block, `grep -c "7C3A1E"` should return 0.

**Chart / SVG data integrity**
- [ ] Charts using exact percentages (e.g. 72%, 65%) must clarify in the figcaption that the data is internal/first-party. Never present internal percentages in a way that implies third-party research.
- [ ] Figcaption format: `"Approximate [metric] — [Business Name] internal [order/sales/customer] data, [year range]. [Any methodological note if needed.]"`
- [ ] Never include "Multiple themes could be selected" or other survey-methodology language unless you actually ran a survey.
- [ ] **Validate every SVG `fill`/`stroke` is a real hex colour before committing.** A typo'd fill (e.g. `fill="#A8days"`) renders an invisible or black bar and silently breaks the chart. After writing any chart, `grep` the SVG for `fill="#"` values and confirm each is a valid 3- or 6-digit hex. Also confirm there are no duplicate/stray `<rect>` left over from copy-paste.

**Internal linking — body text**
- [ ] Every reference to another page on the site (e.g. "our cakes", "the order page", "locations") must be a working `<a href>` hyperlink — never plain text.
- [ ] Minimum internal links per post: 5 (sidebar and related posts do not count toward this minimum — body text links only).

**Sidebar related-post links**
- [ ] Every URL in the sidebar "Related Posts" block must point to a **file that already exists** in `blog/`. Check with `ls blog/` before writing. A 404 in the sidebar harms crawlability and user trust. If the target post doesn't exist yet, replace with the nearest existing post on the same topic.

**Topics filter dropdown (blog/index.html) — update every post**
- [ ] The blog index sidebar has a **Topics filter** with hard-coded counts (`<span class="tag-count">N</span>` inside each `<label class="tag-item" data-tag="…">`). These do NOT auto-compute, so they go stale every time a card is added. After adding the index card, increment the **All** count and each count matching the new card's `data-topics`. Verify the whole dropdown against the real card distribution before committing — `node verify-blog.mjs` does this automatically and reports any chip that is off, plus any `data-topics` tag that has no chip at all.
- [ ] **Don't blindly add +1 when posts may be published in parallel/batches.** A 2026-07-21 audit (Yennora post) found the dropdown's stored "All" baseline (208) was already 3 cards behind the file's real count (212) before this post's own card was even added — other posts had landed concurrently and their counts were never synced. Simply incrementing the previously-documented number by 1 would have locked in a wrong, stale total. Always re-run the regex-count verification script fresh immediately before committing and set every `tag-count` (including ones your own card didn't touch, like `festivals`) to the freshly computed real value, never to "old count + 1".
- [ ] **No orphan `data-topics`.** Every tag on a card must have a matching chip in the dropdown and must come from the documented tag list. Never introduce an undocumented tag (e.g. `kids-cakes`) — a tag with no chip is invisible to the filter; use the documented equivalent (a kids' birthday post is `birthday`).
- [ ] **No duplicate or missing cards.** Every `blog/*.html` file must have exactly one card in `#blog-grid`, and no `href` should appear on more than one card (a 2026-07-14 audit found a pre-existing 120-line block of 5 cards duplicated verbatim, plus one real post with zero cards). Before committing any index.html change, run: extract every card `href`, confirm the set is duplicate-free, and confirm it matches the set of files in `blog/` exactly (no file missing a card, no card pointing at a nonexistent file).
- [ ] **Normalize hrefs before comparing — the index mixes two link conventions.** A 2026-07-21 audit (Yennora post) found that `blog/index.html` cards use two different `href` styles interchangeably: some use a relative filename (`href="eggless-cakes-x.html"`, the style documented in this file's own card template) and others use an absolute extension-less path (`href="/blog/eggless-cakes-x"`). A naive duplicate/missing-card check that treats these as different strings will falsely report ~130 "missing cards" and ~130 "cards pointing at nonexistent files" that don't actually exist. Before comparing, strip any leading `/blog/` and any trailing `.html` from every href to get a canonical slug, then compare slug sets — only then trust the duplicate/missing result.

**Nearest-location accuracy (suburb posts)**
- [ ] Num Num's has TWO shops: **Harris Park** (96/96 Wigram Street, NSW 2150, open daily 11 am–10 pm) and **Riverstone** (Shop 8, Riverstone Shopping Centre, NSW 2765, Mon–Fri 6 am–8 pm / Sat–Sun 7 am–7 pm). A suburb post must lead with the genuinely **closest** shop, not default every suburb to Riverstone. Parramatta-LGA and western suburbs (Parramatta, Harris Park, Rosehill, Camellia, Granville, Clyde, Rydalmere, Westmead, Merrylands, Holroyd) lead with **Harris Park**; north-west suburbs (Quakers Hill, Schofields, The Ponds, Marsden Park, Box Hill, Riverstone, Tallawong) lead with **Riverstone**. The other shop is mentioned second as the alternate. The LocalBusiness schema `@id`, address, hours, and `areaServed` must match the lead shop.

**Branch state reality check (do this before picking a suburb/topic/keyword, not after)**
- [ ] **Always run the `ls blog/` coverage check AFTER checking out `blog-drafts`, never while still on `main` or a detached HEAD.** A 2026-07-25 session ran its initial coverage scan on `main` (before switching branches), found every suburb in the routine's priority list already covered, then checked out `blog-drafts` and discovered it was already 5 posts ahead of `main` (Dundas, Woodcroft, Bhai Dooj, Eggless Cake vs Cupcakes, Cake Serving Size Guide) from a prior session that had committed to `blog-drafts` but never merged to `main`. `blog-drafts` routinely holds unmerged posts `main` doesn't have — a suburb/topic/keyword that looks free from `main` may already be claimed there. Re-run the coverage `ls`/grep pass immediately after `git checkout blog-drafts`.

**Suburb reality check (do this during research, before writing)**
- [ ] Before writing a suburb post, verify the suburb's **actual postcode** and whether it has a meaningful **residential population** via ABS QuickStats / Community Profile. Some "suburbs" on a priority list (e.g. **Clyde 2142**, Camellia) are tiny industrial/rail localities with near-zero usual residents and a postcode that differs from the nearest shop's. Do NOT assume a suburb shares Harris Park's 2150 postcode, and do NOT fabricate suburb-level demographic stats for a suburb that has almost no residents.
- [ ] For low-population/industrial suburbs, frame honestly ("one of Sydney's smallest, most industrial pockets") and lean on **LGA-level data** (City of Parramatta, Cumberland City Council) described as "the surrounding area / suburbs that ring [suburb]", citing profile.id / forecast.id. State the tiny resident count plainly rather than inventing families.

**Meta-reference leakage — scan for accidental references to project instructions before delivery**
- [ ] A 2026-08-05 run (Wentworth Point post) caught, during the Flesch simplification pass, a sentence that had drifted into referencing the *task itself* rather than the reader: "...we've leaned on the surrounding local government area instead, as the Non-negotiable checklist for this project requires when suburb-exact data isn't confirmable." This reads naturally enough on a fast pass that it almost shipped — the sentence is grammatically fine and sits in a plausible spot (explaining why LGA-level data was used instead of a suburb-exact figure), but "the Non-negotiable checklist for this project requires" is an internal authoring instruction, not something a bakery customer should ever read. Before delivery, grep the finished file for tell-tale meta-vocabulary that only belongs in the prompt/checklist, never in reader-facing prose: `checklist`, `non-negotiable`, `this project`, `the routine`, `the task`, `per the rules`, `as instructed`. Any hit inside `.article-body` (not inside an HTML comment) is a leak — rewrite the sentence to state the fact plainly instead of citing the source of the writing rule.

**Priority suburb list is now exhausted — read this before picking POST 1 / POST 2 topics**
- [ ] As of the 2026-08-01 run (North Kellyville, Yagoona), **every suburb named in the routine's own priority list is already covered** (Parramatta, North Parramatta, Westmead, Granville, Merrylands, Rosehill, Rydalmere, Auburn, Quakers Hill, Schofields, The Ponds, Box Hill, Marsden Park, Rouse Hill, Tallawong, Kellyville, Castle Hill — all present in `blog/`). Do not spend time re-checking that list suburb-by-suburb; it is fully claimed. Go straight to picking an adjacent, genuinely uncovered suburb instead.
- [ ] To find the next suburb: run `ls blog/ | grep '^eggless-cakes-' | sed 's/eggless-cakes-//;s/\.html//' | sort` to see the full covered list (230+ suburbs as of this run), then pick a real, named Sydney suburb bordering an already-covered one in the correct catchment (e.g. North Kellyville borders the already-covered Kellyville/Kellyville Ridge/Rouse Hill for Riverstone; Yagoona borders the already-covered Birrong/Chester Hill/Regents Park for Harris Park). Verify the candidate isn't already in that grep output before committing to it.
- [ ] Still run the full **suburb reality check** above on whatever new suburb you pick — real postcode, real ABS population figure, genuine nearest-shop determination by drive time. Do not skip that step just because the suburb wasn't on the original priority list.

**H2 heading style**
- [ ] At least 60% of H2s must be question-format (end with `?`). Check before delivery.
- [ ] No H2 heading should end mid-thought without punctuation. A heading like "What Size Cake Do You Need" (missing `?`) is a failure.

**Hero gradient consistency (non-default gradients)**
- [ ] When a post uses a hero gradient other than the default orange (e.g. Blue/Northwest, Pink/Eggless, Burgundy/Birthday), update ALL four hero elements to match, not just `.page-hero`: (1) the `.page-hero` background gradient, (2) the `.page-hero::after` radial tint, (3) the skeleton-overlay hero background colour (`#sk-overlay` inner block, default `#7C3A1E`), and (4) the hero breadcrumb link/`/`/label tints (default `rgba(255,210,180,…)`) plus the hero badge `background`/`border`/`color`. Leaving the orange defaults behind a blue/pink/burgundy hero is a visible mismatch on first paint. Match the chosen card palette's darkest colour for the skeleton block and its light accent for the badge text.

**Lenis smooth scroll**
- [ ] Every blog post HTML file must include the Lenis smooth scroll block immediately before `</body>`. Never omit it. The exact snippet is defined in the project memory file `feedback_lenis_smooth_scroll.md`.

**Readability (Flesch score) — suburb posts run low, fix during drafting**
- [ ] Suburb/location posts are stat-dense and address-dense (postcodes, LGA names, drive times, census figures), which structurally drags the Flesch Reading Ease score down — a 2026-07-17 audit found already-published reference posts (Quakers Hill, Auburn) sitting at Flesch 50–52, and a first draft of a new suburb post landed at Flesch 46, both below the 55–75 acceptable band in `skills/blog/references/quality-scoring.md`. Do not treat this as a post-hoc fix: while drafting, actively split compound sentences that stack an em-dash aside AND a trailing clause (e.g. "X — the Y that Z — happened because W") into two shorter sentences. Target average sentence length under 20 words in general prose paragraphs (citation-capsule and FAQ-answer sentences can stay longer, since they need to remain self-contained 40–60 word quotable units for AI citation — don't fragment those). Re-run a Flesch check (e.g. `textstat.flesch_reading_ease`) after drafting and again after any edit pass; if it's still under 55, do one more simplification pass on the 5–8 longest non-FAQ, non-citation-capsule sentences before considering the post done.
- [ ] **Unpunctuated `<li>` items silently wreck the Flesch calculation.** A 2026-07-17 audit (Grantham Farm post) found that `<li>` list items without a trailing period — e.g. `<li>Vanilla — classic, crowd-pleasing, works for every occasion</li>` with no `.` before `</li>` — get concatenated by sentence-splitting tools (and by `textstat`) into one giant run-on "sentence" spanning the entire list. This single artificially long sentence craters the average-sentence-length component of the Flesch score (one measured case: fixing this alone raised Flesch from 53.4 to 55.7 with zero prose changes). Always end every `<li>` item's visible text with `.`, `!`, `?`, or `:` before the closing `</li>` — check the flavour list, dietary/allergen list, and Quick Summary takeaway-box bullets specifically, since these are the lists most often left unpunctuated when copying the reference template.
- [ ] **The same unpunctuated-block bug also hits `<div class="suburb-card-title">` (and any other short label `<div>` in the suburb-card pattern).** A 2026-07-18 audit (Newington post) found that suburb-card titles like `<div class="suburb-card-title">Newington (postcode 2127) — 12–15 min</div>` with no trailing period get concatenated with the following card's title/detail text into one run-on "sentence" once tags are stripped for readability scoring, the same failure mode as unpunctuated `<li>` items. Always end every `suburb-card-title` div's visible text with a period (e.g. `— 12–15 min.`) before the closing `</div>`. Check any other short, tag-wrapped label text copied from the reference template for the same missing-punctuation risk — the bug is not limited to `<li>` elements.
- [ ] **`<h3>` subheadings with no trailing punctuation cause the same run-on concatenation, this time merging into the FOLLOWING paragraph.** A 2026-07-21 audit (Cake Delivery Areas Sydney coverage-hub post, a city-wide post organised into named suburb clusters like `<h3>Cumberland Belt</h3><p>South and west of Parramatta...</p>`) found that stripping tags for readability scoring joins the heading text directly onto the next paragraph's first sentence with no separator, producing single "sentences" of 46–67 words purely from the concatenation artefact — not from genuinely long prose. First draft landed at Flesch 51.2. Adding a trailing period to every `<h3>` visible text (e.g. `<h3>Cumberland Belt.</h3>`) removed the false concatenation; combined with splitting a handful of genuinely long analytical sentences, this raised the score to 55.3. Apply to any post using short `<h3>` cluster/section labels immediately followed by body prose, not just suburb-card patterns.
- [ ] **Readability degradation is not limited to suburb/address posts — any stat-or-citation-dense post is at risk.** A 2026-07-17 audit (Lower-Sugar Eggless Cake Options post, a non-suburb dietary/health-angle topic post with no addresses or postcodes at all) found the identical Flesch problem: regulatory citations (FSANZ proposal numbers), percentage breakdowns (NDSS diabetes-type stats), and honesty/caveat clauses each stacked multiple qualifying clauses per sentence, landing the first draft at Flesch 48.7 — well below the 55-75 band. The same fix applied: split compound sentences carrying a stacked stat + qualifier + caveat into two or three shorter sentences during drafting. That single pass (no content removed) raised the score to 55.1. Apply the suburb-post Flesch discipline above to ANY post with dense regulatory/statistical/allergen-honesty content — dietary, allergy, health, or compliance topics — not only suburb/location posts.
- [ ] **A single-language-family topic (a specific non-English festival/culture post) can plateau below 55 even after several full simplification passes, because the syllables-per-word term in the Flesch formula — not sentence length — is the binding constraint.** A 2026-08-05 run (Chuseok/Korean harvest festival post) split every sentence over ~20 words across four separate passes, bringing average sentence length down to 14.6 words (well inside the "under 20" target) and reduced sentence-count filler adverbs (`specifically`, `deliberately`, `genuinely`, `consistently`, `typically`), but the score only rose from 46.3 to 51.3 and never crossed 55. The reason: required proper nouns and cultural terms (`Chuseok`, `songpyeon`, `ancestral`, `charye-sang`, `celebration`, `traditional`, `Australia`) are inherently 3+ syllables and cannot be swapped for shorter synonyms without losing factual or cultural accuracy — avg syllables/word stayed pinned at ~1.66-1.67 through every pass. **Do not keep iterating indefinitely chasing 55 on this kind of post.** After 3-4 passes with avg sentence length confirmed under 20 words and no further easy wins on filler-word removal, treat a score in the low-to-mid 50s as an accepted, documented exception for foreign-language-term-dense festival/cultural posts, and say so explicitly in the delivery summary rather than silently reporting the unmet target as if it passed.

**Word count & depth**
- [ ] Every post must contain **at least 2,000 words of body prose** (the article-body text, excluding SVG chart labels, nav, sidebar and footer). Count it before delivery — do not estimate. Posts that land at ~1,600–1,900 read as thin; expand with an extra question-format H2 section or deeper detail in existing sections until prose clears 2,000. **Re-count after EVERY edit pass, not just once** — top-up paragraphs frequently still leave a post 10–50 words short, so verify the final number is ≥ 2,000 immediately before `git add`. **City-wide and comparison posts (no single suburb anchor, e.g. "eggless cake vs regular cake", "best cake Sydney") consistently land shortest** — budget an extra question-format H2 from the outset rather than topping up at the end.
- [ ] Aim for **3–5 inline images** in the body (first one is the LCP image with `fetchpriority="high"`, the rest `loading="lazy"`) and **2–4 SVG charts** with even distribution.

**FAQ answer length — recount each answer individually, not just the section**
- [ ] FAQ answers routinely drift outside the 40–60 word band on a first draft even when the section as a whole reads fine. A 2026-07-18 audit (Annangrove post) found one of five FAQ answers landed at 36 words — just under the 40–60 word requirement — while the other four were compliant; the shortfall was easy to miss without counting each answer on its own. After drafting the FAQ section, count words in **each answer individually** (not an average across the section) and pad any answer under 40 words with a natural clarifying clause (a reason, a follow-up detail, a specific timeframe) rather than leaving it short.

**Key Takeaways / Quick Summary box word count — count the combined total, don't estimate**
- [ ] The Key Takeaways / Quick Summary box drifts outside the 40–60 word combined target on a first draft the same way FAQ answers do, even when every individual bullet reads fine on its own. A 2026-07-19 audit (Cake Price Guide Sydney post, a city-wide topic post) found the box landed at 88 words across 5 bullets on first draft — well over the 40–60 word target — because each bullet was judged individually for quality rather than summed for total length. After drafting the Key Takeaways/Quick Summary box, add up the word count across **all bullets combined** and tighten phrasing (drop redundant qualifiers, shorten to the essential number/fact) until the total sits inside 40–60 words, the same discipline already applied to FAQ answers.

**Comparison ("X vs Y") posts can silently skip the SVG chart requirement**
- [ ] A 2026-08-03 run (Eggless Cake Recipe vs Bakery Sydney post) found that building a comparison post around an HTML `<table class="compare-table">` — a natural fit for "X vs Y" content — satisfied the comparison structure but left the post with **zero SVG charts** on first draft, failing the "2-4 SVG charts, evenly distributed" requirement even though the table itself looked complete. An HTML comparison table is a good addition to a comparison post, but it is not a substitute for the chart requirement. After drafting any comparison-template post, explicitly count `<svg` chart blocks — a table is not a chart — and add at least one SVG chart (e.g. a bar chart visualizing one of the comparison's key numbers, such as time-cost or price) if the count is 0.

**Image reuse (mandatory check before every commit)**

⚠️ **Current state as of 2026-07-21: 667 image references across the blog draw on only 106
distinct images.** The worst offender (`photo-1558301211-0d8c8ddee6ec`) appears in **101 posts**;
three more appear in 86-89 each. This is the single most common quality failure in this workflow.
It went unchecked for months because this rule lived in a copy of SKILL.md that was never loaded.

- [ ] **Prefer Num Num's own photos.** The bakery has **342 real photos** on its CDN, listed in
  `GBP/image-bank.md` (`https://numnums-images.netlify.app/…`). Real product photography beats
  stock for both E-E-A-T and conversion, and the pool is 3× larger than the stock set currently
  in rotation. Use the bank for the hero and at least one inline image before reaching for stock.
- [ ] **If you do use stock, it must be genuinely new to the site.** Run:
  `grep -ohE '(images\.unsplash\.com/photo-[a-zA-Z0-9_-]+|cdn\.pixabay\.com/photo/[^"'"'"' )]+|images\.pexels\.com/photos/[0-9]+)' blog/*.html | sort -u`
  Every stock ID in the new post must be **absent** from that list. Do not reuse an existing ID
  "because it fits" — with 342 bank photos available there is no excuse.
- [ ] **Never reuse an image inside a single post.** Each of the 3-5 inline images must be distinct.
- [ ] After writing, confirm the distinct-image count went **up** by the number of new images you
  added: re-run the `sort -u | wc -l` count before and after. If it did not increase, you reused
  something.
- [ ] **Some cloud/sandboxed sessions block outbound `curl`/`WebFetch` to `images.unsplash.com`, `cdn.pixabay.com`, and even the project's own `numnums-images.netlify.app` CDN (403 "policy denial" from the egress proxy), so the SKILL's "verify with curl -sI" step can be impossible to run.** A 2026-07-24 session (5-post batch: Dundas, Woodcroft, Bhai Dooj, Cake vs Cupcakes, Cake Serving Size Guide) hit this — both stock CDNs and the real-photo bank were blocked. Do not fabricate a "verified" claim in that case. Instead: use `WebSearch` for `site:unsplash.com <topic>` queries, extract the real photo ID from the *individual photo page URL* the results return (pattern `unsplash.com/photos/<descriptive-slug>-<11-char-ID>`), cross-check that ID against the blocklist grep above, and flag in the delivery summary that live HTTP verification wasn't possible in this session. IDs beginning with a `-` are genuinely part of the 11-character ID (e.g. `-4ccYKuvc5A`) — when a search result's slug ends in a lone/ambiguous leading dash, prefer a different, unambiguous ID from the results rather than guessing whether the dash belongs to the ID.
- [ ] **Preferred fallback when the egress proxy blocks image verification entirely: use the site's own already-live `cake_photos/Product Images/<Flavour>.webp` files instead of stock photos.** A 2026-07-25 session (5-post batch: Doonside, Merrylands West, Sinhala & Tamil New Year, Eggless Cake Troubleshooting, Cake vs Dessert Table) found that even `curl` to arbitrary domains was blocked outright in that sandbox (proxy returned 403 for `images.unsplash.com` AND `numnums-images.netlify.app` alike), making the WebSearch-slug-ID method for Unsplash unverifiable in either direction. The 15 files at `https://numnumsbakery.com.au/cake_photos/Product%20Images/<Flavour>.webp` (one per menu flavour, e.g. `Chocolate.webp`, `Rasmalai.webp`) are already proven live — they're used as `og:image`/`twitter:image` in 199+ existing posts — and are genuinely `.webp` format, satisfying the LCP/webp checklist item with zero verification risk. Reusing them as **inline body images** (not just OG tags) is new for this project but safe: write alt text tied to the literal flavour name (e.g. "A Mango eggless cake from Num Num's Bakery...") since the filename guarantees the content, and rotate through different flavours per post so the same image isn't reused twice within one article.

**Information gain markers — visible callout HTML, not just HTML comments**
- [ ] A 2026-07-18 audit (Eggless Cake Calories Guide post) found the first draft implemented `[ORIGINAL DATA]`, `[PERSONAL EXPERIENCE]` and `[UNIQUE INSIGHT]` markers as invisible `<!-- [ORIGINAL DATA] -->` HTML comments per the "or as visible callouts if the format supports it" language above — technically present but not rendered on the page, so they carry no visible E-E-A-T/originality signal to readers or AI crawlers reading the rendered DOM. On this project, information gain markers must **always** render as a visible styled callout/blockquote block (e.g. a `.callout-box` div with a `.callout-label` showing `[Original Data]`, `[Personal Experience]`, or `[Unique Insight]`), never as an HTML comment only. Reuse the `.takeaway-box`-style pattern: white or tinted background, `#C85478` left border, uppercase label, one self-contained paragraph.

**Location accuracy — Harris Park vs Riverstone (two shops)**
- [ ] Num Num's has TWO locations. **Harris Park:** 96/96 Wigram Street, Harris Park NSW 2150 — open daily 11 am–10 pm. **Riverstone:** Shop 8, Riverstone Shopping Centre, Riverstone NSW 2765 — Mon–Fri 6 am–8 pm, Sat–Sun 7 am–7 pm. For a suburb post, choose the genuinely nearest shop as the primary "nearest location": **Harris Park** for Parramatta and central/western suburbs (Harris Park, Westmead, Granville, Merrylands, North Parramatta, Auburn, Rosehill, Rydalmere); **Riverstone** for the north-west (Quakers Hill, Schofields, The Ponds, Box Hill, Marsden Park, Rouse Hill, Tallawong).
- [ ] The LocalBusiness schema (address, geo, opening hours), the sidebar "Nearest Location" card, the footer address block, and every stated drive time/distance MUST all match the chosen nearest shop. Never claim a short drive time (e.g. "5 min" / "15 min") while pointing the schema or address block at the farther shop. Harris Park ≈ 5 min from Parramatta CBD; Riverstone ≈ 25–30 min from Parramatta.

**Allergen honesty (allergy / dietary posts)**
- [ ] Never imply a cake is "allergen-free" or safe beyond eggs. The kitchen is 100% **egg-free**, which removes the egg cross-contamination pathway — but cakes **contain dairy** (milk powder, butter) and **may involve nuts**, and standard cakes contain wheat. Disclose this explicitly in any egg-allergy or dietary post.
- [ ] For severe/anaphylactic egg allergy, include an honest caveat: tell customers to state their needs when ordering and follow their own medical / ASCIA-aligned advice. Do not promise medical-grade safety. Cite ASCIA (allergy.org.au) and Allergy & Anaphylaxis Australia (allergyfacts.org.au) as authoritative sources.

**Non-allergen certification honesty (kosher, halal, low FODMAP, and similar claims)**
- [ ] A 2026-08-04 run (Hanukkah post, Low FODMAP post) found the same honesty discipline used for egg allergy also applies to other formal certifications the bakery does **not** hold. "100% eggless" is easy to misread as covering unrelated certifications — kosher, halal, or Monash University's low FODMAP certification — none of which follow from an egg-free kitchen. Never let a post imply a certification exists by omission. State plainly, in its own sentence, that the bakery is **not** certified for whatever the reader might be assuming (e.g. "We are not a certified kosher kitchen" / "We are not a Monash-certified low FODMAP kitchen"), then explain what the egg-free claim *does* cover. Do this in the FAQ schema too, not just the body prose — the FAQ is often the only part an AI assistant surfaces.
- [ ] This applies to any post built around a dietary or religious framework broader than eggs (festival posts, FODMAP/IBS posts, halal posts, etc.). Before publishing, scan the draft for any sentence that could be read as claiming a certification the business doesn't have, and add an explicit disclaimer next to it.

**Non-suburb / city-wide & topic posts (schema + length)**
- [ ] For posts that are NOT anchored to a single suburb (e.g. corporate events, "order a cake online", "egg allergy", broad "cake"/"eggless cake" keyword posts), include **BOTH** LocalBusiness nodes in the schema `@graph` — `#harrispark` and `#riverstone` — each with `areaServed: "Greater Sydney"`. Do NOT force a single "nearest shop", and do NOT state specific drive-time claims (there is no anchor suburb to measure from). The sidebar and footer should show both shops.
- [ ] City-wide / topic / comparison posts land short on the first draft almost every time — they routinely come in at ~1,850–1,900 words. **Budget an extra question-format H2 from the outset** and re-count after every edit; expect to add one section to clear 2,000.

### Phase 6.5: Delivery Contract Enforcement (v1.9.0)

Before Phase 7, run the 5-gate delivery contract per `skills/blog/references/blog-delivery-contract.md`. The user is never the first reviewer; the gates are.

Steps:

1. **Capability discovery + hero**: run `python scripts/blog_preflight.py --draft <folder> --gate 1` to enumerate available paths. If `nanobanana-mcp` is loaded, generate the hero via the MCP tool. Otherwise run `python scripts/generate_hero.py --topic "<title>" --tags "<tags>" --out <folder>` (uses the Gemini, Unsplash, Pexels, Pixabay, Openverse ladder).

2. **Format completeness**: render the canonical `.md` to `.html` and `.pdf` via `python scripts/blog_render.py --md <slug>.md --out-dir <folder>`. All three artifacts plus `hero.<ext>` must end up in the draft folder.

3. **Content review (blocking)**: dispatch the `blog-reviewer` agent (Task tool) against the rendered `.html`. The agent emits its scorecard to `<folder>/review.md` ending with `BLOCKING: true|false (reason)`. Threshold: overall score 90/100 or higher AND zero P0 issues per `editorial-heuristics.md`.

4. **Visual + asset gates**: run `python scripts/blog_preflight.py --draft <folder> --strict`. This runs Gate 3 (visual verification via patchright at 3 viewport widths), Gate 4 (reads review.md BLOCKING line), and Gate 5 (asset + link integrity). Exit 0 = ship; exit 1 = block.

5. **Iteration**: on any block, capture the failure diagnostic from `<folder>/preflight-report.json`, re-dispatch the blog-writer agent with the diagnostic as input, and re-run from step 1. Maximum 3 iterations. On the 3rd failure, STOP and present the failure diagnostic instead of the draft.

The orchestrator holds the loop counter; this sub-skill never loops itself.

### Phase 6.8: Mandatory Post-Write Checklist Pass (Num Nums Bakery project)

⚠️ **Do NOT run `/blog-analyze`.** The user ruled it out on 2026-06-20 as a token waste, and
that decision stands. Its value is already captured as a static, token-free checklist — use that
instead. (Superseded instruction: this phase previously said "always run `/blog-analyze`".)

After writing the HTML file and before delivery, walk the checklist manually. This is not optional.

Steps:
1. Verify the newly written file against the **Num Nums Bakery HTML Project — Non-negotiable
   Pre-publish Checklist** section of this file AND the **Quality Gate** section of
   `HOW-TO-ADD-BLOG-POSTS.md`. Work through them item by item — do not eyeball it.
2. Fix **every issue** found, working Critical → High → Medium → Low. Do not present the draft until all findings are resolved.
3. **Always update both checklist files after every post** — this step is unconditional, not "if findings exist." After fixing all issues, go through every finding at every severity level (Critical → Low) and for each one:
   a. Check whether the pattern is already covered verbatim in the **Num Nums Bakery HTML Project — Non-negotiable Pre-publish Checklist** section of this file (SKILL.md).
   b. Check whether it is already covered in the **Quality Gate** section of `HOW-TO-ADD-BLOG-POSTS.md` in the project root.
   c. If either file is missing the pattern, add it to **both files** immediately — same wording, same section, kept in sync.
4. Even if no new patterns were found this run, confirm in your delivery summary: "Checklist files reviewed — no new patterns to add." Never silently skip this step.
5. The rule is permanent: **every finding that surfaces once becomes a pre-check forever.** The checklists grow; they never shrink.

### Phase 7: Delivery

Present the completed article ONLY after Phase 6.5 returns all gates passing AND the Phase 6.8 checklist pass is clean. Include the screenshots from `<folder>/preview/*.png` in the summary so the user can see what they are getting before reading the prose.

Summary template:

```
## Blog Post Complete: [Title]

### Template Used
- [Template name] (or "generic outline - no template matched")

### Statistics
- [N] sourced statistics from tier 1-3 sources
- [N] unique sources cited

### Visual Elements
- Cover image: [source - Pixabay/Unsplash/Pexels or generated SVG]
- [N] inline images (Pixabay/Unsplash/Pexels)
- [N] SVG charts (types: bar, lollipop, donut, line)
- [N] YouTube video embeds (titles: ...)

### Dual-Optimization Elements
- TL;DR box: present (N words)
- Information gain markers: [N] ([types used])
- Citation capsules: [N] across H2 sections
- Internal linking zones: [N] marked

### Structure
- [N] H2 sections with answer-first formatting
- [N] FAQ items with schema
- Word count: ~[N] words
- Estimated reading time: [N] min

### Naturalness
- Sentence length variance: [pass/fail]
- AI phrase scan: [pass/fail]
- Contractions used: [yes/no]
- Rhetorical questions: [N] (target: 1 per 200-300 words)

### Next Steps
- Review and customize for your brand voice
- Resolve [INTERNAL-LINK] placeholders with actual URLs
- Add internal links to your existing content
- Run `/blog analyze <file>` to verify quality score
- Generate VideoObject schema: `/blog schema <file>` (includes video markup)
- Generate audio narration: `/blog audio generate <file>` (optional)
```
