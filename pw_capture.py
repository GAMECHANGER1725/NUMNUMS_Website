from playwright.sync_api import sync_playwright
import os

OUTPUT_DIR = "/Users/vaidikpatel/Downloads/Home/Num Nums Bakery/Website/temporary screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

captures = [
    ("http://localhost:3000/",          1280, 800,  "home-desktop"),
    ("http://localhost:3000/",          375,  812,  "home-mobile"),
    ("http://localhost:3000/cakes.html", 1280, 800,  "cakes-desktop"),
    ("http://localhost:3000/cakes.html", 375,  812,  "cakes-mobile"),
    ("http://localhost:3000/locations.html", 1280, 800, "locations-desktop"),
    ("http://localhost:3000/locations.html", 375, 812,  "locations-mobile"),
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    for url, w, h, label in captures:
        page = browser.new_page(viewport={"width": w, "height": h})
        page.goto(url, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(1500)  # let fonts/video settle
        path = os.path.join(OUTPUT_DIR, f"{label}.png")
        page.screenshot(path=path, full_page=False)
        print(f"Saved: {path}")
        page.close()
    browser.close()

print("All screenshots captured.")
