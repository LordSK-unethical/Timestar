#!/usr/bin/env bash
# =============================================================================
#  TimeStar — Android Build Helper (WSL)
#
#  Usage:
#    bash scripts/build-android.sh [--release | --debug] [--init] [--apk-only]
#
#  Flags:
#    --release   Build release APK (default)
#    --debug     Build debug APK (faster, unsigned)
#    --init      Force re-run of 'tauri android init' (needed once, or after
#                adding a new plugin)
#    --apk-only  Build APK only (skip AAB generation)
#
#  Prerequisites: run scripts/setup-android-wsl.sh first.
# =============================================================================
set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

step() { echo -e "\n${CYAN}${BOLD}==>${NC} ${BLUE}$*${NC}"; }
ok()   { echo -e "   ${GREEN}✓${NC} $*"; }
warn() { echo -e "   ${YELLOW}⚠${NC}  $*"; }
die()  { echo -e "   ${RED}✗  FATAL:${NC} $*" >&2; exit 1; }

# ── Argument parsing ──────────────────────────────────────────────────────────
BUILD_MODE="release"
FORCE_INIT=false
APK_ONLY=false

for arg in "$@"; do
    case "$arg" in
        --debug)    BUILD_MODE="debug"   ;;
        --release)  BUILD_MODE="release" ;;
        --init)     FORCE_INIT=true      ;;
        --apk-only) APK_ONLY=true        ;;
        *) warn "Unknown flag: $arg — ignoring" ;;
    esac
done

echo -e "\n${BOLD}TimeStar — Android Build (WSL)${NC}"
echo    "════════════════════════════════"
echo    "  mode      : $BUILD_MODE"
echo    "  force-init: $FORCE_INIT"
echo    "  apk-only  : $APK_ONLY"
echo    "════════════════════════════════"

# ── Guard: must be in project root ────────────────────────────────────────────
[[ -f "package.json" ]]           || die "Run this script from the project root (where package.json lives)."
[[ -f "src-tauri/Cargo.toml" ]]   || die "src-tauri/Cargo.toml not found. Not a Tauri project root?"

# ── Guard: environment variables ─────────────────────────────────────────────
step "Checking required environment variables"

check_var() {
    local var_name="$1"
    local var_value="${!var_name:-}"
    if [[ -z "$var_value" ]]; then
        die "$var_name is not set. Source ~/.bashrc or run setup-android-wsl.sh first."
    fi
    ok "$var_name = $var_value"
}

check_var ANDROID_HOME
check_var ANDROID_NDK_HOME
check_var JAVA_HOME

[[ -f "$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-ar" ]] \
    || die "NDK not found at ANDROID_NDK_HOME=$ANDROID_NDK_HOME"

# ── Override Windows NDK linker paths ─────────────────────────────────────────
# The project's src-tauri/.cargo/config.toml contains Windows .exe paths.
# In WSL, we must override them via CARGO_TARGET_* environment variables,
# which take precedence over config.toml linker entries.
step "Configuring NDK cross-compilation linkers for WSL"

NDK_TC="${ANDROID_NDK_HOME}/toolchains/llvm/prebuilt/linux-x86_64/bin"

[[ -d "$NDK_TC" ]] || die "NDK toolchain not found: $NDK_TC"

# Linker wrappers — use API 24 (Tauri v2 min)
export CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER="${NDK_TC}/aarch64-linux-android24-clang"
export CARGO_TARGET_ARMV7_LINUX_ANDROIDEABI_LINKER="${NDK_TC}/armv7a-linux-androideabi24-clang"
export CARGO_TARGET_I686_LINUX_ANDROID_LINKER="${NDK_TC}/i686-linux-android24-clang"
export CARGO_TARGET_X86_64_LINUX_ANDROID_LINKER="${NDK_TC}/x86_64-linux-android24-clang"

