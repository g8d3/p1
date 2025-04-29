from selenium import webdriver
from selenium.webdriver.firefox.options import Options
import time

# Configure Chrome options
options = Options()
options.binary_location = "/usr/bin/firefox"
options.add_argument("--headless")  # Run in headless mode (no GUI)
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

# Set up the Chrome WebDriver
driver = webdriver.Firefox(options=options)

try:
    # Open the website
    driver.get("https://x.com")
    time.sleep(5)  # Wait for the page to load (adjust if needed)

    # Take a screenshot
    driver.save_screenshot("x_com_screenshot2.png")
    print("Screenshot saved as 'x_com_screenshot2.png'")

finally:
    # Clean up
    driver.quit()