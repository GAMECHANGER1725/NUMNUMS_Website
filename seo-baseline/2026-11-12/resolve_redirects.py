"""Redirect resolver for netlify.toml: every 30x must land in one hop on a page that exists.
Run from the repo root after any merge round. Exits 1 on a chain, loop or dead blog target."""
import re, os, sys
nt = open("netlify.toml").read()
R = re.findall(r'\[\[redirects\]\]\s*from = "([^"]+)"\s*to = "([^"]+)"\s*status = (\d+)', nt)
src = {f: t for f, t, st in R if st.startswith("30")}
chains = [(f, t, src[t]) for f, t in src.items() if t in src and t != f]
dead = [(f, t) for f, t in src.items()
        if t.startswith("/blog/") and t != "/blog/" and "*" not in t and not os.path.exists(t.strip("/").split("#")[0] + ".html")]
print(f"{len(src)} redirects, {len(chains)} chains, {len(dead)} dead blog targets")
for c in chains: print("CHAIN", *c)
for d in dead: print("DEAD", *d)
sys.exit(1 if chains or dead else 0)