# AR (archiver) — same for all targets
export AR_aarch64_linux_android="${NDK_TC}/llvm-ar"
export AR_armv7_linux_androideabi="${NDK_TC}/llvm-ar"
export AR_i686_linux_android="${NDK_TC}/llvm-ar"
export AR_x86_64_linux_android="${NDK_TC}/llvm-ar"

ok "aarch64  linker → ${CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER##*/}"
ok "armv7    linker → ${CARGO_TARGET_ARMV7_LINUX_ANDROIDEABI_LINKER##*/}"
ok "i686     linker → ${CARGO_TARGET_I686_LINUX_ANDROID_LINKER##*/}"
ok "x86_64   linker → ${CARGO_TARGET_X86_64_LINUX_ANDROID_LINKER##*/}"

# Also export for gradle / Tauri CLI
export CC_aarch64_linux_android="${NDK_TC}/aarch64-linux-android24-clang"
export CC_armv7_linux_androideabi="${NDK_TC}/armv7a-linux-androideabi24-clang"
export CC_i686_linux_android="${NDK_TC}/i686-linux-android24-clang"
export CC_x86_64_linux_android="${NDK_TC}/x86_64-linux-android24-clang"

# ── npm install ───────────────────────────────────────────────────────────────
step "Installing npm dependencies"
npm install
ok "npm dependencies installed"

# ── tauri android init ────────────────────────────────────────────────────────
GEN_ANDROID_DIR="src-tauri/gen/android"

if [[ ! -d "$GEN_ANDROID_DIR" ]] || [[ "$FORCE_INIT" == "true" ]]; then
    step "Initialising Tauri Android project (tauri android init)"
    warn "This generates src-tauri/gen/android — commit it to version control."
    npm run tauri android init
    ok "Android project initialised → $GEN_ANDROID_DIR"
else
    ok "Android project already initialised ($GEN_ANDROID_DIR exists)"
    ok "Run with --init to regenerate"
fi

# ── tauri android build ───────────────────────────────────────────────────────
step "Building Android APK ($BUILD_MODE)"

BUILD_ARGS=""
if [[ "$BUILD_MODE" == "debug" ]]; then
    BUILD_ARGS="--debug"
fi

# Tauri v2 CLI build command
if [[ "$APK_ONLY" == "true" ]]; then
    npm run tauri android build -- --apk $BUILD_ARGS
else
    npm run tauri android build -- $BUILD_ARGS
fi

# ── Locate output APK ─────────────────────────────────────────────────────────
step "Locating output APK"
APK_SEARCH_DIR="${GEN_ANDROID_DIR}/app/build/outputs"

if [[ -d "$APK_SEARCH_DIR" ]]; then
    echo ""
    echo -e "  ${BOLD}Generated APKs:${NC}"
    find "$APK_SEARCH_DIR" -name "*.apk" -exec bash -c \
        'printf "    %s  (%s)\n" "$1" "$(du -sh "$1" | cut -f1)"' _ {} \;
    echo ""
    echo -e "  ${BOLD}Generated AABs:${NC}"
    find "$APK_SEARCH_DIR" -name "*.aab" -exec bash -c \
        'printf "    %s  (%s)\n" "$1" "$(du -sh "$1" | cut -f1)"' _ {} \;
else
    warn "Output directory not found: $APK_SEARCH_DIR"
    warn "Check the Tauri build output above for the APK location."
fi

echo ""
echo -e "${GREEN}${BOLD}✓ Build complete!${NC}"
echo ""
echo -e "${BOLD}Install on connected device (USB debug enabled):${NC}"
echo "  adb install -r \$(find $APK_SEARCH_DIR -name '*.apk' | head -1)"
echo ""
echo -e "${BOLD}Copy APK to Windows:${NC}"
WIN_DEST="/mnt/c/Users/Soham/Desktop"
echo "  cp \$(find $APK_SEARCH_DIR -name '*.apk' | head -1) \"$WIN_DEST/TimeStar.apk\""
