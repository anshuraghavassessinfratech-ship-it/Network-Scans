#!/usr/bin/env node
/**
 * Enterprise Network Scanner for Exam Center Audit System
 * Version 2.0 - Production Grade
 * 
 * Features:
 * - MAC Address detection using ARP table
 * - Vendor lookup (Dell, HP, Lenovo, etc.)
 * - Duplicate prevention using MAC as unique identifier
 * - Parallel async scanning with batching
 * - Offline mode with local JSON storage
 * - Comprehensive logging (scan, error, API failure)
 * - Retry mechanism with timeout handling
 * 
 * Usage:
 *   node scanner.js --api-url https://your-api.com --token YOUR_JWT_TOKEN
 * 
 * Convert to EXE:
 *   npm install -g pkg
 *   pkg scanner.js --targets node18-win-x64 --output network-scanner.exe
 */

const os = require('os')
const dns = require('dns')
const fs = require('fs')
const path = require('path')
const { exec, spawn } = require('child_process')
const https = require('https')
const http = require('http')
const readline = require('readline')
const net = require('net')

// ==================== CONFIGURATION ====================
const CONFIG = {
  // Scanning parameters
  pingTimeout: 300,
  pingConcurrency: 100,
  portScanConcurrency: 50,
  portScanTimeout: 200,
  scanRangeStart: 1,
  scanRangeEnd: 254,
  
  // API settings
  apiEndpoint: '/api/network-scan',
  apiRetryAttempts: 3,
  apiRetryDelay: 2000,
  apiTimeout: 30000,
  
  // Ports for device identification
  windowsPorts: [135, 139, 445, 3389],
  linuxPorts: [22],
  printerPorts: [9100, 515, 631],
  routerPorts: [23, 80, 443, 8080],
  
  // Offline storage
  offlineDir: path.join(os.homedir(), '.exam-scanner'),
  offlineFile: 'pending-scans.json',
  logFile: 'scanner.log',
  errorLogFile: 'error.log',
  apiLogFile: 'api.log',
  scanLogFile: 'scan.log',
  configFile: 'scanner-config.json',
  historyFile: 'scan-history.json',
  
  // Performance settings
  maxRetries: 3,
  gracefulShutdownTimeout: 5000,
  enableMetrics: true,
  enableHistory: true,
}

// Load configuration from file if exists
function loadConfig() {
  const configPath = path.join(CONFIG.offlineDir, CONFIG.configFile)
  try {
    if (fs.existsSync(configPath)) {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      return { ...CONFIG, ...fileConfig }
    }
  } catch (err) {
    console.warn('Failed to load config file:', err.message)
  }
  return CONFIG
}

const CONFIG_LOADED = loadConfig()

