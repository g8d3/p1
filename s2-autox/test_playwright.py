import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("https://x.com")
        await page.screenshot(path="x_com_screenshot_playwright.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())