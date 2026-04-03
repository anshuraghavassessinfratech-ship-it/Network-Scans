# Exam Center Network Scanner

A standalone network scanning tool for the Exam Center Audit System. This tool automatically detects active PCs on the local network and sends the data to the backend API.

## Features

- **Automatic LAN Scanning**: Detects all active devices in the local network (192.168.x.0/24 or similar)
- **PC Detection**: Filters devices to identify only PCs (excludes printers, cameras, routers, etc.)
- **Real-time Progress**: Shows scanning progress with visual feedback
- **API Integration**: Sends scan results directly to the backend with JWT authentication
- **Cross-platform**: Works on Windows, macOS, and Linux

## Requirements

- Node.js 16 or higher (for running from source)
- OR the compiled executable (no Node.js required)
- Network access to the LAN you want to scan
- Admin/root privileges may be required for some network operations

## Installation

### Option 1: Run from Source

```bash
cd scripts/network-scanner
node scanner.js
```

### Option 2: Build Executable

```bash
# Install pkg globally
npm install -g pkg

# Build for Windows
npm run build:win

# Build for all platforms
npm run build:all
```

The executables will be created in the `dist/` folder.

## Usage

### Interactive Mode

Simply run the scanner and it will prompt for all required information:

```bash
node scanner.js
# OR
./network-scanner-win.exe
```

### Command Line Mode

Provide all parameters via command line:

```bash
node scanner.js \
  --api-url https://your-api.vercel.app \
  --token YOUR_JWT_TOKEN \
  --center-code EXM-001 \
  --center-name "ABC Training Center" \
  --city "Mumbai" \
  --auditor "John Doe" \
  --contact "9876543210"
```

### From the Web Interface

1. Log into the Exam Center Audit System
2. Go to Scanner > Network Scan
3. Enter center details
4. Click "Start Network Scan"
5. The system will detect PCs and auto-fill the count

## How It Works

### Phase 1: Host Discovery
- Detects local IP address and subnet
- Sends ICMP ping to all IPs in range (1-254)
- Collects all responding IP addresses

### Phase 2: Device Identification
For each active host, the scanner:

1. **Hostname Lookup**: Performs reverse DNS lookup
2. **NetBIOS Name**: Gets Windows computer name (on Windows)
3. **Port Scanning**: Checks for PC-specific ports:
   - Port 135 (Windows RPC)
   - Port 139 (NetBIOS)
   - Port 445 (SMB/CIFS)
   - Port 3389 (RDP)
   - Port 22 (SSH - Linux)
4. **Device Classification**: Categorizes device as PC or non-PC

### Device Classification Rules

**Identified as PC:**
- Has Windows ports open (135, 139, 445, 3389)
- Has SSH port open (22) 
- Hostname contains: pc, desktop, workstation, laptop, computer, win, client, exam

**Excluded as Non-PC:**
- Hostname contains: printer, router, camera, phone, tv, nas
- Has printer ports open (9100, 515, 631)

## API Payload

The scanner sends the following data to `POST /api/network-scan`:

```json
{
  "centerCode": "EXM-001",
  "centerName": "ABC Training Center",
  "city": "Mumbai",
  "auditorName": "John Doe",
  "contact": "9876543210",
  "systemCount": 45,
  "ipList": ["192.168.1.2", "192.168.1.3", "..."],
  "scanDetails": {
    "totalDevices": 52,
    "localIP": "192.168.1.100",
    "subnet": "192.168.1",
    "scannedAt": "2024-01-15T10:30:00.000Z",
    "deviceBreakdown": {
      "pcs": 45,
      "printers": 3,
      "unknown": 4
    }
  }
}
```

## Security

- All API requests use JWT token authentication
- HTTPS is recommended for API endpoint
- Scan data is encrypted in transit

## Troubleshooting

### "Could not detect local network"
- Ensure network cable is connected or WiFi is connected
- Check if the network interface has a valid IP address

### "Permission denied" errors
- On Windows: Run as Administrator
- On Linux/Mac: Use `sudo node scanner.js`

### Slow scanning
- Large networks take longer (254 IPs scanned)
- Adjust `pingConcurrency` in config for faster/slower scanning

### Missing devices
- Some devices may have firewall blocking ICMP ping
- Devices in sleep mode may not respond

## Building the Executable

### Prerequisites
```bash
npm install -g pkg
```

### Build Commands

```bash
# Windows only
pkg scanner.js --targets node18-win-x64 --output network-scanner.exe

# All platforms
pkg scanner.js --targets node18-win-x64,node18-macos-x64,node18-linux-x64 --out-path dist/
```

### Build Notes
- The executable is self-contained (includes Node.js runtime)
- File size is approximately 40-50 MB
- No installation required - just run the .exe

## License

MIT License - Part of Exam Center Audit System
