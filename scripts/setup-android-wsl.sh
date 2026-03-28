#!/usr/bin/env bash
# =============================================================================
#  TimeStar — Android Build Environment Setup for WSL (Ubuntu)
#  Run once inside WSL Ubuntu: bash scripts/setup-android-wsl.sh
# =============================================================================
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

step()  { echo -e "\n${CYAN}${BOLD}==>${NC} ${BLUE}$*${NC}"; }
ok()    { echo -e "   ${GREEN}✓${NC} $*"; }
warn()  { echo -e "   ${YELLOW}⚠${NC}  $*"; }
die()   { echo -e "   ${RED}✗  ERROR:${NC} $*" >&2; exit 1; }

# ── Configuration ─────────────────────────────────────────────────────────────
ANDROID_HOME_DIR="$HOME/android-sdk"
NDK_VERSION="r26b"                          # matches Windows NDK 26.1.10909125
NDK_DIR_NAME="android-ndk-${NDK_VERSION}"
NDK_FULL_PATH="${ANDROID_HOME_DIR}/ndk/${NDK_DIR_NAME}"
ANDROID_API="24"                            # Tauri v2 minimum API level
ANDROID_API_COMPILE="33"                    # compile/target SDK
BUILD_TOOLS_VERSION="33.0.2"
CMDLINE_TOOLS_BUILD="11076708"              # SDK tools 9.0
NVM_VERSION="0.39.7"
NODE_VERSION="20"

echo -e "\n${BOLD}TimeStar — Android WSL Build Environment Setup${NC}"
echo    "════════════════════════════════════════════════"
echo    "  ANDROID_HOME  : $ANDROID_HOME_DIR"
echo    "  NDK version   : $NDK_VERSION  (NDK 26.1.10909125)"
echo    "  Android API   : $ANDROID_API_COMPILE  (min $ANDROID_API)"
echo    "  Node.js LTS   : $NODE_VERSION"
echo    "════════════════════════════════════════════════"

# ── Guard: must be running in WSL ─────────────────────────────────────────────
if ! grep -qi microsoft /proc/version 2>/dev/null; then
    warn "This script is designed for WSL (Ubuntu). Continuing anyway..."
fi

# ── 1. System packages ────────────────────────────────────────────────────────
step "1/9  Updating system packages"
sudo apt-get update -y -q
sudo apt-get upgrade -y -q
ok "apt updated"

step "1/9  Installing build essentials"
sudo apt-get install -y -q \
    curl git unzip zip wget file \
    build-essential cmake pkg-config \
    libssl-dev libglib2.0-dev \
    python3 python3-pip \
    openjdk-17-jdk \
    libc6-dev-i386            # needed for i686 Android target
ok "Build essentials installed"

# ── 2. Java: set JAVA_HOME ────────────────────────────────────────────────────
step "2/9  Configuring Java 17"
JAVA_HOME_PATH="$(update-java-alternatives -l 2>/dev/null \
    | grep java-17 | awk '{print $3}')"
if [[ -z "$JAVA_HOME_PATH" ]]; then
    JAVA_HOME_PATH="$(dirname "$(dirname "$(readlink -f "$(which java)")")")"
fi
export JAVA_HOME="$JAVA_HOME_PATH"
ok "JAVA_HOME → $JAVA_HOME"
java -version 2>&1 | head -1 | sed 's/^/   /'

# ── 3. Node.js via nvm ────────────────────────────────────────────────────────
step "3/9  Installing Node.js $NODE_VERSION via nvm"
export NVM_DIR="$HOME/.nvm"
if [[ ! -d "$NVM_DIR" ]]; then
    curl -fsSo- \
        "https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh" \
        | bash
fi
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install "$NODE_VERSION" --silent
nvm use "$NODE_VERSION"
nvm alias default "$NODE_VERSION"
ok "Node $(node --version) / npm $(npm --version)"

# ── 4. Rust ───────────────────────────────────────────────────────────────────
step "4/9  Installing / updating Rust (stable)"
if ! command -v rustup &>/dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
        | sh -s -- -y --default-toolchain stable --no-modify-path
fi
# shellcheck source=/dev/null
source "$HOME/.cargo/env"
rustup update stable
ok "$(rustc --version)"
ok "$(cargo --version)"

# ── 5. Android Rust cross-compilation targets ─────────────────────────────────
step "5/9  Adding Android Rust targets"
rustup target add \
    aarch64-linux-android   \
    armv7-linux-androideabi \
    i686-linux-android      \
    x86_64-linux-android
ok "Android targets installed:"
rustup target list | grep -E 'android.*installed' | sed 's/^/       /'

# ── 6. Android SDK command-line tools ─────────────────────────────────────────
step "6/9  Installing Android SDK command-line tools"
mkdir -p "${ANDROID_HOME_DIR}/cmdline-tools"
if [[ ! -f "${ANDROID_HOME_DIR}/cmdline-tools/latest/bin/sdkmanager" ]]; then
    CMDLINE_URL="https://dl.google.com/android/repository/commandlinetools-linux-${CMDLINE_TOOLS_BUILD}_latest.zip"
    echo "   Downloading: $CMDLINE_URL"
    wget -q --show-progress -O /tmp/cmdline-tools.zip "$CMDLINE_URL"
    TMP_EXTRACT=/tmp/cmdline-tools-extract
    rm -rf "$TMP_EXTRACT"
    unzip -q /tmp/cmdline-tools.zip -d "$TMP_EXTRACT"
    mkdir -p "${ANDROID_HOME_DIR}/cmdline-tools/latest"
    # The zip extracts to cmdline-tools/ subdirectory
    mv "$TMP_EXTRACT/cmdline-tools/"* "${ANDROID_HOME_DIR}/cmdline-tools/latest/"
    rm -rf /tmp/cmdline-tools.zip "$TMP_EXTRACT"
    ok "cmdline-tools extracted"
