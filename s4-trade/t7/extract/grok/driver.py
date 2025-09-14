import streamlit as st
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import NoSuchWindowException, WebDriverException
import traceback
import time

# Function to get driver attached to CDP
@st.cache_resource
def get_driver(debugger_address='127.0.0.1:9222'):
    try:
        service = Service(ChromeDriverManager().install())
        options = Options()
        options.add_experimental_option("debuggerAddress", debugger_address)
        driver = webdriver.Chrome(service=service, options=options)
        # Ensure at least one window is open
        if not driver.window_handles:
            driver.execute_script("window.open('about:blank');")
            print("No tabs found. Opened a new blank tab.")
        driver.original_window = driver.window_handles[0]
        print(f"Connected to CDP. Original window handle: {driver.original_window}")
        return driver
    except Exception as e:
        st.error(f"Failed to connect to CDP: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        print(f"Failed to connect to CDP: {str(e)}")
        print(f"Stack trace:\n{traceback.format_exc()}")
        return None

# Function to fetch page content using CDP
def fetch_page_content(url, timeout=10):
    driver = get_driver()
    if not driver:
        print("No driver available. Cannot fetch page.")
        return None
    try:
        # Store current window handles and their URLs to identify Streamlit tab
        initial_windows = {}
        for handle in driver.window_handles:
            try:
                driver.switch_to.window(handle)
                initial_windows[handle] = driver.current_url
            except NoSuchWindowException:
                continue
        print(f"Initial windows: {initial_windows}")

        # Identify Streamlit tab
        streamlit_tab = None
        for handle, page_url in initial_windows.items():
            if "localhost:8501" in page_url:
                streamlit_tab = handle
                break

        # Attempt to open a new tab with retries
        print(f"Opening new tab for {url}")
        max_retries = 3
        for attempt in range(max_retries):
            current_handles = set(driver.window_handles)
            driver.execute_script("window.open('about:blank');")
            time.sleep(1)  # Increased delay to ensure tab creation
            new_handles = set(driver.window_handles) - current_handles
            
            if new_handles:
                new_tab = new_handles.pop()
                if new_tab == streamlit_tab or new_tab in initial_windows:
                    print(f"Attempt {attempt + 1}: New tab is the Streamlit tab or an existing tab. Retrying.")
                    continue
                driver.switch_to.window(new_tab)
                print(f"Switched to new tab: {new_tab}")
                break
            else:
                print(f"Attempt {attempt + 1}: Failed to open a new tab. Retrying.")
                if attempt == max_retries - 1:
                    st.error("Failed to open a new tab for scraping after multiple attempts.")
                    print("Failed to open a new tab for scraping after multiple attempts.")
                    return None
                time.sleep(1)  # Wait before retrying

        # Navigate to the URL in the new tab
        driver.get(url)
        WebDriverWait(driver, timeout).until(EC.visibility_of_element_located((By.TAG_NAME, "body")))
        content = driver.page_source
        print(f"Fetched content from {url}")

        # Close only the new tab
        driver.close()
        print(f"Closed scraping tab: {new_tab}")

        # Switch back to the Streamlit tab if available, otherwise original tab
        if streamlit_tab and streamlit_tab in driver.window_handles:
            driver.switch_to.window(streamlit_tab)
            print(f"Switched back to Streamlit tab: {streamlit_tab}")
        elif driver.original_window in driver.window_handles:
            driver.switch_to.window(driver.original_window)
            print(f"Switched back to original tab: {driver.original_window}")
        else:
            print("Original and Streamlit tabs closed. Switching to first available tab.")
            if driver.window_handles:
                driver.original_window = driver.window_handles[0]
                driver.switch_to.window(driver.original_window)
                print(f"New original tab: {driver.original_window}")
            else:
                st.error("No tabs available. Opening a new tab.")
                print("No tabs available. Opening a new tab.")
                driver.execute_script("window.open('about:blank');")
                driver.original_window = driver.window_handles[0]
                driver.switch_to.window(driver.original_window)
                print(f"New original tab: {driver.original_window}")

        return content
    except NoSuchWindowException as e:
        st.error(f"Browser window closed unexpectedly: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        print(f"Browser window closed unexpectedly: {str(e)}")
        print(f"Stack trace:\n{traceback.format_exc()}")
        return None
    except WebDriverException as e:
        st.error(f"WebDriver error: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        print(f"WebDriver error: {str(e)}")
        print(f"Stack trace:\n{traceback.format_exc()}")
        return None
    except Exception as e:
        st.error(f"Failed to fetch page {url}: {str(e)}")
        st.error(f"Stack trace:\n{traceback.format_exc()}")
        print(f"Failed to fetch page {url}: {str(e)}")
        print(f"Stack trace:\n{traceback.format_exc()}")
        return None
    finally:
        # Close only the new tab if it still exists and isn't the Streamlit tab
        try:
            current_windows = set(driver.window_handles)
            new_tabs = current_windows - set(initial_windows.keys())
            for tab in new_tabs:
                if tab != driver.original_window and tab != streamlit_tab and tab in driver.window_handles:
                    driver.switch_to.window(tab)
                    driver.close()
                    print(f"Closed stray tab: {tab}")
            if driver.window_handles and driver.current_window_handle != streamlit_tab and streamlit_tab in driver.window_handles:
                driver.switch_to.window(streamlit_tab)
                print(f"Ensured switch back to Streamlit tab: {streamlit_tab}")
            elif driver.window_handles and driver.current_window_handle != driver.original_window:
                driver.switch_to.window(driver.original_window)
                print(f"Ensured switch back to original tab: {driver.original_window}")
        except Exception as e:
            print(f"Error during tab cleanup: {str(e)}")