@echo off
echo =======================================================
echo Full System Setup: React + Tauri v2 Android Environment
echo =======================================================
echo.
echo NOTE: You may be prompted by Windows UAC (Admin) to install some software.
pause

echo.
echo [1/6] Installing System Dependencies (CMake, Node.js, Java 17)...
:: winget will skip installation if the software is already installed.
winget install -e --id Kitware.CMake --accept-source-agreements --accept-package-agreements
winget install -e --id OpenJS.NodeJS --accept-source-agreements --accept-package-agreements
winget install -e --id Microsoft.OpenJDK.17 --accept-source-agreements --accept-package-agreements

echo.
echo [2/6] Installing Rust^& Cargo...
winget install -e --id Rustlang.Rustup --accept-source-agreements --accept-package-agreements

echo.
echo [3/6] Installing Android Studio...
winget install -e --id Google.AndroidStudio --accept-source-agreements --accept-package-agreements

echo.
echo [4/6] Refreshing Environment Variables...
:: This attempts to reload PATH so the new tools are available in this script
call RefreshEnv.cmd 2>nul || echo Please restart your terminal after this script finishes if commands fail.

echo.
echo [5/6] Adding Rust Android compilation targets...
cargo >nul 2>nul
if %ERRORLEVEL% equ 0 (
    rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
) else (
    echo [WARNING] Cargo not found in PATH yet. You will need to run:
    echo rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
    echo manually after restarting your terminal.
)

echo.
echo [6/6] Installing NPM Project Dependencies...
npm install

echo.
echo =======================================================
echo Automatic Setup Complete!
echo =======================================================
echo.
echo  [ACTION REQUIRED] To finish the Android Setup:
echo  1. Open Android Studio for the first time and go through the initial setup wizard.
echo  2. Open the SDK Manager (Tools -^> SDK Manager).
echo  3. Go to "SDK Tools" tab, check "Show Package Details" in the bottom right.
echo  4. Expand "NDK (Side by side)" and check version "26.1.10909125".
echo  5. Expand "Android SDK Command-line Tools (latest)" and check it.
echo  6. Click Apply and let them install.
echo.
echo After doing that, restart your computer (to ensure all Paths apply), 
echo and run: `npm run tauri android dev`
pause
