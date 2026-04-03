# Enterprise Network Scanner v2.0 - Complete Guide

Production-grade network scanner for Exam Center Audit System with enterprise-class reliability, performance, and diagnostics.

## 🎯 What's New in v2.0

### Core Enhancements
- ✅ **MAC Address Detection** using ARP table for accurate device identification
- ✅ **Vendor Lookup Database** - 200+ OUI entries (Dell, HP, Lenovo, printers, cameras, routers)
- ✅ **Advanced Device Classification** using both vendor and port-based detection
- ✅ **Parallel Async Scanning** with configurable batching (100+ concurrent operations)
- ✅ **Enterprise Offline Mode** with local JSON storage and conflict resolution
- ✅ **Comprehensive Logging System** with separate logs for different categories
- ✅ **Exponential Backoff Retry Logic** for failed API calls
- ✅ **Network Diagnostics** for connectivity and system health checks
- ✅ **Scan History & Analytics** tracking scans over time
- ✅ **Performance Metrics** measurement for optimization

## 📊 Quick Stats

### Performance
- **Network Discovery**: ~2-3 seconds (254 IPs at 100 concurrent)
- **Device Identification**: ~3-5 seconds (50+ hosts with port scanning)
- **Total Scan Time**: 6-10 seconds typical LAN
- **API Upload**: <1 second (with automatic retry)

### Coverage
- **PC Vendors**: 5+ (Dell, HP, Lenovo, ASUS, Acer, Intel, Realtek, etc.)
- **Excluded Vendors**: 50+ (Printers, cameras, routers, network equipment)
- **MAC OUI Database**: 200+ entries

---

## 🚀 Getting Started

### Installation

```bash
cd scripts/network-scanner
npm install
node scanner.js
```

### Basic Usage

#### Interactive Mode (Recommended for first-time)
```bash
node scanner.js
```
Follow the interactive prompts for:
- API URL
- JWT Token
- Center Code
- Center Name
- City
- Auditor Name
- Contact Number

#### Command-Line Mode
```bash
node scanner.js \
  --api-url https://your-api.com \
  --token eyJhbGciOiJIUzI1NiIs... \
  --center-code EXAM001 \
  --center-name "Exam Center 1" \
  --city "New York" \
  --auditor "John Doe" \
  --contact "555-1234"
```

#### Environment Variables
```bash
export SCANNER_API_URL="https://your-api.com"
export SCANNER_TOKEN="your-jwt-token"
node scanner.js --center-code EXAM001 --center-name "Center 1"
```

---

## 🛠️ Advanced Features

### 1. Offline Mode & Synchronization

**Automatic Offline Detection**
```bash
# Scan even without internet
node scanner.js \
  --api-url https://your-api.com \
  --token YOUR_TOKEN \
  --center-code EXAM001 \
  --center-name "Center 1"
```

When offline:
- Scan results saved locally to `~/.exam-scanner/pending-scans.json`
- Display confirmation: "Data saved locally. Will sync when connection is available."
- Automatic retry with exponential backoff when online

**Manual Sync**
```bash
# Sync pending scans
node scanner.js \
  --sync \
  --api-url https://your-api.com \
  --token YOUR_TOKEN
```

Output:
```
Found 3 pending scan(s). Syncing...

[1/3] Syncing: EXAM001 (2024-03-31T10:30:00Z)...
  ✓ Synced successfully
[2/3] Syncing: EXAM002 (2024-03-31T11:00:00Z)...
  ✓ Synced successfully
[3/3] Syncing: EXAM003 (2024-03-31T12:00:00Z)...
  ✗ Failed: Connection refused (Retry 1)

Sync complete: 2 synced, 1 failed
```

### 2. Logging & Monitoring

**View Logs**
```bash
# General log
node scanner.js --logs general

# Last 20 entries from each log type
node scanner.js --logs error
node scanner.js --logs api
node scanner.js --logs scan
```

**Log File Locations**
- Windows: `%USERPROFILE%\.exam-scanner\`
- macOS/Linux: `~/.exam-scanner/`

**Log File Types**
- `scanner.log` - General operations
- `error.log` - Errors and failures
- `api.log` - API communications
- `scan.log` - Actual scan operations

**Log Entry Format**
```
[2024-03-31T10:30:00.123Z] [SCAN] Starting network scan | {"subnet":"192.168.1","localIP":"192.168.1.100"}
[2024-03-31T10:30:02.456Z] [API] API attempt 1/3 | {"centerCode":"EXAM001"}
[2024-03-31T10:30:03.789Z] [ERROR] Failed to get ARP table | {"error":"Command failed"}
```

### 3. System Diagnostics

```bash
node scanner.js --diagnostics
```

Output:
```
System Information:
  Platform: win32 x64
  Node Version: v18.12.0
  CPUs: 8
  Free Memory: 4096.25 MB
  Total Memory: 16384.50 MB

