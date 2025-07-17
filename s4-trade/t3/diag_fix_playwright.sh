#!/bin/bash
set -euo pipefail

# --- Configuration ---
PLAYWRIGHT_CACHE_DIR="${HOME}/.cache/ms-playwright"
# The specific Chromium version from the error message.
# Note: Playwright might install a newer version, but we'll check for this specific path first.
CHROMIUM_EXECUTABLE="${PLAYWRIGHT_CACHE_DIR}/chromium-1161/chrome-linux/chrome"

# --- Colors for better output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}--- Playwright Chromium Executable Diagnosis and Fix Script ---${NC}"
echo "This script will attempt to diagnose and fix the 'Executable doesn't exist' error for Playwright Chromium."
echo ""

# --- Helper Functions for Diagnosis ---

check_command() {
    local cmd="$1"
    echo -n "  Checking if '${cmd}' is available in PATH... "
    if command -v "${cmd}" &> /dev/null; then
        echo -e "${GREEN}Found! (${GREEN}$(command -v "${cmd}")${NC})"
        return 0
    else
        echo -e "${RED}Not found.${NC}"
        return 1
    fi
}

check_file_exists_and_executable() {
    local file_path="$1"
    echo -n "  Checking for executable: ${file_path}... "
    if [[ -f "${file_path}" ]]; then
        echo -n "Exists. "
        if [[ -x "${file_path}" ]]; then
            echo -e "${GREEN}Executable.${NC}"
            return 0
        else
            echo -e "${YELLOW}Not executable. Permissions might be an issue.${NC}"
            return 1
        fi
    else
        echo -e "${RED}Does not exist.${NC}"
        return 1
    fi
}

check_directory_permissions() {
    local dir_path="$1"
    echo -n "  Checking permissions for directory: ${dir_path}... "
    if [[ -d "${dir_path}" ]]; then
        local perms=$(ls -ld "${dir_path}" | awk '{print $1}')
        local owner=$(ls -ld "${dir_path}" | awk '{print $3}')
        echo -e "Permissions: ${YELLOW}${perms}${NC}, Owner: ${YELLOW}${owner}${NC}."
        # Basic check for rwx for owner
        if [[ "${perms}" =~ ^d[rwx]{3} ]]; then
            echo -e "    ${GREEN}Owner has read, write, and execute permissions.${NC}"
            return 0
        else
            echo -e "    ${RED}Owner might not have full permissions. Consider 'chmod -R u+rwx ${dir_path}'.${NC}"
            return 1
        fi
    else
        echo -e "${RED}Directory does not exist.${NC}"
        return 1
    fi
}

check_disk_space() {
    echo -n "  Checking available disk space in home directory... "
    local available_space=$(df -h "${HOME}" | awk 'NR==2 {print $4}')
    echo -e "Available: ${YELLOW}${available_space}${NC}."
    # Simple check for more than 1GB, as browsers are large
    if [[ "${available_space}" =~ ([0-9.]+)([KMGT]) ]]; then
        local value="${BASH_REMATCH[1]}"
        local unit="${BASH_REMATCH[2]}"
        local min_gb=1 # Minimum 1GB recommended
        local min_mb=1000 # Minimum 1000MB recommended

        if [[ "${unit}" == "G" && $(echo "${value} >= ${min_gb}" | bc -l) -eq 1 ]]; then
            echo -e "    ${GREEN}Sufficient disk space detected.${NC}"
            return 0
        elif [[ "${unit}" == "M" && $(echo "${value} >= ${min_mb}" | bc -l) -eq 1 ]]; then
            echo -e "    ${YELLOW}Potentially low disk space. Consider freeing up more space.${NC}"
            return 1
        elif [[ "${unit}" == "T" ]]; then
            echo -e "    ${GREEN}Sufficient disk space detected.${NC}"
            return 0
        else
            echo -e "    ${RED}Low disk space detected. Please free up space.${NC}"
            return 1
        fi
    else
        echo -e "${RED}Could not determine disk space.${NC}"
        return 1
    fi
}

get_playwright_version() {
    echo -n "  Checking installed Playwright version... "
    local pw_version=""
    # Try to get version from npm list or package.json
    if [[ -f "./package.json" ]]; then
        pw_version=$(npm view @playwright/test version 2>/dev/null || true)
    fi

    if [[ -z "${pw_version}" ]]; then
        # Fallback if not in a project or npm view fails
        pw_version=$(npx playwright --version 2>/dev/null | awk '{print $2}' || true)
    fi

    if [[ -n "${pw_version}" ]]; then
        echo -e "${GREEN}${pw_version}${NC}"
        return 0
    else
        echo -e "${YELLOW}Could not determine Playwright version. Is it installed?${NC}"
        return 1
    fi
}