// ==================== MAC VENDOR DATABASE ====================
// Common PC manufacturers (OUI prefixes)
const PC_VENDORS = {
  // Dell
  '00:14:22': 'Dell', '00:1E:C9': 'Dell', '00:21:9B': 'Dell', '00:22:19': 'Dell',
  '00:23:AE': 'Dell', '00:24:E8': 'Dell', '00:25:64': 'Dell', '00:26:B9': 'Dell',
  '14:FE:B5': 'Dell', '18:03:73': 'Dell', '18:A9:9B': 'Dell', '18:DB:F2': 'Dell',
  '24:B6:FD': 'Dell', '28:F1:0E': 'Dell', '34:17:EB': 'Dell', '44:A8:42': 'Dell',
  '54:9F:35': 'Dell', '5C:26:0A': 'Dell', '64:00:6A': 'Dell', '74:86:7A': 'Dell',
  '78:45:C4': 'Dell', '80:18:44': 'Dell', '84:7B:EB': 'Dell', '90:B1:1C': 'Dell',
  'A4:1F:72': 'Dell', 'A4:BA:DB': 'Dell', 'B0:83:FE': 'Dell', 'B8:2A:72': 'Dell',
  'B8:AC:6F': 'Dell', 'BC:30:5B': 'Dell', 'C8:1F:66': 'Dell', 'D0:67:E5': 'Dell',
  'D4:AE:52': 'Dell', 'D4:BE:D9': 'Dell', 'E0:DB:55': 'Dell', 'EC:F4:BB': 'Dell',
  'F0:1F:AF': 'Dell', 'F4:8E:38': 'Dell', 'F8:B1:56': 'Dell', 'F8:BC:12': 'Dell',
  
  // HP / Hewlett-Packard
  '00:0A:57': 'HP', '00:0B:CD': 'HP', '00:0D:9D': 'HP', '00:0E:7F': 'HP',
  '00:0F:20': 'HP', '00:0F:61': 'HP', '00:10:83': 'HP', '00:11:0A': 'HP',
  '00:11:85': 'HP', '00:12:79': 'HP', '00:13:21': 'HP', '00:14:38': 'HP',
  '00:15:60': 'HP', '00:16:35': 'HP', '00:17:08': 'HP', '00:17:A4': 'HP',
  '00:18:71': 'HP', '00:18:FE': 'HP', '00:19:BB': 'HP', '00:1A:4B': 'HP',
  '00:1B:78': 'HP', '00:1C:C4': 'HP', '00:1E:0B': 'HP', '00:1F:29': 'HP',
  '00:21:5A': 'HP', '00:22:64': 'HP', '00:23:7D': 'HP', '00:24:81': 'HP',
  '00:25:B3': 'HP', '00:26:55': 'HP', '00:30:6E': 'HP', '00:40:17': 'HP',
  '00:60:B0': 'HP', '08:00:09': 'HP', '10:00:5A': 'HP', '10:1F:74': 'HP',
  '10:60:4B': 'HP', '14:02:EC': 'HP', '14:58:D0': 'HP', '18:A9:05': 'HP',
  '1C:98:EC': 'HP', '1C:C1:DE': 'HP', '28:80:23': 'HP', '28:92:4A': 'HP',
  '2C:27:D7': 'HP', '2C:41:38': 'HP', '2C:44:FD': 'HP', '2C:59:E5': 'HP',
  '30:8D:99': 'HP', '30:E1:71': 'HP', '34:64:A9': 'HP', '38:63:BB': 'HP',
  '3C:52:82': 'HP', '3C:A8:2A': 'HP', '3C:D9:2B': 'HP', '40:A8:F0': 'HP',
  '40:B0:34': 'HP', '44:1E:A1': 'HP', '44:31:92': 'HP', '48:0F:CF': 'HP',
  
  // Lenovo
  '00:06:1B': 'Lenovo', '00:09:2D': 'Lenovo', '00:0C:29': 'Lenovo', '00:12:FE': 'Lenovo',
  '00:16:D3': 'Lenovo', '00:19:99': 'Lenovo', '00:1A:6B': 'Lenovo', '00:1E:4F': 'Lenovo',
  '00:1E:68': 'Lenovo', '00:21:86': 'Lenovo', '00:22:67': 'Lenovo', '00:23:20': 'Lenovo',
  '00:24:54': 'Lenovo', '00:25:11': 'Lenovo', '00:26:2D': 'Lenovo', '08:D4:0C': 'Lenovo',
  '10:4A:7D': 'Lenovo', '10:F9:6F': 'Lenovo', '18:4F:32': 'Lenovo', '20:47:47': 'Lenovo',
  '28:D2:44': 'Lenovo', '40:1C:83': 'Lenovo', '48:D2:24': 'Lenovo', '50:7B:9D': 'Lenovo',
  '54:EE:75': 'Lenovo', '5C:BA:37': 'Lenovo', '60:02:B4': 'Lenovo', '68:F7:28': 'Lenovo',
  '70:5A:0F': 'Lenovo', '74:E5:0B': 'Lenovo', '7C:7A:91': 'Lenovo', '80:FA:5B': 'Lenovo',
  '84:7A:88': 'Lenovo', '88:70:8C': 'Lenovo', '8C:EC:4B': 'Lenovo', '98:FA:9B': 'Lenovo',
  'A4:4C:C8': 'Lenovo', 'A8:1E:84': 'Lenovo', 'B0:7B:25': 'Lenovo', 'B4:6D:83': 'Lenovo',
  'BC:1A:EA': 'Lenovo', 'C0:C9:E3': 'Lenovo', 'C8:5B:76': 'Lenovo', 'D0:BF:9C': 'Lenovo',
  'D8:D3:85': 'Lenovo', 'E0:2F:6D': 'Lenovo', 'E8:40:F2': 'Lenovo', 'EC:89:14': 'Lenovo',
  'F0:03:8C': 'Lenovo', 'F4:4D:30': 'Lenovo', 'F8:0D:60': 'Lenovo', 'FC:D5:D9': 'Lenovo',
  
  // Acer
  '00:15:00': 'Acer', '00:1F:16': 'Acer', '10:60:4B': 'Acer', '40:61:86': 'Acer',
  '60:F8:1D': 'Acer', '7C:D3:0A': 'Acer', '8C:A9:82': 'Acer', 'B8:CA:3A': 'Acer',
  
  // ASUS
  '00:0C:6E': 'ASUS', '00:0E:A6': 'ASUS', '00:11:2F': 'ASUS', '00:13:D4': 'ASUS',
  '00:15:F2': 'ASUS', '00:17:31': 'ASUS', '00:18:F3': 'ASUS', '00:1A:92': 'ASUS',
  '00:1B:FC': 'ASUS', '00:1D:60': 'ASUS', '00:1E:8C': 'ASUS', '00:1F:C6': 'ASUS',
  '00:22:15': 'ASUS', '00:23:54': 'ASUS', '00:24:8C': 'ASUS', '00:26:18': 'ASUS',
  '04:D9:F5': 'ASUS', '08:62:66': 'ASUS', '0C:9D:92': 'ASUS', '10:7B:44': 'ASUS',
  '10:BF:48': 'ASUS', '14:DA:E9': 'ASUS', '1C:87:2C': 'ASUS', '20:CF:30': 'ASUS',
  
  // Intel (common in PCs)
  '00:03:47': 'Intel', '00:07:E9': 'Intel', '00:0E:0C': 'Intel', '00:0E:35': 'Intel',
  '00:11:11': 'Intel', '00:12:F0': 'Intel', '00:13:02': 'Intel', '00:13:20': 'Intel',
  '00:13:CE': 'Intel', '00:13:E8': 'Intel', '00:15:00': 'Intel', '00:15:17': 'Intel',
  '00:16:6F': 'Intel', '00:16:76': 'Intel', '00:16:EA': 'Intel', '00:16:EB': 'Intel',
  '00:17:35': 'Intel', '00:18:DE': 'Intel', '00:19:D1': 'Intel', '00:19:D2': 'Intel',
  '00:1B:21': 'Intel', '00:1B:77': 'Intel', '00:1C:BF': 'Intel', '00:1C:C0': 'Intel',
  '00:1D:E0': 'Intel', '00:1D:E1': 'Intel', '00:1E:64': 'Intel', '00:1E:65': 'Intel',
  '00:1E:67': 'Intel', '00:1F:3B': 'Intel', '00:1F:3C': 'Intel', '00:20:7B': 'Intel',
  '00:21:5C': 'Intel', '00:21:5D': 'Intel', '00:21:6A': 'Intel', '00:21:6B': 'Intel',
  '00:22:FA': 'Intel', '00:22:FB': 'Intel', '00:24:D6': 'Intel', '00:24:D7': 'Intel',
  '00:26:C6': 'Intel', '00:26:C7': 'Intel', '00:27:10': 'Intel',
  
  // Realtek (common in PCs)
  '00:0A:CD': 'Realtek', '00:0C:E7': 'Realtek', '00:E0:4C': 'Realtek',
  '00:E0:6F': 'Realtek', '08:10:75': 'Realtek', '08:3A:88': 'Realtek',
  '28:87:BA': 'Realtek', '34:97:F6': 'Realtek', '4C:ED:FB': 'Realtek',
  '50:3E:AA': 'Realtek', '52:54:00': 'Realtek', '54:E1:AD': 'Realtek',
  '74:D0:2B': 'Realtek', '80:FA:5B': 'Realtek', '98:E7:43': 'Realtek',
  'C4:E9:84': 'Realtek', 'C8:60:00': 'Realtek', 'D4:3D:7E': 'Realtek',
}

