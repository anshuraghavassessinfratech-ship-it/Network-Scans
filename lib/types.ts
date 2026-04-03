import { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  username: string
  password: string
  role: "admin" | "auditor"
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface ExamCenter {
  _id?: ObjectId
  centerId: string
  name: string
  address: string
  city: string
  state: string
  zone: string
  capacity: number
  contactPerson: string
  contactPhone: string
  contactEmail: string
  status: "active" | "inactive" | "suspended"
  createdAt: Date
  updatedAt: Date
}

export interface AuditRecord {
  _id?: ObjectId
  centerId: string
  centerName: string
  auditorId: string
  auditorName: string
  auditDate: Date
  
  // Infrastructure checks
  infrastructure: {
    buildingCondition: "excellent" | "good" | "fair" | "poor"
    powerBackup: boolean
    internetConnectivity: boolean
    cctv: boolean
    biometricSystem: boolean
    fireExtinguishers: boolean
    emergencyExits: boolean
    airConditioning: boolean
    lighting: boolean
    seatingArrangement: boolean
    drinkingWater: boolean
    toiletFacilities: boolean
  }
  
  // IT Infrastructure
  itInfrastructure: {
    totalComputers: number
    workingComputers: number
    serverRoom: boolean
    ups: boolean
    lan: boolean
    internetSpeed: string
    antivirus: boolean
    firewall: boolean
  }
  
  // Compliance
  compliance: {
    licensesValid: boolean
    staffTrained: boolean
    examSoftwareInstalled: boolean
    mockTestConducted: boolean
    dataBackupSystem: boolean
    incidentReportingSystem: boolean
  }
  
  // Scores
  overallScore: number
  infrastructureScore: number
  itScore: number
  complianceScore: number
  
  // Status
  status: "compliant" | "non-compliant" | "needs-improvement"
  
  // Notes
  remarks: string
  recommendations: string[]
  
  // Photos
  photos: string[]
  
  // Network Scan Data
  networkScan?: {
    systemCount: number
    ipList: string[]
    scannedAt: Date
  }
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface NetworkScan {
  _id?: ObjectId
  scanId: string
  centerCode: string
  centerName: string
  city: string
  auditorName: string
  contact: string
  systemCount: number
  systemsDetected?: number
  ipList: string[]
  scanDetails?: {
    totalDevices: number
    localIP: string
    subnet: string
    scannedAt: string
    deviceBreakdown?: {
      pcs: number
      printers: number
      unknown: number
    }
  }
  scannedBy: string
  scannedAt: Date
  createdAt?: Date
  status: "pending" | "verified" | "rejected"
}

export interface ScanLog {
  _id?: ObjectId
  centerId: string
  scannedBy: string
  scannedAt: Date
  location: {
    latitude: number
    longitude: number
  }
  deviceInfo: string
}

export interface DashboardStats {
  totalScans: number
  verifiedScans: number
  pendingScans: number
  averageSystems: number
  recentScans: NetworkScan[]
  scansByCenter: number
  monthlyScans: {
    month: string
    count: number
  }[]
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
