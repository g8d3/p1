from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from webdriver_manager.firefox import GeckoDriverManager
from selenium.webdriver.firefox.service import Service
import time

# Configure Firefox options
options = Options()
options.add_argument("--headless")  # Run in headless mode (no GUI)
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

print('before service')
# Set up the Firefox WebDriver using webdriver_manager
service = Service(GeckoDriverManager().install())
driver = webdriver.Firefox(service=service, options=options)
print('after service')

try:
    # Open the website
    print("Navigating to x.com...")
    driver.get("https://x.com")
    print("Navigated to x.com.")
    time.sleep(5)  # Wait for the page to load (adjust if needed)

    # Take a screenshot
    print("Taking screenshot...")
    driver.save_screenshot("x_com_screenshot.png")
    print("Screenshot saved as 'x_com_screenshot.png'")

finally:
    # Clean up
    driver.quit()
