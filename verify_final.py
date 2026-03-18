import os
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    os.makedirs("/home/jules/verification/video", exist_ok=True)

    # Desktop
    context_desktop = browser.new_context(viewport={'width': 1280, 'height': 800}, record_video_dir="/home/jules/verification/video")
    page = context_desktop.new_page()
    page.goto("http://localhost:8080")
    page.wait_for_timeout(2000)
    page.get_by_label("Security Key").fill("01522105373")
    page.get_by_role("button", name="Initialize Access").click()
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/desktop_home.png")

    # Check Automation Start
    page.get_by_role("button", name="Start Engine").click()
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/desktop_home_active.png")

    # Mobile
    context_mobile = browser.new_context(viewport={'width': 375, 'height': 812}, is_mobile=True, record_video_dir="/home/jules/verification/video")
    page_m = context_mobile.new_page()
    page_m.goto("http://localhost:8080")
    page_m.wait_for_timeout(2000)
    page_m.get_by_label("Security Key").fill("01522105373")
    page_m.get_by_role("button", name="Initialize Access").click()
    page_m.wait_for_timeout(2000)
    page_m.screenshot(path="/home/jules/verification/mobile_home.png")

    # In mobile header, it's just a Button with Menu icon
    # The Button component doesn't have an accessible name for the icon by default unless we use get_by_role('button').first (since it's the only ghost button with icon in header)
    page_m.locator("button:has(svg)").first.click()
    page_m.wait_for_timeout(500)
    page_m.get_by_text("Settings", exact=True).click()
    page_m.wait_for_timeout(1000)
    page_m.screenshot(path="/home/jules/verification/mobile_settings.png")

    context_desktop.close()
    context_mobile.close()
    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
