"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  ClipboardCheck,
  Search,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import type { AuditRecord } from "@/lib/types"

export default function AuditsPage() {
  const { user } = useAuth()
  const [audits, setAudits] = useState<AuditRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const fetchAudits = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: "10",
        ...(search && { centerId: search }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
      })

      const res = await fetch(`/api/audits?${params}`)
      const data = await res.json()

      if (data.success) {
        setAudits(data.data.audits)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch audits:", error)
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, search, statusFilter])

  useEffect(() => {
    fetchAudits()
  }, [fetchAudits])

  const handleExport = async (format: "json" | "csv") => {
    setIsExporting(true)
    try {
      const res = await fetch(`/api/export?type=audits&format=${format}`)
      
      if (format === "csv") {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `audits-export-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: "application/json",
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `audits-export-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed")
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "non-compliant":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Records</h1>
          <p className="text-muted-foreground">
            View and manage examination center audits
          </p>
        </div>

        {user?.role === "admin" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport("csv")}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("json")}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by center ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="needs-improvement">Needs Improvement</SelectItem>
                <SelectItem value="non-compliant">Non-Compliant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
          <CardDescription>
            {pagination.total} audit{pagination.total !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : audits.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No audits found</p>
              {user?.role === "auditor" && (
                <Button asChild className="mt-4">
                  <Link href="/scanner">Start Auditing</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Center</TableHead>
                      <TableHead>Auditor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Scores</TableHead>
                      <TableHead>Overall</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audits.map((audit) => (
                      <TableRow key={audit._id?.toString()}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{audit.centerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {audit.centerId}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{audit.auditorName}</TableCell>
                        <TableCell>
                          {new Date(audit.auditDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-16">Infra:</span>
                              <Progress
                                value={audit.infrastructureScore}
                                className="h-2 w-16"
                              />
                              <span>{audit.infrastructureScore}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-16">IT:</span>
                              <Progress
                                value={audit.itScore}
                                className="h-2 w-16"
                              />
                              <span>{audit.itScore}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-16">Comply:</span>
                              <Progress
                                value={audit.complianceScore}
                                className="h-2 w-16"
                              />
                              <span>{audit.complianceScore}%</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <span className="text-2xl font-bold">
                              {audit.overallScore}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              audit.status === "compliant"
                                ? "default"
                                : audit.status === "non-compliant"
                                ? "destructive"
                                : "secondary"
                            }
                            className="flex items-center gap-1 w-fit"
                          >
                            {getStatusIcon(audit.status)}
                            {audit.status.replace("-", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedAudit(audit)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() =>
                        setPagination((p) => ({ ...p, page: p.page - 1 }))
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.pages}
                      onClick={() =>
                        setPagination((p) => ({ ...p, page: p.page + 1 }))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Audit Detail Dialog */}
      <Dialog open={!!selectedAudit} onOpenChange={() => setSelectedAudit(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedAudit && (
            <>
              <DialogHeader>
                <DialogTitle>Audit Details</DialogTitle>
                <DialogDescription>
                  {selectedAudit.centerName} - {new Date(selectedAudit.auditDate).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Scores Overview */}
                <div className="grid gap-4 sm:grid-cols-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Infrastructure</p>
                      <p className="text-2xl font-bold">{selectedAudit.infrastructureScore}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">IT</p>
                      <p className="text-2xl font-bold">{selectedAudit.itScore}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Compliance</p>
                      <p className="text-2xl font-bold">{selectedAudit.complianceScore}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Overall</p>
                      <p className="text-2xl font-bold">{selectedAudit.overallScore}%</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Infrastructure Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Infrastructure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex items-center justify-between py-1 border-b">
                        <span>Building Condition</span>
                        <Badge variant="outline">{selectedAudit.infrastructure.buildingCondition}</Badge>
                      </div>
                      {Object.entries(selectedAudit.infrastructure)
                        .filter(([key]) => key !== "buildingCondition")
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between py-1 border-b">
                            <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                            {value ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* IT Infrastructure Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">IT Infrastructure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex items-center justify-between py-1 border-b">
                        <span>Total Computers</span>
                        <span className="font-medium">{selectedAudit.itInfrastructure.totalComputers}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b">
                        <span>Working Computers</span>
                        <span className="font-medium">{selectedAudit.itInfrastructure.workingComputers}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b">
                        <span>Internet Speed</span>
                        <span className="font-medium">{selectedAudit.itInfrastructure.internetSpeed}</span>
                      </div>
                      {Object.entries(selectedAudit.itInfrastructure)
                        .filter(([key]) => !["totalComputers", "workingComputers", "internetSpeed"].includes(key))
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between py-1 border-b">
                            <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                            {value ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {Object.entries(selectedAudit.compliance).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between py-1 border-b">
                          <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                          {value ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Remarks */}
                {selectedAudit.remarks && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Remarks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{selectedAudit.remarks}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {selectedAudit.recommendations && selectedAudit.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-4 space-y-1">
                        {selectedAudit.recommendations.map((rec, i) => (
                          <li key={i} className="text-muted-foreground">{rec}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
