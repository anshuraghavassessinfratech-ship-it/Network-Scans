# Network Scanner v2.0 - Quick Reference Guide

## 📋 Command Cheat Sheet

### Basic Scanning
```bash
# Interactive mode (prompts for inputs)
node scanner.js

# Command-line mode (no prompts)
node scanner.js \
  --api-url https://your-api.com \
  --token YOUR_JWT_TOKEN \
  --center-code EXAM001 \
  --center-name "Center 1" \
  --city "New York" \
  --auditor "John Doe" \
  --contact "555-1234"
```

### Syncing & Operations
```bash
# Sync pending offline scans
node scanner.js --sync \
  --api-url https://your-api.com \
  --token YOUR_JWT_TOKEN

# View scan history and statistics
node scanner.js --stats

# View error logs
node scanner.js --logs error

# Run system diagnostics
node scanner.js --diagnostics
```

### Log Commands
```bash
# View different log types
node scanner.js --logs general    # General operations
node scanner.js --logs error      # Errors only
node scanner.js --logs api        # API calls
node scanner.js --logs scan       # Scan operations
```

---

## 🗂️ File Locations

### Windows
```
%USERPROFILE%\.exam-scanner\
├── scanner.log
├── error.log
├── api.log
├── scan.log
├── pending-scans.json
├── scan-history.json
└── scanner-config.json
```

### macOS/Linux
```
~/.exam-scanner/
├── scanner.log
├── error.log
├── api.log
├── scan.log
├── pending-scans.json
├── scan-history.json
└── scanner-config.json
```

---

## 🔧 Configuration

### Basic Configuration File
Create `~/.exam-scanner/scanner-config.json`:

```json
{
  "pingTimeout": 300,
  "pingConcurrency": 100,
  "portScanConcurrency": 50,
  "apiRetryAttempts": 3,
  "apiRetryDelay": 2000
}
```

### Tuning for Slow Networks
```json
{
  "pingTimeout": 500,
  "pingConcurrency": 50,
  "portScanConcurrency": 25,
  "portScanTimeout": 400,
  "apiTimeout": 60000
}
```

### Tuning for Fast Networks
```json
{
  "pingTimeout": 100,
  "pingConcurrency": 150,
  "portScanConcurrency": 75,
  "apiRetryAttempts": 5
}
```

---

## 🎯 Common Scenarios

### Scenario 1: Quick Network Scan
```bash
# Fast scan for 254 IPs on local network
node scanner.js \
  --api-url https://your-api.com \
  --token YOUR_TOKEN \
  --center-code EXAM001 \
  --center-name "Center 1"

# Typical result: 6-10 seconds
```

### Scenario 2: Offline Scan + Later Sync
```bash
# Scan without internet (data saved locally)
node scanner.js \
  --api-url https://your-api.com \
  --token YOUR_TOKEN \
  --center-code EXAM001 \
  --center-name "Center 1"

# Later when online, sync:
node scanner.js --sync \
  --api-url https://your-api.com \
  --token YOUR_TOKEN
```

### Scenario 3: Troubleshooting
```bash
# Check system health
node scanner.js --diagnostics

# Review recent errors
node scanner.js --logs error

# Check API communications
node scanner.js --logs api

# View scan history
node scanner.js --stats
```

### Scenario 4: Batch Scanning
```bash
# Scan multiple centers
for center in EXAM001 EXAM002 EXAM003; do
  echo "Scanning $center..."
  node scanner.js \
    --api-url https://your-api.com \
    --token YOUR_TOKEN \
    --center-code $center \
    --center-name "Center - $center"
  sleep 60  # Wait between scans
done

# View all results
node scanner.js --stats
```

---

## 📊 Output Interpretation

### Device Counts
```
Total Active Devices: 45    ← All devices found
Detected PCs:         32    ← Systems to audit
Printers:             8     ← Excluded (not counted)
Cameras:              3     ← Excluded (not counted)
Network Devices:      2     ← Excluded (switches, APs)
Unknown:              0     ← Could not classify
```

**System Count = Detected PCs** (this gets sent to API)

### Confidence Levels
```
"confidence": "high"     ← MAC vendor identified
"confidence": "medium"   ← Port-based detection
"confidence": "low"      ← Could not determine
```

### Device Types
```
"pc"              → Windows/Linux computer
"printer"         → Network printer
"camera"          → Security camera
"network-device"  → Router, switch, AP
"unknown"         → Cannot classify
```

---

## 🔍 Troubleshooting Decision Tree

### Q: No PCs found, but I know they exist
```
1. Run diagnostics: node scanner.js --diagnostics
   ↓
2. Check if DNS available? ✓ → Continue | ✗ → Check network
   ↓
3. Ping gateway: ping 192.168.1.1
   ↓
4. Check firewall: ICMP (ping) must be allowed
   ↓
5. Increase timeout: Edit scanner-config.json, set pingTimeout: 500
```