Network Diagnostics:
  Network Available: ✓
  DNS Available: ✓
  Internet Available: ✓
  Interfaces: 4

Log Locations:
  General: C:\Users\User\.exam-scanner\scanner.log
  Error: C:\Users\User\.exam-scanner\error.log
  API: C:\Users\User\.exam-scanner\api.log
  Scan: C:\Users\User\.exam-scanner\scan.log
```

### 4. Scan History & Statistics

```bash
node scanner.js --stats
```

Output:
```
Scan History & Statistics:

Total Scans: 15
Average PCs per Scan: 32
Last Scan: 3/31/2024, 10:30:00 AM

Last 10 Scans:
  1. EXAM001 - 32 PCs - 3/31/2024, 10:30:00 AM
  2. EXAM002 - 28 PCs - 3/31/2024, 11:00:00 AM
  3. EXAM003 - 35 PCs - 3/31/2024, 11:30:00 AM
  ...
```

### 5. Configuration File

Create `~/.exam-scanner/scanner-config.json`:

```json
{
  "description": "Production configuration",
  "pingTimeout": 300,
  "pingConcurrency": 100,
  "portScanConcurrency": 50,
  "portScanTimeout": 200,
  "scanRangeStart": 1,
  "scanRangeEnd": 254,
  "apiRetryAttempts": 5,
  "apiRetryDelay": 3000,
  "apiTimeout": 45000,
  "maxRetries": 3,
  "enableMetrics": true,
  "enableHistory": true
}
```

---

## 📋 Scan Results Format

### Console Output

```
╔════════════════════════════════════════════════════════════╗
║                    SCAN RESULTS                            ║
╚════════════════════════════════════════════════════════════╝

Total Active Devices: 45
Detected PCs:         32
Printers:             8
Cameras:              3
Network Devices:      2
Unknown:              0
Scan Duration:        8.45s

--- Detected PCs ---
  192.168.1.10        | 00:1A:2B:3C:4D:5E | Dell         | DESKTOP-001
  192.168.1.11        | 00:1A:2B:3C:4D:5F | HP           | LAPTOP-001
  192.168.1.12        | 00:1A:2B:3C:4D:60 | Lenovo       | THINKPAD-01

--- Printers (Excluded) ---
  192.168.1.50        | 00:11:22:33:44:55 | HP-Printer

--- Cameras (Excluded) ---
  192.168.1.200       | 00:0F:7C:12:34:56 | Hikvision