// Vendors to EXCLUDE (printers, cameras, routers, etc.)
const EXCLUDED_VENDORS = {
  // Printers
  '00:00:48': 'Epson', '00:00:85': 'Canon', '00:00:F0': 'Samsung', 
  '00:01:E3': 'Kyocera', '00:04:00': 'Lexmark', '00:0B:DB': 'Dell-Printer',
  '00:1B:A9': 'Brother', '00:1E:8F': 'Canon', '00:1F:A4': 'Kyocera-Mita',
  '00:20:00': 'Lexmark', '00:25:4B': 'Ricoh', '00:26:73': 'Ricoh',
  '00:80:77': 'Brother', '00:80:87': 'OKI', '00:80:91': 'HP-Printer',
  '08:00:37': 'Fujitsu', '30:CD:A7': 'Samsung-Printer', '3C:2A:F4': 'Brother',
  '40:B8:9A': 'HP-Printer', '48:BA:4E': 'Zebra', '5C:E8:EB': 'Samsung-Printer',
  '60:12:8B': 'Canon-Printer', '64:51:06': 'HP-Printer', '78:E7:D1': 'HP-Printer',
  '80:CE:62': 'HP-Printer', '98:4B:E1': 'HP-Printer', 'A0:D3:C1': 'HP-Printer',
  'AC:18:26': 'Seiko-Epson', 'B0:AC:FA': 'Brother', 'D8:49:2F': 'Canon-Printer',
  'E4:E7:49': 'HP-Printer', 'F4:81:39': 'HP-Printer', 'FC:15:B4': 'HP-Printer',
  
  // Network equipment (routers, switches, APs)
  '00:00:0C': 'Cisco', '00:01:42': 'Cisco', '00:01:43': 'Cisco', '00:01:63': 'Cisco',
  '00:01:64': 'Cisco', '00:01:96': 'Cisco', '00:01:97': 'Cisco', '00:01:C7': 'Cisco',
  '00:01:C9': 'Cisco', '00:02:3D': 'Cisco', '00:02:4A': 'Cisco', '00:02:4B': 'Cisco',
  '00:02:7D': 'Cisco', '00:02:7E': 'Cisco', '00:02:B9': 'Cisco', '00:02:BA': 'Cisco',
  '00:03:31': 'Cisco', '00:03:32': 'Cisco', '00:03:6B': 'Cisco', '00:03:9F': 'Cisco',
  '00:03:A0': 'Cisco', '00:03:E3': 'Cisco', '00:03:E4': 'Cisco', '00:03:FD': 'Cisco',
  '00:03:FE': 'Cisco', '00:04:27': 'Cisco', '00:04:28': 'Cisco', '00:04:4D': 'Cisco',
  '00:04:6D': 'Cisco', '00:04:6E': 'Cisco', '00:04:9A': 'Cisco', '00:04:9B': 'Cisco',
  '00:18:0A': 'TP-Link', '00:1D:0F': 'TP-Link', '00:23:CD': 'TP-Link',
  '00:25:86': 'TP-Link', '00:27:19': 'TP-Link', '14:CC:20': 'TP-Link',
  '14:CF:92': 'TP-Link', '18:A6:F7': 'TP-Link', '1C:3B:F3': 'TP-Link',
  '20:DC:E6': 'TP-Link', '28:EE:52': 'TP-Link', '30:B5:C2': 'TP-Link',
  '34:E8:94': 'TP-Link', '38:83:45': 'TP-Link', '40:16:7E': 'TP-Link',
  '50:C7:BF': 'TP-Link', '54:E6:FC': 'TP-Link', '5C:89:9A': 'TP-Link',
  '60:E3:27': 'TP-Link', '64:66:B3': 'TP-Link', '64:70:02': 'TP-Link',
  '6C:5A:B5': 'TP-Link', '6C:B0:CE': 'TP-Link', '70:4F:57': 'TP-Link',
  '74:EA:3A': 'TP-Link', '78:A1:06': 'TP-Link', '7C:8B:CA': 'TP-Link',
  '80:89:17': 'TP-Link', '84:16:F9': 'TP-Link', '88:25:93': 'TP-Link',
  '8C:21:0A': 'TP-Link', '90:F6:52': 'TP-Link', '94:0C:6D': 'TP-Link',
  '98:DA:C4': 'TP-Link', 'A0:F3:C1': 'TP-Link', 'AC:84:C6': 'TP-Link',
  'B0:4E:26': 'TP-Link', 'B4:B0:24': 'TP-Link', 'BC:46:99': 'TP-Link',
  'C0:25:E9': 'TP-Link', 'C4:6E:1F': 'TP-Link', 'C8:3A:35': 'TP-Link',
  'CC:32:E5': 'TP-Link', 'D4:6E:0E': 'TP-Link', 'D8:07:B6': 'TP-Link',
  'DC:FE:07': 'TP-Link', 'E4:D3:32': 'TP-Link', 'E8:DE:27': 'TP-Link',
  'F4:EC:38': 'TP-Link', 'F8:D1:11': 'TP-Link', 'FC:D7:33': 'TP-Link',
  
  // D-Link
  '00:05:5D': 'D-Link', '00:0D:88': 'D-Link', '00:0F:3D': 'D-Link',
  '00:11:95': 'D-Link', '00:13:46': 'D-Link', '00:15:E9': 'D-Link',
  '00:17:9A': 'D-Link', '00:19:5B': 'D-Link', '00:1B:11': 'D-Link',
  '00:1C:F0': 'D-Link', '00:1E:58': 'D-Link', '00:21:91': 'D-Link',
  '00:22:B0': 'D-Link', '00:24:01': 'D-Link', '00:26:5A': 'D-Link',
  '00:50:BA': 'D-Link', '14:D6:4D': 'D-Link', '1C:7E:E5': 'D-Link',
  
  // Netgear
  '00:09:5B': 'Netgear', '00:0F:B5': 'Netgear', '00:14:6C': 'Netgear',
  '00:18:4D': 'Netgear', '00:1B:2F': 'Netgear', '00:1E:2A': 'Netgear',
  '00:1F:33': 'Netgear', '00:22:3F': 'Netgear', '00:24:B2': 'Netgear',
  '00:26:F2': 'Netgear', '08:BD:43': 'Netgear', '10:0D:7F': 'Netgear',
  '10:0C:6B': 'Netgear', '20:4E:7F': 'Netgear', '28:C6:8E': 'Netgear',
  '2C:B0:5D': 'Netgear', '30:46:9A': 'Netgear', '44:94:FC': 'Netgear',
  
  // IP Cameras
  '00:0F:7C': 'Hikvision', '00:1A:FA': 'Hikvision', '00:3C:1F': 'Hikvision',
  '18:68:CB': 'Hikvision', '28:57:BE': 'Hikvision', '2C:51:9B': 'Hikvision',
  '38:D5:47': 'Hikvision', '44:19:B6': 'Hikvision', '4C:BD:8F': 'Hikvision',
  '54:C4:15': 'Hikvision', '58:03:FB': 'Hikvision', '5C:F9:6A': 'Hikvision',
  '64:00:F1': 'Hikvision', '68:CB:6A': 'Hikvision', '7C:08:D9': 'Hikvision',
  '80:08:B0': 'Hikvision', '84:B8:B8': 'Hikvision', '8C:E1:17': 'Hikvision',
  'A4:16:E7': 'Hikvision', 'B4:A3:82': 'Hikvision', 'BC:AD:28': 'Hikvision',
  'C0:56:27': 'Hikvision', 'C4:2F:90': 'Hikvision', 'D4:28:B2': 'Hikvision',
  'DC:02:8E': 'Hikvision', 'E0:50:8B': 'Hikvision', 'EC:8E:B5': 'Hikvision',
  'F0:2F:4B': 'Hikvision', 'F8:A0:97': 'Hikvision',
  
  // Dahua cameras
  '00:19:4D': 'Dahua', '3C:EF:8C': 'Dahua', '48:2A:E3': 'Dahua',
  '4C:11:BF': 'Dahua', '54:2A:9C': 'Dahua', '90:02:A9': 'Dahua',
  'B8:A3:86': 'Dahua', 'C8:42:05': 'Dahua', 'D0:E4:43': 'Dahua',
  'D4:43:0E': 'Dahua', 'E0:50:8B': 'Dahua',
}

// ==================== LOGGER ====================
class Logger {
  constructor() {
    this.ensureOfflineDir()
    this.logPaths = {
      general: path.join(CONFIG_LOADED.offlineDir, CONFIG_LOADED.logFile),
      error: path.join(CONFIG_LOADED.offlineDir, CONFIG_LOADED.errorLogFile),
      api: path.join(CONFIG_LOADED.offlineDir, CONFIG_LOADED.apiLogFile),
      scan: path.join(CONFIG_LOADED.offlineDir, CONFIG_LOADED.scanLogFile),
    }
  }
  