### Q: API calls failing
```
1. Check API logs: node scanner.js --logs api
   ↓
2. Is error 401? → JWT token expired → Regenerate token
   ↓
3. Is error 400? → Invalid data format → Check center code
   ↓
4. Is error 503? → API server down → Check API status
   ↓
5. No response? → Set offline mode → Wait and sync
```

### Q: Scan running very slow
```
1. Run diagnostics: node scanner.js --diagnostics
   ↓
2. Check system resources: free memory? CPU? Disk?
   ↓
3. Check network: ping latency? packet loss?
   ↓
4. Reduce concurrency in scanner-config.json:
   - pingConcurrency: 50 (was 100)
   - portScanConcurrency: 25 (was 50)
   ↓
5. Or increase timeouts to handle slow devices
```

---

## 📈 Performance Tips

### For Faster Scans
1. Increase `pingConcurrency` to 150+
2. Increase `portScanConcurrency` to 75+
3. Reduce `pingTimeout` to 200ms
4. Use wired connection (not WiFi)

### For Reliable Scans
1. Reduce `pingConcurrency` to 50
2. Increase `pingTimeout` to 500ms
3. Increase `apiRetryAttempts` to 5
4. Configure `--logs api` to monitor

### For Limited Resources
1. Set `pingConcurrency` to 25
2. Set `portScanConcurrency` to 10
3. Increase timeouts to 300-500ms
4. Reduce API timeout if needed

---

## 🔐 Security Best Practices

### API Token Management
```bash
# ✗ DON'T: Hardcode token
node scanner.js --token abc123xyz

# ✓ DO: Use environment variable
export SCANNER_TOKEN="your-jwt-token"
node scanner.js --token $SCANNER_TOKEN

# ✓ DO: Use config file with restricted permissions
# chmod 600 ~/.exam-scanner/scanner-config.json
```

### Log Security
```bash
# View sensitive logs carefully
node scanner.js --logs api

# Rotate logs monthly
find ~/.exam-scanner -name "*.log" -mtime +30 -delete

# Backup with encryption
tar -czf - ~/.exam-scanner | gpg --encrypt > backup.tar.gz.gpg
```

---

## 📱 Portable Execution

### Windows Standalone Executable
```bash
# Build
npm run build:win

# Run anywhere (no Node.js required)
.\dist\network-scanner-win.exe \
  --api-url https://your-api.com \
  --token YOUR_TOKEN \
  --center-code EXAM001
```

### macOS Standalone
```bash
npm run build:mac
./dist/network-scanner-macos --api-url ...
```

### Linux Standalone
```bash
npm run build:linux
./dist/network-scanner-linux --api-url ...
```

---

## 🚀 Quick Deploy Script

### Windows Batch Script
```batch
@echo off
setlocal enabledelayedexpansion

set API_URL=https://your-api.com
set TOKEN=your-jwt-token
set SCAN_DIR=%USERPROFILE%\.exam-scanner

REM Ensure directory exists
if not exist !SCAN_DIR! mkdir !SCAN_DIR!

REM Run scan
node "%CD%\scanner.js" ^
  --api-url !API_URL! ^
  --token !TOKEN! ^
  --center-code EXAM001 ^
  --center-name "Exam Center 1"

REM Offer to view results
choice /C YN /M "View results?"
if errorlevel 2 goto end
notepad !SCAN_DIR!\scanner.log

:end
```

### Linux Bash Script
```bash
#!/bin/bash
API_URL="https://your-api.com"
TOKEN="your-jwt-token"

node $(dirname "$0")/scanner.js \
  --api-url "$API_URL" \
  --token "$TOKEN" \
  --center-code "EXAM001" \
  --center-name "Exam Center 1"
```

---

## 📚 Documentation References

- **Detailed Guide**: [ENTERPRISE_GUIDE.md](ENTERPRISE_GUIDE.md)
- **API Spec**: [API_INTEGRATION.md](API_INTEGRATION.md)
- **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Release Notes**: [CHANGELOG.md](CHANGELOG.md)

---

## 💡 Pro Tips

1. **Check diagnostics first** before troubleshooting
   ```bash
   node scanner.js --diagnostics
   ```

2. **Review logs in real-time**
   ```bash
   # Windows
   Get-Content $env:USERPROFILE\.exam-scanner\scanner.log -Wait
   
   # Linux/Mac
   tail -f ~/.exam-scanner/scanner.log
   ```

3. **Batch operations**
   ```bash
   # Create list of centers
   for i in {1..10}; do
     node scanner.js --center-code EXAM$i --center-name "Center $i"
   done
   ```

4. **Monitor pending scans**
   ```bash
   # Check how many are waiting to sync
   cat ~/.exam-scanner/pending-scans.json | jq 'length'
   ```

5. **Extract statistics**
   ```bash
   # Get average PCs detected
   cat ~/.exam-scanner/scan-history.json | jq '[.[].pcs] | add / length'
   ```

---

**Quick Reference Version**: 2.0.0
**Last Updated**: March 31, 2024
