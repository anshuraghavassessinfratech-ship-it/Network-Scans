# Network Scanner - Deployment & Operations Guide

## Deployment Scenarios

### Scenario 1: Single Machine (Development)

```bash
# Install
cd scripts/network-scanner
npm install

# Run interactively
node scanner.js
```

**Logs Location**: `~/.exam-scanner/`

### Scenario 2: Distributed Deployment (Windows Machines)

#### Step 1: Build Executable
```bash
npm install -g pkg
npm run build:win
# Output: dist/network-scanner-win.exe
```

#### Step 2: Distribute to Machines
```bash
# Via network share
xcopy dist\network-scanner-win.exe \\server\scanner-deployment\

# Or via USB/external drive
xcopy dist\network-scanner-win.exe D:\deployment\
```

#### Step 3: Create Batch Script (run-scanner.bat)
```batch
@echo off
REM Network Scanner - Exam Center Audit
REM Create shortcuts and logs

set API_URL=https://your-api.com
set SCAN_DIR=%USERPROFILE%\.exam-scanner

if not exist %SCAN_DIR% mkdir %SCAN_DIR%

REM Run scanner
"%CD%\network-scanner-win.exe" ^
  --api-url %API_URL% ^
  --center-code EXAM001 ^
  --center-name "Exam Center 1"

REM Offer to view results
choice /C YN /M "View logs?"
if errorlevel 2 goto end
if errorlevel 1 (
  notepad %SCAN_DIR%\scanner.log
)

:end
```

#### Step 4: Create Desktop Shortcut
```batch
REM create-shortcut.vbs
Set oWS = WScript.CreateObject("WScript.Shell")
oWS.CreateShortcut(oWS.SpecialFolders("Desktop") & "\Network Scanner.lnk").TargetPath = _
  "C:\Program Files\ExamScanner\run-scanner.bat"
```

### Scenario 3: Automated Scheduled Scanning

#### Windows Task Scheduler
```powershell
# PowerShell script: schedule-scanner.ps1
$trigger = New-ScheduledTaskTrigger -AtStartup
$action = New-ScheduledTaskAction -Execute "C:\Program Files\ExamScanner\network-scanner-win.exe" `
  -Argument "--api-url https://your-api.com --token YOUR_TOKEN --center-code EXAM001"
  
Register-ScheduledTask -TaskName "ExamCenterScanner" `
  -Trigger $trigger `
  -Action $action `
  -User System
```

#### Linux Cron Job
```bash
# Add to crontab (crontab -e)
# Run scan every Monday at 08:00
0 8 * * 1 /usr/local/bin/network-scanner \
  --api-url https://your-api.com \
  --token YOUR_TOKEN \
  --center-code EXAM001 > /var/log/exam-scanner.log 2>&1
```

#### macOS LaunchAgent
```xml
<!-- ~/Library/LaunchAgents/com.examcenter.scanner.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.examcenter.scanner</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/network-scanner</string>
    <string>--api-url</string>
    <string>https://your-api.com</string>
    <string>--token</string>
    <string>YOUR_TOKEN</string>
  </array>
  <key>StartInterval</key>
  <integer>86400</integer>
</dict>
</plist>
```

### Scenario 4: Docker Container

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /scanner

# Install dependencies
RUN apk add --no-cache iputils net-tools samba-client

# Copy scanner files
COPY scripts/network-scanner/ .
RUN npm install --production

# Create storage directory
RUN mkdir -p /root/.exam-scanner

# Set environment variables
ENV API_URL=${API_URL}
ENV API_TOKEN=${API_TOKEN}
ENV CENTER_CODE=${CENTER_CODE}
ENV CENTER_NAME=${CENTER_NAME}

