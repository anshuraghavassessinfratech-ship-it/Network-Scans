# 🎯 NETWORK SCANNER EXE - QUICK START (5 Minutes)

## ⚡ TL;DR - Just Want to Build It?

```powershell
# 1. Open PowerShell in scanner directory
cd "C:\Users\Lenovo\Desktop\New folder\Audit\scripts\network-scanner"

# 2. Install pkg (one time only)
npm install -g pkg

# 3. Build EXE
pkg scanner.js --targets node18-win-x64 --output dist/network-scanner.exe --compress

# 4. Done! Your .exe is at: dist/network-scanner.exe
# Uses it:
.\dist\network-scanner.exe --diagnostics
```

**That's it! No dependencies, no installation needed on other PCs.**

---

## 🔧 What Just Happened?

You converted a Node.js script into a standalone Windows .exe that:
- ✅ Works **without Node.js installed**
- ✅ Runs on **Windows 10/11**
- ✅ Includes **all dependencies bundled**
- ✅ Supports **offline mode** (saves data locally)
- ✅ **No installation** needed - just run the .exe

---

## 📊 Build Times

| Build Type | Time | Size |
|-----------|------|------|
| First build | 5-10 min | ~35 MB |
| Rebuild (cached) | 30 sec | ~35 MB |
| No compression | 5-10 min | ~50 MB |

> First build takes longer because pkg downloads Node.js binary (~130 MB) once.

---

## ✅ Verify Your Build

```powershell
# Check file exists and see size
ls -l dist\network-scanner.exe

# Test it works
.\dist\network-scanner.exe --diagnostics

# Should show system info, network tests, etc.
```

---

## 🚀 Test Against Your API

**Terminal 1: Start Next.js API**
```powershell
npm run dev
# Should show: Ready in 896ms, listening on http://localhost:3000
```

**Terminal 2: Run Scanner**
```powershell
cd scripts\network-scanner
.\dist\network-scanner.exe --api-url http://localhost:3000 --token dev-scan-token
```

**Expected Result:**
```
✓ Network scan found X devices
✓ Data sent successfully!
  Scan ID: SCAN-1712146800000-ABC12
```

---

## 📦 Distribute Your EXE

### Send to Another PC
```powershell
# Copy the .exe file
"C:\Users\...\scripts\network-scanner\dist\network-scanner.exe"

# Run on target PC (no Node.js needed):
network-scanner.exe --api-url https://your-api.com --token TOKEN
```

### Create Release Archive
```powershell
# In scripts/network-scanner folder:

# 1. Copy built exe
copy dist\network-scanner.exe .\network-scanner-v2.0.0.exe

# 2. Add README (or use README.md that exists)
# 3. Create ZIP
Compress-Archive -Path network-scanner-v2.0.0.exe, README.md, BUILD_EXE_GUIDE.md -DestinationPath network-scanner-v2.0.0.zip

# 4. Done! Share the ZIP
```

---

## 🎓 Understanding the Build

### What pkg Does
1. **Bundles:** Includes all npm dependencies (`os`, `fs`, etc - already built-in)
2. **Compresses:** Makes .exe 35 MB instead of 50 MB
3. **Extracts:** At runtime, unpacks to Windows `%TEMP%` (first run only)
4. **Executes:** Runs your scanner.js in isolated Node.js environment

### What Happens Inside The EXE
1. On first run: Unpacks Node.js + your code to `%TEMP%\pkg-X` (~1-10 sec)
2. Runs scanner.js with your CLI arguments
3. Creates `.exam-scanner` folder in user's home for logs
4. Saves data locally if offline
5. On next run: Reuses cached unpacked file (much faster)

---

## 🔍 File Locations on User's PC

After running the .exe:
```
C:\Users\[Username]\.exam-scanner\
├── scanner.log          ← General log
├── error.log            ← Errors
├── api.log              ← API calls
├── scan.log             ← Network scan details
├── pending-scans.json   ← Offline queue
└── scan-history.json    ← Last 100 scans
```

---

## 🆘 Common Issues & Fixes

### Issue: Build fails - "Cannot find module"
```powershell
# Make sure you're in the right directory
cd scripts\network-scanner
dir scanner.js
dir package.json

# Then rebuild
pkg scanner.js --targets node18-win-x64 --output dist/network-scanner.exe --compress
```

### Issue: Windows Defender blocks .exe
→ Right-click → Properties → Unblock → Apply ✓

### Issue: First run is slow
→ Normal! Unpacks to temp. Second run will be fast.

### Issue: "Cannot connect to API"
```powershell
# Check API is running
curl http://localhost:3000

# Check token is valid
.\dist\network-scanner.exe --api-url http://localhost:3000 --token INVALID_TOKEN
# Should show: "Unauthorized" (not "Network Error")
```

### Issue: "Authorization: Bearer header not sent"
→ You removed `--token` argument. Usage requires token:
```powershell
# ✓ Correct
.\network-scanner.exe --api-url http://localhost:3000 --token dev-scan-token

# ✗ Wrong
.\network-scanner.exe  # Missing --token
```

---

## 📋 All CLI Arguments

```powershell
# Basic scan with API
network-scanner.exe --api-url http://api.com --token YOUR_TOKEN

# Only sync offline data (no new scan)
network-scanner.exe --sync --api-url http://api.com --token YOUR_TOKEN

# Show scan history
network-scanner.exe --stats

# Show logs
network-scanner.exe --logs general
network-scanner.exe --logs error
network-scanner.exe --logs api
network-scanner.exe --logs scan

# System diagnostics
network-scanner.exe --diagnostics

# Interactive mode (prompts for all inputs)
network-scanner.exe --api-url http://api.com --token TOKEN
```

---

## 🎯 Next Steps

1. **✅ Build the EXE** (using commands above)
2. **✅ Test locally** (--diagnostics and --api-url http://localhost:3000)
3. **📖 Read** `BUILD_EXE_GUIDE.md` (comprehensive guide)
4. **📋 Reference** `QUICK_REFERENCE.md` (all commands & troubleshooting)
5. **📤 Distribute** (copy .exe to other PCs, no Node.js needed)

---

## 🎁 Bonus: Automated Build Script

**Windows (PowerShell):**
```powershell
# Just double-click this file to auto-build
.\build-exe.bat
```

**Linux/WSL (Bash):**
```bash
# Run this to auto-build
bash build-exe.sh
```

---

## 🏆 Success Checklist

- [ ] `pkg` installed (`pkg --version` works)
- [ ] `dist/network-scanner.exe` file exists
- [ ] File size is ~35 MB or larger
- [ ] `network-scanner.exe --diagnostics` shows system info
- [ ] `network-scanner.exe --api-url http://localhost:3000 --token dev-scan-token` works
- [ ] Data appears in MongoDB after successful scan
- [ ] `.exe` works on another PC (without Node.js)

---

## 📞 Support

If you hit issues:
1. Check `BUILD_EXE_GUIDE.md` Troubleshooting section
2. Check `QUICK_REFERENCE.md` Common Issues
3. Run with `--diagnostics` to see network status
4. Check logs in `.exam-scanner` folder

---

**Status:** ✅ Ready to Build
**Tool:** pkg v5.x
**Target:** Windows 10/11 x64
**Scanner Version:** 2.0.0 - Production

Generated: April 3, 2026