  ensureOfflineDir() {
    if (!fs.existsSync(CONFIG_LOADED.offlineDir)) {
      fs.mkdirSync(CONFIG_LOADED.offlineDir, { recursive: true })
    }
  }
  
  log(level, message, data = null, category = 'general') {
    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ' | ' + JSON.stringify(data) : ''}\n`
    
    // Console output
    if (level === 'error') {
      console.error(logLine.trim())
    } else if (level === 'warn') {
      console.warn(logLine.trim())
    } else if (level === 'info') {
      console.log(logLine.trim())
    }
    
    // File output - general log always
    try {
      fs.appendFileSync(this.logPaths.general, logLine)
    } catch (err) {
      // Silent fail
    }
    
    // Category-specific log
    if (this.logPaths[category]) {
      try {
        fs.appendFileSync(this.logPaths[category], logLine)
      } catch (err) {
        // Silent fail
      }
    }
  }
  
  info(message, data = null) {
    this.log('info', message, data, 'general')
  }
  
  error(message, data = null) {
    this.log('error', message, data, 'error')
  }
  
  warn(message, data = null) {
    this.log('warn', message, data, 'general')
  }
  
  scan(message, data = null) {
    this.log('scan', message, data, 'scan')
  }
  
  api(message, data = null) {
    this.log('api', message, data, 'api')
  }
  
  getLogPath(category = 'general') {
    return this.logPaths[category]
  }
  
  getLogs(category = 'general', lines = 100) {
    try {
      if (!fs.existsSync(this.logPaths[category])) return []
      const content = fs.readFileSync(this.logPaths[category], 'utf8')
      return content.split('\n').slice(-lines).filter(line => line.trim())
    } catch (err) {
      return []
    }
  }
}

const logger = new Logger()

// ==================== OFFLINE STORAGE ====================
class OfflineStorage {
  constructor() {
    this.ensureDir()
    this.filePath = path.join(CONFIG_LOADED.offlineDir, CONFIG_LOADED.offlineFile)
    this.historyPath = path.join(CONFIG_LOADED.offlineDir, CONFIG_LOADED.historyFile)
  }
  
  ensureDir() {
    if (!fs.existsSync(CONFIG_LOADED.offlineDir)) {
      fs.mkdirSync(CONFIG_LOADED.offlineDir, { recursive: true })
    }
  }
  
  loadPendingScans() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8')
        return JSON.parse(data)
      }
    } catch (err) {
      logger.error('Failed to load pending scans', { error: err.message })
    }
    return []
  }
  
  savePendingScan(scanData) {
    try {
      const pending = this.loadPendingScans()
      pending.push({
        ...scanData,
        savedAt: new Date().toISOString(),
        retryCount: 0,
        lastError: null,
      })
      fs.writeFileSync(this.filePath, JSON.stringify(pending, null, 2))
      logger.info('Scan saved offline', { centerCode: scanData.centerCode })
      return true
    } catch (err) {
      logger.error('Failed to save scan offline', { error: err.message })
      return false
    }
  }
  
  removePendingScan(index) {
    try {
      const pending = this.loadPendingScans()
      pending.splice(index, 1)
      fs.writeFileSync(this.filePath, JSON.stringify(pending, null, 2))
      return true
    } catch (err) {
      logger.error('Failed to remove pending scan', { error: err.message })
      return false
    }
  }
  
  updatePendingScan(index, updates) {
    try {
      const pending = this.loadPendingScans()
      if (pending[index]) {
        pending[index] = { ...pending[index], ...updates, updatedAt: new Date().toISOString() }
        fs.writeFileSync(this.filePath, JSON.stringify(pending, null, 2))
        return true
      }
      return false
    } catch (err) {
      logger.error('Failed to update pending scan', { error: err.message })
      return false
    }
  }
  
  clearPendingScans() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify([]))
      return true
    } catch (err) {
      return false
    }
  }
  
  // Scan History Management
  addToHistory(scanResult) {
    try {
      if (!CONFIG_LOADED.enableHistory) return true
      
      const history = this.loadHistory()
      const historyEntry = {
        id: `SCAN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        centerCode: scanResult.centerCode,
        centerName: scanResult.centerName,
        totalDevices: scanResult.totalDevices,
        pcs: scanResult.pcs.length,
        printers: scanResult.printers?.length || 0,
        cameras: scanResult.cameras?.length || 0,
        unknown: scanResult.unknown?.length || 0,
        subnet: scanResult.networkInfo?.subnet,
        duration: scanResult.duration,
        status: 'completed',
      }
      
      history.push(historyEntry)
      // Keep last 100 scans
      const trimmed = history.slice(-100)
      fs.writeFileSync(this.historyPath, JSON.stringify(trimmed, null, 2))
      logger.scan('Scan added to history', { id: historyEntry.id })
      return historyEntry.id
    } catch (err) {
      logger.error('Failed to add to history', { error: err.message })
      return null
    }
  }
  
  loadHistory() {
    try {
      if (fs.existsSync(this.historyPath)) {
        const data = fs.readFileSync(this.historyPath, 'utf8')
        return JSON.parse(data)
      }
    } catch (err) {
      logger.error('Failed to load history', { error: err.message })
    }
    return []
  }
  
  getHistoryStats() {
    try {
      const history = this.loadHistory()
      if (!history.length) return null
      
      const totalScans = history.length
      const avgPCs = Math.round(history.reduce((sum, h) => sum + h.pcs, 0) / totalScans)
      const lastScan = history[history.length - 1]
      
      return {
        totalScans,
        avgPCs,
        lastScan,
        history: history.slice(-10), // Last 10
      }
    } catch (err) {
      return null
    }
  }
}

const offlineStorage = new OfflineStorage()

// ==================== DIAGNOSTICS ====================
class NetworkDiagnostics {
  static async checkConnectivity() {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      networkAvailable: false,
      interfaces: [],
      dns: { available: false, resolvedIP: null },
      internet: { available: false, testIP: '8.8.8.8' },
      errors: [],
    }
    
    try {
      const interfaces = os.networkInterfaces()
      diagnostics.interfaces = Object.keys(interfaces).map(name => ({
        name,
        addresses: interfaces[name].filter(iface => iface.family === 'IPv4' && !iface.internal),
      }))
      
      // Check DNS
      await new Promise((resolve) => {
        dns.lookup('google.com', (err, address) => {
          if (!err) {
            diagnostics.dns.available = true
            diagnostics.dns.resolvedIP = address
            diagnostics.networkAvailable = true
          } else {
            diagnostics.errors.push(`DNS Error: ${err.message}`)
          }
          resolve()
        })
      })
      
      // Check internet (ping 8.8.8.8)
      const internetCheck = await this.checkInternet()
      diagnostics.internet.available = internetCheck
      if (!internetCheck) {
        diagnostics.errors.push('Internet connectivity check failed')
      }
    } catch (err) {
      diagnostics.errors.push(err.message)
    }
    
