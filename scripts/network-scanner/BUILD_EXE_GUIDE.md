# Network Scanner - Convert to Windows EXE
## Complete Guide for Bundling Node.js CLI into Executable

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Tool Selection & Comparison](#tool-selection)
3. [Step-by-Step Installation](#installation)
4. [Configuration](#configuration)
5. [Build Commands](#build-commands)
6. [Testing & Validation](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Distribution](#distribution)

---

## ✅ Prerequisites

### System Requirements
- **Windows 10/11** (any version)
- **Node.js 16+** (for building, not required on target machine)
- **npm** or **pnpm** package manager
- **PowerShell** or **Command Prompt**
- **~200 MB free disk space** (for build tools and output)

### Verify Installation
```powershell
node --version   # Should be v16.0.0 or higher
npm --version    # Should be 6.0.0 or higher
```

---

## 🛠️ Tool Selection & Comparison

### **pkg** (RECOMMENDED)
✅ **Pros:**
- Simplest setup for CommonJS projects
- Single .exe file output
- Works with Node.js native modules
- Great Windows support
- No wrapper shell script needed
- Supports node_modules bundling
- Active maintenance

❌ **Cons:**
- Slightly larger file size (~40-50MB)
- Slower first startup (unpacks to temp)

**Why we use pkg:** Your scanner.js is CommonJS and doesn't require ESM—pkg is perfect fit.

### Alternative: nexe
- Smaller executable (~10-20MB)
- Slower build time
- More complex configuration
- Not recommended for this use case

---

## 📦 Installation

### Step 1: Navigate to Scanner Directory
```powershell
cd "C:\Users\Lenovo\Desktop\New folder\Audit\scripts\network-scanner"
```

### Step 2: Install pkg Globally (Recommended)
```powershell
npm install -g pkg
```

**Verify Installation:**
```powershell
pkg --version
```

Expected output: `v5.x.x` or higher

### Step 3: Install pkg Locally (Alternative, if global fails)
```powershell
npm install --save-dev pkg
```

Then use `npx pkg` instead of `pkg` in all commands.

### Step 4: Verify scanner.js Dependencies
```powershell
npm list
```

This shows all bundled dependencies.

---

## ⚙️ Configuration

### Option A: Update package.json (Recommended)
Your package.json already has basic config. Update it:

```json
{
  "name": "exam-center-network-scanner",
  "version": "2.0.0",
  "description": "Enterprise-grade network scanner for Exam Center Audit System",
  "main": "scanner.js",
  "bin": {
    "network-scanner": "scanner.js"
  },
  "scripts": {
    "start": "node scanner.js",
    "build:exe": "pkg scanner.js --targets node18-win-x64 --output dist/network-scanner.exe",
    "build:exe-v2": "pkg scanner.js --targets node20-win-x64 --output dist/network-scanner-v2.exe",
    "build:all": "npm run build:exe && npm run build:exe-v2"
  },
  "pkg": {
    "scripts": [
      "scanner.js"
    ],
    "assets": [
      "package.json"
    ],
    "targets": [
      "node18-win-x64",
      "node20-win-x64"
    ],
    "outputPath": "dist",
    "compress": true,
    "bytecode": false
  },
  "type": "commonjs",
  "engines": {
    "node": ">=16.0.0"
  }
}
```

### Option B: CLI Only (No config file change needed)
If you want to keep package.json minimal, just use CLI flags.

---

## 🚀 Build Commands

### Build Option 1: Single 64-bit Executable (RECOMMENDED)
```powershell
pkg scanner.js --targets node18-win-x64 --output dist/network-scanner.exe --compress
```

**Output:** `dist/network-scanner.exe` (~45-50 MB) 

### Build Option 2: Multiple Node Versions
```powershell
# Build for Node 18
pkg scanner.js --targets node18-win-x64 --output dist/network-scanner-node18.exe

# Build for Node 20 (newer, slightly better performance)
pkg scanner.js --targets node20-win-x64 --output dist/network-scanner-node20.exe
```

### Build Option 3: Compressed Version (Smaller File)
```powershell
pkg scanner.js --targets node18-win-x64 --output dist/network-scanner.exe --compress
```

**Size:** ~35 MB (compressed vs. ~50 MB uncompressed)

### Build Option 4: Using npm Script
```powershell
npm run build:exe
```

(If you updated package.json with scripts)

---

## 🧪 Testing & Validation

### Step 1: Verify .exe was Created
```powershell
dir dist\
```

You should see `network-scanner.exe`

### Step 2: Check File Properties
```powershell
ls -la dist\network-scanner.exe
```

Output example:
```
Mode                 LastWriteTime         Length Name
----                 -------            ---------- ----
-a---           4/3/2026  2:30 PM       46857216 network-scanner.exe
```

### Step 3: Run Help Command
```powershell
.\dist\network-scanner.exe --help
```

Or with diagnostics:
```powershell
.\dist\network-scanner.exe --diagnostics
```

**Expected output:**
```
╔════════════════════════════════════════════════════════════╗
║  ENTERPRISE NETWORK SCANNER v2.0 - Production Grade       ║
║  Exam Center Audit System                                 ║
╚════════════════════════════════════════════════════════════╝

Running Diagnostics...
...
```

### Step 4: Test with Mock Data
```powershell
# Show scan history
.\dist\network-scanner.exe --stats

# Show recent logs
.\dist\network-scanner.exe --logs

# Show dev token bypass test
.\dist\network-scanner.exe --api-url http://localhost:3000 --token dev-scan-token
```

### Step 5: Full Integration Test
**Terminal 1:** Start your Next.js API
```powershell
npm run dev
```

**Terminal 2:** Run scanner against local API
```powershell
cd scripts\network-scanner
.\dist\network-scanner.exe --api-url http://localhost:3000 --token dev-scan-token
```

**Expected Result:**
- Scanner runs network scan
- Sends data to API
- Returns `{"success":true,"data":{...}}`
- Data appears in MongoDB

---

## 🔧 Troubleshooting

### Issue 1: `pkg: command not found`
**Cause:** pkg not installed globally
**Solution:**
```powershell
npm install -g pkg
```

Or use:
```powershell
npx pkg scanner.js --targets node18-win-x64 --output network-scanner.exe
```

---

### Issue 2: `.exe file runs but crashes immediately`
**Cause:** Node version mismatch or missing dependencies
**Solution:**
```powershell
# Try different Node version
pkg scanner.js --targets node20-win-x64 --output network-scanner.exe

# Or rebuild with debug output
pkg scanner.js --targets node18-win-x64 --output network-scanner.exe --debug
```

---

### Issue 3: `.exe runs but gives "Cannot find module" error`
**Cause:** Assets not bundled
**Solution:**
```powershell
# Update package.json pkg.assets (see Configuration section)
# Rebuild with bundle flag
pkg scanner.js --targets node18-win-x64 --output network-scanner.exe --compress

# OR manually verify node_modules
dir node_modules
```

---

### Issue 4: `Authorization: Bearer header not sent`
**Cause:** Token not passed to .exe
**Solution:**
```powershell
# Correct usage
.\network-scanner.exe --api-url http://localhost:3000 --token YOUR_TOKEN

# Wrong (will fail)
.\network-scanner.exe  # Missing --token
```

---

### Issue 5: `.exe file is too large (>100 MB)`
**Cause:** No compression applied
**Solution:**
```powershell
# Rebuild with compression
pkg scanner.js --targets node18-win-x64 --output network-scanner.exe --compress
```

**Size comparison:**
- Uncompressed: ~50 MB
- Compressed: ~35 MB
- With bytecode: ~25 MB (slightly slower)

---

### Issue 6: First run is very slow
**Cause:** Normal for pkg - unpacking to temp first run
**Solution:** This is expected behavior
- First run: 5-10 seconds (unpacking to %TEMP%)
- Subsequent runs: <1 second

---

### Issue 7: Antivirus flags the .exe as suspicious
**Cause:** Code signing not done; legitimate false positive
**Solution:**
1. Submit binary to antivirus vendor (false positive report)
2. Use Windows code signing (optional, requires certificate):
```powershell
signtool sign /f certificate.pfx /p password /fd SHA256 /tr http://timestamp.example.com network-scanner.exe
```

---

## 📤 Distribution

### Prepare for Release

**Directory Structure:**
```
network-scanner-v2.0.0/
├── network-scanner.exe
├── README.md
├── LICENSE
├── USAGE.txt
└── CHANGELOG.md
```

### Create README.txt for Users
```
NETWORK SCANNER v2.0.0
Exam Center Audit System

REQUIREMENTS:
- Windows 10/11
- Internet connection (to send data to API)
- ~50MB free disk space

USAGE:
network-scanner.exe --api-url https://your-api.com --token YOUR_JWT_TOKEN

EXAMPLES:

1. Interactive Mode (will prompt for input):
   network-scanner.exe --api-url http://localhost:3000 --token YOUR_TOKEN

2. Scan History:
   network-scanner.exe --stats

3. Show Logs:
   network-scanner.exe --logs general

4. Diagnostics:
   network-scanner.exe --diagnostics

5. Sync Offline Data:
   network-scanner.exe --sync --api-url http://localhost:3000 --token YOUR_TOKEN

OFFLINE STORAGE:
- Location: %USERPROFILE%\.exam-scanner
- Files: pending-scans.json, scanner.log, error.log, scan-history.json

TROUBLESHOOTING:
1. If .exe won't start: Windows Defender might be blocking it
   - Right-click .exe -> Properties -> Unblock -> Apply

2. If "Unauthorized" error: Check your JWT token
   - Verify token with: /api/auth/login endpoint

3. If "Network unreachable": Check your API URL and firewall
   - Try: ping -c 1 your-api.com

SUPPORT:
Contact: audit-system@example.com
```

### Create Installation Batch Script (Optional)
**install.bat**
```batch
@echo off
echo Installing Network Scanner to Program Files...

set INSTALL_DIR=%ProgramFiles%\ExamCenterNetworkScanner
mkdir "%INSTALL_DIR%" 2>nul

copy network-scanner.exe "%INSTALL_DIR%\network-scanner.exe"
copy README.txt "%INSTALL_DIR%\README.txt"
copy LICENSE "%INSTALL_DIR%\LICENSE"

echo.
echo Installation complete!
echo.
echo You can now run:
echo    "%INSTALL_DIR%\network-scanner.exe"
echo.
echo Or add to PATH for global access:
echo    setx PATH "%%PATH%%;%INSTALL_DIR%"
echo.
pause
```

### Create Uninstall Batch Script (Optional)
**uninstall.bat**
```batch
@echo off
set INSTALL_DIR=%ProgramFiles%\ExamCenterNetworkScanner
del /Q "%INSTALL_DIR%\network-scanner.exe" 2>nul
del /Q "%INSTALL_DIR%\README.txt" 2>nul
rmdir "%INSTALL_DIR%" 2>nul
echo Network Scanner uninstalled.
```

---

## 📋 Full Build Workflow

### Complete Step-by-Step Build

```powershell
# 1. Navigate to scanner directory
cd "C:\Users\Lenovo\Desktop\New folder\Audit\scripts\network-scanner"

# 2. Install pkg globally (one-time)
npm install -g pkg

# 3. Create output directory
mkdir -Force dist

# 4. Build the executable
pkg scanner.js --targets node18-win-x64 --output dist/network-scanner.exe --compress

# 5. Verify build
ls -la dist/network-scanner.exe

# 6. Run help to verify it works
.\dist\network-scanner.exe --diagnostics

# 7. Test against API (if running on localhost:3000)
.\dist\network-scanner.exe --api-url http://localhost:3000 --token dev-scan-token
```

---

## 🎯 Summary

| Step | Command | Time |
|------|---------|------|
| Install pkg | `npm install -g pkg` | ~30 sec |
| Build .exe | `pkg scanner.js --targets node18-win-x64 ...` | ~5-10 min |
| Test | `.\network-scanner.exe --diagnostics` | ~5 sec |
| Deploy | Copy .exe to target machine | ~1 sec |

---

## ✨ Best Practices

1. **Always use `--compress`** to reduce file size
2. **Test on fresh Windows VM** before distribution
3. **Include README.txt** with usage instructions
4. **Sign executable** for production (code signing certificate)
5. **Keep unsigned version** for testing/development
6. **Version your EXEs:** `network-scanner-v2.0.0.exe`
7. **Store offline data** in user's home directory
8. **Add error logging** for support/debugging

---

## 📲 Next Steps

1. ✅ Run build command from "Full Build Workflow" section
2. ✅ Test .exe with `--diagnostics`
3. ✅ Test against running API server
4. ✅ Verify data appears in MongoDB
5. ✅ Create README.txt
6. ✅ Package for distribution

---

**Generated:** April 3, 2026
**Scanner Version:** 2.0.0 - Production Grade
**Target:** Windows 10/11 x64
