# Vendored: claude-seo `seo-audit`

## Why this is here

The `NumNums-SEO-Weekly` cloud routine runs in a fresh sandbox with **no plugins
installed**. On the 22-07-2026 trial run, Step 1 failed outright:

```
Unknown skill: claude-seo:seo-audit
```

The routine then hand-rolled its own audit and auto-applied ~90 files of changes from
it. That is not an acceptable steady state — the audit must always run, from this exact
rubric, so the health score is comparable week over week.

Same failure mode, same fix, as `skills/blog-write/SKILL.md`: `.claude/` is gitignored,
so anything under it is invisible to the cloud. A tracked path under `skills/` is the
only thing the routine can rely on.

## This is an EXACT copy — do not edit

Every file here is byte-for-byte identical to the plugin. Verified at vendor time:

```
SKILL.md   sha1 e9ba12443c06e38c569c36468f46524fe7e49a19   (matches plugin)
agents/    18 files, all identical
scripts/   50 files, all identical
```

**Do not add project-specific rules to `SKILL.md`.** The skill is unique and must stay
verbatim so its findings and its 0–100 health score mean the same thing here as
upstream. Num Nums-specific context (eggless-only scope, Wikidata `sameAs`, sitemap and
llms.txt as Critical, no-screenshots) belongs in the **routine prompt**, which passes it
to the skill as input — not baked into the skill itself.

To verify nothing has drifted:

```
SRC=~/.claude/plugins/cache/agricidaniel-claude-seo/claude-seo/2.0.0
diff -r "$SRC/skills/seo-audit/SKILL.md" skills/seo-audit/SKILL.md
diff -r "$SRC/agents"  skills/seo-audit/agents
diff -r "$SRC/scripts" skills/seo-audit/scripts
```

## Provenance

| | |
|---|---|
| Upstream | https://github.com/AgriciDaniel/claude-seo |
| Marketplace | `agricidaniel-claude-seo` |
| Plugin | `claude-seo` |
| Version | 2.0.0 |
| License | MIT (see `LICENSE.txt`) |
| Vendored | 2026-07-22 |

## Contents

- `SKILL.md` — the audit skill, verbatim
- `agents/` — all 18 specialist agent prompts, verbatim
- `scripts/` — all 50 helper scripts, verbatim
- `reference/seo-orchestrator.md` — upstream `skills/seo/SKILL.md` (business-type detection)
- `reference/requirements.txt` — upstream Python deps, verbatim

Not copied (unreachable from the audit path): `screenshots/` (1.6M), `assets/`,
`branding/`, `tests/`, `docs/`, `extensions/`, `pdf/`.

## Python dependencies — REQUIRED

The audit path is **not** stdlib-only. `scripts/fetch_page.py` fails immediately without
`requests`:

```
Error: requests library required. Install with: pip install requests
```

The routine must install these before invoking the skill:

```
pip install requests beautifulsoup4 lxml
```

Those three cover `fetch_page.py`, `parse_html.py`, and `url_safety.py` — the core crawl
and parse path.

The remaining deps in `reference/requirements.txt` (playwright, weasyprint, matplotlib,
openpyxl, google-api-python-client, trafilatura, htmldate) are only needed for
screenshots, PDF export, and the Google API agent. This routine is data-only and does
none of those, so they stay uninstalled — and the agents that need them
(`seo-visual`, and PDF generation via `scripts/google_report.py`) are skipped.

## Re-syncing a newer upstream version

Straight copy, no merge needed, because nothing here is modified:

```
SRC=~/.claude/plugins/cache/agricidaniel-claude-seo/claude-seo/<version>
cp "$SRC/skills/seo-audit/SKILL.md" skills/seo-audit/SKILL.md
cp "$SRC/agents/"*.md              skills/seo-audit/agents/
cp "$SRC/scripts/"*.py             skills/seo-audit/scripts/
cp "$SRC/skills/seo/SKILL.md"      skills/seo-audit/reference/seo-orchestrator.md
```

Then update the version and sha in this file.