else
    ok "cmdline-tools already present — skipping download"
fi

export ANDROID_HOME="$ANDROID_HOME_DIR"
export PATH="${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:$PATH"
SDKMGR="${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager"

# Accept all licences non-interactively
step "6/9  Accepting Android SDK licences"
yes | "$SDKMGR" --licenses 2>/dev/null || true
ok "Licences accepted"

# ── 7. Android SDK packages ───────────────────────────────────────────────────
step "7/9  Installing SDK packages (platform-tools, build-tools, platform)"
"$SDKMGR" \
    "platform-tools" \
    "platforms;android-${ANDROID_API_COMPILE}" \
    "build-tools;${BUILD_TOOLS_VERSION}"
ok "SDK packages installed"

# ── 8. Android NDK ────────────────────────────────────────────────────────────
step "8/9  Installing Android NDK $NDK_VERSION"
mkdir -p "${ANDROID_HOME_DIR}/ndk"
if [[ ! -d "$NDK_FULL_PATH" ]]; then
    NDK_URL="https://dl.google.com/android/repository/android-ndk-${NDK_VERSION}-linux.zip"
    echo "   Downloading: $NDK_URL"
    wget -q --show-progress -O /tmp/android-ndk.zip "$NDK_URL"
    unzip -q /tmp/android-ndk.zip -d "${ANDROID_HOME_DIR}/ndk/"
    rm /tmp/android-ndk.zip
    ok "NDK extracted to $NDK_FULL_PATH"
else
    ok "NDK $NDK_VERSION already present — skipping download"
fi

export ANDROID_NDK_HOME="$NDK_FULL_PATH"
export NDK_HOME="$ANDROID_NDK_HOME"
export PATH="${ANDROID_NDK_HOME}:$PATH"

# ── 9. cargo-ndk ─────────────────────────────────────────────────────────────
step "9/9  Installing cargo-ndk"
if ! command -v cargo-ndk &>/dev/null; then
    cargo install cargo-ndk
else
    ok "cargo-ndk already installed — skipping"
fi
ok "$(cargo ndk --version 2>/dev/null || echo 'cargo-ndk installed')"

# ── Persist environment to ~/.bashrc ─────────────────────────────────────────
step "Persisting environment variables to ~/.bashrc"

BASHRC_BLOCK='
# ── TimeStar: Android SDK / NDK build environment ────────────────────────────
export JAVA_HOME="$(update-java-alternatives -l 2>/dev/null | grep java-17 | awk '"'"'{print $3}'"'"')"
export ANDROID_HOME="$HOME/android-sdk"
export ANDROID_NDK_HOME="$ANDROID_HOME/ndk/android-ndk-r26b"
export NDK_HOME="$ANDROID_NDK_HOME"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_NDK_HOME:$HOME/.cargo/bin:$PATH"

# NVM (Node Version Manager)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ]            && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ]   && \. "$NVM_DIR/bash_completion"
# ─────────────────────────────────────────────────────────────────────────────'

# Only append if not already present
if ! grep -q "TimeStar: Android SDK" "$HOME/.bashrc"; then
    echo "$BASHRC_BLOCK" >> "$HOME/.bashrc"
    ok "Environment block added to ~/.bashrc"
else
    warn "~/.bashrc already has TimeStar env block — skipped"
fi

# ── Final verification ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}════════════ Verification ════════════${NC}"
printf "  %-18s %s\n" "Java:"       "$(java -version 2>&1 | head -1)"
printf "  %-18s %s\n" "Rust:"       "$(rustc --version)"
printf "  %-18s %s\n" "Cargo:"      "$(cargo --version)"
printf "  %-18s %s\n" "cargo-ndk:"  "$(cargo ndk --version 2>/dev/null || echo 'installed')"
printf "  %-18s %s\n" "Node.js:"    "$(node --version)"
printf "  %-18s %s\n" "npm:"        "$(npm --version)"
printf "  %-18s %s\n" "sdkmanager:" "$("$SDKMGR" --version 2>/dev/null || echo 'installed')"
printf "  %-18s %s\n" "adb:"        "$(adb version 2>/dev/null | head -1 || echo 'installed')"
echo ""
echo -e "  Android Rust targets:"
rustup target list | grep 'android.*installed' | sed 's/^/    /'
echo ""
echo -e "  Installed SDK packages (platforms + ndk):"
"$SDKMGR" --list_installed 2>/dev/null \
    | grep -E '(platform|ndk|build-tools)' \
    | sed 's/^/    /' || true
echo -e "${BOLD}══════════════════════════════════════${NC}"

echo ""
echo -e "${GREEN}${BOLD}✓ Environment setup complete!${NC}"
echo ""
echo -e "${BOLD}Next steps:${NC}"
echo "  1. Copy project to WSL native filesystem (faster builds):"
echo "       cp -r /mnt/c/Users/Soham/Desktop/Extra/React-Tauri/TimeStar/clock-app ~/timestar"
echo ""
echo "  2. source ~/.bashrc   (or open a fresh terminal)"
echo ""
echo "  3. Run the Android build helper:"
echo "       cd ~/timestar && bash scripts/build-android.sh"
echo ""
echo "  NOTE: Building directly on /mnt/c/... is ~10× slower due to WSL filesystem"
echo "        cross-over overhead. Always copy to ~/timestar first."
