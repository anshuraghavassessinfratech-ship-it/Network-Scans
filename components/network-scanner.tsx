"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Monitor,
  Download,
  RefreshCw,
  Network,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Calendar,
  Server,
  ExternalLink,
} from "lucide-react"

interface NetworkScanData {
  scanId: string
  centerCode: string
  centerName: string
  city: string
  auditorName: string
  systemCount: number
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
  scannedAt: string
  status: "pending" | "verified" | "rejected"
}

interface NetworkScannerProps {
  centerCode: string
  centerName: string
  onScanDataLoaded: (data: { systemCount: number; ipList: string[] }) => void
}

export function NetworkScanner({
  centerCode,
  centerName,
  onScanDataLoaded,
}: NetworkScannerProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastScan, setLastScan] = useState<NetworkScanData | null>(null)
  const [error, setError] = useState("")

  // Fetch last scan data from backend
  const fetchLastScan = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError("")

    try {
      const response = await fetch(`/api/network-scan?centerCode=${encodeURIComponent(centerCode)}&limit=1`)
      const result = await response.json()

      if (result.success && result.data && result.data.length > 0) {
        const scanData = result.data[0]
        setLastScan(scanData)
        // Auto-fill the system count from backend
        onScanDataLoaded({
          systemCount: scanData.systemCount,
          ipList: scanData.ipList || [],
        })
      } else {
        setLastScan(null)
      }
    } catch (err) {
      setError("Failed to fetch scan data")
      console.error("Fetch scan error:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [centerCode, onScanDataLoaded])

  // Fetch on mount and set up polling
  useEffect(() => {
    fetchLastScan()

    // Poll every 10 seconds for new scan data
    const pollInterval = setInterval(() => {
      fetchLastScan(true)
    }, 10000)

    return () => clearInterval(pollInterval)
  }, [fetchLastScan])

  const handleDownloadScanner = () => {
    // Download the scanner executable
    // In production, this would point to a hosted release
    window.open("/api/download-scanner", "_blank")
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Verified</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Scanner
            </CardTitle>
            <CardDescription>
              Use the standalone scanner application to detect PCs on the local network
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLastScan(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="sr-only">Refresh</span>
            </Button>
            <Button size="sm" onClick={handleDownloadScanner}>
              <Download className="h-4 w-4 mr-2" />
              Download Scanner
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!lastScan ? (
          /* No scan data available */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No Scan Data Available</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Download and run the Network Scanner application on a computer connected to this
              center&apos;s local network to automatically detect and count active PCs.
            </p>
            <Button onClick={handleDownloadScanner}>
              <Download className="h-4 w-4 mr-2" />
              Download Network Scanner
            </Button>
          </div>
        ) : (
          /* Display last scan data */
          <div className="space-y-4">
            {/* Scan Status Header */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Network Scan Available
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    System count has been auto-filled from the scan
                  </p>
                </div>
              </div>
              {getStatusBadge(lastScan.status)}
            </div>

            {/* System Count Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {lastScan.systemCount}
                </div>
                <div className="text-sm text-muted-foreground mt-1">PCs Detected</div>
              </div>
              {lastScan.scanDetails?.deviceBreakdown && (
                <>
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-center">
                    <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                      {lastScan.scanDetails.deviceBreakdown.printers || 0}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Printers</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-center">
                    <div className="text-4xl font-bold text-gray-600 dark:text-gray-400">
                      {lastScan.scanDetails.totalDevices || 0}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Total Devices</div>
                  </div>
                </>
              )}
            </div>

            {/* Scan Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Scanned At</p>
                  <p className="text-sm font-medium">{formatDate(lastScan.scannedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Scanned By</p>
                  <p className="text-sm font-medium">{lastScan.auditorName || "Unknown"}</p>
                </div>
              </div>
              {lastScan.scanDetails?.subnet && (
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Subnet</p>
                    <p className="text-sm font-medium font-mono">{lastScan.scanDetails.subnet}.0/24</p>
                  </div>
                </div>
              )}
              {lastScan.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">City</p>
                    <p className="text-sm font-medium">{lastScan.city}</p>
                  </div>
                </div>
              )}
            </div>

            {/* IP List */}
            {lastScan.ipList && lastScan.ipList.length > 0 && (
              <div className="border rounded-lg">
                <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                  <span className="font-medium text-sm">Detected PC IP Addresses</span>
                  <Badge variant="secondary">{lastScan.ipList.length} IPs</Badge>
                </div>
                <div className="max-h-48 overflow-y-auto p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {lastScan.ipList.map((ip, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm"
                      >
                        <Monitor className="h-3 w-3 text-blue-600" />
                        <span className="font-mono text-xs">{ip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Scan ID */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Scan ID: <span className="font-mono">{lastScan.scanId}</span></span>
              <Button variant="ghost" size="sm" onClick={() => fetchLastScan(true)}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 border rounded-lg bg-muted/30">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            How to Use the Network Scanner
          </h4>
          <ol className="text-sm text-muted-foreground space-y-2 ml-6 list-decimal">
            <li>Download the Network Scanner application using the button above</li>
            <li>Run the scanner on any PC connected to the exam center&apos;s LAN</li>
            <li>Enter the center code: <span className="font-mono font-medium text-foreground">{centerCode}</span></li>
            <li>The scanner will automatically detect all PCs on the network</li>
            <li>Results will appear here automatically within 10 seconds</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