# --- Fixing Functions ---

run_playwright_install() {
    echo -e "${BLUE}--- Attempting Fix: Running 'npx playwright install' ---${NC}"
    echo "This may take a few minutes as it downloads browser binaries."
    if npx playwright install; then
        echo -e "${GREEN}Successfully ran 'npx playwright install'.${NC}"
        return 0
    else
        echo -e "${RED}Failed to run 'npx playwright install'. Check the output above for errors.${NC}"
        return 1
    fi
}

clean_cache_and_reinstall() {
    echo -e "${BLUE}--- Attempting Fix: Cleaning Playwright cache and reinstalling ---${NC}"
    echo -e "${YELLOW}WARNING: This will remove all Playwright browser binaries from your cache.${NC}"
    read -p "Do you want to proceed? (y/N): " confirm_clean
    if [[ "${confirm_clean}" =~ ^[Yy]$ ]]; then
        echo "Removing Playwright cache: ${PLAYWRIGHT_CACHE_DIR}"
        rm -rf "${PLAYWRIGHT_CACHE_DIR}"
        if [[ $? -eq 0 ]]; then
            echo -e "${GREEN}Cache removed.${NC}"
            run_playwright_install
            return $? # Return status of run_playwright_install
        else
            echo -e "${RED}Failed to remove cache. Check permissions.${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}Cache cleaning skipped.${NC}"
        return 1
    fi
}

# --- Main Script Execution ---

echo -e "${BLUE}--- Diagnosis Phase ---${NC}"

# Check essential commands
check_command "npm"
check_command "npx"

echo ""

# Check Playwright specific paths and files
check_directory_permissions "${PLAYWRIGHT_CACHE_DIR}"
check_file_exists_and_executable "${CHROMIUM_EXECUTABLE}"

echo ""

# Check system resources
check_disk_space
get_playwright_version

echo -e "${BLUE}--- Diagnosis Summary ---${NC}"
echo "Based on the checks above:"
if [[ ! -d "${PLAYWRIGHT_CACHE_DIR}" ]]; then
    echo -e "  ${RED}* Playwright cache directory '${PLAYWRIGHT_CACHE_DIR}' does not exist.${NC}"
elif ! check_file_exists_and_executable "${CHROMIUM_EXECUTABLE}" &>/dev/null; then
    echo -e "  ${RED}* Chromium executable '${CHROMIUM_EXECUTABLE}' is missing or not executable.${NC}"
elif ! check_disk_space &>/dev/null; then
    echo -e "  ${RED}* Low disk space might be preventing downloads.${NC}"
elif ! check_directory_permissions "${PLAYWRIGHT_CACHE_DIR}" &>/dev/null; then
    echo -e "  ${RED}* Permissions issues in the cache directory are suspected.${NC}"
else
    echo -e "  ${GREEN}* Initial checks suggest the environment is mostly set up, but the executable is still reported missing. Reinstallation is recommended.${NC}"
fi

echo ""
read -p "Do you want to attempt to fix the problem by reinstalling Playwright browsers? (y/N): " confirm_fix

if [[ "${confirm_fix}" =~ ^[Yy]$ ]]; then
    echo ""
    if run_playwright_install; then
        echo -e "${GREEN}Fix attempt 1 (npx playwright install) completed. Please try running your Playwright tests again.${NC}"
    else
        echo -e "${YELLOW}First fix attempt failed. Trying a more aggressive fix (clean cache and reinstall).${NC}"
        echo ""
        if clean_cache_and_reinstall; then
            echo -e "${GREEN}Fix attempt 2 (clean cache and reinstall) completed. Please try running your Playwright tests again.${NC}"
        else
            echo -e "${RED}Both automated fix attempts failed.${NC}"
            echo -e "${RED}--- Manual Troubleshooting Steps ---${NC}"
            echo "1. Ensure you have a stable internet connection (Playwright downloads are large)."
            echo "2. Check if any firewalls or proxies are blocking downloads from GitHub or Microsoft CDN."
            echo "3. Manually verify permissions for '${PLAYWRIGHT_CACHE_DIR}' and its contents."
            echo "   You can try: ${YELLOW}sudo chmod -R u+rwx ${PLAYWRIGHT_CACHE_DIR}${NC} (use with caution)."
            echo "4. Consider updating Node.js and npm to their latest stable versions."
            echo "5. If you are in a CI/CD environment, ensure the runner has network access and sufficient disk space."
        fi
    fi
else
    echo -e "${YELLOW}Fix attempts skipped by user.${NC}"
fi

echo -e "${BLUE}--- Script Finished ---${NC}"
