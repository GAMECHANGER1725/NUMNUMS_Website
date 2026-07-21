# CLAUDE.md — Frontend Website Rules

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.
- **Invoke the `blog-write` skill** before writing any blog post, every session, no exceptions — including scheduled/cloud routine runs. Never hand-write a post by copying an existing one from `blog/`.
- **Invoke the GBP rules file** before writing any Google Business Profile post: read `GBP/gbp-posts-harris-park.md` or `GBP/gbp-posts-riverstone.md` and complete its **Anti-repetition check** before drafting.

## Skill Resolution — read this before writing content
The project skill lives at **`skills/blog-write/SKILL.md`** — a real, git-tracked file. This is the
one the cloud routine reads and appends new checklist patterns to after every post, so it is the
single source of truth. `.claude/skills/blog-write/SKILL.md` is a local symlink to it, so the
`blog-write` skill invocation and the file path stay in sync.

- ✅ Edit `skills/blog-write/SKILL.md` (or the symlink — same file).
- ❌ Never edit `~/.claude/plugins/cache/agricidaniel-blog/…` — version-pinned, wiped on plugin update, absent in the cloud.
- ⚠️ Never convert `skills/blog-write/SKILL.md` into a symlink or move it under `.claude/`. `.claude/` is gitignored, so the cloud routine would lose the file entirely.
- If the loaded `blog-write` skill does **not** contain a section titled *"Num Nums Bakery HTML Project — Non-negotiable Pre-publish Checklist"*, you have the generic plugin version. **Stop and read `skills/blog-write/SKILL.md` directly before writing.**

## Anti-Repetition (blog + GBP)
Repetition is the #1 recurring failure on this project. Before writing anything:
- **Blog:** `ls blog/` first. Never write a post for a suburb that already has one. Check the last 10 posts in `git log --oneline -10 -- blog/` and do not reuse their angle.
- **GBP:** follow the Anti-repetition check in the location's rules file — last 6 suburbs, last 6 angles, and a random unused image from `GBP/image-bank.md`.
- **Images:** run the image-reuse grep in the blog-write checklist. A stock ID reused across posts is a failure, not a shortcut.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:3000`)
- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- Puppeteer is installed at `C:/Users/nateh/AppData/Local/Temp/puppeteer-test/`. Chrome cache is at `C:/Users/nateh/.cache/puppeteer/`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Deployment Workflow
- GitHub → Netlify sync is automatic. Pushing to GitHub deploys to production.
- **Test all changes on localhost** until the user explicitly says to push/commit to GitHub.
- Never run `git push` or `git commit` unless the user explicitly asks.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
