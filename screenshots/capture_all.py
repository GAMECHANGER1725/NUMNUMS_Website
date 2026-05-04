from playwright.sync_api import sync_playwright
import os

OUTPUT_DIR = "/Users/vaidikpatel/Downloads/Home/Num Nums Bakery/Website/screenshots"
URL = "https://num-nums-bakery-test.netlify.app/"

PAGES = [
    ("home", "/"),
    ("products", "/products"),
    ("locations", "/locations"),
    ("about", "/about"),
    ("contact", "/contact"),
]

VIEWPORTS = [
    ("desktop", 1440, 900),
    ("mobile", 375, 812),
]

def capture(page, url, path, width, height):
    page.set_viewport_size({"width": width, "height": height})
    page.goto(url, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)
    # Above-the-fold only (viewport height)
    page.screenshot(path=path, full_page=False)
    print(f"Saved: {path}")

def capture_full(page, url, path, width, height):
    page.set_viewport_size({"width": width, "height": height})
    page.goto(url, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)
    page.screenshot(path=path, full_page=True)
    print(f"Saved (full): {path}")

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context()
    pg = context.new_page()

    for vp_name, vp_w, vp_h in VIEWPORTS:
        for page_name, path_suffix in PAGES:
            full_url = URL.rstrip("/") + path_suffix
            # ATF shot
            out_atf = os.path.join(OUTPUT_DIR, f"{vp_name}_{page_name}_atf.png")
            capture(pg, full_url, out_atf, vp_w, vp_h)
            # Full-page shot (home only to keep it manageable)
            if page_name == "home":
                out_full = os.path.join(OUTPUT_DIR, f"{vp_name}_{page_name}_full.png")
                capture_full(pg, full_url, out_full, vp_w, vp_h)

    browser.close()
    print("All done.")