```

### API Payload

```json
{
  "centerCode": "EXAM001",
  "centerName": "Exam Center 1",
  "city": "New York",
  "auditorName": "John Doe",
  "contact": "555-1234",
  "systemCount": 32,
  "ipList": ["192.168.1.10", "192.168.1.11", ...],
  "macList": ["00:1A:2B:3C:4D:5E", "00:1A:2B:3C:4D:5F", ...],
  "scanDetails": {
    "totalDevices": 45,
    "localIP": "192.168.1.100",
    "subnet": "192.168.1",
    "scannedAt": "2024-03-31T10:30:00Z",
    "scanDuration": 8450,
    "deviceBreakdown": {
      "pcs": 32,
      "printers": 8,
      "cameras": 3,
      "networkDevices": 2,
      "unknown": 0
    },
    "devices": [
      {
        "ip": "192.168.1.10",
        "mac": "00:1A:2B:3C:4D:5E",
        "vendor": "Dell",
        "type": "pc",
        "confidence": "high"
      }
    ]
  }
}
```

### API Response

**Success:**
```json
{
  "success": true,
  "data": {
    "scanId": "SCAN-1711860600000-abc12",
    "centerCode": "EXAM001",
    "systemCount": 32
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Invalid center code"
}
```

---

## 🔧 Troubleshooting

### Problem: Scanner not finding any PCs

**Diagnosis:**
```bash
node scanner.js --diagnostics
```

**Solutions:**
1. Check network connectivity: Ensure you're on the LAN
2. Check ARP table population: Wait a few seconds after connecting
3. Check firewall: ICMP (ping) must be allowed
4. Check network interface: Ensure WiFi/Ethernet is connected
5. Verify subnet: Check if network is 192.168.x.x, 10.x.x.x, or 172.16-31.x.x

### Problem: API calls failing

**Check:**
```bash
node scanner.js --logs api
```

**Solutions:**
1. Verify API URL: Remove trailing `/`, correct protocol (http vs https)
2. Check JWT Token: Ensure it's valid and not expired
3. Check Network: Ensure internet connectivity (`node scanner.js --diagnostics`)
4. Check API Status: Verify API server is running
5. Check CORS: API must have CORS headers

**Example:**
```bash
✗ API attempt 1/3 error | {"error":"ECONNREFUSED"}
```
→ API server not accessible

### Problem: Offline mode not working

**Check:**
```bash
node scanner.js --logs error
```

**Solutions:**
1. Verify storage permissions: Check folder permissions on `~/.exam-scanner/`
2. Check disk space: Ensure sufficient disk space available
3. Check JSON format: Verify `pending-scans.json` is valid JSON
4. Check file locks: Close any other processes accessing the file

### Problem: Slow scanning

**Check:**
```bash
node scanner.js --diagnostics
```

**Solutions:**
1. Reduce concurrency in `scanner-config.json`:
   ```json
   {
     "pingConcurrency": 50,
     "portScanConcurrency": 25
   }
   ```
2. Check system resources: Memory and CPU usage
3. Check network: High latency or packet loss?
4. Increase timeouts:
   ```json
   {
     "pingTimeout": 500,
     "portScanTimeout": 400
   }
   ```

---

## 🏗️ Building Executable

### For Windows

```bash
# Install pkg
npm install -g pkg

# Build EXE
npm run build:win

# Output: dist/network-scanner-win.exe
```

### For macOS

```bash
npm run build:mac
# Output: dist/network-scanner-macos
```

### For Linux

```bash
npm run build:linux
# Output: dist/network-scanner-linux
```

### Build for All Platforms

```bash
npm run build:all
```

### Distribution

After building:
1. Copy executable to `Program Files` or `/usr/local/bin/`
2. Create shortcuts for users
3. Document the URL and token for users
4. Provide offline sync instructions

---

## 🔒 Security

✓ **No credential storage**: Token kept in memory only, never logged or saved
✓ **HTTPS support**: Full TLS/SSL encryption for API calls
✓ **No sensitive data**: Offline storage contains only scan results
✓ **Local-only storage**: Pending scans never sent to external services
✓ **Standard user**: No admin/root required (for most operations)

---

## 📊 Device Classification Rules

### High Confidence (MAC-based)
- Dell, HP, Lenovo, ASUS, Acer, Intel, Realtek → **PC**
- Epson, Canon, Brother, Kyocera, etc. → **Printer**
- Cisco, TP-Link, D-Link, Netgear → **Router/Switch**
- Hikvision, Dahua → **Camera**

### Medium Confidence (Port-based)
- Ports 135, 139, 445, 3389 open → **Windows PC**
- Ports 9100, 515, 631 open → **Printer**
- Port 22 open → **Possible Linux PC**

### Classification Output
Each device includes confidence level:
- `high` - Vendor-based identification
- `medium` - Port-based identification
- `low` - Unknown device

---

## 🎓 Common Workflows

### Workflow 1: Single Center Scan
```bash
# Scan and upload immediately
node scanner.js \
  --api-url https://your-api.com \
  --token YOUR_TOKEN \
  --center-code EXAM001 \
  --center-name "Center 1"
```

### Workflow 2: Batch Scanning (Multiple Centers)
```bash
# Center 1
node scanner.js --api-url ... --center-code EXAM001 --center-name "Center 1"

# Center 2
node scanner.js --api-url ... --center-code EXAM002 --center-name "Center 2"

# View history
node scanner.js --stats
```

### Workflow 3: Offline Deployment
```bash
# On offline laptop
node scanner.js --api-url https://your-api.com --center-code EXAM001

# When back online
node scanner.js --sync --api-url https://your-api.com --token YOUR_TOKEN
```

### Workflow 4: Troubleshooting
```bash
# Check system
node scanner.js --diagnostics

# View recent errors
node scanner.js --logs error

# View API calls
node scanner.js --logs api

# View scan history
node scanner.js --stats
```

---

## 📞 Support

For issues:
1. Run diagnostics: `node scanner.js --diagnostics`
2. Check logs: `node scanner.js --logs error`
3. Review configuration: `cat ~/.exam-scanner/scanner-config.json`
4. Verify connectivity: `node scanner.js --logs api`

---

## 📝 License

MIT
