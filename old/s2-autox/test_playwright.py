# patchright here!
from patchright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://playwright.dev')
    page.screenshot(path=f'example-{p.chromium.name}.png')
    browser.close()