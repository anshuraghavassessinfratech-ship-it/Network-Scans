# Network Scanner - API Integration Guide

## API Endpoint

```
POST /api/network-scan
```

## Authentication

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

## Request Body

```json
{
  "centerCode": "EXAM001",
  "centerName": "Exam Center 1",
  "city": "New York",
  "auditorName": "John Doe",
  "contact": "555-1234",
  "systemCount": 32,
  "ipList": [
    "192.168.1.10",
    "192.168.1.11",
    "192.168.1.12"
  ],
  "macList": [
    "00:1A:2B:3C:4D:5E",
    "00:1A:2B:3C:4D:5F",
    "00:1A:2B:3C:4D:60"
  ],
  "scanDetails": {
    "totalDevices": 45,
    "localIP": "192.168.1.100",
    "subnet": "192.168.1",
    "scannedAt": "2024-03-31T10:30:00.000Z",
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
      },
      {
        "ip": "192.168.1.11",
        "mac": "00:1A:2B:3C:4D:5F",
        "vendor": "HP",
        "type": "pc",
        "confidence": "high"
      },
      {
        "ip": "192.168.1.50",
        "mac": "00:11:22:33:44:55",
        "vendor": "HP-Printer",
        "type": "printer",
        "confidence": "high"
      }
    ]
  }
}
```

## Response

### Success (200 OK)

```json
{
  "success": true,
  "data": {
    "scanId": "SCAN-1711860600000-abc12",
    "centerCode": "EXAM001",
    "systemCount": 32,
    "message": "Scan recorded successfully"
  }
}
```

### Error (4xx/5xx)

```json
{
  "success": false,
  "error": "Invalid center code"
}
```

## Error Codes

| Code | Error | Cause | Solution |
|------|-------|-------|----------|
| 400 | Invalid center code | centerCode is missing or invalid | Verify centerCode format |
| 400 | Invalid center name | centerName is missing | Provide centerName |
| 400 | Invalid system count | systemCount < 0 or not a number | Ensure systemCount is >= 0 |
| 400 | IP list must be an array | ipList is not an array | Ensure ipList is JSON array |
| 401 | Unauthorized | Invalid or missing JWT token | Verify token is valid |
| 403 | Forbidden | User doesn't have permission | Check user role/permissions |
| 409 | Duplicate scan | Scan for same center/timestamp exists | Try again with different timestamp |
| 500 | Internal server error | Server-side error | Retry or contact support |

## Important Fields

### Required Fields
- `centerCode` - Unique identifier for exam center
- `centerName` - Display name of center
- `systemCount` - Number of PCs detected (must match `ipList.length`)
- `ipList` - Array of IP addresses

### Optional Fields
- `city` - City where center is located
- `auditorName` - Name of person conducting audit
- `contact` - Contact number of auditor
- `macList` - Array of MAC addresses (for duplicate prevention)
- `scanDetails` - Additional scan metadata

### scanDetails Structure
```json
{
  "totalDevices": 45,           // Total devices found (including non-PCs)
  "localIP": "192.168.1.100",   // Scanner's local IP
  "subnet": "192.168.1",         // Network subnet scanned
  "scannedAt": "ISO-8601-datetime",  // Scan timestamp
  "scanDuration": 8450,          // Duration in milliseconds
  "deviceBreakdown": {           // Device count by type
    "pcs": 32,
    "printers": 8,
    "cameras": 3,
    "networkDevices": 2,
    "unknown": 0
  },
  "devices": [...]               // Array of device details
}
```

## Validation Rules

| Field | Rule | Example |
|-------|------|---------|
| centerCode | Alphanumeric, 3-20 chars | EXAM001, CENTER123 |
| systemCount | Integer >= 0 | 32 |
| ipList | Valid IPv4 addresses | 192.168.1.10 |
| macList | Valid MAC addresses | 00:1A:2B:3C:4D:5E |
| scanDuration | Integer >= 0 (ms) | 8450 |

## Example Requests

### cURL

```bash
curl -X POST https://your-api.com/api/network-scan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "centerCode": "EXAM001",
    "centerName": "Exam Center 1",
    "city": "New York",
    "auditorName": "John Doe",
    "contact": "555-1234",
    "systemCount": 32,
    "ipList": ["192.168.1.10", "192.168.1.11", "192.168.1.12"],
    "macList": ["00:1A:2B:3C:4D:5E", "00:1A:2B:3C:4D:5F", "00:1A:2B:3C:4D:60"],
    "scanDetails": {
      "totalDevices": 45,
      "localIP": "192.168.1.100",
      "subnet": "192.168.1",
      "scannedAt": "2024-03-31T10:30:00.000Z",
      "scanDuration": 8450,
      "deviceBreakdown": {
        "pcs": 32,
        "printers": 8,
        "cameras": 3,
        "networkDevices": 2,
        "unknown": 0
      }
    }
  }'
```