# Run scanner
CMD ["node", "scanner.js", \
  "--api-url", "${API_URL}", \
  "--token", "${API_TOKEN}", \
  "--center-code", "${CENTER_CODE}", \
  "--center-name", "${CENTER_NAME}"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  scanner:
    build: .
    environment:
      API_URL: https://your-api.com
      API_TOKEN: your-jwt-token
      CENTER_CODE: EXAM001
      CENTER_NAME: "Exam Center 1"
    volumes:
      - scanner-logs:/root/.exam-scanner
    restart: unless-stopped

volumes:
  scanner-logs:
```

#### Run Container
```bash
docker build -t exam-scanner .
docker run -e API_URL=https://api.example.com \
  -e API_TOKEN=your-token \
  exam-scanner
```

### Scenario 5: Group Policy Deployment (Windows Enterprise)

#### 1. Create GPO Package
```batch
REM Create MSI or run as startup script via GPO
```

#### 2. Distribute via WSUS
- Upload to WSUS server
- Deploy to target computers
- Automatic retry on failure

#### 3. Group Policy Script
```powershell
# In Computer Configuration > Windows Settings > Scripts (Startup)
# Add: C:\deployments\run-scanner.ps1

param(
  $ApiUrl = "https://your-api.com",
  $Token = "YOUR_TOKEN",
  $CenterCode = "EXAM001"
)

$ScannerPath = "C:\Program Files\ExamScanner\network-scanner-win.exe"

if (Test-Path $ScannerPath) {
  & $ScannerPath --api-url $ApiUrl --token $Token --center-code $CenterCode
}
```

---

## Operations & Monitoring

### Log Aggregation

#### Centralized Logging (ELK Stack)
```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - C:\Users\*\.exam-scanner\*.log

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  username: "elastic"
  password: "changeme"
```

#### Syslog Integration
```bash
# Linux: Forward logs to syslog
tail -f ~/.exam-scanner/scanner.log | logger -t exam-scanner
```

### Monitoring Dashboard (Prometheus/Grafana)

#### Metrics Export
```javascript
// Add to scanner to export metrics
const metrics = {
  scans_total: 42,
  scans_success: 40,
  scans_failed: 2,
  avg_duration_ms: 8450,
  pcs_detected: 32,
  api_errors: 1,
};
```

### Health Check

```bash
# Simple health check
if [ -f ~/.exam-scanner/scanner.log ]; then
  LAST_SCAN=$(tail -1 ~/.exam-scanner/scan.log | timestamp)
  TIME_SINCE_SCAN=$(date +%s - $LAST_SCAN)
  
  if [ $TIME_SINCE_SCAN -gt 86400 ]; then
    echo "ALERT: No scan in last 24 hours"
  fi
fi
```

### Alerting

#### Email Alert (if scan fails)
```bash
#!/bin/bash
# check-and-alert.sh

PENDING_FILE="$HOME/.exam-scanner/pending-scans.json"
PENDING_COUNT=$(jq length $PENDING_FILE)

if [ $PENDING_COUNT -gt 5 ]; then
  mail -s "Scanner Alert: $PENDING_COUNT pending scans" ops@example.com
fi
```

#### Slack Notification
```javascript
// Notify on API failure
const slack = require('@slack/web-api').WebClient;
const client = new slack.WebClient(process.env.SLACK_TOKEN);

client.chat.postMessage({
  channel: '#exam-scanner',
  text: `Scanner failed for ${centerCode}: ${error}`,
  icon_emoji: ':warning:'
});
```

---

## Maintenance

### Regular Tasks

#### Weekly
- [ ] Check error logs for patterns
- [ ] Review pending scans count
- [ ] Verify API connectivity
- [ ] Check disk usage

```bash
# Weekly check script
#!/bin/bash
echo "=== Scanner Health Check ==="
echo "Pending scans: $(jq length ~/.exam-scanner/pending-scans.json)"
echo "Log size: $(du -h ~/.exam-scanner/scanner.log | cut -f1)"
echo "Recent errors: $(tail -20 ~/.exam-scanner/error.log)"
```

#### Monthly
- [ ] Rotate log files (keep last 30 days)
- [ ] Cleanup old scan history
- [ ] Update vendor database
- [ ] Review performance metrics

```bash
# Monthly maintenance script
#!/bin/bash
# Clean logs older than 30 days
find ~/.exam-scanner -name "*.log" -mtime +30 -delete

# Compress old logs
gzip ~/.exam-scanner/scanner.log.1

# Trim history (keep last 500 scans)
jq '.[0:500]' ~/.exam-scanner/scan-history.json > temp.json && mv temp.json ~/.exam-scanner/scan-history.json
```

#### Quarterly
- [ ] Update Node.js runtime
- [ ] Update dependencies: `npm update`
- [ ] Security audit
- [ ] Performance optimization

### Backup Strategy

```bash
#!/bin/bash
# Backup scanner data

BACKUP_DIR="/backups/exam-scanner-$(date +%Y%m%d)"
SOURCE_DIR="$HOME/.exam-scanner"

mkdir -p $BACKUP_DIR
cp -r $SOURCE_DIR/* $BACKUP_DIR/

# Compress
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Upload to S3
aws s3 cp $BACKUP_DIR.tar.gz s3://backups/exam-scanner/
```

### Troubleshooting Checklist

#### Scanner Won't Start
1. Check Node.js installation: `node --version`
2. Verify permissions: `ls -la ~/.exam-scanner/`
3. Check disk space: `df -h`
4. Review error log: `cat ~/.exam-scanner/error.log`

#### API Failures (401)
1. Verify JWT token: `echo $API_TOKEN | cut -d. -f2 | base64 -d`
2. Check expiration: Compare `exp` field with current time
3. Regenerate token if needed
4. Update all deployments

#### Offline Mode Issues
1. Check internet: `ping 8.8.8.8`
2. Verify pending scans: `cat ~/.exam-scanner/pending-scans.json`
3. Manual sync: `node scanner.js --sync --api-url ... --token ...`
4. Review API logs for errors

#### Performance Degradation
1. Check system resources: `top`, `free -h`
2. Check network: `ping <gateway>`, `iperf`
3. Reduce concurrency in config
4. Check for background tasks

---

## Version Management

### Update Process

1. **Test Update**
   ```bash
   npm outdated  # Check for updates
   npm update    # Update dependencies
   npm test      # Run tests
   ```

2. **Stage Update**
   ```bash
   # Build new executable
   npm run build:all
   # Test on single machine first
   ```

3. **Deploy Update**
   ```bash
   # Roll out to all machines
   # Use deployment tool or manual distribution
   ```

4. **Rollback if Needed**
   ```bash
   # Keep previous executable as backup
   mv network-scanner-v2.exe network-scanner-v1-backup.exe
   ```

### Versioning Schema
- `MAJOR.MINOR.PATCH`
- SemVer following
- Changelog kept in `CHANGELOG.md`

---

## Security Hardening

### Network Security
- [ ] Use HTTPS only (no HTTP)
- [ ] Verify SSL certificates
- [ ] Use VPN for remote scanners
- [ ] Firewall: Allow only required ports

### Access Control
- [ ] Rotate JWT tokens regularly (e.g., monthly)
- [ ] Use different tokens per scanner
- [ ] Track token usage in logs
- [ ] Invalidate compromised tokens

### Data Protection
- [ ] Enable disk encryption (BitLocker, FileVault)
- [ ] Restrict log file access (chmod 600)
- [ ] Delete old logs regularly
- [ ] Backup to encrypted storage

### Audit Trail
- [ ] Enable Windows Event Logging
- [ ] Log all scanner activity
- [ ] Monitor for anomalies
- [ ] Generate monthly audit reports

---

## Disaster Recovery

### Recovery Plan

#### RTO: 15 minutes (Recovery Time Objective)
#### RPO: 1 scan (Recovery Point Objective)

**Steps:**
1. Restore executable from backup
2. Restore configuration from version control
3. Resync pending scans from last known state
4. Verify API connectivity
5. Resume scanning

### Backup Locations
- Primary: Local disk (`~/.exam-scanner/`)
- Secondary: Network share (`\\server\backups\exam-scanner\`)
- Tertiary: Cloud storage (S3, Azure Blob)

```bash
# Automated backup script
#!/bin/bash
BACKUP_DEST="/mnt/nas/exam-scanner-backups/$(hostname)-$(date +%Y%m%d)"
rsync -av ~/.exam-scanner/ $BACKUP_DEST/
aws s3 sync $BACKUP_DEST s3://backups/exam-scanner/$(hostname)/
```

---

## Documentation

- **README.md**: General usage
- **ENTERPRISE_GUIDE.md**: Advanced features
- **API_INTEGRATION.md**: API specification
- **DEPLOYMENT.md**: This file (operations)

---

**Last Updated**: March 31, 2024
**Version**: 2.0
