#!/bin/bash
# Network Scanner - Build EXE Helper Script (for WSL/Git Bash)
# This script automates the conversion of scanner.js to network-scanner.exe

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║    NETWORK SCANNER v2.0 - EXE Builder (Linux/WSL)         ║"
echo "║    Exam Center Audit System                               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
echo "[1/5] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js is installed"
node --version

# Check if npm is installed
echo ""
echo "[2/5] Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm is not installed"
    exit 1
fi
echo "✓ npm is installed"
npm --version

# Check if pkg is installed globally
echo ""
echo "[3/5] Checking pkg installation..."
if ! command -v pkg &> /dev/null; then
    echo "⚠ pkg is not installed globally"
    echo "Installing pkg globally..."
    npm install -g pkg
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to install pkg"
        exit 1
    fi
fi
echo "✓ pkg is installed"
pkg --version

# Create dist directory
echo ""
echo "[4/5] Creating output directory..."
mkdir -p dist
echo "✓ Directory created: dist/"

# Build the executable
echo ""
echo "[5/5] Building executable..."
echo "This may take 5-10 minutes on first build..."
echo ""

pkg scanner.js --targets node18-win-x64 --output dist/network-scanner.exe --compress

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ BUILD FAILED"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure scanner.js exists in this directory"
    echo "2. Run: npm install -g pkg"
    echo "3. Check internet connection (pkg downloads Node binaries)"
    echo "4. Try: npx pkg scanner.js --targets node18-win-x64 --output dist/network-scanner.exe"
    echo ""
    exit 1
fi

echo ""
echo "✓ BUILD SUCCESSFUL!"
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    BUILD COMPLETE                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verify the exe
echo "Verifying executable..."
if [ -f dist/network-scanner.exe ]; then
    SIZE=$(ls -lh dist/network-scanner.exe | awk '{print $5}')
    echo "✓ File created: dist/network-scanner.exe ($SIZE)"
else
    echo "❌ ERROR: Executable not found"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "NEXT STEPS:"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "1. TEST WITHOUT ARGUMENTS (Help):"
echo "   dist/network-scanner.exe --diagnostics"
echo ""
echo "2. TEST WITH API (Development):"
echo "   dist/network-scanner.exe \\"
echo "     --api-url http://localhost:3000 \\"
echo "     --token dev-scan-token"
echo ""
echo "3. DISTRIBUTE:"
echo "   Copy dist/network-scanner.exe to any Windows 10/11 machine"
echo "   (No Node.js installation required!)"
echo ""
echo "USAGE EXAMPLES:"
echo "   network-scanner.exe --stats          (Show history)"
echo "   network-scanner.exe --logs           (Show logs)"
echo "   network-scanner.exe --sync           (Sync offline data)"
echo "   network-scanner.exe --diagnostics    (Run diagnostics)"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