    logger.scan('Diagnostics check complete', diagnostics)
    return diagnostics
  }
  
  static checkInternet() {
    return new Promise((resolve) => {
      const isWindows = os.platform() === 'win32'
      const cmd = isWindows ? 'ping -n 1 -w 1000 8.8.8.8' : 'ping -c 1 -W 1 8.8.8.8'
      
      exec(cmd, { timeout: 3000 }, (error, stdout) => {
        if (error) {
          resolve(false)
        } else {
          const success = isWindows
            ? !stdout.includes('Request timed out') && !stdout.includes('unreachable')
            : stdout.includes('1 received')
          resolve(success)
        }
      })
    })
  }
  
  static async getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: os.uptime(),
      freeMem: os.freemem(),
      totalMem: os.totalmem(),
      cpus: os.cpus().length,
    }
  }
}

// ==================== NETWORK UTILITIES ====================


// Get local IP and subnet info
function getLocalNetworkInfo() {
  const interfaces = os.networkInterfaces()
  const validNetworks = []
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const parts = iface.address.split('.')
        const subnet = `${parts[0]}.${parts[1]}.${parts[2]}`
        
        const isPrivate = 
          (parts[0] === '192' && parts[1] === '168') ||
          parts[0] === '10' ||
          (parts[0] === '172' && parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31)
        
        if (isPrivate) {
          validNetworks.push({
            localIP: iface.address,
            subnet,
            netmask: iface.netmask,
            mac: iface.mac,
            interfaceName: name,
          })
        }
      }
    }
  }
  
  return validNetworks.length > 0 ? validNetworks[0] : null
}

// Get ARP table to map IP to MAC addresses
function getARPTable() {
  return new Promise((resolve) => {
    const isWindows = os.platform() === 'win32'
    const cmd = isWindows ? 'arp -a' : 'arp -an'
    
    exec(cmd, { timeout: 10000 }, (error, stdout) => {
      if (error) {
        logger.error('Failed to get ARP table', { error: error.message })
        resolve({})
        return
      }
      
      const arpMap = {}
      const lines = stdout.split('\n')
      
      for (const line of lines) {
        let match
        
        if (isWindows) {
          // Windows: 192.168.1.1     00-aa-bb-cc-dd-ee     dynamic
          match = line.match(/(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F-]{17})/i)
          if (match) {
            const ip = match[1]
            const mac = match[2].replace(/-/g, ':').toUpperCase()
            arpMap[ip] = mac
          }
        } else {
          // Linux/Mac: ? (192.168.1.1) at 00:aa:bb:cc:dd:ee [ether] on eth0
          match = line.match(/\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([0-9a-fA-F:]{17})/i)
          if (match) {
            const ip = match[1]
            const mac = match[2].toUpperCase()
            arpMap[ip] = mac
          }
        }
      }
      
      logger.scan('ARP table loaded', { entries: Object.keys(arpMap).length })
      resolve(arpMap)
    })
  })
}

// Refresh ARP table by pinging subnet
async function refreshARPTable(subnet) {
  const isWindows = os.platform() === 'win32'
  
  // Ping broadcast to populate ARP
  return new Promise((resolve) => {
    if (isWindows) {
      exec(`ping -n 1 -w 1 ${subnet}.255`, { timeout: 3000 }, () => resolve())
    } else {
      exec(`ping -c 1 -W 1 ${subnet}.255`, { timeout: 3000 }, () => resolve())
    }
  })
}

// Lookup vendor from MAC address
function lookupVendor(mac) {
  if (!mac) return { vendor: 'Unknown', isPC: false, isExcluded: false }
  
  // Get OUI (first 3 octets)
  const oui = mac.substring(0, 8).toUpperCase()
  
  // Check excluded vendors first
  if (EXCLUDED_VENDORS[oui]) {
    return {
      vendor: EXCLUDED_VENDORS[oui],
      isPC: false,
      isExcluded: true,
    }
  }
  
  // Check PC vendors
  if (PC_VENDORS[oui]) {
    return {
      vendor: PC_VENDORS[oui],
      isPC: true,
      isExcluded: false,
    }
  }
  
  return {
    vendor: 'Unknown',
    isPC: false,
    isExcluded: false,
  }
}

// Ping with timeout
function pingIP(ip, timeout = CONFIG.pingTimeout) {
  return new Promise((resolve) => {
    const isWindows = os.platform() === 'win32'
    const pingCmd = isWindows
      ? `ping -n 1 -w ${timeout} ${ip}`
      : `ping -c 1 -W 1 ${ip}`
    
    exec(pingCmd, { timeout: timeout + 500 }, (error, stdout) => {
      if (error) {
        resolve({ ip, alive: false })
        return
      }
      
      const alive = isWindows
        ? !stdout.includes('Request timed out') && !stdout.includes('unreachable') && !stdout.includes('could not find')
        : stdout.includes('1 received') || stdout.includes('1 packets received')
      
      resolve({ ip, alive })
    })
  })
}

// Check port with timeout
function checkPort(ip, port, timeout = CONFIG.portScanTimeout) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let resolved = false
    
    const done = (result) => {
      if (!resolved) {
        resolved = true
        socket.destroy()
        resolve(result)
      }
    }
    
    socket.setTimeout(timeout)
    socket.on('connect', () => done(true))
    socket.on('timeout', () => done(false))
    socket.on('error', () => done(false))
    
    try {
      socket.connect(port, ip)
    } catch {
      done(false)
    }
  })
}

// Get hostname via DNS reverse lookup
function getHostname(ip) {
  return new Promise((resolve) => {
    dns.reverse(ip, (err, hostnames) => {
      resolve(err || !hostnames?.length ? null : hostnames[0])
    })
  })
}

// Get NetBIOS name (Windows)
function getNetBIOSName(ip) {
  return new Promise((resolve) => {
    if (os.platform() !== 'win32') {
      resolve(null)
      return
    }
    
    exec(`nbtstat -A ${ip}`, { timeout: 3000 }, (error, stdout) => {
      if (error) {
        resolve(null)
        return
      }
      
      const lines = stdout.split('\n')
      for (const line of lines) {
        if (line.includes('<00>') && line.includes('UNIQUE')) {
          const parts = line.trim().split(/\s+/)
          if (parts[0] && !parts[0].startsWith('MAC')) {
            resolve(parts[0])
            return
          }
        }
      }
      resolve(null)
    })
  })
}

// Progress bar
function printProgress(current, total, label = '') {
  const barLength = 40
  const progress = Math.min(current / total, 1)
  const filled = Math.round(barLength * progress)
  const empty = barLength - filled
  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  const percent = Math.round(progress * 100)
  
  process.stdout.clearLine?.(0)
  process.stdout.cursorTo?.(0)
  process.stdout.write(`[${bar}] ${percent}% ${label}`)
}

// ==================== MAIN SCANNER ====================

