from playwright.sync_api import sync_playwright
import os

OUTPUT_DIR = "/Users/vaidikpatel/Downloads/Home/Num Nums Bakery/Website/screenshots"
BASE = "https://num-nums-bakery-test.netlify.app"

PAGES = [
    ("cakes", "/cakes.html"),
    ("order", "/order.html"),
]

VIEWPORTS = [
    ("desktop", 1440, 900),
    ("mobile", 375, 812),
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context()
    pg = context.new_page()

    for vp_name, vp_w, vp_h in VIEWPORTS:
        for page_name, path_suffix in PAGES:
            full_url = BASE + path_suffix
            pg.set_viewport_size({"width": vp_w, "height": vp_h})
            pg.goto(full_url, wait_until="networkidle", timeout=30000)
            pg.wait_for_timeout(1500)
            out = os.path.join(OUTPUT_DIR, f"{vp_name}_{page_name}_atf.png")
            pg.screenshot(path=out, full_page=False)
            print(f"Saved: {out}")

    browser.close()
    print("Done.")