### JavaScript/Node.js

```javascript
const https = require('https');
const url = new URL('https://your-api.com/api/network-scan');

const payload = {
  centerCode: 'EXAM001',
  centerName: 'Exam Center 1',
  city: 'New York',
  auditorName: 'John Doe',
  contact: '555-1234',
  systemCount: 32,
  ipList: ['192.168.1.10', '192.168.1.11', '192.168.1.12'],
  macList: ['00:1A:2B:3C:4D:5E', '00:1A:2B:3C:4D:5F', '00:1A:2B:3C:4D:60'],
  scanDetails: {
    totalDevices: 45,
    localIP: '192.168.1.100',
    subnet: '192.168.1',
    scannedAt: new Date().toISOString(),
    scanDuration: 8450,
    deviceBreakdown: {
      pcs: 32,
      printers: 8,
      cameras: 3,
      networkDevices: 2,
      unknown: 0
    }
  }
};

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Length': Buffer.byteLength(JSON.stringify(payload))
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error(`Problem: ${e.message}`);
});

req.write(JSON.stringify(payload));
req.end();
```

### Python

```python
import requests
import json

url = 'https://your-api.com/api/network-scan'
headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
}

payload = {
    'centerCode': 'EXAM001',
    'centerName': 'Exam Center 1',
    'city': 'New York',
    'auditorName': 'John Doe',
    'contact': '555-1234',
    'systemCount': 32,
    'ipList': ['192.168.1.10', '192.168.1.11', '192.168.1.12'],
    'macList': ['00:1A:2B:3C:4D:5E', '00:1A:2B:3C:4D:5F', '00:1A:2B:3C:4D:60'],
    'scanDetails': {
        'totalDevices': 45,
        'localIP': '192.168.1.100',
        'subnet': '192.168.1',
        'scannedAt': datetime.now().isoformat() + 'Z',
        'scanDuration': 8450,
        'deviceBreakdown': {
            'pcs': 32,
            'printers': 8,
            'cameras': 3,
            'networkDevices': 2,
            'unknown': 0
        }
    }
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

## Data Validation Checklist

Before sending scan data, verify:

- [ ] `centerCode` is 3-20 alphanumeric characters
- [ ] `systemCount` matches `ipList.length`
- [ ] All IPs in `ipList` are valid IPv4 addresses
- [ ] All MACs in `macList` are valid format (00:1A:2B:3C:4D:5E)
- [ ] No duplicate IPs or MACs
- [ ] `scanDuration` is in milliseconds
- [ ] `scannedAt` is ISO-8601 format
- [ ] `deviceBreakdown` sum matches `totalDevices`
- [ ] No null or undefined values
- [ ] JWT token is valid and not expired

## Rate Limiting

- **Limit**: 100 requests per minute per API key
- **Headers**: Include `X-RateLimit-*` in response

If rate limited (429):
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

Wait `retryAfter` seconds before retrying.

## Retry Strategy

The scanner implements exponential backoff:

```
Attempt 1: Immediate
Attempt 2: 2 seconds
Attempt 3: 4 seconds
Attempt 4: 8 seconds (if configured)
```

Max retries: 3 (configurable)

## Integration Checklist

- [ ] API endpoint is accessible
- [ ] JWT token is valid
- [ ] CORS headers are set (if browser)
- [ ] HTTPS is configured
- [ ] Database schema updated for scan records
- [ ] Authentication middleware is in place
- [ ] Request validation is implemented
- [ ] Error handling is comprehensive
- [ ] Logging is configured
- [ ] Test with sample scan data

## Troubleshooting

### 401 Unauthorized
- Verify JWT token format: `Bearer <token>`
- Check token expiration
- Verify token is for correct user
- Check token secret matches

### 400 Bad Request
- Verify JSON is valid
- All required fields present
- Field types are correct (number vs string)
- No extra whitespace in center code

### 503 Service Unavailable
- API server may be down
- Check API status page
- Retry with exponential backoff
- Implement offline mode

## Monitoring

Monitor these metrics:
- API response time (should be <1 second)
- Error rate (should be <1%)
- 401 errors (authentication issues)
- 400 errors (validation errors)
- Request volume trends

---

**Last Updated**: March 31, 2024
**Version**: 2.0