async function scanNetwork(onProgress) {
  const startTime = Date.now()
  const networkInfo = getLocalNetworkInfo()
  
  if (!networkInfo) {
    throw new Error('Could not detect local network. Please check network connection.')
  }
  
  logger.scan('Starting network scan', { subnet: networkInfo.subnet, localIP: networkInfo.localIP })
  
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║     ENTERPRISE NETWORK SCANNER v2.0 - Production Grade    ║')
  console.log('║     Exam Center Audit System                              ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')
  
  console.log(`Local IP: ${networkInfo.localIP}`)
  console.log(`Interface: ${networkInfo.interfaceName}`)
  console.log(`Scanning: ${networkInfo.subnet}.0/24\n`)
  
  // Phase 0: System diagnostics
  console.log('Phase 0: System Diagnostics...\n')
  const diagnostics = await NetworkDiagnostics.checkConnectivity()
  console.log(`  Network Available: ${diagnostics.networkAvailable ? '✓' : '✗'}`)
  console.log(`  DNS Available: ${diagnostics.dns.available ? '✓' : '✗'}`)
  console.log(`  Internet Available: ${diagnostics.internet.available ? '✓' : '✗'}\n`)
  
  if (diagnostics.errors.length > 0) {
    console.log('Warnings:')
    diagnostics.errors.forEach(err => console.log(`  ⚠ ${err}`))
    console.log()
  }
  
  // Phase 1: Refresh ARP and discover hosts
  console.log('Phase 1: Host Discovery (Parallel Ping Sweep)...\n')
  
  await refreshARPTable(networkInfo.subnet)
  
  const ipsToScan = []
  for (let i = CONFIG_LOADED.scanRangeStart; i <= CONFIG_LOADED.scanRangeEnd; i++) {
    ipsToScan.push(`${networkInfo.subnet}.${i}`)
  }
  
  const totalIPs = ipsToScan.length
  const activeHosts = []
  let scanned = 0
  
  // Parallel ping with batching
  const batchSize = CONFIG_LOADED.pingConcurrency
  
  for (let i = 0; i < ipsToScan.length; i += batchSize) {
    const batch = ipsToScan.slice(i, i + batchSize)
    const results = await Promise.all(batch.map(ip => pingIP(ip)))
    
    for (const result of results) {
      scanned++
      if (result.alive) {
        activeHosts.push(result.ip)
      }
      
      if (onProgress) {
        onProgress({ phase: 'discovery', current: scanned, total: totalIPs, found: activeHosts.length })
      }
      
      printProgress(scanned, totalIPs, `Found: ${activeHosts.length} hosts`)
    }
  }
  
  console.log(`\n\nDiscovered ${activeHosts.length} active hosts.\n`)
  logger.scan('Host discovery complete', { activeHosts: activeHosts.length })
  
  // Phase 2: Get ARP table for MAC addresses
  console.log('Phase 2: MAC Address Resolution (ARP Table)...\n')
  
  const arpTable = await getARPTable()
  
  // Phase 3: Identify devices
  console.log('Phase 3: Device Identification (Vendor + Ports)...\n')
  
  const devices = []
  const seenMACs = new Set() // For deduplication
  let identified = 0
  
  for (const ip of activeHosts) {
    identified++
    
    // Get MAC from ARP
    const mac = arpTable[ip] || null
    
    // Skip duplicates by MAC
    if (mac && seenMACs.has(mac)) {
      logger.scan('Skipping duplicate MAC', { ip, mac })
      printProgress(identified, activeHosts.length, `Processing: ${identified}/${activeHosts.length}`)
      continue
    }
    
    if (mac) {
      seenMACs.add(mac)
    }
    
    // Vendor lookup
    const vendorInfo = lookupVendor(mac)
    
    // Get hostname
    const hostname = await getHostname(ip)
    const netbiosName = await getNetBIOSName(ip)
    const displayName = netbiosName || hostname || ip
    
    // Determine device type
    let deviceType = 'unknown'
    let confidence = 'low'
    
    if (vendorInfo.isExcluded) {
      deviceType = vendorInfo.vendor.toLowerCase().includes('printer') ? 'printer' : 
                   vendorInfo.vendor.toLowerCase().includes('camera') || vendorInfo.vendor.toLowerCase().includes('hikvision') || vendorInfo.vendor.toLowerCase().includes('dahua') ? 'camera' : 'network-device'
      confidence = 'high'
    } else if (vendorInfo.isPC) {
      deviceType = 'pc'
      confidence = 'high'
    } else {
      // Port-based detection for unknown vendors
      const [winRPC, netbios, smb, rdp, ssh, printer9100, printerLPD] = await Promise.all([
        checkPort(ip, 135),
        checkPort(ip, 139),
        checkPort(ip, 445),
        checkPort(ip, 3389),
        checkPort(ip, 22),
        checkPort(ip, 9100),
        checkPort(ip, 515),
      ])
      
      if (printer9100 || printerLPD) {
        deviceType = 'printer'
        confidence = 'medium'
      } else if (winRPC || smb || rdp) {
        deviceType = 'pc'
        confidence = 'medium'
      } else if (ssh) {
        deviceType = 'possible-pc'
        confidence = 'low'
      }
    }
    
    const device = {
      ip,
      mac: mac || 'Unknown',
      vendor: vendorInfo.vendor,
      hostname: displayName,
      type: deviceType,
      confidence,
    }
    
    devices.push(device)
    
    if (onProgress) {
      onProgress({ phase: 'identification', current: identified, total: activeHosts.length, devices })
    }
    
    printProgress(identified, activeHosts.length, `Processing: ${identified}/${activeHosts.length}`)
  }
  
  console.log('\n')
  
  // Categorize results
  const pcs = devices.filter(d => d.type === 'pc' || d.type === 'possible-pc')
  const printers = devices.filter(d => d.type === 'printer')
  const cameras = devices.filter(d => d.type === 'camera')
  const networkDevices = devices.filter(d => d.type === 'network-device')
  const unknown = devices.filter(d => d.type === 'unknown')
  
  logger.scan('Scan complete', {
    total: devices.length,
    pcs: pcs.length,
    printers: printers.length,
    cameras: cameras.length,
    networkDevices: networkDevices.length,
    unknown: unknown.length,
  })
  
  const duration = Date.now() - startTime
  
  return {
    networkInfo,
    totalDevices: devices.length,
    devices,
    pcs,
    printers,
    cameras,
    networkDevices,
    unknown,
    systemCount: pcs.length,
    ipList: pcs.map(d => d.ip),
    macList: pcs.map(d => d.mac).filter(m => m !== 'Unknown'),
    duration,
  }
}

// ==================== API COMMUNICATION ====================

