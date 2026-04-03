@echo off
REM ============================================================================
REM Network Scanner - Build EXE Helper Script
REM This script automates the conversion of scanner.js to network-scanner.exe
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║    NETWORK SCANNER v2.0 - EXE Builder                     ║
echo ║    Exam Center Audit System                               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo And make sure to add Node.js to PATH during installation
    pause
    exit /b 1
)
echo ✓ Node.js is installed
node --version

REM Check if npm is installed
echo.
echo [2/5] Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: npm is not installed
    pause
    exit /b 1
)
echo ✓ npm is installed
npm --version

REM Check if pkg is installed globally
echo.
echo [3/5] Checking pkg installation...
pkg --version >nul 2>&1
if errorlevel 1 (
    echo ⚠ pkg is not installed globally
    echo Installing pkg globally...
    call npm install -g pkg
    if errorlevel 1 (
        echo ❌ ERROR: Failed to install pkg
        echo Try: npm install -g pkg
        pause
        exit /b 1
    )
)
echo ✓ pkg is installed
pkg --version

REM Create dist directory
echo.
echo [4/5] Creating output directory...
if not exist dist (
    mkdir dist
    echo ✓ Directory created: dist\
) else (
    echo ✓ Directory exists: dist\
)

REM Build the executable
echo.
echo [5/5] Building executable...
echo This may take 5-10 minutes on first build...
echo.

call pkg scanner.js --targets node18-win-x64 --output dist/network-scanner.exe --compress

if errorlevel 1 (
    echo.
    echo ❌ BUILD FAILED
    echo.
    echo Troubleshooting:
    echo 1. Make sure scanner.js exists in this directory
    echo 2. Run: npm install -g pkg
    echo 3. Check internet connection (pkg downloads Node binaries)
    echo 4. Try: npx pkg scanner.js --targets node18-win-x64 --output dist/network-scanner.exe
    echo.
    pause
    exit /b 1
)

echo.
echo ✓ BUILD SUCCESSFUL!
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    BUILD COMPLETE                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verify the exe
echo Verifying executable...
if exist dist\network-scanner.exe (
    for /F "tokens=5" %%A in ('dir dist\network-scanner.exe ^| findstr "network-scanner"') do (
        set SIZE=%%A
    )
    echo ✓ File created: dist\network-scanner.exe (!SIZE! bytes)
) else (
    echo ❌ ERROR: Executable not found
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo NEXT STEPS:
echo ═══════════════════════════════════════════════════════════════
echo.
echo 1. TEST WITHOUT ARGUMENTS (Help):
echo    dist\network-scanner.exe --diagnostics
echo.
echo 2. TEST WITH API (Development):
echo    dist\network-scanner.exe ^
echo      --api-url http://localhost:3000 ^
echo      --token dev-scan-token
echo.
echo 3. DISTRIBUTE:
echo    Copy dist\network-scanner.exe to any Windows 10/11 machine
echo    (No Node.js installation required!)
echo.
echo USAGE EXAMPLES:
echo    network-scanner.exe --stats          (Show history)
echo    network-scanner.exe --logs           (Show logs)
echo    network-scanner.exe --sync           (Sync offline data)
echo    network-scanner.exe --diagnostics    (Run diagnostics)
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM Optional: Run diagnostics
set /p RUNTEST="Run diagnostics now? (y/n): "
if /i "%RUNTEST%"=="y" (
    echo.
    echo Running diagnostics...
    echo.
    call dist\network-scanner.exe --diagnostics
)

echo.
pause
