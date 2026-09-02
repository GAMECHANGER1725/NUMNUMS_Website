# Memory Index

- [Business type & product scope](project_business_type.md) — 100% eggless bakery: custom eggless cakes + Indian sweets only (no snacks/savoury)

- [Deploy only when asked](feedback_deploy_on_request.md) — Never run `netlify deploy` unless the user explicitly requests it
- [Netlify account details](user_netlify_account.md) — numnums01725@gmail.com (Google login), site: numnumstest.netlify.app
- [Never push to GitHub unless asked](feedback_always_push.md) — Test on localhost; only commit/push when user explicitly requests it (GitHub auto-deploys to Netlify)
- [Cake base ingredients](project_cake_ingredients.md) — Plain Flour, Sugar, Oil, Baking Powder, Milk Powder, Water — internal only, do not list to customers
- [Blog card colour vs post colour](feedback_blog_card_vs_post_colours.md) — Unique card colour (e.g. navy) stays on the index card only; blog post interior always uses standard espresso/cream/pink palette
- [Lenis smooth scroll on blog posts](feedback_lenis_smooth_scroll.md) — Every blog post must include Lenis smooth scroll (desktop only, mobile uses native scroll); pink progress bar; exact snippet saved in memory file
- [Hamburger menu pattern](feedback_hamburger_menu_pattern.md) — All non-home pages use `#mobile-menu > a` CSS selector block (not inline styles) for dividers and pill button; inline !important breaks on Safari/Tailwind
- [Always add blog posts to sitemap](feedback_blog_sitemap.md) — Every new blog post must be added to sitemap.xml immediately; 7 posts were missing during 2026-05-23 audit (Critical SEO issue)
- [Netlify Minify HTML breaks inline quotes](project_netlify_minify_html_breaks_inline_quotes.md) — Netlify post-processing truncates single-quoted inline style/on* attrs in prod (invisible on localhost); prefer CSS classes
- [CSP must allowlist unpkg](project_csp_unpkg_allowlist.md) — netlify.toml CSP script-src must include https://unpkg.com or React/Babel/Lenis silently break in production
- [Never run /blog-analyze; always start with blog-write](feedback_blog_analyze_after_every_post.md) — blog-analyze wastes tokens; invoke the blog-write skill for every new post and apply the static checklist manually