class APIClient {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl
    this.token = token
    this.requestCount = 0
    this.errorCount = 0
  }
  
  async sendWithRetry(data, retries = CONFIG_LOADED.apiRetryAttempts) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.api(`API attempt ${attempt}/${retries}`, { centerCode: data.centerCode })
        
        const result = await this.send(data)
        
        if (result.success) {
          logger.api('API call successful', { scanId: result.data?.scanId })
          this.requestCount++
          return result
        }
        
        logger.api(`API call failed: ${result.error}`, { 
          statusCode: result.statusCode,
          response: result.response 
        })
        console.error(`❌ API Error: ${result.error}`)
        this.errorCount++
        
        if (attempt < retries) {
          const delay = CONFIG_LOADED.apiRetryDelay * attempt // Exponential backoff
          console.log(`⏳ Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${retries + 1})`)
          await new Promise(r => setTimeout(r, delay))
        }
      } catch (error) {
        logger.error(`API attempt ${attempt + 1} failed`, { 
          error: error.message,
          code: error.code,
          stack: error.stack?.substring(0, 200)
        })
        console.error(`❌ Network Error: ${error.message} (code: ${error.code})`)
        this.errorCount++
        
        if (attempt < retries) {
          const delay = CONFIG_LOADED.apiRetryDelay * attempt
          console.log(`⏳ Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${retries + 1})`)
          await new Promise(r => setTimeout(r, delay))
        }
      }
    }
    
    return { success: false, error: 'All retry attempts failed' }
  }
  
  send(data) {
    return new Promise((resolve, reject) => {
      const normalizedBase = this.apiUrl.replace(/\/+$/, '')
      const endpoint = CONFIG_LOADED.apiEndpoint.startsWith('/') ? CONFIG_LOADED.apiEndpoint : `/${CONFIG_LOADED.apiEndpoint}`
      const fullApiUrl = normalizedBase.endsWith('/api/network-scan')
        ? normalizedBase
        : normalizedBase + endpoint

      const url = new URL(fullApiUrl)
      const isHttps = url.protocol === 'https:'
      const client = isHttps ? https : http
      
      const payload = JSON.stringify(data)
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        timeout: CONFIG_LOADED.apiTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Authorization': `Bearer ${this.token}`,
          'User-Agent': 'ExamCenterScanner/2.0',
        },
      }
      
      const req = client.request(options, (res) => {
        let body = ''
        res.on('data', chunk => body += chunk)
        res.on('end', () => {
          try {
            const result = JSON.parse(body)
            
            // Log response details for debugging
            console.log(`📡 API Response: ${res.statusCode} ${res.statusMessage}`)
            console.log(`📦 Response Body: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`)
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result)
            } else {
              resolve({ 
                success: false, 
                error: `HTTP ${res.statusCode}: ${result.error || result.message || 'Unknown error'}`,
                statusCode: res.statusCode,
                response: result
              })
            }
          } catch (parseError) {
            console.error(`❌ Failed to parse response: ${parseError.message}`)
            console.error(`❌ Raw response body: ${body}`)
            resolve({ success: false, error: `Invalid server response: ${parseError.message}` })
          }
        })
      })
      
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })
      
      req.on('error', (error) => {
        reject(error)
      })
      
      req.write(payload)
      req.end()
    })
  }
  
  getStats() {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      successRate: this.requestCount > 0 
        ? Math.round(((this.requestCount - this.errorCount) / this.requestCount) * 100) 
        : 0,
    }
  }
}

// ==================== SYNC PENDING SCANS ====================

async function syncPendingScans(apiUrl, token) {
  const pending = offlineStorage.loadPendingScans()
  
  if (pending.length === 0) {
    console.log('\nNo pending scans to sync.\n')
    return { synced: 0, failed: 0 }
  }
  
  console.log(`\nFound ${pending.length} pending scan(s). Syncing...\n`)
  
  const apiClient = new APIClient(apiUrl, token)
  let synced = 0
  let failed = 0
  
  for (let i = 0; i < pending.length; i++) {
    const scan = pending[i]
    console.log(`[${i + 1}/${pending.length}] Syncing: ${scan.centerCode} (${scan.savedAt})...`)
    
    const result = await apiClient.sendWithRetry(scan, 2)
    
    if (result.success) {
      offlineStorage.removePendingScan(i - synced)
      synced++
      console.log(`  ✓ Synced successfully`)
      logger.api('Pending scan synced', { centerCode: scan.centerCode })
    } else {
      const retryCount = (scan.retryCount || 0) + 1
      offlineStorage.updatePendingScan(i - synced, { 
        retryCount, 
        lastError: result.error,
      })
      failed++
      console.log(`  ✗ Failed: ${result.error} (Retry ${retryCount})`)
      logger.error('Failed to sync pending scan', { centerCode: scan.centerCode, error: result.error })
    }
  }
  
  console.log(`\nSync complete: ${synced} synced, ${failed} failed\n`)
  logger.api('Sync batch complete', { synced, failed })
  
  return { synced, failed }
}

// ==================== INTERACTIVE PROMPTS ====================

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

function parseArgs() {
  const args = process.argv.slice(2)
  const config = {
    apiUrl: '',
    token: '',
    centerCode: '',
    centerName: '',
    city: '',
    auditorName: '',
    contact: '',
    syncOnly: false,
    showStats: false,
    showLogs: false,
    logType: 'general',
    diagnostics: false,
  }
  
  for (let i = 0; i < args.length; i++) {
    const key = args[i]
    const value = args[i + 1]
    
    switch (key) {
      case '--api-url': config.apiUrl = value; i++; break
      case '--token': config.token = value; i++; break
      case '--center-code': config.centerCode = value; i++; break
      case '--center-name': config.centerName = value; i++; break
      case '--city': config.city = value; i++; break
      case '--auditor': config.auditorName = value; i++; break
      case '--contact': config.contact = value; i++; break
      case '--sync': config.syncOnly = true; break
      case '--stats': config.showStats = true; break
      case '--logs': config.showLogs = true; config.logType = value || 'general'; i++; break
      case '--diagnostics': config.diagnostics = true; break
    }
  }
  
  return config
}

// ==================== MAIN ====================

