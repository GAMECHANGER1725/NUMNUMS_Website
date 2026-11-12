"""Round 2 merges (SEO Fix Plan Phase 3, 2026-11-12): the 14 pages Google dropped
between 10 Oct and 7 Nov. Each is 301'd (clean + .html) to the survivor that now
covers it, removed from sitemap/llms/index cards, and every internal link repointed.
Run from the repo root. Idempotent enough to re-run: skips slugs already gone."""
import os, re, glob, subprocess

HUB = "eggless-cake-bakery-harris-park-riverstone-sydney"
MERGES = {
    "eggless-cakes-blacktown": HUB,
    "eggless-cakes-marayong": HUB,
    "eggless-cakes-rouse-hill": HUB,
    "eggless-cakes-north-parramatta": HUB,
    "cake-shop-near-me-marsden-park-talawong": HUB,
    "birthday-cake-near-me-sydney-suburbs": HUB,
    "anniversary-cake-sydney": "best-cake-sydney",
    "eggless-cakes-graduation-sydney": "best-cake-sydney",
    "eggless-cakes-housewarming-sydney": "best-cake-sydney",
    "eggless-cakes-fathers-day-sydney": "best-cake-sydney",
    "wedding-cake-sydney-north-west": "tiered-cakes-sydney",
    "vegan-vs-eggless-cakes-difference": "eggless-cake-vs-regular-cake",
    "eggless-cake-recipe-vs-bakery-sydney": "eggless-cake-vs-regular-cake",
    "why-we-chose-100-percent-eggless-bakery": "eggless-cake-vs-regular-cake",
}
for to in set(MERGES.values()):
    assert os.path.exists(f"blog/{to}.html"), to

# 1. netlify.toml: repoint the .html block, add a clean-URL block after it
nt = open("netlify.toml").read()
for frm, to in MERGES.items():
    blk = f'[[redirects]]\n  from = "/blog/{frm}.html"\n  to = "/blog/{frm}"\n  status = 301\n  force = true\n'
    if blk in nt:
        new = (f'[[redirects]]\n  from = "/blog/{frm}.html"\n  to = "/blog/{to}"\n  status = 301\n  force = true\n\n'
               f'[[redirects]]\n  from = "/blog/{frm}"\n  to = "/blog/{to}"\n  status = 301\n  force = true\n')
        nt = nt.replace(blk, new)
    else:
        assert f'from = "/blog/{frm}"\n  to = "/blog/{to}"' in nt, f"no redirect block for {frm}"
open("netlify.toml", "w").write(nt)

# 2. sitemap + llms.txt
sm = open("sitemap.xml").read()
for frm in MERGES:
    sm = re.sub(r"\s*<url>\s*<loc>https://numnumsbakery\.com\.au/blog/%s</loc>.*?</url>" % re.escape(frm), "", sm, flags=re.S)
open("sitemap.xml", "w").write(sm)
ll = open("llms.txt").read().split("\n")
ll = [l for l in ll if not any(l.startswith(f"- https://numnumsbakery.com.au/blog/{f} ") for f in MERGES)]
open("llms.txt", "w").write("\n".join(ll))

# 3. blog/index.html cards
L = open("blog/index.html").read().split("\n")
for frm in MERGES:
    hit = [i for i, l in enumerate(L) if re.search(r'href="(/blog/)?%s(\.html)?"' % re.escape(frm), l)]
    if not hit:
        continue
    i = hit[0]
    start = max(j for j in range(i + 1) if "blog-card-wrap" in L[j])
    indent = L[start][: len(L[start]) - len(L[start].lstrip())]
    end = next(j for j in range(i, len(L)) if L[j] == indent + "</div>")
    if start > 0 and "<!-- CARD -->" in L[start - 1]:
        start -= 1
    if start > 0 and L[start - 1].strip() == "":
        start -= 1
    del L[start : end + 1]
open("blog/index.html", "w").write("\n".join(L))

# 4. delete the posts
for frm in MERGES:
    if os.path.exists(f"blog/{frm}.html"):
        subprocess.run(["git", "rm", "-q", f"blog/{frm}.html"], check=True)

# 5. repoint every internal link (absolute and relative, with or without .html / anchor)
pages = glob.glob("*.html") + glob.glob("blog/*.html")
changed = 0
for p in pages:
    s = open(p).read(); o = s
    me = os.path.basename(p)[:-5]
    for frm, to in MERGES.items():
        pat = r'href="(?:https://numnumsbakery\.com\.au)?(?:/blog/|\.\./blog/|\./)?%s(?:\.html)?(#[^"]*)?"' % re.escape(frm)
        s = re.sub(pat, lambda m: f'href="/blog/{to}"', s)
    # a page now linking to itself: unwrap the anchor, keep the text
    s = re.sub(r'<a href="/blog/%s"[^>]*>(.*?)</a>' % re.escape(me), r"\1", s) if me in MERGES.values() else s
    if s != o:
        open(p, "w").write(s); changed += 1
print("pages with links repointed:", changed)
