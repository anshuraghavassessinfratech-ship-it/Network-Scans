"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Network,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react"

interface NetworkScan {
  _id: string
  scanId: string
  centerCode: string
  centerName: string
  city: string
  auditorName: string
  contact: string
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
  scannedAt: Date
  status: "pending" | "verified" | "rejected"
}

export default function NetworkScansPage() {
  const [scans, setScans] = useState<NetworkScan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    fetchScans()
  }, [])

  const fetchScans = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/network-scan")
      const data = await res.json()

      if (data.success) {
        setScans(data.data)
      } else {
        setError(data.error || "Failed to fetch network scans")
      }
    } catch (err) {
      setError("Failed to fetch network scans")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      scan.centerCode.toLowerCase().includes(search.toLowerCase()) ||
      scan.centerName.toLowerCase().includes(search.toLowerCase()) ||
      scan.scanId.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || !statusFilter || scan.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Scans</h1>
          <p className="text-muted-foreground">
            View and manage network scan results from exam centers
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scans.length}</div>
            <p className="text-xs text-muted-foreground">
              Network audits performed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scans.filter(s => s.status === "verified").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Approved scans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scans.filter(s => s.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Systems</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scans.length > 0 ? Math.round(scans.reduce((sum, s) => sum + s.systemCount, 0) / scans.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Systems per center
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by center code, name, or scan ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Network Scan Results</CardTitle>
          <CardDescription>
            Detailed results from network scanning operations
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold">Auditor Name</TableHead>
                <TableHead className="font-bold">Center Code</TableHead>
                <TableHead className="font-bold">Center Name</TableHead>
                <TableHead className="font-bold">City</TableHead>
                <TableHead className="font-bold">Total Systems</TableHead>
                <TableHead className="font-bold">PCs</TableHead>
                <TableHead className="font-bold">Printers</TableHead>
                <TableHead className="font-bold">LAN Subnet</TableHead>
                <TableHead className="font-bold">Local IP</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Scanned At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScans.map((scan) => (
                <TableRow key={scan._id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{scan.auditorName}</TableCell>
                  <TableCell className="font-mono text-sm">{scan.centerCode}</TableCell>
                  <TableCell className="font-medium">{scan.centerName}</TableCell>
                  <TableCell>{scan.city}</TableCell>
                  <TableCell className="text-center font-bold text-blue-600">{scan.systemCount}</TableCell>
                  <TableCell className="text-center font-bold text-green-600">
                    {scan.scanDetails?.deviceBreakdown?.pcs || 0}
                  </TableCell>
                  <TableCell className="text-center font-bold text-orange-600">
                    {scan.scanDetails?.deviceBreakdown?.printers || 0}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {scan.scanDetails?.subnet || "N/A"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {scan.scanDetails?.localIP || "N/A"}
                  </TableCell>
                  <TableCell>{getStatusBadge(scan.status)}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {new Date(scan.scannedAt).toLocaleDateString()} <br />
                    {new Date(scan.scannedAt).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredScans.length === 0 && (
            <div className="text-center py-8">
              <Network className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No network scans found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Network scan data will appear here once scanners submit results.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}