async function main() {
  let config = parseArgs()
  
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║  ENTERPRISE NETWORK SCANNER v2.0 - Production Grade       ║')
  console.log('║  Exam Center Audit System                                 ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')
  
  logger.info('Scanner started', { command: process.argv.slice(2) })
  
  // Handle special commands
  if (config.diagnostics) {
    console.log('Running Diagnostics...\n')
    const diags = await NetworkDiagnostics.checkConnectivity()
    const sysInfo = await NetworkDiagnostics.getSystemInfo()
    
    console.log('System Information:')
    console.log(`  Platform: ${sysInfo.platform} ${sysInfo.arch}`)
    console.log(`  Node Version: ${sysInfo.nodeVersion}`)
    console.log(`  CPUs: ${sysInfo.cpus}`)
    console.log(`  Free Memory: ${(sysInfo.freeMem / 1024 / 1024).toFixed(2)} MB`)
    console.log(`  Total Memory: ${(sysInfo.totalMem / 1024 / 1024).toFixed(2)} MB`)
    
    console.log('\nNetwork Diagnostics:')
    console.log(`  Network Available: ${diags.networkAvailable ? '✓' : '✗'}`)
    console.log(`  DNS Available: ${diags.dns.available ? '✓' : '✗'}`)
    console.log(`  Internet Available: ${diags.internet.available ? '✓' : '✗'}`)
    console.log(`  Interfaces: ${diags.interfaces.length}`)
    
    if (diags.errors.length > 0) {
      console.log('\nErrors:')
      diags.errors.forEach(err => console.log(`  ✗ ${err}`))
    }
    
    console.log('\nLog Locations:')
    console.log(`  General: ${logger.getLogPath('general')}`)
    console.log(`  Error: ${logger.getLogPath('error')}`)
    console.log(`  API: ${logger.getLogPath('api')}`)
    console.log(`  Scan: ${logger.getLogPath('scan')}`)
    
    return
  }
  
  if (config.showStats) {
    console.log('Scan History & Statistics:\n')
    const stats = offlineStorage.getHistoryStats()
    if (stats) {
      console.log(`Total Scans: ${stats.totalScans}`)
      console.log(`Average PCs per Scan: ${stats.avgPCs}`)
      console.log(`Last Scan: ${stats.lastScan ? new Date(stats.lastScan.timestamp).toLocaleString() : 'N/A'}`)
      console.log(`\nLast 10 Scans:`)
      stats.history.forEach((h, i) => {
        console.log(`  ${i + 1}. ${h.centerCode} - ${h.pcs} PCs - ${new Date(h.timestamp).toLocaleString()}`)
      })
    } else {
      console.log('No scan history available')
    }
    return
  }
  
  if (config.showLogs) {
    console.log(`\nRecent ${config.logType.toUpperCase()} Logs:\n`)
    const logs = logger.getLogs(config.logType, 20)
    logs.forEach(log => console.log(log))
    return
  }
  
  // Interactive mode
  if (!config.apiUrl) {
    config.apiUrl = await prompt('Enter API URL (e.g., https://your-api.vercel.app): ')
  }
  
  if (!config.token) {
    config.token = await prompt('Enter JWT Token: ')
  }
  
  // Check connectivity first
  console.log('\nChecking connectivity...')
  const diags = await NetworkDiagnostics.checkConnectivity()
  if (!diags.dns.available) {
    console.warn('⚠ DNS unavailable - offline sync may be required')
  }
  
  // Sync pending scans first
  if (diags.dns.available) {
    const syncResult = await syncPendingScans(config.apiUrl, config.token)
    if (syncResult.failed > 0 && config.syncOnly) {
      console.log('\nSome scans failed to sync. Please try again later.')
      return
    }
  } else if (config.syncOnly) {
    console.log('\nNo internet connection. Cannot sync pending scans now.')
    return
  }
  
  if (config.syncOnly) {
    console.log('Sync-only mode. Exiting.\n')
    return
  }
  
  // Get center details
  if (!config.centerCode) {
    config.centerCode = await prompt('Enter Center Code: ')
  }
  
  if (!config.centerName) {
    config.centerName = await prompt('Enter Center Name: ')
  }
  
  if (!config.city) {
    config.city = await prompt('Enter City: ')
  }
  
  if (!config.auditorName) {
    config.auditorName = await prompt('Enter Auditor Name: ')
  }
  
  if (!config.contact) {
    config.contact = await prompt('Enter Contact Number: ')
  }
  
  try {
    // Run scan
    const scanResult = await scanNetwork()
    
    // Print results
    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║                    SCAN RESULTS                            ║')
    console.log('╚════════════════════════════════════════════════════════════╝\n')
    
    console.log(`Total Active Devices: ${scanResult.totalDevices}`)
    console.log(`Detected PCs:         ${scanResult.pcs.length}`)
    console.log(`Printers:             ${scanResult.printers.length}`)
    console.log(`Cameras:              ${scanResult.cameras.length}`)
    console.log(`Network Devices:      ${scanResult.networkDevices.length}`)
    console.log(`Unknown:              ${scanResult.unknown.length}`)
    console.log(`Scan Duration:        ${(scanResult.duration / 1000).toFixed(2)}s\n`)
    
    console.log('--- Detected PCs ---')
    for (const pc of scanResult.pcs) {
      console.log(`  ${pc.ip.padEnd(15)} | ${pc.mac.padEnd(17)} | ${pc.vendor.padEnd(12)} | ${pc.hostname}`)
    }
    
    if (scanResult.printers.length > 0) {
      console.log('\n--- Printers (Excluded) ---')
      for (const p of scanResult.printers) {
        console.log(`  ${p.ip.padEnd(15)} | ${p.mac.padEnd(17)} | ${p.vendor}`)
      }
    }
    
    if (scanResult.cameras.length > 0) {
      console.log('\n--- Cameras (Excluded) ---')
      for (const c of scanResult.cameras) {
        console.log(`  ${c.ip.padEnd(15)} | ${c.mac.padEnd(17)} | ${c.vendor}`)
      }
    }
    
    // Prepare payload
    const payload = {
      centerCode: config.centerCode,
      centerName: config.centerName,
      city: config.city,
      auditorName: config.auditorName,
      contact: config.contact,
      systemCount: scanResult.systemCount,
      ipList: scanResult.ipList,
      macList: scanResult.macList,
      scanDetails: {
        totalDevices: scanResult.totalDevices,
        localIP: scanResult.networkInfo.localIP,
        subnet: scanResult.networkInfo.subnet,
        scannedAt: new Date().toISOString(),
        scanDuration: scanResult.duration,
        deviceBreakdown: {
          pcs: scanResult.pcs.length,
          printers: scanResult.printers.length,
          cameras: scanResult.cameras.length,
          networkDevices: scanResult.networkDevices.length,
          unknown: scanResult.unknown.length,
        },
        devices: scanResult.devices.map(d => ({
          ip: d.ip,
          mac: d.mac,
          vendor: d.vendor,
          type: d.type,
          confidence: d.confidence,
        })),
      },
    }
    
    console.log('\n=== Sending to Server ===\n')
    
    const apiClient = new APIClient(config.apiUrl, config.token)
    const apiResult = await apiClient.sendWithRetry(payload)
    
    if (apiResult.success) {
      console.log('✓ Data sent successfully!')
      console.log(`  Scan ID: ${apiResult.data?.scanId || 'N/A'}`)
      
      // Add to history
      scanResult.centerCode = config.centerCode
      scanResult.centerName = config.centerName
      const historyId = offlineStorage.addToHistory(scanResult)
      if (historyId) {
        console.log(`  History ID: ${historyId}`)
      }
    } else {
      console.log('✗ Failed to send data. Saving offline...')
      offlineStorage.savePendingScan(payload)
      console.log('  Data saved locally. Will sync when connection is available.')
      console.log(`  Run with --sync flag to retry: node scanner.js --sync --api-url ${config.apiUrl} --token YOUR_TOKEN`)
      logger.error('Failed to send scan data', { error: apiResult.error })
    }
    
  } catch (error) {
    logger.error('Scan failed', { error: error.message, stack: error.stack })
    console.error('\nError:', error.message)
    process.exit(1)
  }
  
  console.log('\n=== Scan Complete ===\n')
  
  await prompt('Press Enter to exit...')
}

// Exports
module.exports = { 
  scanNetwork, 
  APIClient,
  NetworkDiagnostics,
  getLocalNetworkInfo, 
  lookupVendor,
  logger,
  offlineStorage,
}

// Run
if (require.main === module) {
  main()
}
