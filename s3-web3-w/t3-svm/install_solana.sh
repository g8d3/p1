#!/bin/bash

# Script to install Solana CLI and Anchor CLI, detecting and fixing failures
# Designed for Linux (Ubuntu/Debian) and macOS

set -e

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if [[ "$(uname)" == "Darwin" ]]; then
        echo "macOS"
    elif [[ "$(uname)" == "Linux" ]]; then
        echo "Linux"
    else
        echo "Unsupported OS"
        exit 1
    fi
}

# Function to install dependencies
install_dependencies() {
    local os=$1
    log "Installing dependencies for $os..."

    if [[ "$os" == "Linux" ]]; then
        sudo apt update
        sudo apt install -y build-essential libssl-dev pkg-config curl
    elif [[ "$os" == "macOS" ]]; then
        if ! command_exists brew; then
            log "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
        brew install openssl@3 pkg-config
    fi
}

# Function to set OpenSSL environment variables
set_openssl_env() {
    local os=$1
    if [[ "$os" == "macOS" ]]; then
        export OPENSSL_DIR=$(brew --prefix openssl@3)
        export OPENSSL_LIB_DIR=$OPENSSL_DIR/lib
        export OPENSSL_INCLUDE_DIR=$OPENSSL_DIR/include
        export PKG_CONFIG_PATH=$OPENSSL_DIR/lib/pkgconfig:$PKG_CONFIG_PATH
        echo "export OPENSSL_DIR=$OPENSSL_DIR" >> ~/.zshrc
        echo "export OPENSSL_LIB_DIR=$OPENSSL_DIR/lib" >> ~/.zshrc
        echo "export OPENSSL_INCLUDE_DIR=$OPENSSL_DIR/include" >> ~/.zshrc
        echo "export PKG_CONFIG_PATH=$OPENSSL_DIR/lib/pkgconfig:$PKG_CONFIG_PATH" >> ~/.zshrc
    elif [[ "$os" == "Linux" ]]; then
        export OPENSSL_DIR=/usr
        export OPENSSL_LIB_DIR=/usr/lib
        export OPENSSL_INCLUDE_DIR=/usr/include
    fi
}

# Function to install Rust
install_rust() {
    if ! command_exists rustc; then
        log "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source $HOME/.cargo/env
    else
        log "Rust already installed: $(rustc --version)"
        rustup update
    fi
}

# Function to install Solana CLI
install_solana() {
    local max_attempts=3
    local attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        log "Attempting to install Solana CLI (Attempt $attempt/$max_attempts)..."
        if sh -c "$(curl -sSfL https://release.solana.com/v1.18.15/install)"; then
            log "Solana CLI installed successfully"
            export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
            echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.zshrc
            break
        else
            log "Solana CLI installation failed"
            if [[ $attempt -eq $max_attempts ]]; then
                log "Max attempts reached. Exiting."
                exit 1
            fi
            sleep 2
        fi
        ((attempt++))
    done
}

# Function to install Anchor CLI
install_anchor() {
    local max_attempts=3
    local attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        log "Attempting to install Anchor CLI (Attempt $attempt/$max_attempts)..."
        if cargo install avm --force && avm install 0.31.1 && avm use 0.31.1; then
            log "Anchor CLI installed successfully"
            export PATH="$HOME/.avm/bin:$PATH"
            echo 'export PATH="$HOME/.avm/bin:$PATH"' >> ~/.zshrc
            break
        else
            log "Anchor CLI installation failed"
            if [[ $attempt -eq $max_attempts ]]; then
                log "Max attempts reached. Cleaning up and retrying with fallback..."
                cargo clean
                rm -rf ~/.cargo/registry/cache
                set_openssl_env "$(detect_os)"
                ((attempt--))
            fi
            sleep 2
        fi
        ((attempt++))
    done
}

# Function to verify installations
verify_installations() {
    log "Verifying installations..."
    if command_exists solana; then
        log "Solana CLI installed: $(solana --version)"
    else
        log "Solana CLI not found"
        exit 1
    fi
    if command_exists anchor; then
        log "Anchor CLI installed: $(anchor --version)"
    else
        log "Anchor CLI not found"
        exit 1
    fi
}

# Main execution
main() {
    log "Starting installation of Solana CLI and Anchor CLI..."
    local os=$(detect_os)
    install_dependencies "$os"
    set_openssl_env "$os"
    install_rust
    install_solana
    install_anchor
    source ~/.zshrc
    verify_installations
    log "Installation completed successfully!"
    log "Next steps: Run 'anchor init my_launchpad' to create a new project."
}

main
